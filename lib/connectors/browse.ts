import "server-only";
import type { Platform } from "@/lib/model";
import {
  REGIONAL_DISCOVERY_PROFILES,
  resolveCountryToIso,
  resolveLanguageToIso,
} from "@/lib/creator-metadata";
import type { ConnectorResponse, FederatedSearchResponse, NormalizedCreator } from "./types";
import { searchYouTube, youtubeCapabilities } from "./youtube";
import { searchTwitch, twitchCapabilities } from "./twitch";
import { lookupKick, kickCapabilities } from "./kick";
import { tiktokCapabilities } from "./tiktok";
import { instagramCapabilities } from "./instagram";

const BROWSE_TTL_MS = 15 * 60 * 1000;

interface BrowseCacheEntry {
  data: FederatedSearchResponse & { cachedFromServer: boolean };
  expiresAt: number;
}

const browseCache = new Map<string, BrowseCacheEntry>();

export interface BrowseOptions {
  platform?: Platform | "All platforms" | null;
  category?: string | null;
  country?: string | null;
  language?: string | null;
  maxFollowers?: number | null;
  maxViews?: number | null;
}

/**
 * Returns server-cached real creator profiles from live platform endpoints (never hardcoded fixtures)
 * so /discover renders interactive live API data immediately and supports filter-driven browsing.
 */
