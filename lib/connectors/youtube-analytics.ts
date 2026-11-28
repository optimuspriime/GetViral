import "server-only";
import type { AudienceInsight, Creator, MetricSnapshot } from "@/lib/model";
import { resolveCountryCode } from "@/lib/country-detector";
import { detectCreatorLanguage, extractYouTubeCategory } from "@/lib/creator-metadata";

export const YT_OAUTH_STATE_COOKIE = "gv_yt_oauth_state";
export const YT_ANALYTICS_CONN_COOKIE = "gv_yt_analytics_conn";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YT_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels";
const YT_ANALYTICS_REPORTS_URL = "https://youtubeanalytics.googleapis.com/v2/reports";

export const YT_ANALYTICS_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
].join(" ");

export interface GoogleOAuthCredentials {
  clientId: string;
  clientSecret: string;
}

export interface StoredYouTubeOAuthConnection {
  ownerKey: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  channelId: string;
  channelTitle: string;
  channelHandle: string;
  connectedAt: string;
}

export interface OwnedYouTubeChannel {
  channelId: string;
  creatorId: string;
  title: string;
  handle: string;
  profileUrl: string;
  avatarUrl: string;
  bio: string;
  country: string | null;
  language: string | null;
  category: string;
  subscribers: number | null;
  totalViews: number | null;
  videoCount: number | null;
  avgViews: number | null;
}

export interface YouTubeAnalyticsSummary {
  views: number;
  watchTimeHours: number;
  estimatedMinutesWatched: number;
  averageViewDurationSeconds: number;
  likes: number;
  comments: number;
  shares: number;
  subscribersGained: number;
  subscribersLost: number;
  netSubscribers: number;
}

export interface YouTubeAnalyticsDailyPoint {
  isoDate: string;
  date: string;
  views: number;
  watchHours: number;
  subscribersGained: number;
}

export interface YouTubeAnalyticsCountryRow {
  countryCode: string;
  countryName: string;
  views: number;
  watchHours: number;
  sharePercent: number;
}

export interface YouTubeAnalyticsDemographicRow {
  ageGroup: string;
  gender: string;
  label: string;
  viewerPercentage: number;
}

export interface YouTubeAnalyticsTrafficRow {
  sourceKey: string;
  label: string;
  views: number;
  watchHours: number;
  sharePercent: number;
}

export interface YouTubeAnalyticsReport {
  rangeDays: 7 | 28 | 90;
  startDate: string;
  endDate: string;
  retrievedAt: string;
  channel: OwnedYouTubeChannel;
  summary: YouTubeAnalyticsSummary;
  dailySeries: YouTubeAnalyticsDailyPoint[];
  countries: YouTubeAnalyticsCountryRow[];
  demographics: YouTubeAnalyticsDemographicRow[];
  trafficSources: YouTubeAnalyticsTrafficRow[];
}

export function resolveGoogleOAuthCredentials(): GoogleOAuthCredentials | null {
  const clientId =
    process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() ||
    process.env.YOUTUBE_OAUTH_CLIENT_ID?.trim() ||
    "";
  const clientSecret =
    process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() ||
    process.env.YOUTUBE_OAUTH_CLIENT_SECRET?.trim() ||
    "";

  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function getGoogleOAuthRedirectUri(requestUrl: string): string {
  const explicit = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  const parsed = new URL(requestUrl);
  return `${parsed.origin}/api/oauth/youtube/callback`;
}

export function buildGoogleOAuthAuthorizeUrl(
  redirectUri: string,
  stateToken: string,
  creds: GoogleOAuthCredentials,
): string {
  const params = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: YT_ANALYTICS_SCOPES,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state: stateToken,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForGoogleTokens(
  code: string,
  redirectUri: string,
  creds: GoogleOAuthCredentials,
): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
}> {
  const body = new URLSearchParams({
    code,
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error_description?: string;
    error?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Unable to complete Google authorization.");
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000,
  };
}

export async function refreshGoogleAccessToken(
  refreshToken: string,
  creds: GoogleOAuthCredentials,
): Promise<{ accessToken: string; expiresAt: number }> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    grant_type: "refresh_token",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(data.error || "Google session expired; please reconnect your channel.");
  }

  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000,
  };
}

