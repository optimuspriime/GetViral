import "server-only";
import type { Creator, MetricSnapshot, Platform } from "@/lib/model";
import { searchYouTube } from "@/lib/connectors/youtube";
import { searchTwitch } from "@/lib/connectors/twitch";
import { lookupKick } from "@/lib/connectors/kick";

export interface LiveSyncStats {
  kickCount: number;
  youtubeCount: number;
  twitchCount: number;
  unconfiguredPlatforms: Platform[];
  unsupportedPlatforms: Platform[];
  totalSynced: number;
  timestamp: string;
}

/**
 * Refreshes ONLY the authenticated user's explicitly saved creators via official live connectors.
 * Never imports hardcoded channel lists or fabricates fallback metrics / audience percentages.
 */
export async function refreshSavedCreatorsFromConnectors(savedCreators: Creator[]): Promise<{
  creators: Creator[];
  stats: LiveSyncStats;
}> {
  const nowStr = new Date().toISOString();
  const refreshed: Creator[] = [];
  let kickCount = 0;
  let youtubeCount = 0;
  let twitchCount = 0;
  const unconfiguredSet = new Set<Platform>();
  const unsupportedSet = new Set<Platform>();

  for (const creator of savedCreators) {
    const updatedAccounts = [];

    for (const account of creator.accounts) {
      const handle = account.handle.replace(/^@/, "");
      let connectorRes = null;

      if (account.platform === "Kick") {
        connectorRes = await lookupKick(handle, { bypassCache: true });
      } else if (account.platform === "YouTube") {
        connectorRes = await searchYouTube(handle, { bypassCache: true, limit: 1 });
      } else if (account.platform === "Twitch") {
        connectorRes = await searchTwitch(handle, { bypassCache: true, limit: 1 });
      } else {
        unsupportedSet.add(account.platform);
        updatedAccounts.push(account);
        continue;
      }

      if (connectorRes.status === "unconfigured") {
        unconfiguredSet.add(account.platform);
        updatedAccounts.push(account);
        continue;
      }

      const freshItem = connectorRes.items[0];
      if (!freshItem) {
        updatedAccounts.push(account);
        continue;
      }

      if (account.platform === "Kick") kickCount++;
      if (account.platform === "YouTube") youtubeCount++;
      if (account.platform === "Twitch") twitchCount++;

      const newSnapshots: MetricSnapshot[] = [];
      if (freshItem.followers !== null) {
        newSnapshots.push({
          id: `snap-${account.id}-followers-${Date.now()}`,
          metricName: "followers",
          value: freshItem.followers,
          unit: "count",
          collectedAt: freshItem.fetchedAt || nowStr,
          windowStart: null,
          windowEnd: null,
          periodLabel: "Synced Live API",
          sampleSize: null,
          source: freshItem.source,
          status: "public",
        });
      }
      if (freshItem.reach !== null) {
        newSnapshots.push({
          id: `snap-${account.id}-reach-${Date.now()}`,
          metricName: freshItem.reachMetric === "avg_live_viewers" ? "avg_live_viewers" : "avg_video_views",
          value: freshItem.reach,
          unit: freshItem.reachMetric === "avg_live_viewers" ? "count" : "views",
          collectedAt: freshItem.fetchedAt || nowStr,
          windowStart: null,
          windowEnd: null,
          periodLabel: freshItem.isLiveStream ? "Current Live Stream" : "Recent Content",
          sampleSize: 10,
          source: freshItem.source,
          status: "public",
        });
      }

      updatedAccounts.push({
        ...account,
        activity: freshItem.isLiveStream ? "Live Now" : account.activity,
        snapshots: [...newSnapshots, ...account.snapshots].slice(0, 15),
      });
    }

    refreshed.push({
      ...creator,
      accounts: updatedAccounts,
    });
  }

  return {
    creators: refreshed,
    stats: {
      kickCount,
      youtubeCount,
      twitchCount,
      unconfiguredPlatforms: Array.from(unconfiguredSet),
      unsupportedPlatforms: Array.from(unsupportedSet),
      totalSynced: kickCount + youtubeCount + twitchCount,
      timestamp: nowStr,
    },
  };
}