export async function getLiveBrowseCreators(
  options?: BrowseOptions,
): Promise<FederatedSearchResponse & { cachedFromServer: boolean }> {
  const platform = options?.platform && options.platform !== "All platforms" ? options.platform : null;
  const category = options?.category && options.category !== "All categories" ? options.category : null;
  const country = options?.country?.trim() || null;
  const language = options?.language && options.language !== "All languages" ? options.language : null;
  const maxFollowers =
    options?.maxFollowers && Number.isFinite(options.maxFollowers) && options.maxFollowers > 0
      ? options.maxFollowers
      : null;
  const maxViews =
    options?.maxViews && Number.isFinite(options.maxViews) && options.maxViews > 0
      ? options.maxViews
      : null;

  const cacheKey = [
    platform || "all",
    category || "all",
    country || "all",
    language || "all",
    maxFollowers ? String(maxFollowers) : "anyF",
    maxViews ? String(maxViews) : "anyV",
  ]
    .join("|")
    .toLowerCase();

  const existing = browseCache.get(cacheKey);
  if (existing && Date.now() < existing.expiresAt) {
    return existing.data;
  }

  const now = new Date().toISOString();
  const regionCode = resolveCountryToIso(country);
  const regionalProfile = regionCode ? REGIONAL_DISCOVERY_PROFILES[regionCode] : undefined;
  const relevanceLanguage = resolveLanguageToIso(language) || regionalProfile?.languageIso || null;

  const tasks: Array<{ platform: Platform; promise: Promise<ConnectorResponse> }> = [];

  if (!platform || platform === "YouTube") {
    const isNarrow = Boolean(
      (maxFollowers && maxFollowers <= 500_000) || (maxViews && maxViews <= 500_000),
    );
    let baseTopic = "popular youtube creators";
    let extraQueries: string[] = [];

    if (category) {
      baseTopic = regionalProfile ? `${category} ${regionalProfile.browseTopics[0]}` : `${category} creators`;
      if (isNarrow) {
        extraQueries = [`${category} podcast`, `${category} vlog`, `${category} review`];
      }
    } else if (regionalProfile) {
      const seeds = isNarrow ? regionalProfile.emergingTopics : regionalProfile.browseTopics;
      baseTopic = seeds[0];
      extraQueries = seeds.slice(1);
    } else if (isNarrow) {
      baseTopic = "daily vlog channel";
      extraQueries = ["indie podcast", "gameplay channel", "tech review channel"];
    } else if (country) {
      baseTopic = `${country} creators vlog`;
      extraQueries = [`${country} youtube channel`, `${country} gaming podcast`];
    }

    tasks.push({
      platform: "YouTube",
      promise: searchYouTube(baseTopic, {
        limit: 50,
        regionCode,
        relevanceLanguage,
        maxFollowers,
        maxViews,
        extraQueries,
      }),
    });
  }

  if (!platform || platform === "Twitch") {
    const twitchTopic = category || "just chatting";
    tasks.push({
      platform: "Twitch",
      promise: searchTwitch(twitchTopic, { limit: 15 }),
    });
  }

  if (!platform || platform === "Kick") {
    // Public Kick REST lookup only works by known single handles; query a small set of real public channels
    const kickHandles = ["xqc", "adinross", "trainwreckstv", "nickmercs"];
    tasks.push({
      platform: "Kick",
      promise: Promise.allSettled(kickHandles.map((h) => lookupKick(h))).then((settled) => {
        const items: NormalizedCreator[] = [];
        let lastError: string | undefined;
        let sawSuccess = false;
        for (const r of settled) {
          if (r.status === "fulfilled") {
            if (r.value.status === "success") {
              sawSuccess = true;
              items.push(...r.value.items);
            } else if (r.value.message) {
              lastError = r.value.message;
            }
          }
        }
        return {
          platform: "Kick",
          status: sawSuccess ? "success" : "error",
          message: sawSuccess ? undefined : lastError || "Kick lookup temporarily unavailable",
          items,
          capabilities: kickCapabilities,
          fetchedAt: now,
          source: "Kick Public Channel",
          isLive: sawSuccess,
        };
      }),
    });
  }

  const settled = await Promise.allSettled(tasks.map((t) => t.promise));

  const connectorStatuses: FederatedSearchResponse["connectorStatuses"] = {
    YouTube: {
      status: process.env.YOUTUBE_DATA_API_KEY?.trim() ? "success" : "unconfigured",
      itemCount: 0,
      capabilities: youtubeCapabilities,
      isLive: false,
    },
    Twitch: {
      status:
        process.env.TWITCH_CLIENT_ID?.trim() && process.env.TWITCH_CLIENT_SECRET?.trim()
          ? "success"
          : "unconfigured",
      itemCount: 0,
      capabilities: twitchCapabilities,
      isLive: false,
    },
    Kick: {
      status: "success",
      itemCount: 0,
      capabilities: kickCapabilities,
      isLive: false,
    },
    TikTok: {
      status: "unsupported_operation",
      itemCount: 0,
      message: "Requires TikTok Creator OAuth authorization.",
      capabilities: tiktokCapabilities,
      isLive: false,
    },
    Instagram: {
      status: "unsupported_operation",
      itemCount: 0,
      message: "Requires Meta Professional OAuth authorization.",
      capabilities: instagramCapabilities,
      isLive: false,
    },
  };

  const allItems: NormalizedCreator[] = [];

  settled.forEach((res, idx) => {
    const plat = tasks[idx].platform;
    if (res.status === "fulfilled") {
      const val = res.value;
      connectorStatuses[plat] = {
        status: val.status,
        itemCount: val.items.length,
        message: val.message,
        capabilities: val.capabilities,
        isLive: val.isLive,
        cached: true,
      };
      allItems.push(...val.items);
    } else {
      connectorStatuses[plat] = {
        status: "error",
        itemCount: 0,
        message: res.reason instanceof Error ? res.reason.message : "Browse query failed",
        capabilities: connectorStatuses[plat].capabilities,
        isLive: false,
      };
    }
  });

  // Deduplicate cleanly by platform + handle
  const seen = new Set<string>();
  const deduped: NormalizedCreator[] = [];
  const counts: Partial<Record<Platform, number>> = {};

  for (const item of allItems) {
    const key = `${item.platform.toLowerCase()}:${item.handle.toLowerCase().replace(/^@/, "")}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push({
        ...item,
        freshness: "Cached Live Browse (15m TTL)",
        isLive: false,
      });
      counts[item.platform] = (counts[item.platform] ?? 0) + 1;
    }
  }

  (Object.keys(connectorStatuses) as Platform[]).forEach((plat) => {
    if (connectorStatuses[plat].status === "success") {
      connectorStatuses[plat].itemCount = counts[plat] ?? 0;
    }
  });

  deduped.sort((a, b) => (b.followers ?? b.reach ?? 0) - (a.followers ?? a.reach ?? 0));

  const payload: FederatedSearchResponse & { cachedFromServer: boolean } = {
    query: category || "",
    timestamp: now,
    totalResults: deduped.length,
    creators: deduped,
    connectorStatuses,
    cachedFromServer: true,
  };

  if (deduped.length > 0) {
    browseCache.set(cacheKey, {
      data: payload,
      expiresAt: Date.now() + BROWSE_TTL_MS,
    });
  }

  return payload;
}