export async function fetchOwnedYouTubeChannel(accessToken: string): Promise<OwnedYouTubeChannel> {
  const res = await fetch(
    `${YT_CHANNELS_URL}?part=id,snippet,statistics,topicDetails&mine=true`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(`Unable to read authorized YouTube channel (HTTP ${res.status}).`);
  }

  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      snippet: {
        title: string;
        customUrl?: string;
        description?: string;
        country?: string;
        defaultLanguage?: string;
        defaultAudioLanguage?: string;
        thumbnails?: { high?: { url: string }; default?: { url: string } };
      };
      statistics?: {
        subscriberCount?: string;
        viewCount?: string;
        videoCount?: string;
      };
      topicDetails?: { topicCategories?: string[] };
    }>;
  };

  const ch = data.items?.[0];
  if (!ch) {
    throw new Error("No YouTube channel was found under this authorized Google account.");
  }

  const handle = ch.snippet.customUrl
    ? ch.snippet.customUrl.startsWith("@")
      ? ch.snippet.customUrl
      : `@${ch.snippet.customUrl}`
    : `@${ch.id}`;

  const subscribers = ch.statistics?.subscriberCount ? parseInt(ch.statistics.subscriberCount, 10) : null;
  const totalViews = ch.statistics?.viewCount ? parseInt(ch.statistics.viewCount, 10) : null;
  const videoCount = ch.statistics?.videoCount ? parseInt(ch.statistics.videoCount, 10) : null;
  const avgViews = totalViews && videoCount && videoCount > 0 ? Math.round(totalViews / videoCount) : null;

  return {
    channelId: ch.id,
    creatorId: `yt-${ch.id}`,
    title: ch.snippet.title,
    handle,
    profileUrl: `https://www.youtube.com/${handle}`,
    avatarUrl: ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.default?.url || "",
    bio: ch.snippet.description || `${ch.snippet.title} on YouTube`,
    country: resolveCountryCode(ch.snippet.country),
    language: detectCreatorLanguage(
      ch.snippet.defaultAudioLanguage || ch.snippet.defaultLanguage || null,
      ch.snippet.title,
      ch.snippet.description,
    ),
    category: extractYouTubeCategory(
      ch.topicDetails?.topicCategories,
      ch.snippet.title,
      ch.snippet.description,
    ),
    subscribers,
    totalViews,
    videoCount,
    avgViews,
  };
}

function formatIsoDateUtc(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatAgeGenderLabel(ageGroup: string, gender: string): string {
  const cleanAge = ageGroup.replace(/^age/i, "").replace("-", "–");
  const cleanGender =
    gender.toLowerCase() === "female"
      ? "Female"
      : gender.toLowerCase() === "male"
        ? "Male"
        : "Other";
  return `${cleanGender} · ${cleanAge}`;
}

const TRAFFIC_LABELS: Record<string, string> = {
  YT_SEARCH: "YouTube Search",
  RELATED_VIDEO: "Suggested Videos",
  SUBSCRIBER: "Home & Subscriptions Feed",
  SHORTS: "YouTube Shorts Feed",
  EXT_URL: "External Websites & Apps",
  YT_CHANNEL: "Channel Page",
  NOTIFICATION: "Subscriber Notifications",
  PLAYLIST: "Playlists",
  YT_OTHER_PAGE: "Other YouTube Features",
  NO_LINK_OTHER: "Direct / Unknown",
};

async function runAnalyticsQuery(
  accessToken: string,
  params: Record<string, string>,
): Promise<Array<Array<string | number>>> {
  const sp = new URLSearchParams({
    ids: "channel==MINE",
    ...params,
  });

  const res = await fetch(`${YT_ANALYTICS_REPORTS_URL}?${sp.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Creator analytics query returned HTTP ${res.status}`);
  }

  const data = (await res.json()) as { rows?: Array<Array<string | number>> };
  return data.rows ?? [];
}

