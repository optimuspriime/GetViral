import "server-only";
import type { ConnectorResponse, NormalizedCreator, PlatformCapability } from "./types";
import { searchCache } from "./cache";
import { detectCreatorCountry, resolveCountryCode } from "@/lib/country-detector";
import { detectCreatorLanguage, extractYouTubeCategory } from "@/lib/creator-metadata";

export const youtubeCapabilities: PlatformCapability = {
  platform: "YouTube",
  keywordDiscovery: true,
  exactHandleLookup: true,
  categoryDiscovery: true,
  liveStreamStatus: true,
  requiresOAuth: false,
  requiresApiKey: true,
  authType: "api_key",
  supportedMetrics: ["subscribers", "avg_views", "video_count"],
  discoveryNote:
    "Official YouTube Data API v3 supports keyword discovery, region/language filtering, and public channel statistics (lifetime views ÷ video count).",
  authorizationRequirement: "Google Cloud API key with YouTube Data API v3 enabled (YOUTUBE_DATA_API_KEY).",
};

export interface YouTubeSearchOptions {
  bypassCache?: boolean;
  limit?: number;
  regionCode?: string | null;
  relevanceLanguage?: string | null;
  maxFollowers?: number | null;
  maxViews?: number | null;
  extraQueries?: string[];
}

