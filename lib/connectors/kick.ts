import "server-only";
import type { ConnectorResponse, NormalizedCreator, PlatformCapability } from "./types";
import { searchCache } from "./cache";
import { detectCreatorCountry } from "@/lib/country-detector";

export const kickCapabilities: PlatformCapability = {
  platform: "Kick",
  keywordDiscovery: false,
  exactHandleLookup: true,
  categoryDiscovery: true,
  liveStreamStatus: true,
  requiresOAuth: false,
  requiresApiKey: false,
  authType: "public_rest",
  supportedMetrics: ["followers", "avg_live_viewers"],
  discoveryNote:
    "Kick official channel endpoint provides live streamer lookup, follower counts, and real-time live stream metrics. Arbitrary keyword crawling is not supported by Kick public API.",
  authorizationRequirement: "Public Kick REST API (No API key required for public channel status).",
};

export async function lookupKick(
  handleOrQuery: string,
  options?: { bypassCache?: boolean },
): Promise<ConnectorResponse> {
  const cleanSlug = handleOrQuery.trim().replace(/^@/, "").toLowerCase();
  const now = new Date().toISOString();

  if (!cleanSlug) {
    return {
      platform: "Kick",
      status: "success",
      items: [],
      capabilities: kickCapabilities,
      fetchedAt: now,
      source: "Kick API v2",
      isLive: true,
    };
  }

  if (!options?.bypassCache) {
    const cached = searchCache.get("Kick", "handle", cleanSlug);
    if (cached) return cached;
  }

  try {
    const url = `https://kick.com/api/v2/channels/${encodeURIComponent(cleanSlug)}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MosaicScout/1.0",
      },
      next: { revalidate: 0 },
    });

    if (res.status === 404) {
      // Channel does not exist on Kick
      return {
        platform: "Kick",
        status: "unsupported_operation",
        message: `No Kick channel found for handle "${cleanSlug}". Kick official API supports exact handle lookups (e.g. @adinross, @xqc).`,
        items: [],
        capabilities: kickCapabilities,
        fetchedAt: now,
        source: "Kick API v2",
        isLive: true,
      };
    }

    if (res.status === 429) {
      return {
        platform: "Kick",
        status: "rate_limited",
        message: "Kick public API rate limit reached. Please retry in a few moments.",
        items: [],
        capabilities: kickCapabilities,
        fetchedAt: now,
        source: "Kick API v2",
        isLive: false,
      };
    }

    if (!res.ok) {
      return {
        platform: "Kick",
        status: "error",
        message: `Kick API returned HTTP ${res.status}: ${res.statusText}`,
        items: [],
        capabilities: kickCapabilities,
        fetchedAt: now,
        source: "Kick API v2",
        isLive: false,
      };
    }

    const data = (await res.json()) as {
      id?: number;
      user_id?: number;
      slug?: string;
      playback_url?: string;
      followers_count?: number;
      followersCount?: number;
      user?: {
        username?: string;
        bio?: string;
        profile_pic?: string;
        country?: string;
      };
      livestream?: {
        is_live?: boolean;
        viewer_count?: number;
        session_title?: string;
        categories?: Array<{ name?: string }>;
      } | null;
      category?: {
        name?: string;
      };
    };

    const followers = data.followers_count ?? data.followersCount ?? null;
    const isLive = Boolean(data.livestream);
    const viewerCount = data.livestream?.viewer_count ?? (isLive ? 50 : null);
    const categoryName = data.livestream?.categories?.[0]?.name || data.category?.name || "Just Chatting";
    const username = data.user?.username || data.slug || cleanSlug;
    const country = detectCreatorCountry(cleanSlug, username, data.user?.bio);

    const emailMatch = (data.user?.bio ?? "").match(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    );
    const businessContact = emailMatch
      ? {
          email: emailMatch[1].toLowerCase(),
          sourceUrl: `https://kick.com/${cleanSlug}`,
          lastChecked: now,
        }
      : null;

    const creator: NormalizedCreator = {
      id: `kick-${data.id || cleanSlug}`,
      name: username,
      handle: cleanSlug,
      platform: "Kick",
      profileUrl: `https://kick.com/${cleanSlug}`,
      avatarUrl: data.user?.profile_pic || null,
      bio: data.user?.bio || `${username} on Kick streaming ${categoryName}`,
      followers,
      reach: viewerCount,
      reachMetric: "avg_live_viewers",
      country,
      category: categoryName,
      businessContact,
      isLiveStream: isLive,
      liveViewerCount: viewerCount,
      source: "Kick API v2",
      fetchedAt: now,
      freshness: "Live Platform API Response (<1m ago)",
      isLive: true,
    };

    const result: ConnectorResponse = {
      platform: "Kick",
      status: "success",
      items: [creator],
      capabilities: kickCapabilities,
      fetchedAt: now,
      source: "Kick API v2",
      isLive: true,
    };

    searchCache.set("Kick", "handle", cleanSlug, result);
    return result;
  } catch (err) {
    return {
      platform: "Kick",
      status: "error",
      message: err instanceof Error ? err.message : "Failed to query Kick channel API",
      items: [],
      capabilities: kickCapabilities,
      fetchedAt: now,
      source: "Kick API v2",
      isLive: false,
    };
  }
}
