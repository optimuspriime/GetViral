import "server-only";
import type { Platform } from "@/lib/model";
import type {
  ConnectorResponse,
  FederatedSearchResponse,
  NormalizedCreator,
} from "./types";
import { searchYouTube, youtubeCapabilities } from "./youtube";
import { searchTwitch, twitchCapabilities } from "./twitch";
import { lookupKick, kickCapabilities } from "./kick";
import { searchTikTok, tiktokCapabilities } from "./tiktok";
import { searchInstagram, instagramCapabilities } from "./instagram";

export async function federatedSearch(
  query: string,
  options?: {
    platform?: Platform | "All platforms";
    bypassCache?: boolean;
    limit?: number;
  },
): Promise<FederatedSearchResponse> {
  const q = query.trim();
  const targetPlatform = options?.platform && options.platform !== "All platforms" ? options.platform : null;
  const now = new Date().toISOString();

  if (!q) {
    return {
      query: "",
      timestamp: now,
      totalResults: 0,
      creators: [],
      connectorStatuses: {
        YouTube: { status: "success", itemCount: 0, capabilities: youtubeCapabilities, isLive: false },
        Twitch: { status: "success", itemCount: 0, capabilities: twitchCapabilities, isLive: false },
        Kick: { status: "success", itemCount: 0, capabilities: kickCapabilities, isLive: false },
        TikTok: { status: "success", itemCount: 0, capabilities: tiktokCapabilities, isLive: false },
        Instagram: { status: "success", itemCount: 0, capabilities: instagramCapabilities, isLive: false },
      },
    };
  }

  // Kick only supports exact single-token channel handles (no spaces)
  const isSingleHandleToken = !/\s/.test(q);

  const tasks: Array<{ platform: Platform; promise: Promise<ConnectorResponse> }> = [];

  if (!targetPlatform || targetPlatform === "YouTube") {
    tasks.push({ platform: "YouTube", promise: searchYouTube(q, options) });
  }
  if (!targetPlatform || targetPlatform === "Twitch") {
    tasks.push({ platform: "Twitch", promise: searchTwitch(q, options) });
  }
  if (!targetPlatform || targetPlatform === "Kick") {
    if (isSingleHandleToken) {
      tasks.push({ platform: "Kick", promise: lookupKick(q, options) });
    } else {
      tasks.push({
        platform: "Kick",
        promise: Promise.resolve({
          platform: "Kick",
          status: "unsupported_operation",
          message:
            'Kick supports exact single-word @handle lookup only (e.g. "@adinross" or "xqc"). Multi-word keyword queries are skipped on Kick.',
          items: [],
          capabilities: kickCapabilities,
          fetchedAt: now,
          source: "Kick Channel API",
          isLive: false,
        }),
      });
    }
  }
  if (!targetPlatform || targetPlatform === "TikTok") {
    tasks.push({ platform: "TikTok", promise: searchTikTok(q) });
  }
  if (!targetPlatform || targetPlatform === "Instagram") {
    tasks.push({ platform: "Instagram", promise: searchInstagram(q) });
  }

  const results = await Promise.allSettled(tasks.map((t) => t.promise));

  const connectorStatuses: FederatedSearchResponse["connectorStatuses"] = {
    YouTube: { status: "unconfigured", itemCount: 0, capabilities: youtubeCapabilities, isLive: false },
    Twitch: { status: "unconfigured", itemCount: 0, capabilities: twitchCapabilities, isLive: false },
    Kick: { status: "unconfigured", itemCount: 0, capabilities: kickCapabilities, isLive: false },
    TikTok: { status: "unsupported_operation", itemCount: 0, capabilities: tiktokCapabilities, isLive: false },
    Instagram: { status: "unsupported_operation", itemCount: 0, capabilities: instagramCapabilities, isLive: false },
  };

  const allItems: NormalizedCreator[] = [];

  results.forEach((settled, idx) => {
    const platform = tasks[idx].platform;
    if (settled.status === "fulfilled") {
      const resp = settled.value;
      connectorStatuses[platform] = {
        status: resp.status,
        itemCount: resp.items.length,
        message: resp.message,
        capabilities: resp.capabilities,
        isLive: resp.isLive,
        cached: resp.cached,
      };
      allItems.push(...resp.items);
    } else {
      connectorStatuses[platform] = {
        status: "error",
        itemCount: 0,
        message: settled.reason instanceof Error ? settled.reason.message : "Connector query failed",
        capabilities:
          platform === "YouTube"
            ? youtubeCapabilities
            : platform === "Twitch"
            ? twitchCapabilities
            : platform === "Kick"
            ? kickCapabilities
            : platform === "TikTok"
            ? tiktokCapabilities
            : instagramCapabilities,
        isLive: false,
      };
    }
  });

  // Deduplicate creators by (platform + handle)
  const seen = new Set<string>();
  const deduplicated: NormalizedCreator[] = [];

  for (const item of allItems) {
    const key = `${item.platform.toLowerCase()}:${item.handle.toLowerCase().replace(/^@/, "")}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(item);
    }
  }

  // Sort: higher follower/reach first
  deduplicated.sort((a, b) => {
    const aVal = a.followers ?? a.reach ?? 0;
    const bVal = b.followers ?? b.reach ?? 0;
    return bVal - aVal;
  });

  return {
    query: q,
    timestamp: now,
    totalResults: deduplicated.length,
    creators: deduplicated,
    connectorStatuses,
  };
}
