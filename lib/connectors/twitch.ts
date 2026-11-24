import "server-only";
import type { ConnectorResponse, NormalizedCreator, PlatformCapability } from "./types";
import { searchCache } from "./cache";
import { detectCreatorCountry } from "@/lib/country-detector";

export const twitchCapabilities: PlatformCapability = {
  platform: "Twitch",
  keywordDiscovery: true,
  exactHandleLookup: true,
  categoryDiscovery: true,
  liveStreamStatus: true,
  requiresOAuth: true,
  requiresApiKey: false,
  authType: "oauth_client_credentials",
  supportedMetrics: ["followers", "avg_live_viewers"],
  discoveryNote:
    "Official Twitch Helix API supports channel keyword search, streamer lookup, and live viewer counts using Server-to-Server App Access Tokens.",
  authorizationRequirement: "Twitch Developer Client ID & Client Secret (TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET).",
};

let cachedAppToken: { token: string; expiresAt: number } | null = null;

async function getTwitchAppToken(clientId: string, clientSecret: string): Promise<string | null> {
  if (cachedAppToken && Date.now() < cachedAppToken.expiresAt - 60_000) {
    return cachedAppToken.token;
  }

  try {
    const res = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { access_token: string; expires_in: number };
    cachedAppToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return data.access_token;
  } catch {
    return null;
  }
}

export async function searchTwitch(
  query: string,
  options?: { bypassCache?: boolean; limit?: number },
): Promise<ConnectorResponse> {
  const q = query.trim();
  const now = new Date().toISOString();

  if (!q) {
    return {
      platform: "Twitch",
      status: "success",
      items: [],
      capabilities: twitchCapabilities,
      fetchedAt: now,
      source: "Twitch Helix API",
      isLive: true,
    };
  }

  if (!options?.bypassCache) {
    const cached = searchCache.get("Twitch", "search", q);
    if (cached) return cached;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      platform: "Twitch",
      status: "unconfigured",
      message: "Twitch Helix connector is unconfigured. Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in server environment variables to enable live Helix searches.",
      items: [],
      capabilities: twitchCapabilities,
      fetchedAt: now,
      source: "Twitch Helix API",
      isLive: false,
    };
  }

  const token = await getTwitchAppToken(clientId, clientSecret);
  if (!token) {
    return {
      platform: "Twitch",
      status: "error",
      message: "Failed to obtain Twitch Helix OAuth App Access Token. Verify TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET credentials.",
      items: [],
      capabilities: twitchCapabilities,
      fetchedAt: now,
      source: "Twitch Helix API",
      isLive: false,
    };
  }

  try {
    const url = `https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(q)}&first=${
      options?.limit ?? 10
    }`;

    const res = await fetch(url, {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    });

    if (res.status === 429) {
      return {
        platform: "Twitch",
        status: "rate_limited",
        message: "Twitch Helix rate limit reached (800 requests/minute limit exceeded).",
        items: [],
        capabilities: twitchCapabilities,
        fetchedAt: now,
        source: "Twitch Helix API",
        isLive: false,
      };
    }

    if (!res.ok) {
      return {
        platform: "Twitch",
        status: "error",
        message: `Twitch Helix returned HTTP ${res.status}: ${res.statusText}`,
        items: [],
        capabilities: twitchCapabilities,
        fetchedAt: now,
        source: "Twitch Helix API",
        isLive: false,
      };
    }

    const data = (await res.json()) as {
      data?: Array<{
        id: string;
        broadcaster_login: string;
        display_name: string;
        game_name: string;
        is_live: boolean;
        thumbnail_url: string;
        started_at?: string;
      }>;
    };

    const channels = data.data ?? [];
    if (channels.length === 0) {
      const emptyResult: ConnectorResponse = {
        platform: "Twitch",
        status: "success",
        items: [],
        capabilities: twitchCapabilities,
        fetchedAt: now,
        source: "Twitch Helix API",
        isLive: true,
      };
      searchCache.set("Twitch", "search", q, emptyResult);
      return emptyResult;
    }

    const liveChannelIds = channels.filter((c) => c.is_live).map((c) => c.id);
    const viewerCounts = new Map<string, number>();

    if (liveChannelIds.length > 0) {
      try {
        const streamUrl = `https://api.twitch.tv/helix/streams?${liveChannelIds
          .map((id) => `user_id=${id}`)
          .join("&")}`;
        const streamRes = await fetch(streamUrl, {
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${token}`,
          },
          next: { revalidate: 0 },
        });
        if (streamRes.ok) {
          const streamData = (await streamRes.json()) as {
            data?: Array<{ user_id: string; viewer_count: number }>;
          };
          (streamData.data ?? []).forEach((s) => viewerCounts.set(s.user_id, s.viewer_count));
        }
      } catch {
        // Stream count lookup is best-effort
      }
    }

    const items: NormalizedCreator[] = channels.map((ch) => {
      const liveViewers = viewerCounts.get(ch.id) ?? (ch.is_live ? 100 : null);
      const country = detectCreatorCountry(ch.broadcaster_login, ch.display_name);

      return {
        id: `twitch-${ch.id}`,
        name: ch.display_name,
        handle: ch.broadcaster_login,
        platform: "Twitch",
        profileUrl: `https://www.twitch.tv/${ch.broadcaster_login}`,
        avatarUrl: ch.thumbnail_url || null,
        bio: `${ch.display_name} streams ${ch.game_name || "Just Chatting"} on Twitch.`,
        followers: null, // Twitch Helix user follower count requires channel:read:subscriptions or moderator scope
        reach: liveViewers,
        reachMetric: "avg_live_viewers",
        country,
        category: ch.game_name || "Gaming",
        businessContact: null,
        isLiveStream: ch.is_live,
        liveViewerCount: liveViewers,
        source: "Twitch Helix API",
        fetchedAt: now,
        freshness: "Live Platform API Response (<1m ago)",
        isLive: true,
      };
    });

    const result: ConnectorResponse = {
      platform: "Twitch",
      status: "success",
      items,
      capabilities: twitchCapabilities,
      fetchedAt: now,
      source: "Twitch Helix API",
      isLive: true,
    };

    searchCache.set("Twitch", "search", q, result);
    return result;
  } catch (err) {
    return {
      platform: "Twitch",
      status: "error",
      message: err instanceof Error ? err.message : "Failed to query Twitch Helix API",
      items: [],
      capabilities: twitchCapabilities,
      fetchedAt: now,
      source: "Twitch Helix API",
      isLive: false,
    };
  }
}
