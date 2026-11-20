import type {
  Creator,
  MetricSnapshot,
  PlatformAccount,
  ReachMetricName,
} from "@/lib/model";

export function latestMetric(
  account: PlatformAccount,
  metricName: string,
): MetricSnapshot | undefined {
  return account.snapshots
    .filter((snapshot) => snapshot.metricName === metricName)
    .sort(
      (a, b) =>
        new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime(),
    )[0];
}

export function reachMetricName(
  account: PlatformAccount,
): ReachMetricName | null {
  if (account.platform === "Twitch" || account.platform === "Kick") {
    return "avg_live_viewers";
  }
  if (
    account.platform === "YouTube" ||
    account.platform === "TikTok"
  ) {
    return "avg_video_views";
  }
  return null;
}

export function currentFollowers(account: PlatformAccount): number | null {
  return latestMetric(account, "followers")?.value ?? null;
}

export function currentReach(account: PlatformAccount): number | null {
  const metric = reachMetricName(account);
  return metric ? (latestMetric(account, metric)?.value ?? null) : null;
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Unavailable";
  return Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function primaryAccount(creator: Creator) {
  return creator.accounts[0];
}

export function creatorPlatforms(creator: Creator) {
  return [...new Set(creator.accounts.map((account) => account.platform))];
}

export function mostRecentCollection(creator: Creator): string | null {
  const timestamps = creator.accounts.flatMap((account) =>
    account.snapshots.map((snapshot) => snapshot.collectedAt),
  );
  return timestamps.sort().at(-1) ?? null;
}

export function relativeDate(value: string | null): string {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  const days = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 86_400_000),
  );
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function rangeStart(days: number) {
  return Date.now() - days * 86_400_000;
}
