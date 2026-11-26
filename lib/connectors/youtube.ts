import "server-only";
import type { ConnectorResponse, NormalizedCreator, PlatformCapability } from "./types";
import { searchCache } from "./cache";
import { detectCreatorCountry, resolveCountryCode } from "@/lib/country-detector";

export const youtubeCapabilities: PlatformCapability = {
  platform: "YouTube",
  keywordDiscovery: true,
  exactHandleLookup: true,
  categoryDiscovery: false,
  liveStreamStatus: true,
  requiresOAuth: false,
  requiresApiKey: true,
  authType: "api_key",
  supportedMetrics: ["subscribers", "avg_views", "video_count"],
  discoveryNote:
    "Official YouTube Data API v3 supports keyword discovery and channel statistics lookup using a Google Cloud API key.",
  authorizationRequirement: "Google Cloud API key with YouTube Data API v3 enabled (YOUTUBE_DATA_API_KEY).",
};

export async function searchYouTube(
  query: string,
  options?: { bypassCache?: boolean; limit?: number },
): Promise<ConnectorResponse> {
  const q = query.trim();
  const now = new Date().toISOString();

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

  // Check cache
  if (!options?.bypassCache) {
    const cached = searchCache.get("YouTube", "search", q);
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
          thumbnails?: { default?: { url: string }; high?: { url: string } };
        };
        statistics: { subscriberCount?: string; viewCount?: string; videoCount?: string };
      }>;
    };

    let statsData: YouTubeChannelStatsResponse | null = null;

    // Fast 1-unit exact handle lookup when user searches @handle (falls back to keyword search if needed)
    if (/^@[a-zA-Z0-9._-]{2,}$/.test(q)) {
      const handleUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(
        q,
      )}&key=${apiKey}`;
      const handleRes = await fetch(handleUrl, { next: { revalidate: 0 } });
      if (handleRes.ok) {
        const candidate = (await handleRes.json()) as YouTubeChannelStatsResponse;
        if (candidate.items && candidate.items.length > 0) {
          statsData = candidate;
        }
      }
    }

    if (!statsData) {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=${
        options?.limit ?? 10
      }&q=${encodeURIComponent(q)}&key=${apiKey}`;

      const res = await fetch(searchUrl, { next: { revalidate: 0 } });

      if (res.status === 429 || res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        const reason = (errData as { error?: { errors?: Array<{ reason?: string }> } })?.error?.errors?.[0]?.reason;
        if (reason === "quotaExceeded" || reason === "rateLimitExceeded") {
          return {
            platform: "YouTube",
            status: "rate_limited",
            message: "YouTube Data API daily quota limit exceeded. Live queries paused until quota resets.",
            items: [],
            capabilities: youtubeCapabilities,
            fetchedAt: now,
            source: "YouTube Data API v3",
            isLive: false,
          };
        }
      }

      if (!res.ok) {
        return {
          platform: "YouTube",
          status: "error",
          message: `YouTube API returned HTTP ${res.status}: ${res.statusText}`,
          items: [],
          capabilities: youtubeCapabilities,
          fetchedAt: now,
          source: "YouTube Data API v3",
          isLive: false,
        };
      }

      const data = (await res.json()) as {
        items?: Array<{
          id: { channelId: string };
          snippet: { title: string; description: string; thumbnails?: { default?: { url: string }; high?: { url: string } } };
        }>;
      };

      if (!data.items || data.items.length === 0) {
        const emptyResult: ConnectorResponse = {
          platform: "YouTube",
          status: "success",
          items: [],
          capabilities: youtubeCapabilities,
          fetchedAt: now,
          source: "YouTube Data API v3",
          isLive: true,
        };
        searchCache.set("YouTube", "search", q, emptyResult);
        return emptyResult;
      }

      const channelIds = data.items.map((i) => i.id.channelId).join(",");
      const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds}&key=${apiKey}`;
      const statsRes = await fetch(statsUrl, { next: { revalidate: 0 } });

      if (!statsRes.ok) {
        return {
          platform: "YouTube",
          status: "error",
          message: `Failed to fetch YouTube channel statistics (HTTP ${statsRes.status})`,
          items: [],
          capabilities: youtubeCapabilities,
          fetchedAt: now,
          source: "YouTube Data API v3",
          isLive: false,
        };
      }

      statsData = (await statsRes.json()) as YouTubeChannelStatsResponse;
    }

    const items: NormalizedCreator[] = (statsData.items ?? []).map((ch) => {
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
        category: "Entertainment",
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

    searchCache.set("YouTube", "search", q, result);
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