export async function fetchYouTubeAnalyticsReport(
  accessToken: string,
  channel: OwnedYouTubeChannel,
  rangeDays: 7 | 28 | 90 = 28,
): Promise<YouTubeAnalyticsReport> {
  const endObj = new Date();
  endObj.setUTCDate(endObj.getUTCDate() - 1); // Complete day up to yesterday
  const startObj = new Date(endObj);
  startObj.setUTCDate(startObj.getUTCDate() - (rangeDays - 1));

  const startDate = formatIsoDateUtc(startObj);
  const endDate = formatIsoDateUtc(endObj);
  const retrievedAt = new Date().toISOString();

  const [summaryRes, dailyRes, countryRes, demoRes, trafficRes] = await Promise.allSettled([
    runAnalyticsQuery(accessToken, {
      startDate,
      endDate,
      metrics:
        "views,estimatedMinutesWatched,averageViewDuration,likes,comments,shares,subscribersGained,subscribersLost",
    }),
    runAnalyticsQuery(accessToken, {
      startDate,
      endDate,
      dimensions: "day",
      metrics: "views,estimatedMinutesWatched,subscribersGained",
      sort: "day",
    }),
    runAnalyticsQuery(accessToken, {
      startDate,
      endDate,
      dimensions: "country",
      metrics: "views,estimatedMinutesWatched",
      sort: "-views",
      maxResults: "10",
    }),
    runAnalyticsQuery(accessToken, {
      startDate,
      endDate,
      dimensions: "ageGroup,gender",
      metrics: "viewerPercentage",
      sort: "-viewerPercentage",
    }),
    runAnalyticsQuery(accessToken, {
      startDate,
      endDate,
      dimensions: "insightTrafficSourceType",
      metrics: "views,estimatedMinutesWatched",
      sort: "-views",
      maxResults: "8",
    }),
  ]);

  if (summaryRes.status === "rejected" && dailyRes.status === "rejected") {
    throw summaryRes.reason instanceof Error
      ? summaryRes.reason
      : new Error("Unable to fetch authorized channel analytics.");
  }

  const sRow = summaryRes.status === "fulfilled" ? summaryRes.value[0] ?? [] : [];
  const views = Number(sRow[0] ?? 0);
  const estimatedMinutesWatched = Number(sRow[1] ?? 0);
  const averageViewDurationSeconds = Number(sRow[2] ?? 0);
  const likes = Number(sRow[3] ?? 0);
  const comments = Number(sRow[4] ?? 0);
  const shares = Number(sRow[5] ?? 0);
  const subscribersGained = Number(sRow[6] ?? 0);
  const subscribersLost = Number(sRow[7] ?? 0);

  const summary: YouTubeAnalyticsSummary = {
    views,
    watchTimeHours: Math.round(estimatedMinutesWatched / 60),
    estimatedMinutesWatched,
    averageViewDurationSeconds,
    likes,
    comments,
    shares,
    subscribersGained,
    subscribersLost,
    netSubscribers: subscribersGained - subscribersLost,
  };

  const dailyRows = dailyRes.status === "fulfilled" ? dailyRes.value : [];
  const dailySeries: YouTubeAnalyticsDailyPoint[] = dailyRows.map((row) => {
    const isoDate = String(row[0]);
    const parsed = new Date(`${isoDate}T00:00:00Z`);
    const shortDate = Number.isNaN(parsed.getTime())
      ? isoDate
      : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    return {
      isoDate,
      date: shortDate,
      views: Number(row[1] ?? 0),
      watchHours: Math.round((Number(row[2] ?? 0) / 60) * 10) / 10,
      subscribersGained: Number(row[3] ?? 0),
    };
  });

  const rawCountries = countryRes.status === "fulfilled" ? countryRes.value : [];
  const countryTotalViews =
    rawCountries.reduce((acc, row) => acc + Number(row[1] ?? 0), 0) || views || 1;
  const countries: YouTubeAnalyticsCountryRow[] = rawCountries.map((row) => {
    const code = String(row[0]).toUpperCase();
    const cViews = Number(row[1] ?? 0);
    return {
      countryCode: code,
      countryName: resolveCountryCode(code) ?? code,
      views: cViews,
      watchHours: Math.round(Number(row[2] ?? 0) / 60),
      sharePercent: Math.round((cViews / countryTotalViews) * 1000) / 10,
    };
  });

  const rawDemo = demoRes.status === "fulfilled" ? demoRes.value : [];
  const demographics: YouTubeAnalyticsDemographicRow[] = rawDemo.map((row) => {
    const ageGroup = String(row[0]);
    const gender = String(row[1]);
    return {
      ageGroup,
      gender,
      label: formatAgeGenderLabel(ageGroup, gender),
      viewerPercentage: Math.round(Number(row[2] ?? 0) * 10) / 10,
    };
  });

  const rawTraffic = trafficRes.status === "fulfilled" ? trafficRes.value : [];
  const trafficTotalViews =
    rawTraffic.reduce((acc, row) => acc + Number(row[1] ?? 0), 0) || views || 1;
  const trafficSources: YouTubeAnalyticsTrafficRow[] = rawTraffic.map((row) => {
    const sourceKey = String(row[0]);
    const tViews = Number(row[1] ?? 0);
    return {
      sourceKey,
      label: TRAFFIC_LABELS[sourceKey] ?? sourceKey.replace(/_/g, " "),
      views: tViews,
      watchHours: Math.round(Number(row[2] ?? 0) / 60),
      sharePercent: Math.round((tViews / trafficTotalViews) * 1000) / 10,
    };
  });

  return {
    rangeDays,
    startDate,
    endDate,
    retrievedAt,
    channel,
    summary,
    dailySeries,
    countries,
    demographics,
    trafficSources,
  };
}