export async function searchYouTube(
  query: string,
  options?: YouTubeSearchOptions,
): Promise<ConnectorResponse> {
  const q = query.trim();
  const now = new Date().toISOString();
  const limit = Math.min(50, Math.max(1, options?.limit ?? 35));
  const regionCode = options?.regionCode?.trim().toUpperCase() || null;
  const relevanceLanguage = options?.relevanceLanguage?.trim().toLowerCase() || null;
  const extraQueriesKey = (options?.extraQueries ?? []).join(",");
  const cacheKey = [
    q,
    limit,
    regionCode || "",
    relevanceLanguage || "",
    options?.maxFollowers ? `maxF${options.maxFollowers}` : "",
    options?.maxViews ? `maxV${options.maxViews}` : "",
    extraQueriesKey,
  ].join("|");

  if (!q) {
    return {
      platform: "YouTube",
      status: "success",
      items: [],
      capabilities: youtubeCapabilities,
      fetchedAt: now,
      source: "YouTube Data API v3",
      isLive: true,
    };
  }

  // Check cache (also accept legacy plain-query key when no filter modifiers are active)
  if (!options?.bypassCache) {
    const cached =
      searchCache.get("YouTube", "search", cacheKey) ??
      (!regionCode && !relevanceLanguage && !options?.maxFollowers && !options?.maxViews && !extraQueriesKey
        ? searchCache.get("YouTube", "search", q)
        : null);
    if (cached) return cached;
  }

  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) {
    return {
      platform: "YouTube",
      status: "unconfigured",
      message: "YouTube Data API key is not configured. Set YOUTUBE_DATA_API_KEY in server environment variables to enable live YouTube discovery.",
      items: [],
      capabilities: youtubeCapabilities,
      fetchedAt: now,
      source: "YouTube Data API v3",
      isLive: false,
    };
  }

  try {
    type YouTubeChannelStatsResponse = {
      items?: Array<{
        id: string;
        snippet: {
          title: string;
          customUrl?: string;
          description: string;
          country?: string;
          defaultLanguage?: string;
          defaultAudioLanguage?: string;
          thumbnails?: { default?: { url: string }; high?: { url: string } };
        };
        statistics: { subscriberCount?: string; viewCount?: string; videoCount?: string };
        topicDetails?: { topicCategories?: string[] };
      }>;
    };

    const collectedChannels = new Map<
      string,
      NonNullable<YouTubeChannelStatsResponse["items"]>[number]
    >();

    // Fast 1-unit exact handle lookup when user searches @handle (falls back to keyword search if needed)
    if (/^@[a-zA-Z0-9._-]{2,}$/.test(q) && !regionCode && !relevanceLanguage) {
      const handleUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,topicDetails&forHandle=${encodeURIComponent(
        q,
      )}&key=${apiKey}`;
      const handleRes = await fetch(handleUrl, { next: { revalidate: 0 } });
      if (handleRes.ok) {
        const candidate = (await handleRes.json()) as YouTubeChannelStatsResponse;
        for (const ch of candidate.items ?? []) {
          collectedChannels.set(ch.id, ch);
        }
      }
    }

    const fetchChannelBatchBySearch = async (
      searchQuery: string,
      maxResults: number,
      maxPages = 1,
      order: "relevance" | "date" = "relevance",
    ) => {
      let pageToken: string | undefined;
      const newChannelIds: string[] = [];

      for (let page = 0; page < maxPages; page++) {
        const searchParams = new URLSearchParams({
          part: "snippet",
          type: "channel",
          maxResults: String(Math.min(50, maxResults)),
          q: searchQuery,
          order,
          key: apiKey,
        });
        if (regionCode) searchParams.set("regionCode", regionCode);
        if (relevanceLanguage) searchParams.set("relevanceLanguage", relevanceLanguage);
        if (pageToken) searchParams.set("pageToken", pageToken);

        const searchUrl = `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`;
        const res = await fetch(searchUrl, { next: { revalidate: 0 } });

        if (res.status === 429 || res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          const reason = (errData as { error?: { errors?: Array<{ reason?: string }> } })?.error?.errors?.[0]?.reason;
          if (reason === "quotaExceeded" || reason === "rateLimitExceeded") {
            return { errorStatus: "rate_limited" as const, message: "YouTube Data API daily quota limit exceeded. Live queries paused until quota resets." };
          }
        }

        if (!res.ok) {
          if (newChannelIds.length > 0) break;
          return { errorStatus: "error" as const, message: `YouTube API returned HTTP ${res.status}: ${res.statusText}` };
        }

        const data = (await res.json()) as {
          nextPageToken?: string;
          items?: Array<{
            id: { channelId: string };
          }>;
        };

        for (const item of data.items ?? []) {
          const cid = item.id?.channelId;
          if (cid && !collectedChannels.has(cid) && !newChannelIds.includes(cid)) {
            newChannelIds.push(cid);
          }
        }

        pageToken = data.nextPageToken;
        if (!pageToken || (data.items ?? []).length === 0) break;
      }

      if (newChannelIds.length === 0) return { ok: true as const };

      // YouTube channels.list accepts up to 50 IDs per request
      for (let offset = 0; offset < newChannelIds.length; offset += 50) {
        const chunk = newChannelIds.slice(offset, offset + 50);
        const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,topicDetails&id=${chunk.join(",")}&key=${apiKey}`;
        const statsRes = await fetch(statsUrl, { next: { revalidate: 0 } });
        if (!statsRes.ok) {
          if (collectedChannels.size > 0) break;
          return { errorStatus: "error" as const, message: `Failed to fetch YouTube channel statistics (HTTP ${statsRes.status})` };
        }
        const statsData = (await statsRes.json()) as YouTubeChannelStatsResponse;
        for (const ch of statsData.items ?? []) {
          collectedChannels.set(ch.id, ch);
        }
      }
      return { ok: true as const };
    };

    const countWithinBounds = () =>
      Array.from(collectedChannels.values()).filter((ch) => {
        const subs = ch.statistics.subscriberCount ? parseInt(ch.statistics.subscriberCount, 10) : null;
        if (options?.maxFollowers && (subs === null || subs > options.maxFollowers)) {
          return false;
        }
        if (options?.maxViews) {
          const totalViews = ch.statistics.viewCount ? parseInt(ch.statistics.viewCount, 10) : null;
          const videos = ch.statistics.videoCount ? parseInt(ch.statistics.videoCount, 10) : null;
          const avg = totalViews && videos && videos > 0 ? Math.round(totalViews / videos) : null;
          if (avg === null || avg > options.maxViews) return false;
        }
        return true;
      }).length;

    if (collectedChannels.size === 0) {
      const hasNarrowTier = Boolean(
        (options?.maxFollowers && options.maxFollowers <= 500_000) ||
        (options?.maxViews && options.maxViews <= 500_000),
      );
      const initialPages = limit > 1 && (hasNarrowTier || Boolean(regionCode)) ? 2 : 1;

      const firstBatch = await fetchChannelBatchBySearch(q, limit, initialPages);
      if ("errorStatus" in firstBatch && firstBatch.errorStatus) {
        return {
          platform: "YouTube",
          status: firstBatch.errorStatus,
          message: firstBatch.message,
          items: [],
          capabilities: youtubeCapabilities,
          fetchedAt: now,
          source: "YouTube Data API v3",
          isLive: false,
        };
      }

      // Run regional/niche complementary searches when broad query yields too few matching profiles
      const extraSeeds = [...(options?.extraQueries ?? [])];
      if (hasNarrowTier && limit > 1) {
        for (const suffix of ["vlog", "podcast", "clips", "reviews"]) {
          const derived = `${q} ${suffix}`.trim();
          if (!extraSeeds.includes(derived)) {
            extraSeeds.push(derived);
          }
        }
      }

      if (limit > 1 && extraSeeds.length > 0) {
        const targetMatches = hasNarrowTier ? 20 : 65;
        for (const extraSeed of extraSeeds.slice(0, 3)) {
          if (hasNarrowTier ? countWithinBounds() >= targetMatches : collectedChannels.size >= targetMatches) {
            break;
          }
          await fetchChannelBatchBySearch(extraSeed, 50, 1).catch(() => {});
        }
      }

      // If filtering specifically for smaller channels (<500K subs) and relevance results remain mega-heavy,
      // fetch active mid/emerging creators via recent activity order cleanly
      if (hasNarrowTier && limit > 1 && countWithinBounds() < 15) {
        await fetchChannelBatchBySearch(q, 50, 1, "date").catch(() => {});
      }
    }

    const regionCountryName = regionCode ? resolveCountryCode(regionCode) : null;

    const items: NormalizedCreator[] = Array.from(collectedChannels.values()).map((ch) => {
      const handle = ch.snippet.customUrl
        ? ch.snippet.customUrl.startsWith("@")
          ? ch.snippet.customUrl
          : `@${ch.snippet.customUrl}`
        : `@${ch.id}`;

      const followers = ch.statistics.subscriberCount ? parseInt(ch.statistics.subscriberCount, 10) : null;
      const totalViews = ch.statistics.viewCount ? parseInt(ch.statistics.viewCount, 10) : null;
      const videoCount = ch.statistics.videoCount ? parseInt(ch.statistics.videoCount, 10) : null;
      const avgViews = totalViews && videoCount && videoCount > 0 ? Math.round(totalViews / videoCount) : null;

      const explicitCountry = resolveCountryCode(ch.snippet.country);
      const audioLang = (ch.snippet.defaultAudioLanguage || ch.snippet.defaultLanguage || "").toLowerCase();
      const langCountry = audioLang.startsWith("pt-br") ? "Brazil" : null;
      const resolvedCountry =
        explicitCountry ||
        detectCreatorCountry(handle, ch.snippet.title, ch.snippet.description) ||
        langCountry ||
        regionCountryName;

      const resolvedLanguage = detectCreatorLanguage(
        ch.snippet.defaultAudioLanguage || ch.snippet.defaultLanguage || null,
        ch.snippet.title,
        ch.snippet.description,
      );

      const resolvedCategory = extractYouTubeCategory(
        ch.topicDetails?.topicCategories,
        ch.snippet.title,
        ch.snippet.description,
      );

      // Check if description has public business email
      const emailMatch = ch.snippet.description.match(
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      );
      const businessContact = emailMatch
        ? {
            email: emailMatch[1].toLowerCase(),
            sourceUrl: `https://www.youtube.com/${handle}/about`,
            lastChecked: now,
          }
        : null;

      return {
        id: `yt-${ch.id}`,
        name: ch.snippet.title,
        handle,
        platform: "YouTube",
        profileUrl: `https://www.youtube.com/${handle}`,
        avatarUrl: ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.default?.url || null,
        bio: ch.snippet.description || "YouTube Creator Channel",
        followers,
        reach: avgViews,
        reachMetric: "avg_views",
        country: resolvedCountry,
        category: resolvedCategory,
        language: resolvedLanguage,
        businessContact,
        source: "YouTube Data API v3",
        fetchedAt: now,
        freshness: "Live Platform API Response (<1m ago)",
        isLive: true,
      };
    });

    const result: ConnectorResponse = {
      platform: "YouTube",
      status: "success",
      items,
      capabilities: youtubeCapabilities,
      fetchedAt: now,
      source: "YouTube Data API v3",
      isLive: true,
    };

    searchCache.set("YouTube", "search", cacheKey, result);
    return result;
  } catch (err) {
    return {
      platform: "YouTube",
      status: "error",
      message: err instanceof Error ? err.message : "Failed to execute YouTube Data API query",
      items: [],
      capabilities: youtubeCapabilities,
      fetchedAt: now,
      source: "YouTube Data API v3",
      isLive: false,
    };
  }
}
