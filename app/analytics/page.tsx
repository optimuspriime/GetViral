"use client";

import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Unplug,
  Users,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HorizontalValueChart, TrendChart } from "@/components/charts";
import { CompactMetric } from "@/components/compact-metric";
import { useProspects } from "@/components/data-provider";
import { getCountryFlag } from "@/lib/country-detector";
import { formatCompactNumber, formatExactNumber } from "@/lib/format";
import type { Creator } from "@/lib/model";

type AnalyticsRangeDays = 7 | 28 | 90;

interface OwnedChannelSummary {
  channelId: string;
  creatorId: string;
  title: string;
  handle: string;
  profileUrl: string;
  avatarUrl: string;
  subscribers: number;
  avgViews: number;
}

interface AnalyticsCountryRow {
  countryCode: string;
  countryName: string;
  views: number;
  watchHours: number;
  sharePercent: number;
}

interface AnalyticsDemographicRow {
  ageGroup: string;
  gender: string;
  label: string;
  viewerPercentage: number;
}

interface AnalyticsTrafficRow {
  sourceKey: string;
  label: string;
  views: number;
  watchHours: number;
  sharePercent: number;
}

interface AnalyticsDailyPoint {
  isoDate: string;
  date: string;
  views: number;
  watchHours: number;
  subscribersGained: number;
}

interface YouTubeAnalyticsReport {
  rangeDays: AnalyticsRangeDays;
  startDate: string;
  endDate: string;
  retrievedAt: string;
  channel: OwnedChannelSummary;
  summary: {
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
  };
  dailySeries: AnalyticsDailyPoint[];
  countries: AnalyticsCountryRow[];
  demographics: AnalyticsDemographicRow[];
  trafficSources: AnalyticsTrafficRow[];
}

interface AnalyticsApiResponse {
  connected: boolean;
  oauthConfigured: boolean;
  connectedAt?: string;
  rangeDays?: AnalyticsRangeDays;
  channel?: OwnedChannelSummary;
  report?: YouTubeAnalyticsReport;
  creatorRecord?: Creator;
  requiresReconnect?: boolean;
  error?: string;
}

const TRAFFIC_COLORS = [
  "#16834B",
  "#65A30D",
  "#14B8A6",
  "#8B5CF6",
  "#E59A1A",
  "#F06478",
  "#0EA5E9",
  "#EC4899",
];

function formatDurationSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatReadableTimestamp(iso?: string | null): string {
  if (!iso) return "Just now";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatOAuthErrorMessage(code: string): string {
  switch (code) {
    case "access_denied":
      return "Google authorization was cancelled. No channel tokens were stored.";
    case "invalid_state":
      return "Authorization session expired or could not be verified. Please start connecting again.";
    case "oauth_not_configured":
      return "Creator OAuth credentials are not configured on this server yet.";
    case "no_channel":
      return "The signed-in Google account has no active YouTube channel attached.";
    case "missing_code":
      return "Google did not return an authorization code. Please try again.";
    case "token_exchange_failed":
      return "Could not complete token exchange with Google. Check authorized redirect URIs and try again.";
    default:
      return "Could not connect your YouTube Analytics channel. Please try again.";
  }
}

export default function AnalyticsStudioPage() {
  const { addCustomCreator, addCreator, lists, isGuest, showToast } = useProspects();

  const [rangeDays, setRangeDays] = useState<AnalyticsRangeDays>(28);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsApiResponse | null>(null);

  const loadAnalytics = useCallback(
    async (targetDays: AnalyticsRangeDays, isManualRefresh = false) => {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await fetch(`/api/analytics/youtube?days=${targetDays}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as AnalyticsApiResponse;
        setAnalyticsData(json);
        if (json.error && !json.requiresReconnect) {
          setStatusBanner({ tone: "error", text: json.error });
        }
      } catch {
        setStatusBanner({
          tone: "error",
          text: "Could not load YouTube Analytics status right now.",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectedParam = params.get("connected");
    const oauthErrorParam = params.get("oauth_error");

    if (connectedParam === "1") {
      setStatusBanner({
        tone: "success",
        text: "YouTube channel authorized cleanly. Private creator analytics are now live below.",
      });
      window.history.replaceState({}, "", "/analytics");
    } else if (oauthErrorParam) {
      setStatusBanner({
        tone: "error",
        text: formatOAuthErrorMessage(oauthErrorParam),
      });
      window.history.replaceState({}, "", "/analytics");
    }
  }, []);

  useEffect(() => {
    void loadAnalytics(rangeDays);
  }, [rangeDays, loadAnalytics]);

  async function handleSyncToProfile() {
    if (!analyticsData?.connected) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/analytics/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: rangeDays }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        syncedToCloud?: boolean;
        requiresSignInForCloud?: boolean;
        creatorRecord?: Creator;
        error?: string;
      };

      if (!res.ok || !json.creatorRecord) {
        showToast(json.error || "Failed to sync verified creator analytics.", "error");
        return;
      }

      addCustomCreator(json.creatorRecord);
      if (!isGuest && lists[0]) {
        addCreator(lists[0].id, json.creatorRecord.id);
      }

      if (json.syncedToCloud) {
        showToast(
          `${json.creatorRecord.name} synced with verified audience geography to your cloud workspace.`,
          "success",
        );
      } else if (json.requiresSignInForCloud) {
        showToast(
          `${json.creatorRecord.name} updated in your local studio session. Sign in to persist insights to your cloud shortlist.`,
          "info",
        );
      } else {
        showToast(`${json.creatorRecord.name} analytics synced to your workspace.`, "success");
      }
    } catch {
      showToast("Network error while syncing verified creator analytics.", "error");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/analytics/youtube", { method: "DELETE" });
      setStatusBanner({
        tone: "success",
        text: "Disconnected YouTube Analytics session and cleared encrypted access tokens.",
      });
      showToast("YouTube Analytics session disconnected cleanly.", "info");
      await loadAnalytics(rangeDays);
    } catch {
      showToast("Failed to disconnect analytics session.", "error");
    } finally {
      setDisconnecting(false);
    }
  }

  const report = analyticsData?.report ?? null;

  const dailyTrendData = useMemo(() => {
    if (!report) return [];
    return report.dailySeries.map((point) => ({
      date: point.date,
      "Channel Views": point.views,
    }));
  }, [report]);

  const topCountryChartData = useMemo(() => {
    if (!report) return [];
    return report.countries.slice(0, 8).map((c) => ({
      name: c.countryName,
      value: Number(c.sharePercent.toFixed(1)),
    }));
  }, [report]);

  const totalEngagements = report
    ? report.summary.likes + report.summary.comments + report.summary.shares
    : 0;

  return (
    <div className="analytics-studio-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <Sparkles size={11} className="inline-icon" /> CREATOR STUDIO ANALYTICS
          </span>
          <h1>Creator-Authorized Channel Insights</h1>
          <p className="page-subtitle">
            Review verified watch time, audience geography, demographics, and traffic sources directly
            from authorized creator permissions.
          </p>
        </div>

        <div className="page-heading-actions">
          <Link href="/discover" className="button button-secondary button-sm">
            Discover Creators
          </Link>
          {analyticsData?.connected && (
            <button
              type="button"
              className="button button-secondary button-sm"
              onClick={() => void loadAnalytics(rangeDays, true)}
              disabled={refreshing}
            >
              <RefreshCw size={13} className={refreshing ? "spin-icon" : ""} />
              {refreshing ? "Refreshing…" : "Refresh Report"}
            </button>
          )}
        </div>
      </div>

      {statusBanner && (
        <div
          className={`analytics-status-banner ${
            statusBanner.tone === "success" ? "is-success" : "is-error"
          }`}
          role="status"
        >
          {statusBanner.tone === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{statusBanner.text}</span>
        </div>
      )}

      {loading ? (
        <div className="card analytics-loading-card">
          <div className="analytics-loading-rows">
            <div className="skeleton-pill analytics-skel-lg" />
            <div className="skeleton-pill analytics-skel-md" />
            <div className="skeleton-pill analytics-skel-sm" />
          </div>
          <p className="page-subtitle">Checking authorized creator analytics session…</p>
        </div>
      ) : !analyticsData?.oauthConfigured ? (
        <div className="card analytics-unconnected-card">
          <div className="empty-state">
            <Lock size={22} className="text-muted" />
            <strong>Creator OAuth Is Not Configured Yet</strong>
            <p>
              This deployment does not currently have Creator OAuth credentials enabled. Public
              channel search and saved shortlists continue working normally.
            </p>
            <Link href="/settings" className="button button-secondary button-sm">
              Check Platform Status
            </Link>
          </div>
        </div>
      ) : !analyticsData?.connected || !report ? (
        <div className="analytics-unconnected-stack">
          <section className="analytics-hero-panel">
            <div className="analytics-hero-copy">
              <div className="analytics-trust-pill">
                <ShieldCheck size={14} /> Read-Only Creator Consent · Encrypted HTTP-Only Session
              </div>
              <h2>Unlock First-Party YouTube Audience &amp; Retention Data</h2>
              <p>
                Public discovery surfaces subscriber totals and lifetime averages. Connecting your
                owned YouTube channel authorizes read-only private analytics so brands and creators
                can inspect real geography shares, demographics, watch hours, and traffic mix with
                timestamped provenance.
              </p>

              {analyticsData?.requiresReconnect && (
                <p className="analytics-reconnect-note">
                  <AlertCircle size={14} /> Your previous authorization expired. Reconnect below to
                  issue a fresh read-only report.
                </p>
              )}

              <div className="analytics-hero-actions">
                <a
                  href="/api/oauth/youtube/start?returnTo=/analytics"
                  className="button button-primary analytics-connect-cta"
                >
                  Connect Your YouTube Channel <ArrowUpRight size={15} />
                </a>
                <span className="analytics-readonly-note">
                  <Lock size={13} /> Read-only scope · Disconnect cleanly anytime
                </span>
              </div>
            </div>
          </section>

          <section className="analytics-capability-grid" aria-label="Included creator insights">
            <article className="card analytics-capability-card">
              <div className="analytics-cap-icon tone-emerald">
                <Globe size={18} />
              </div>
              <h3>Verified Audience Geography</h3>
              <p>
                Top viewer countries ranked by real watch-view percentage, paired with exact view
                and watch-hour totals.
              </p>
            </article>

            <article className="card analytics-capability-card">
              <div className="analytics-cap-icon tone-violet">
                <Users size={18} />
              </div>
              <h3>Age &amp; Gender Breakdown</h3>
              <p>
                Official audience viewer distribution across age brackets and gender groups when
                above YouTube privacy thresholds.
              </p>
            </article>

            <article className="card analytics-capability-card">
              <div className="analytics-cap-icon tone-coral">
                <TrendingUp size={18} />
              </div>
              <h3>Traffic Source Attribution</h3>
              <p>
                Understand how viewers arrive across Search, Browse Features, Suggested Videos,
                Shorts Feed, and External links.
              </p>
            </article>

            <article className="card analytics-capability-card">
              <div className="analytics-cap-icon tone-amber">
                <Clock size={18} />
              </div>
              <h3>Watch Hours &amp; Net Growth</h3>
              <p>
                Track daily views, total watch time, average duration, likes, comments, shares, and
                subscriber gained/lost velocity over 7d, 28d, or 90d.
              </p>
            </article>
          </section>
        </div>
      ) : (
        <div className="analytics-connected-stack">
          {/* Authorized Channel Header + Actions */}
          <section className="card analytics-channel-header">
            <div className="analytics-channel-identity">
              <div className="analytics-channel-avatar">
                {report.channel.avatarUrl ? (
                  <img
                    src={report.channel.avatarUrl}
                    alt={report.channel.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
                <span>{report.channel.title.slice(0, 2).toUpperCase()}</span>
              </div>

              <div className="analytics-channel-meta">
                <div className="analytics-badge-row">
                  <span className="live-verified-badge capability-badge-live">
                    <ShieldCheck size={11} /> Creator-Authorized Analytics
                  </span>
                  <span className="freshness-meta">
                    Report: {report.startDate} to {report.endDate} · Retrieved{" "}
                    {formatReadableTimestamp(report.retrievedAt)}
                  </span>
                </div>
                <h2>{report.channel.title}</h2>
                <div className="analytics-channel-subline">
                  <a
                    href={report.channel.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="analytics-handle-link"
                  >
                    {report.channel.handle} <ExternalLink size={11} />
                  </a>
                  <span>·</span>
                  <span>
                    <strong className="tabular-nums">
                      <CompactMetric value={report.channel.subscribers} suffix="subscribers" />
                    </strong>{" "}
                    subscribers
                  </span>
                  <span>·</span>
                  <span>
                    <strong className="tabular-nums">
                      <CompactMetric value={report.channel.avgViews} suffix="avg views per video" />
                    </strong>{" "}
                    lifetime avg/video
                  </span>
                </div>
              </div>
            </div>

            <div className="analytics-toolbar">
              <div className="analytics-range-pills" role="tablist" aria-label="Analytics time range">
                {([7, 28, 90] as const).map((daysOption) => (
                  <button
                    key={daysOption}
                    type="button"
                    role="tab"
                    aria-selected={rangeDays === daysOption}
                    className={`analytics-range-btn ${rangeDays === daysOption ? "active" : ""}`}
                    onClick={() => setRangeDays(daysOption)}
                    disabled={refreshing}
                  >
                    {daysOption}D
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="button button-primary button-sm"
                onClick={() => void handleSyncToProfile()}
                disabled={syncing}
              >
                <BookmarkCheck size={14} />
                {syncing ? "Syncing…" : "Sync to Profile & Shortlist"}
              </button>

              <Link
                href={`/creators/${encodeURIComponent(report.channel.creatorId)}`}
                className="button button-secondary button-sm"
              >
                Open Creator Profile
              </Link>

              <button
                type="button"
                className="button button-secondary button-sm analytics-disconnect-btn"
                onClick={() => void handleDisconnect()}
                disabled={disconnecting}
              >
                <Unplug size={13} />
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          </section>

          {/* 5 Studio KPI Cards */}
          <section className="analytics-kpi-grid" aria-label="Channel analytics KPI summary">
            <article className="card analytics-kpi-card">
              <span className="analytics-kpi-label">
                <Video size={13} /> Views ({report.rangeDays}d)
              </span>
              <strong className="analytics-kpi-value tabular-nums">
                <CompactMetric value={report.summary.views} suffix="views" />
              </strong>
              <span className="analytics-kpi-sub">
                {formatExactNumber(report.summary.views)} total views
              </span>
            </article>

            <article className="card analytics-kpi-card">
              <span className="analytics-kpi-label">
                <Clock size={13} /> Watch Time
              </span>
              <strong className="analytics-kpi-value tabular-nums">
                {formatCompactNumber(report.summary.watchTimeHours)} hrs
              </strong>
              <span className="analytics-kpi-sub">
                {formatExactNumber(report.summary.estimatedMinutesWatched)} mins watched
              </span>
            </article>

            <article className="card analytics-kpi-card">
              <span className="analytics-kpi-label">
                <Activity size={13} /> Avg. View Duration
              </span>
              <strong className="analytics-kpi-value tabular-nums">
                {formatDurationSeconds(report.summary.averageViewDurationSeconds)}
              </strong>
              <span className="analytics-kpi-sub">Mean viewer watch length</span>
            </article>

            <article className="card analytics-kpi-card">
              <span className="analytics-kpi-label">
                <Users size={13} /> Net Subscribers
              </span>
              <strong
                className={`analytics-kpi-value tabular-nums ${
                  report.summary.netSubscribers >= 0 ? "text-green" : "text-coral"
                }`}
              >
                {report.summary.netSubscribers >= 0 ? "+" : ""}
                {formatCompactNumber(report.summary.netSubscribers)}
              </strong>
              <span className="analytics-kpi-sub tabular-nums">
                +{formatCompactNumber(report.summary.subscribersGained)} gained · -
                {formatCompactNumber(report.summary.subscribersLost)} lost
              </span>
            </article>

            <article className="card analytics-kpi-card">
              <span className="analytics-kpi-label">
                <TrendingUp size={13} /> Engagements
              </span>
              <strong className="analytics-kpi-value tabular-nums">
                <CompactMetric value={totalEngagements} suffix="actions" />
              </strong>
              <span className="analytics-kpi-sub tabular-nums">
                {formatCompactNumber(report.summary.likes)} likes ·{" "}
                {formatCompactNumber(report.summary.comments)} comments ·{" "}
                {formatCompactNumber(report.summary.shares)} shares
              </span>
            </article>
          </section>

          {/* Daily Views Curve + Top Countries */}
          <div className="grid-2">
            <section className="card">
              <div className="card-head">
                <div>
                  <h2 className="card-title">Daily Views Trajectory ({report.rangeDays}D)</h2>
                  <p className="card-caption">
                    Creator-authorized daily view counts from {report.startDate} to {report.endDate}
                  </p>
                </div>
              </div>

              {dailyTrendData.length >= 2 ? (
                <TrendChart
                  data={dailyTrendData}
                  label="Daily Views"
                  series={["Channel Views"]}
                />
              ) : (
                <div className="chart-empty">
                  Needs at least 2 days of channel views to plot a trajectory.
                </div>
              )}
            </section>

            <section className="card">
              <div className="card-head">
                <div>
                  <h2 className="card-title">Verified Audience Geography</h2>
                  <p className="card-caption">
                    Real share of channel views by viewer country ({report.rangeDays}d)
                  </p>
                </div>
              </div>

              {topCountryChartData.length > 0 ? (
                <>
                  <HorizontalValueChart
                    data={topCountryChartData}
                    suffix="%"
                    onSelect={() => {}}
                  />
                  <div className="analytics-breakdown-list">
                    {report.countries.slice(0, 6).map((country) => (
                      <div className="analytics-breakdown-row" key={country.countryCode}>
                        <div className="analytics-breakdown-label">
                          <span>{getCountryFlag(country.countryName)}</span>
                          <strong>{country.countryName}</strong>
                        </div>
                        <div className="analytics-breakdown-metrics tabular-nums">
                          <span>{formatCompactNumber(country.views)} views</span>
                          <span>{formatCompactNumber(country.watchHours)}h</span>
                          <strong>{country.sharePercent.toFixed(1)}%</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="chart-empty">
                  No country breakdown returned for this window yet.
                </div>
              )}
            </section>
          </div>

          {/* Traffic Sources + Demographics */}
          <div className="grid-2">
            <section className="card">
              <div className="card-head">
                <div>
                  <h2 className="card-title">Traffic Source Attribution</h2>
                  <p className="card-caption">Where viewers discovered this channel&apos;s videos</p>
                </div>
              </div>

              {report.trafficSources.length > 0 ? (
                <div className="analytics-progress-list">
                  {report.trafficSources.slice(0, 8).map((source, index) => {
                    const color = TRAFFIC_COLORS[index % TRAFFIC_COLORS.length];
                    return (
                      <div className="analytics-progress-item" key={source.sourceKey}>
                        <div className="analytics-progress-head">
                          <span className="analytics-progress-title">{source.label}</span>
                          <span className="analytics-progress-stat tabular-nums">
                            {formatCompactNumber(source.views)} views ·{" "}
                            <strong>{source.sharePercent.toFixed(1)}%</strong>
                          </span>
                        </div>
                        <div className="analytics-progress-track">
                          <div
                            className="analytics-progress-fill"
                            style={{
                              width: `${Math.min(100, Math.max(2, source.sharePercent))}%`,
                              background: color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="chart-empty">No traffic source breakdown returned for this window.</div>
              )}
            </section>

            <section className="card">
              <div className="card-head">
                <div>
                  <h2 className="card-title">Viewer Age &amp; Gender Demographics</h2>
                  <p className="card-caption">
                    Logged-in viewer distribution when threshold requirements are met
                  </p>
                </div>
              </div>

              {report.demographics.length > 0 ? (
                <div className="analytics-progress-list">
                  {report.demographics.slice(0, 10).map((demo) => (
                    <div
                      className="analytics-progress-item"
                      key={`${demo.ageGroup}-${demo.gender}`}
                    >
                      <div className="analytics-progress-head">
                        <span className="analytics-progress-title">{demo.label}</span>
                        <span className="analytics-progress-stat tabular-nums">
                          <strong>{demo.viewerPercentage.toFixed(1)}%</strong>
                        </span>
                      </div>
                      <div className="analytics-progress-track">
                        <div
                          className="analytics-progress-fill"
                          style={{
                            width: `${Math.min(100, Math.max(2, demo.viewerPercentage))}%`,
                            background:
                              demo.gender.toLowerCase() === "female"
                                ? "#F06478"
                                : demo.gender.toLowerCase() === "male"
                                ? "#16834B"
                                : "#8B5CF6",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="analytics-threshold-empty" role="status">
                  <Users size={18} className="text-muted" />
                  <div>
                    <strong>Demographic Threshold Not Reached Yet</strong>
                    <p>
                      YouTube suppresses age and gender splits when viewer sample volume in this{" "}
                      {report.rangeDays}-day window is below privacy reporting thresholds.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
