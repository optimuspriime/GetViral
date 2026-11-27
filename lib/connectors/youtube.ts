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
  const cacheKey = [
    q,
    limit,
    regionCode || "",
    relevanceLanguage || "",
    options?.maxFollowers ? `max${options.maxFollowers}` : "",
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
      (!regionCode && !relevanceLanguage && !options?.maxFollowers
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

    const fetchChannelBatchBySearch = async (searchQuery: string, maxResults: number) => {
      const searchParams = new URLSearchParams({
        part: "snippet",
        type: "channel",
        maxResults: String(maxResults),
        q: searchQuery,
        key: apiKey,
      });
      if (regionCode) searchParams.set("regionCode", regionCode);
      if (relevanceLanguage) searchParams.set("relevanceLanguage", relevanceLanguage);

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
        return { errorStatus: "error" as const, message: `YouTube API returned HTTP ${res.status}: ${res.statusText}` };
      }

      const data = (await res.json()) as {
        items?: Array<{
          id: { channelId: string };
        }>;
      };

      const uniqueIds = Array.from(
        new Set((data.items ?? []).map((i) => i.id?.channelId).filter(Boolean)),
      ).filter((id) => !collectedChannels.has(id));

      if (uniqueIds.length === 0) return { ok: true as const };

      const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,topicDetails&id=${uniqueIds.join(",")}&key=${apiKey}`;
      const statsRes = await fetch(statsUrl, { next: { revalidate: 0 } });
      if (!statsRes.ok) {
        return { errorStatus: "error" as const, message: `Failed to fetch YouTube channel statistics (HTTP ${statsRes.status})` };
      }
      const statsData = (await statsRes.json()) as YouTubeChannelStatsResponse;
      for (const ch of statsData.items ?? []) {
        collectedChannels.set(ch.id, ch);
      }
      return { ok: true as const };
    };

    if (collectedChannels.size === 0) {
      const firstBatch = await fetchChannelBatchBySearch(q, limit);
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

      // If caller asked for smaller creators (e.g. <= 100K) and broad search returned mega-channels only,
      // run one complementary emerging-creator query so real <100K channels appear cleanly
      if (options?.maxFollowers && options.maxFollowers <= 500_000 && limit > 1) {
        const matchingCount = Array.from(collectedChannels.values()).filter((ch) => {
          const subs = ch.statistics.subscriberCount ? parseInt(ch.statistics.subscriberCount, 10) : null;
          return subs !== null && subs <= options.maxFollowers!;
        }).length;

        if (matchingCount < 4) {
          const indieQuery = `${q} small creator channel`.trim();
          await fetchChannelBatchBySearch(indieQuery, 50).catch(() => {});
        }
      }
    }

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

      const resolvedCountry =
        resolveCountryCode(ch.snippet.country) ||
        detectCreatorCountry(handle, ch.snippet.title, ch.snippet.description);

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