export function buildAuthorizedCreatorRecord(report: YouTubeAnalyticsReport): Creator {
  const { channel, retrievedAt, countries, demographics, rangeDays, dailySeries } = report;

  const audienceInsights: AudienceInsight[] = [
    ...countries.slice(0, 6).map((c) => ({
      dimension: "country",
      value: c.countryName,
      amount: c.sharePercent,
      unit: "%",
      collectedAt: retrievedAt,
      source: `YouTube Creator-Authorized Analytics (${rangeDays}d)`,
      status: "creator_authorized" as const,
      confidence: 1,
    })),
    ...demographics.slice(0, 4).map((d) => ({
      dimension: "demographic",
      value: d.label,
      amount: d.viewerPercentage,
      unit: "%",
      collectedAt: retrievedAt,
      source: `YouTube Creator-Authorized Analytics (${rangeDays}d)`,
      status: "creator_authorized" as const,
      confidence: 1,
    })),
  ];

  const dailySnapshots: MetricSnapshot[] = dailySeries.slice(-14).map((pt) => ({
    id: `snap-${channel.creatorId}-views-${pt.isoDate}`,
    metricName: "avg_video_views",
    value: pt.views,
    unit: "views" as const,
    collectedAt: `${pt.isoDate}T12:00:00.000Z`,
    windowStart: `${pt.isoDate}T00:00:00.000Z`,
    windowEnd: `${pt.isoDate}T23:59:59.000Z`,
    periodLabel: "Daily channel views (Creator OAuth)",
    sampleSize: 1,
    source: "YouTube Creator-Authorized Analytics",
    status: "creator_authorized" as const,
  }));

  const snapshots: MetricSnapshot[] = [
    ...(channel.subscribers !== null
      ? [
          {
            id: `snap-${channel.creatorId}-followers-auth`,
            metricName: "followers",
            value: channel.subscribers,
            unit: "count" as const,
            collectedAt: retrievedAt,
            windowStart: null,
            windowEnd: null,
            periodLabel: "Authorized channel subscriber count",
            sampleSize: null,
            source: "YouTube Creator-Authorized Analytics",
            status: "creator_authorized" as const,
          },
        ]
      : []),
    ...(channel.avgViews !== null
      ? [
          {
            id: `snap-${channel.creatorId}-reach-auth`,
            metricName: "avg_video_views",
            value: channel.avgViews,
            unit: "views" as const,
            collectedAt: retrievedAt,
            windowStart: null,
            windowEnd: null,
            periodLabel: "Channel lifetime average (total views ÷ videos)",
            sampleSize: channel.videoCount,
            source: "YouTube Creator-Authorized Analytics",
            status: "creator_authorized" as const,
          },
        ]
      : []),
    ...dailySnapshots,
  ];

  return {
    id: channel.creatorId,
    name: channel.title,
    category: channel.category,
    language: channel.language,
    creatorCountry: channel.country ?? countries[0]?.countryName ?? null,
    creatorCountrySource: channel.country
      ? "Authorized Channel Profile"
      : countries[0]
        ? "Top Audience Country (Creator OAuth)"
        : null,
    bio: channel.bio,
    avatar: channel.avatarUrl,
    businessContact: null,
    audienceInsights,
    accounts: [
      {
        id: `acc-${channel.creatorId}`,
        platform: "YouTube",
        handle: channel.handle,
        profileUrl: channel.profileUrl,
        activity: "Verified Owner",
        snapshots,
      },
    ],
  };
}
