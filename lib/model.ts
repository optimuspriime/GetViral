export const PLATFORMS = [
  "Twitch",
  "Kick",
  "YouTube",
  "TikTok",
  "Instagram",
] as const;

export type Platform = (typeof PLATFORMS)[number];
export type MetricStatus = "public" | "creator_authorized" | "estimated";
export type MetricUnit = "count" | "views" | "percent" | "hours" | "posts";

export interface MetricSnapshot {
  id: string;
  metricName: string;
  value: number | null;
  unit: MetricUnit;
  collectedAt: string;
  windowStart: string | null;
  windowEnd: string | null;
  periodLabel: string | null;
  sampleSize: number | null;
  source: string;
  status: MetricStatus;
}

export interface CreatorPlatformAccount {
  id: string;
  platform: Platform;
  handle: string;
  profileUrl: string;
  activity: string | null;
  snapshots: MetricSnapshot[];
}

export type PlatformAccount = CreatorPlatformAccount;

export interface AudienceInsight {
  dimension: string;
  value: string;
  amount: number | null;
  unit: string;
  collectedAt: string;
  source: string;
  status: MetricStatus;
  confidence: number | null;
}

export interface BusinessContact {
  email: string;
  sourceUrl: string;
  lastChecked: string;
}

export interface Creator {
  id: string;
  name: string;
  category: string | null;
  language: string | null;
  creatorCountry: string | null;
  creatorCountrySource: string | null;
  bio: string;
  avatar: string;
  accounts: PlatformAccount[];
  audienceInsights: AudienceInsight[];
  businessContact: BusinessContact | null;
}

export type ReachMetricName = "avg_live_viewers" | "avg_video_views";

export interface ProspectList {
  id: string;
  name: string;
  creatorIds: string[];
  notes: Record<string, string>;
  tags?: Record<string, string[]>;
  statuses: Record<string, ProspectStatus>;
}

export type ProspectStatus =
  | "To review"
  | "Shortlisted"
  | "Contacted"
  | "Partnered";

export interface AppData {
  creators: Creator[];
  lists: ProspectList[];
}
