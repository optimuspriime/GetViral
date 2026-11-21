"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3, CalendarDays, CircleHelp, Users, Video, Radio, Mail, ChevronRight,
  TrendingUp, Sparkles, CheckCircle2, X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useProspects } from "@/components/data-provider";
import {
  CategoryChart, ComparisonBarChart, HorizontalValueChart, PlatformChart, TrendChart, shortNumber
} from "@/components/charts";
import { BrandMark } from "@/components/brand-mark";
import { platformColors } from "@/lib/platforms";
import type { Creator, MetricSnapshot, PlatformAccount } from "@/lib/model";
import { currentFollowers, currentReach, reachMetricName } from "@/lib/metrics";
import { getCountryFlag } from "@/lib/country-detector";

type SnapshotPoint = Record<string, string | number | null> & { date: string };
type AccountWithCreator = { creator: Creator; account: PlatformAccount };

export default function DashboardPage() {
  const router = useRouter();
  const { creators, activeWorkspace } = useProspects();
  const [range, setRange] = useState(90);
  const [reachMode, setReachMode] = useState<"live" | "video">("live");
  const [dashboardTab, setDashboardTab] = useState<"reach" | "audience" | "creators">("reach");
  const [showExplainer, setShowExplainer] = useState(false);

  const platformData = useMemo(() => {
    const profiles = new Map<string, Set<string>>();
    creators.forEach((creator) =>
      creator.accounts.forEach(({ platform }) => {
        const creatorsForPlatform = profiles.get(platform) ?? new Set<string>();
        creatorsForPlatform.add(creator.id);
        profiles.set(platform, creatorsForPlatform);
      }),
    );
    return [...profiles].map(([name, creatorIds]) => ({ name, value: creatorIds.size }));
  }, [creators]);

  const accounts = useMemo<AccountWithCreator[]>(
    () => creators.flatMap((creator) => creator.accounts.map((account) => ({ creator, account }))),
    [creators],
  );

  const followerPlatforms = [...new Set(accounts.map(({ account }) => account.platform))];
  const livePlatforms = [
    ...new Set(
      accounts
        .filter(({ account }) => reachMetricName(account) === "avg_live_viewers")
        .map(({ account }) => account.platform),
    ),
  ];
  const videoPlatforms = [
    ...new Set(
      accounts
        .filter(({ account }) => reachMetricName(account) === "avg_video_views")
        .map(({ account }) => account.platform),
    ),
  ];

  const growth = useMemo(
    () => aggregateSnapshots(accounts, "followers", range),
    [accounts, range],
  );
  const liveTrend = useMemo(
    () =>
      aggregateSnapshots(
        accounts.filter(({ account }) => reachMetricName(account) === "avg_live_viewers"),
        "avg_live_viewers",
        range,
        "mean",
      ),
    [accounts, range],
  );
  const videoTrend = useMemo(
    () =>
      aggregateSnapshots(
        accounts.filter(({ account }) => reachMetricName(account) === "avg_video_views"),
        "avg_video_views",
        range,
        "mean",
      ),
    [accounts, range],
  );

  const categoryData = useMemo(() => {
    const values = new Map<string, number>();
    creators.forEach((creator) =>
      values.set(
        creator.category ?? "Uncategorized",
        (values.get(creator.category ?? "Uncategorized") ?? 0) + 1,
      ),
    );
    return [...values]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [creators]);

  const countries = useMemo(() => {
    const values = new Map<string, number>();
    creators.forEach(
      (creator) =>
        creator.creatorCountry &&
        values.set(
          creator.creatorCountry,
          (values.get(creator.creatorCountry) ?? 0) + 1,
        ),
    );
    return [...values]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [creators]);

  const audienceUnits = new Set(
    creators.flatMap((creator) =>
      creator.audienceInsights
        .filter(
          (insight) =>
            ["country", "audience_country"].includes(insight.dimension.toLowerCase()) &&
            insight.amount !== null,
        )
        .map((insight) => insight.unit),
    ),
  );

  const audienceCountryData = useMemo(() => {
    if (audienceUnits.size !== 1) return [];
    const values = new Map<string, number[]>();
    creators.forEach((creator) =>
      creator.audienceInsights.forEach((insight) => {
        if (
          !["country", "audience_country"].includes(insight.dimension.toLowerCase()) ||
          insight.amount === null
        )
          return;
        values.set(insight.value, [...(values.get(insight.value) ?? []), insight.amount]);
      }),
    );
    return [...values]
      .map(([name, amounts]) => ({
        name,
        value: amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [creators, audienceUnits.size]);

  const audienceUnit = audienceUnits.size === 1 ? [...audienceUnits][0] : "%";
  const emails = creators.filter((creator) => creator.businessContact);
  const recent = creators.slice(0, 6);
  const lastCollected = accounts
    .flatMap(({ account }) => account.snapshots.map((snapshot) => snapshot.collectedAt))
    .sort()
    .at(-1);

  const followerComparison = accounts
    .map(({ account }) => ({
      name: account.handle,
      platform: account.platform,
      value: currentFollowers(account),
    }))
    .filter(
      (item): item is { name: string; platform: PlatformAccount["platform"]; value: number } =>
        item.value !== null,
    )
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  const reachComparison = accounts
    .filter(
      ({ account }) =>
        reachMetricName(account) ===
        (reachMode === "live" ? "avg_live_viewers" : "avg_video_views"),
    )
    .map(({ account }) => ({
      name: account.handle,
      platform: account.platform,
      value: currentReach(account),
    }))
    .filter(
      (item): item is { name: string; platform: PlatformAccount["platform"]; value: number } =>
        item.value !== null,
    )
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  const audienceSizeBands = [
    { name: "Under 1M", min: 0, max: 999_999 },
    { name: "1M–10M", min: 1_000_000, max: 9_999_999 },
    { name: "10M–50M", min: 10_000_000, max: 49_999_999 },
    { name: "50M–100M", min: 50_000_000, max: 99_999_999 },
    { name: "100M+", min: 100_000_000, max: Infinity },
  ];

  const audienceSizeDistribution = audienceSizeBands.map((band) => ({
    name: band.name,
    count: accounts.filter(({ account }) => {
      const followers = currentFollowers(account);
      return followers !== null && followers >= band.min && followers <= band.max;
    }).length,
  }));

  function filterBy(parameter: string, value: string) {
    router.push(`/discover?${parameter}=${encodeURIComponent(value)}`);
  }

  return (
    <>
      {/* Hero Banner */}
      <section className="dashboard-hero">
        <div className="hero-visual" aria-hidden="true">
          <BrandMark className="hero-logo-mark" />
        </div>
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={12} className="inline-icon" /> MOSAIC CREATOR INTELLIGENCE · {activeWorkspace.name.toUpperCase()}
          </div>
          <h1>Discover, analyze, and partner with top creators.</h1>
          <p className="page-subtitle">
            Enterprise intelligence across YouTube, Twitch, Kick, TikTok, and Instagram with verified reach metrics and prospect shortlists.
          </p>
          <div className="hero-actions">
            <Link href="/discover" className="button button-primary">
              <Users size={15} /> Discover creators
            </Link>
            <Link href="/lists" className="button button-secondary">
              <TrendingUp size={15} /> View saved shortlists
            </Link>
          </div>
        </div>
      </section>

      {/* Live System Status Strip */}
      <div className="system-status-banner">
        <div className="status-pill-green">
          <span className="banner-dot-green" />
          <strong>Live Verified Catalog Active</strong>
        </div>
        <span>
          Real-time metrics, official handle lookups, and multi-platform reach snapshots across {creators.length} verified creators.
        </span>
        <button
          className="info-link-btn"
          onClick={() => setShowExplainer(true)}
          type="button"
        >
          <CircleHelp size={14} /> Metric Definitions
        </button>
      </div>

      {/* KPI Stat Grid */}
      <div className="stat-grid">
        <div onClick={() => router.push("/discover")} className="stat-clickable" role="button" tabIndex={0}>
          <StatCard
            tone="violet"
            label="Verified Creators"
            value={creators.length}
            note="Profiles with multi-platform reach"
            icon={<Users size={16} />}
          />
        </div>
        <div onClick={() => router.push("/discover")} className="stat-clickable" role="button" tabIndex={0}>
          <StatCard
            tone="teal"
            label="Platform Accounts"
            value={accounts.length}
            note={`${platformData.length} active platforms tracked`}
            icon={<BarChart3 size={16} />}
          />
        </div>
        <div
          onClick={() => router.push("/discover?hasContact=true")}
          className="stat-clickable"
          role="button"
          tabIndex={0}
        >
          <StatCard
            tone="coral"
            label="Verified Business Contacts"
            value={emails.length}
            note="Direct email & management channels"
            icon={<Mail size={16} />}
          />
        </div>
        <div
          onClick={() => router.push("/discover?platform=Twitch")}
          className="stat-clickable"
          role="button"
          tabIndex={0}
        >
          <StatCard
            tone="yellow"
            label="Livestream Accounts"
            value={accounts.filter(({ account }) => reachMetricName(account) === "avg_live_viewers").length}
            note="Twitch & Kick live streamer channels"
            icon={<Radio size={16} />}
          />
        </div>
      </div>

      {/* Primary Charts */}
      <div className="chart-grid">
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Creator Profiles by Platform</h2>
              <p className="card-caption">Click any platform segment to filter discovery</p>
            </div>
            <span className="coverage-tag">
              {creators.length} creators · {accounts.length} accounts
            </span>
          </div>
          <PlatformChart data={platformData} onSelect={(name) => filterBy("platform", name)} />
          <div className="chart-legend">
            {platformData.map((item) => {
              const total = platformData.reduce((acc, p) => acc + p.value, 0);
              const pct = Math.round((item.value / (total || 1)) * 100);
              return (
                <button
                  key={item.name}
                  className="legend-item legend-btn"
                  onClick={() => filterBy("platform", item.name)}
                  type="button"
                  title={`Filter discovery catalog by ${item.name}`}
                >
                  <i
                    className="legend-dot"
                    style={{ background: platformColors[item.name as keyof typeof platformColors] }}
                  />
                  <span>
                    <strong>{item.name}</strong>{" "}
                    <span className="muted">
                      {item.value.toLocaleString()} ({pct}%)
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Follower & Subscriber Growth</h2>
              <p className="card-caption">Historical snapshots across tracked platforms</p>
            </div>
            <RangeTabs range={range} onChange={setRange} />
          </div>
          <TrendChart data={growth} label="Audience Size" series={followerPlatforms} />
          <div className="chart-legend">
            <span>
              <CheckCircle2 size={12} className="inline-icon text-green" /> Verified snapshots
            </span>
            <span>Updated {lastCollected ? formatDate(lastCollected) : "Recently"}</span>
          </div>
        </section>
      </div>

      {/* Tabs */}
      <section className="dashboard-insights">
        <div className="dashboard-tabs" role="tablist" aria-label="Dashboard insights">
          <button
            id="dashboard-tab-reach"
            className={`dashboard-tab ${dashboardTab === "reach" ? "selected" : ""}`}
            role="tab"
            aria-selected={dashboardTab === "reach"}
            aria-controls="dashboard-panel-reach"
            onClick={() => setDashboardTab("reach")}
          >
            Reach & Benchmarks
          </button>
          <button
            id="dashboard-tab-audience"
            className={`dashboard-tab ${dashboardTab === "audience" ? "selected" : ""}`}
            role="tab"
            aria-selected={dashboardTab === "audience"}
            aria-controls="dashboard-panel-audience"
            onClick={() => setDashboardTab("audience")}
          >
            Audience & Geography
          </button>
          <button
            id="dashboard-tab-creators"
            className={`dashboard-tab ${dashboardTab === "creators" ? "selected" : ""}`}
            role="tab"
            aria-selected={dashboardTab === "creators"}
            aria-controls="dashboard-panel-creators"
            onClick={() => setDashboardTab("creators")}
          >
            Verified Profiles Directory
          </button>
        </div>

        {dashboardTab === "reach" && (
          <div id="dashboard-panel-reach" className="dashboard-tab-panel" role="tabpanel">
            <div className="chart-grid equal">
              <section className="card">
                <div className="card-head">
                  <div>
                    <h2 className="card-title">Average Concurrent Stream Viewers</h2>
                    <p className="card-caption">Twitch & Kick · historical stream windows</p>
                  </div>
                  <span className="coverage-tag">Live Streamers</span>
                </div>
                <TrendChart data={liveTrend} label="Avg Concurrent Viewers" series={livePlatforms} />
                <div className="chart-legend">
                  Twitch & Kick live broadcast concurrency · 30-day collection average
                </div>
              </section>

              <section className="card">
                <div className="card-head">
                  <div>
                    <h2 className="card-title">Average Video Views per Post</h2>
                    <p className="card-caption">YouTube & TikTok · recent uploads</p>
                  </div>
                  <span className="coverage-tag">Video Platforms</span>
                </div>
                <TrendChart data={videoTrend} label="Avg Views / Video" series={videoPlatforms} />
                <div className="chart-legend">
                  Mean view count across recent 10-30 public video posts
                </div>
              </section>
            </div>

            <div className="dashboard-lower section-spacer">
              <section className="card">
                <div className="card-head">
                  <div>
                    <h2 className="card-title">Audience Comparison · Followers</h2>
                    <p className="card-caption">Audience totals by top platform accounts</p>
                  </div>
                  <span className="coverage-tag">Top Reach</span>
                </div>
                <ComparisonBarChart
                  data={followerComparison}
                  valueLabel="Followers / Subscribers"
                  onSelect={(platform) => filterBy("platform", platform)}
                />
                <div className="chart-legend">
                  Audience count by account · click a bar to filter platform
                </div>
              </section>

              <section className="card">
                <div className="card-head">
                  <div>
                    <h2 className="card-title">
                      {reachMode === "live"
                        ? "Live Concurrency Comparison"
                        : "Video Views Comparison"}
                    </h2>
                    <p className="card-caption">
                      {reachMode === "live"
                        ? "Twitch & Kick concurrent viewers"
                        : "YouTube & TikTok average views"}
                    </p>
                  </div>
                  <div className="range-tabs">
                    <button
                      className={`range-tab ${reachMode === "live" ? "selected" : ""}`}
                      onClick={() => setReachMode("live")}
                      type="button"
                    >
                      Live
                    </button>
                    <button
                      className={`range-tab ${reachMode === "video" ? "selected" : ""}`}
                      onClick={() => setReachMode("video")}
                      type="button"
                    >
                      Video
                    </button>
                  </div>
                </div>
                <ComparisonBarChart
                  data={reachComparison}
                  valueLabel={reachMode === "live" ? "Avg Live Viewers" : "Avg Views / Video"}
                  onSelect={(platform) => filterBy("platform", platform)}
                />
                <div className="chart-legend">
                  {reachMode === "live"
                    ? "Mean concurrent viewers during active broadcast streams"
                    : "Average view volume achieved per public video post"}
                </div>
              </section>
            </div>
          </div>
        )}

        {dashboardTab === "audience" && (
          <div id="dashboard-panel-audience" className="dashboard-tab-panel" role="tabpanel">
            <div className="dashboard-lower">
              <section className="card">
                <div className="card-head">
                  <div>
                    <h2 className="card-title">Audience Tier Distribution</h2>
                    <p className="card-caption">Account reach segmentation · click to filter</p>
                  </div>
                  <span className="coverage-tag">Tiers</span>
                </div>
                <CategoryChart
                  data={audienceSizeDistribution}
                  itemLabel="accounts"
                  onSelect={(bandName) => {
                    const band = audienceSizeBands.find((item) => item.name === bandName);
                    if (band) {
                      const params = new URLSearchParams({ minFollowers: String(band.min) });
                      if (Number.isFinite(band.max)) params.set("maxFollowers", String(band.max));
                      router.push(`/discover?${params.toString()}`);
                    }
                  }}
                />
              </section>

              <section className="card">
                <div className="card-head">
                  <div>
                    <h2 className="card-title">Creator Categories</h2>
                    <p className="card-caption">Top creative verticals · click to filter</p>
                  </div>
                  <span className="coverage-tag">Verticals</span>
                </div>
                <CategoryChart data={categoryData} onSelect={(name) => filterBy("category", name)} />
              </section>
            </div>

            <div className="dashboard-single section-spacer">
              <section className="card">
                <div className="card-head">
                  <div>
                    <h2 className="card-title">Creator Countries & Audience Geography</h2>
                    <p className="card-caption">Creator home country and verified audience demographics</p>
                  </div>
                  <span className="coverage-tag">{countries.length} Countries</span>
                </div>
                <div className="country-list">
                  {countries.map(({ name, count }) => (
                    <button
                      key={name}
                      className="country-row country-button"
                      onClick={() => filterBy("country", name)}
                      type="button"
                    >
                      <span className="country-name">
                        <span style={{ marginRight: 6 }}>{getCountryFlag(name)}</span>
                        {name}
                      </span>
                      <span className="progress-track">
                        <span
                          className="progress-fill"
                          style={{
                            width: `${Math.max(
                              14,
                              (count / Math.max(...countries.map((c) => c.count))) * 100,
                            )}%`,
                          }}
                        />
                      </span>
                      <span className="country-count">{count} creators</span>
                    </button>
                  ))}
                </div>

                <div className="audience-country-section">
                  <div className="audience-country-heading">
                    <strong>Audience Geography Breakdown</strong>
                    <span>Verified audience share by country across creator profiles</span>
                  </div>
                  {audienceCountryData.length > 0 ? (
                    <>
                      <HorizontalValueChart
                        data={audienceCountryData}
                        suffix={audienceUnit === "percent" || audienceUnit === "%" ? "%" : ` ${audienceUnit}`}
                        onSelect={(country) => filterBy("country", country)}
                      />
                      <div className="chart-legend">
                        Aggregated audience geography share from verified channel analytics
                      </div>
                    </>
                  ) : (
                    <div className="availability-note">
                      Audience location breakdown is based on verified analytics feeds.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {dashboardTab === "creators" && (
          <div id="dashboard-panel-creators" className="dashboard-tab-panel" role="tabpanel">
            <section className="card">
              <div className="card-head">
                <div>
                  <h2 className="card-title">Featured Verified Creators</h2>
                  <p className="card-caption">Top ranked profiles in your active catalog</p>
                </div>
                <Link href="/discover" className="button button-secondary button-sm">
                  View all in Discovery <ChevronRight size={13} />
                </Link>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Creator</th>
                      <th>Primary Platform</th>
                      <th>Followers / Subs</th>
                      <th>Platform Reach</th>
                      <th>Country</th>
                      <th>Cadence</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((creator) => {
                      const account = creator.accounts[0];
                      return (
                        <tr key={creator.id}>
                          <td>
                            <Link href={`/creators/${creator.id}`} className="creator-cell">
                              <span className="creator-avatar">
                                {creator.avatar && creator.avatar.startsWith("http") ? (
                                  <img
                                    src={creator.avatar}
                                    alt={creator.name}
                                    className="avatar-table-img"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : null}
                                <span>{creator.name.slice(0, 2).toUpperCase()}</span>
                              </span>
                              <span>
                                <span className="creator-name">{creator.name}</span>
                                <span className="creator-handle">{account?.handle}</span>
                              </span>
                            </Link>
                          </td>
                          <td>
                            {account && (
                              <span
                                className={`platform-label platform-badge platform-${account.platform.toLowerCase()}`}
                              >
                                <i
                                  className="platform-dot"
                                  style={{ background: platformColors[account.platform] }}
                                />
                                {account.platform}
                              </span>
                            )}
                          </td>
                          <td>
                            {account && currentFollowers(account) !== null
                              ? `${shortNumber(currentFollowers(account)!)} ${account.platform === "YouTube" ? "subs" : "followers"}`
                              : "—"}
                          </td>
                          <td>
                            {account && currentReach(account) !== null
                              ? `${shortNumber(currentReach(account)!)} ${reachMetricName(account) === "avg_live_viewers" ? "avg viewers" : "avg views"}`
                              : "—"}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="table-country-badge"
                              onClick={() => filterBy("country", creator.creatorCountry ?? "")}
                              title={`Filter by ${creator.creatorCountry ?? "Global"}`}
                            >
                              <span className="flag-icon">{getCountryFlag(creator.creatorCountry)}</span>
                              <span>{creator.creatorCountry ?? "Global"}</span>
                            </button>
                          </td>
                          <td>{account?.activity ?? "Active"}</td>
                          <td>
                            <Link
                              href={`/creators/${creator.id}`}
                              className="button button-secondary button-sm"
                            >
                              Profile
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </section>

      {/* Explainer Modal */}
      {showExplainer && (
        <div className="modal-backdrop" onClick={() => setShowExplainer(false)}>
          <div className="explainer-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <CircleHelp size={20} className="modal-icon-green" />
                <h3>Metric Definitions & Verification Principles</h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowExplainer(false)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="definition-card-item">
                <div className="definition-head">
                  <Users size={16} /> <strong>Followers & Subscribers</strong>
                </div>
                <p>
                  Platform-reported audience size collected at designated snapshot intervals.
                  YouTube subscribers are explicitly tracked separately from live follower counts.
                </p>
              </div>
              <div className="definition-card-item">
                <div className="definition-head">
                  <Radio size={16} /> <strong>Average Concurrent Viewers (ACV)</strong>
                </div>
                <p>
                  Mean viewer count calculated across broadcast streams within a 30-day window on Twitch and Kick.
                  We never conflate momentary peak or current viewers with historical ACV.
                </p>
              </div>
              <div className="definition-card-item">
                <div className="definition-head">
                  <Video size={16} /> <strong>Average Video Views</strong>
                </div>
                <p>
                  Mean view count recorded across recent public posts (typically 10-30 videos). Video views and live stream reach are never mixed on a single arbitrary scale.
                </p>
              </div>
              <div className="definition-card-item">
                <div className="definition-head">
                  <CalendarDays size={16} /> <strong>Historical Dated Growth</strong>
                </div>
                <p>
                  Calculated purely from dated observations. If a platform API did not report a collection on a given date, we do not fabricate interpolated points.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="button button-primary"
                onClick={() => setShowExplainer(false)}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({
  label,
  value,
  note,
  icon,
  tone,
}: {
  label: string;
  value: number;
  note: string;
  icon: React.ReactNode;
  tone: "violet" | "teal" | "coral" | "yellow";
}) {
  return (
    <section className={`card stat-card stat-card-${tone}`}>
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <AnimatedKpi value={value} />
      <div className="stat-foot">{note}</div>
    </section>
  );
}

function AnimatedKpi({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || value === 0) {
      setDisplayValue(value);
      return;
    }
    let startTime: number | undefined;
    let frame = 0;
    const duration = 500;
    function tick(timestamp: number) {
      if (startTime === undefined) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplayValue(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    }
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);
  return (
    <div className="stat-value">{new Intl.NumberFormat("en-US").format(displayValue)}</div>
  );
}

function RangeTabs({
  range,
  onChange,
}: {
  range: number;
  onChange: (range: number) => void;
}) {
  return (
    <div className="range-tabs" aria-label="Chart date range">
      {[7, 30, 90].map((days) => (
        <button
          key={days}
          className={`range-tab ${range === days ? "selected" : ""}`}
          onClick={() => onChange(days)}
          type="button"
        >
          {days}D
        </button>
      ))}
    </div>
  );
}

function aggregateSnapshots(
  accounts: AccountWithCreator[],
  metric: string,
  days: number,
  aggregation: "sum" | "mean" = "sum",
): SnapshotPoint[] {
  const now = Date.now();
  const buckets = new Map<string, Map<string, Array<{ value: number; weight: number }>>>();
  accounts.forEach(({ account }) =>
    account.snapshots.forEach((snapshot: MetricSnapshot) => {
      const keyMatches =
        metric === "followers" ? snapshot.metricName === "followers" : snapshot.metricName === metric;
      if (
        !keyMatches ||
        snapshot.value === null ||
        (now - new Date(snapshot.collectedAt).getTime()) / 86_400_000 > days
      )
        return;
      const day = new Date(snapshot.collectedAt).toISOString().slice(0, 10);
      const platforms = buckets.get(day) ?? new Map<string, Array<{ value: number; weight: number }>>();
      platforms.set(account.platform, [
        ...(platforms.get(account.platform) ?? []),
        {
          value: snapshot.value,
          weight: snapshot.sampleSize && snapshot.sampleSize > 0 ? snapshot.sampleSize : 1,
        },
      ]);
      buckets.set(day, platforms);
    }),
  );

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, platforms]) => {
      const point: SnapshotPoint = {
        date: new Date(`${day}T00:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      };
      platforms.forEach((samples, platform) => {
        point[platform] =
          aggregation === "mean"
            ? Math.round(
                samples.reduce((sum, sample) => sum + sample.value * sample.weight, 0) /
                  samples.reduce((sum, sample) => sum + sample.weight, 0),
              )
            : samples.reduce((sum, sample) => sum + sample.value, 0);
      });
      return point;
    });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
