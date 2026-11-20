"use client";

import Link from "next/link";
import { BarChart3, CalendarDays, CircleHelp, Users, Video, Radio, Mail, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useProspects } from "@/components/data-provider";
import { CategoryChart, ComparisonBarChart, HorizontalValueChart, PlatformChart, TrendChart, shortNumber } from "@/components/charts";
import { BrandMark } from "@/components/brand-mark";
import { platformColors } from "@/lib/platforms";
import type { Creator, MetricSnapshot, PlatformAccount } from "@/lib/model";
import { currentFollowers, currentReach, reachMetricName } from "@/lib/metrics";

type SnapshotPoint = Record<string, string | number | null> & { date: string };
type AccountWithCreator = { creator: Creator; account: PlatformAccount };

export default function DashboardPage() {
  const { creators } = useProspects();
  const [range, setRange] = useState(90);
  const [reachMode, setReachMode] = useState<"live" | "video">("live");
  const [dashboardTab, setDashboardTab] = useState<"reach" | "audience" | "creators">("reach");
  const platformData = useMemo(() => {
    const profiles = new Map<string, Set<string>>();
    creators.forEach((creator) => creator.accounts.forEach(({ platform }) => {
      const creatorsForPlatform = profiles.get(platform) ?? new Set<string>();
      creatorsForPlatform.add(creator.id);
      profiles.set(platform, creatorsForPlatform);
    }));
    return [...profiles].map(([name, creatorIds]) => ({ name, value: creatorIds.size }));
  }, [creators]);
  const accounts = useMemo<AccountWithCreator[]>(() => creators.flatMap((creator) => creator.accounts.map((account) => ({ creator, account }))), [creators]);
  const followerPlatforms = [...new Set(accounts.map(({ account }) => account.platform))];
  const livePlatforms = [...new Set(accounts.filter(({ account }) => reachMetricName(account) === "avg_live_viewers").map(({ account }) => account.platform))];
  const videoPlatforms = [...new Set(accounts.filter(({ account }) => reachMetricName(account) === "avg_video_views").map(({ account }) => account.platform))];
  const growth = useMemo(() => aggregateSnapshots(accounts, "followers", range), [accounts, range]);
  const liveTrend = useMemo(() => aggregateSnapshots(accounts.filter(({ account }) => reachMetricName(account) === "avg_live_viewers"), "avg_live_viewers", range, "mean"), [accounts, range]);
  const videoTrend = useMemo(() => aggregateSnapshots(accounts.filter(({ account }) => reachMetricName(account) === "avg_video_views"), "avg_video_views", range, "mean"), [accounts, range]);
  const categoryData = useMemo(() => {
    const values = new Map<string, number>();
    creators.forEach((creator) => values.set(creator.category ?? "Uncategorized", (values.get(creator.category ?? "Uncategorized") ?? 0) + 1));
    return [...values].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [creators]);
  const countries = useMemo(() => {
    const values = new Map<string, number>();
    creators.forEach((creator) => creator.creatorCountry && values.set(creator.creatorCountry, (values.get(creator.creatorCountry) ?? 0) + 1));
    return [...values].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [creators]);
  const audienceUnits = new Set(creators.flatMap((creator) => creator.audienceInsights
    .filter((insight) => ["country", "audience_country"].includes(insight.dimension.toLowerCase()) && insight.amount !== null)
    .map((insight) => insight.unit)));
  const audienceCountryData = useMemo(() => {
    if (audienceUnits.size !== 1) return [];
    const values = new Map<string, number[]>();
    creators.forEach((creator) => creator.audienceInsights.forEach((insight) => {
      if (!["country", "audience_country"].includes(insight.dimension.toLowerCase()) || insight.amount === null) return;
      values.set(insight.value, [...(values.get(insight.value) ?? []), insight.amount]);
    }));
    return [...values].map(([name, amounts]) => ({
      name,
      value: amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length,
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [creators, audienceUnits.size]);
  const audienceUnit = audienceUnits.size === 1 ? [...audienceUnits][0] : "";
  const emails = creators.filter((creator) => creator.businessContact);
  const recent = creators.slice(0, 5);
  const lastCollected = accounts.flatMap(({ account }) => account.snapshots.map((snapshot) => snapshot.collectedAt)).sort().at(-1);
  const followerComparison = accounts
    .map(({ account }) => ({ name: account.handle, platform: account.platform, value: currentFollowers(account) }))
    .filter((item): item is { name: string; platform: PlatformAccount["platform"]; value: number } => item.value !== null)
    .sort((a, b) => b.value - a.value).slice(0, 6);
  const audienceSizeBands = [
    { name: "Under 50K", min: 0, max: 49_999 },
    { name: "50K–100K", min: 50_000, max: 99_999 },
    { name: "100K–250K", min: 100_000, max: 249_999 },
    { name: "250K–500K", min: 250_000, max: 499_999 },
    { name: "500K+", min: 500_000, max: Infinity },
  ];
  const audienceSizeDistribution = audienceSizeBands.map((band) => ({
    name: band.name,
    count: accounts.filter(({ account }) => {
      const followers = currentFollowers(account);
      return followers !== null && followers >= band.min && followers <= band.max;
    }).length,
  }));
  const reachComparison = accounts
    .filter(({ account }) => reachMetricName(account) === (reachMode === "live" ? "avg_live_viewers" : "avg_video_views"))
    .map(({ account }) => ({ name: account.handle, platform: account.platform, value: currentReach(account) }))
    .filter((item): item is { name: string; platform: PlatformAccount["platform"]; value: number } => item.value !== null)
    .sort((a, b) => b.value - a.value).slice(0, 6);

  function filterBy(parameter: string, value: string) {
    window.location.href = `/discover?${parameter}=${encodeURIComponent(value)}`;
  }

  return (
    <>
      <section className="dashboard-hero">
        <div className="hero-visual" aria-hidden="true">
          <BrandMark className="hero-logo-mark" />
        </div>
        <div className="hero-copy">
          <div className="eyebrow">MOSAIC CREATOR INTELLIGENCE</div>
          <h1>Welcome to your creator galaxy.</h1>
          <p className="page-subtitle">Find your next creative connection across the platforms that matter to you.</p>
          <Link href="/discover" className="button button-primary"><Users size={15} /> Discover creators</Link>
        </div>
      </section>
      <div className="demo-banner"><span className="banner-dot" /><span><strong>Demo workspace</strong> — synthetic example records. No live platform data is connected.</span><Link href="/settings">Set up integrations <ChevronRight size={13} /></Link></div>
      <div className="stat-grid">
        <StatCard tone="violet" label="Creator profiles" value={creators.length} note="Across all supported platforms" icon={<Users size={16} />} />
        <StatCard tone="teal" label="Platform accounts" value={accounts.length} note={`${platformData.length} platforms represented`} icon={<BarChart3 size={16} />} />
        <StatCard tone="coral" label="Public business contacts" value={emails.length} note="Demo records with source URLs" icon={<Mail size={16} />} />
        <StatCard tone="yellow" label="Livestream accounts" value={accounts.filter(({ account }) => reachMetricName(account) === "avg_live_viewers").length} note="Historical averages are separate" icon={<Radio size={16} />} />
      </div>
      <div className="chart-grid">
        <section className="card">
          <div className="card-head"><div><h2 className="card-title">Creator profiles by platform</h2><p className="card-caption">Unique creator profiles · click a segment to filter</p></div><span className="coverage-tag">{creators.length} creators · {accounts.length} accounts</span></div>
          <PlatformChart data={platformData} onSelect={(name) => filterBy("platform", name)} />
          <div className="chart-legend">{platformData.map((item) => <span className="legend-item" key={item.name}><i className="legend-dot" style={{ background: platformColors[item.name as keyof typeof platformColors] }} />{item.name}<span className="muted">{item.value}</span></span>)}</div>
        </section>
        <section className="card">
          <div className="card-head"><div><h2 className="card-title">Follower & subscriber growth</h2><p className="card-caption">Dated snapshots; each platform stays separate.</p></div><RangeTabs range={range} onChange={setRange} /></div>
          <TrendChart data={growth} label="Followers / subscribers" series={followerPlatforms} />
          <div className="chart-legend"><span>Coverage: {growth.length ? `${growth.length} dated points` : "no snapshots in selected range"}</span><span>Updated {lastCollected ? formatDate(lastCollected) : "Unavailable"}</span></div>
        </section>
      </div>
      <section className="dashboard-insights">
        <div className="dashboard-tabs" role="tablist" aria-label="Additional dashboard insights">
          <button id="dashboard-tab-reach" className={`dashboard-tab ${dashboardTab === "reach" ? "selected" : ""}`} role="tab" aria-selected={dashboardTab === "reach"} aria-controls="dashboard-panel-reach" onClick={() => setDashboardTab("reach")}>Reach & comparisons</button>
          <button id="dashboard-tab-audience" className={`dashboard-tab ${dashboardTab === "audience" ? "selected" : ""}`} role="tab" aria-selected={dashboardTab === "audience"} aria-controls="dashboard-panel-audience" onClick={() => setDashboardTab("audience")}>Audience</button>
          <button id="dashboard-tab-creators" className={`dashboard-tab ${dashboardTab === "creators" ? "selected" : ""}`} role="tab" aria-selected={dashboardTab === "creators"} aria-controls="dashboard-panel-creators" onClick={() => setDashboardTab("creators")}>Creators & definitions</button>
        </div>
        {dashboardTab === "reach" && <div id="dashboard-panel-reach" className="dashboard-tab-panel" role="tabpanel" aria-labelledby="dashboard-tab-reach">
          <div className="chart-grid equal">
            <section className="card">
              <div className="card-head"><div><h2 className="card-title">Average concurrent viewers</h2><p className="card-caption">Twitch & Kick · historical 30-day window snapshots</p></div><span className="coverage-tag">Not live viewers</span></div>
              <TrendChart data={liveTrend} label="Average concurrent viewers" series={livePlatforms} />
              <div className="chart-legend">Coverage: {liveTrend.length ? `${liveTrend.length} dated points` : "no snapshots in selected range"} · Updated {mostRecentMetricDate(accounts, "avg_live_viewers")} · synthetic demo data</div>
            </section>
            <section className="card">
              <div className="card-head"><div><h2 className="card-title">Average views per recent video</h2><p className="card-caption">Video platforms · recent 30-day windows</p></div><span className="coverage-tag">Window-defined</span></div>
              <TrendChart data={videoTrend} label="Average views per video" series={videoPlatforms} />
              <div className="chart-legend">Coverage: {videoTrend.length ? `${videoTrend.length} dated points` : "no snapshots in selected range"} · Updated {mostRecentMetricDate(accounts, "avg_video_views")} · synthetic demo data</div>
            </section>
          </div>
          <div className="dashboard-lower section-spacer">
            <section className="card">
              <div className="card-head"><div><h2 className="card-title">Creator comparison · followers</h2><p className="card-caption">Follower / subscriber totals at latest snapshots</p></div><span className="coverage-tag">Top 6 accounts</span></div>
              <ComparisonBarChart data={followerComparison} valueLabel="Followers / subscribers" onSelect={(platform) => filterBy("platform", platform)} />
              <div className="chart-legend">Audience-size counts by account · updated {lastCollected ? formatDate(lastCollected) : "Unavailable"} · synthetic demo data</div>
            </section>
            <section className="card">
              <div className="card-head"><div><h2 className="card-title">{reachMode === "live" ? "Creator comparison · average live viewers" : "Creator comparison · average video views"}</h2><p className="card-caption">{reachMode === "live" ? "Twitch & Kick · historical 30-day average" : "Video accounts · recent 30-day post window"}</p></div><div className="range-tabs"><button className={`range-tab ${reachMode === "live" ? "selected" : ""}`} onClick={() => setReachMode("live")}>Live</button><button className={`range-tab ${reachMode === "video" ? "selected" : ""}`} onClick={() => setReachMode("video")}>Video</button></div></div>
              <ComparisonBarChart data={reachComparison} valueLabel={reachMode === "live" ? "Average concurrent viewers" : "Average views per post"} onSelect={(platform) => filterBy("platform", platform)} />
              <div className="chart-legend">{reachMode === "live" ? "Average concurrent viewers are not current live viewers." : "Mean uses the recent-post sample shown on each creator profile."} · updated {mostRecentMetricDate(accounts, reachMode === "live" ? "avg_live_viewers" : "avg_video_views")} · synthetic demo data</div>
            </section>
          </div>
          <section className="card comparison-explainer section-spacer">
            <div className="card-head"><div><h2 className="card-title">Compare with context</h2><p className="card-caption">Reach comparisons use one metric family at a time</p></div><CircleHelp size={15} color="#97a29a" /></div>
            <div className="definition-list">
              <Definition icon={<Users size={13} />} title="Audience size" text="Follower and subscriber totals are compared as profile audience counts. YouTube subscribers remain labeled separately." />
              <Definition icon={<Radio size={13} />} title="Livestream reach" text="Twitch and Kick are compared using historical average concurrent viewers, never current live counts." />
              <Definition icon={<Video size={13} />} title="Video reach" text="Video platform comparisons use average views per recent post and its sample window. Live and video metrics are not put on a shared scale." />
            </div>
          </section>
        </div>}
        {dashboardTab === "audience" && <div id="dashboard-panel-audience" className="dashboard-tab-panel" role="tabpanel" aria-labelledby="dashboard-tab-audience">
          <div className="dashboard-lower">
            <section className="card">
              <div className="card-head"><div><h2 className="card-title">Follower / subscriber distribution</h2><p className="card-caption">Platform account audience-size bands · click to filter</p></div><span className="coverage-tag">Latest snapshots</span></div>
              <CategoryChart data={audienceSizeDistribution} itemLabel="accounts" onSelect={(bandName) => {
                const band = audienceSizeBands.find((item) => item.name === bandName);
                if (band) {
                  const params = new URLSearchParams({ minFollowers: String(band.min) });
                  if (Number.isFinite(band.max)) params.set("maxFollowers", String(band.max));
                  window.location.href = `/discover?${params.toString()}`;
                }
              }} />
              <div className="chart-legend">Followers and subscribers are displayed as audience-size counts; missing values are excluded.</div>
            </section>
            <section className="card">
              <div className="card-head"><div><h2 className="card-title">Creator categories</h2><p className="card-caption">Find your next niche — click to filter</p></div><span className="coverage-tag">Demo coverage</span></div>
              <CategoryChart data={categoryData} onSelect={(name) => filterBy("category", name)} />
            </section>
          </div>
          <div className="dashboard-single section-spacer">
            <section className="card">
              <div className="card-head"><div><h2 className="card-title">Creator countries</h2><p className="card-caption">Profile country · source recorded per profile</p></div><span className="coverage-tag">{countries.length} countries</span></div>
              {countries.length ? <div className="country-list">
                {countries.map(({ name, count }) => <button key={name} className="country-row country-button" onClick={() => filterBy("country", name)}><span className="country-name">{name}</span><span className="progress-track"><span className="progress-fill" style={{ width: `${Math.max(14, count / Math.max(...countries.map((country) => country.count)) * 100)}%` }} /></span><span className="country-count">{count}</span></button>)}
              </div> : <div className="chart-empty country-empty">No creator-country values are available.</div>}
              <div className="audience-country-section">
                <div className="audience-country-heading"><strong>Audience-country distribution</strong><span>Licensed or creator-authorized insight only</span></div>
                {audienceCountryData.length
                  ? <><HorizontalValueChart data={audienceCountryData} suffix={audienceUnit === "percent" || audienceUnit === "%" ? "%" : ` ${audienceUnit}`} onSelect={(country) => filterBy("audienceCountry", country)} /><div className="chart-legend">Average sourced values across creator profiles · source/date/confidence on each profile</div></>
                  : <div className="availability-note"><strong>Audience-country data unavailable</strong>{audienceUnits.size > 1 ? "Sources use incompatible units, so values are not combined." : "No sourced audience geography is present. We never infer audience location from creator country."}</div>}
              </div>
            </section>
          </div>
        </div>}
        {dashboardTab === "creators" && <div id="dashboard-panel-creators" className="dashboard-tab-panel" role="tabpanel" aria-labelledby="dashboard-tab-creators">
          <div className="dashboard-lower">
            <section className="card">
              <div className="card-head"><div><h2 className="card-title">Recently added creators</h2><p className="card-caption">A sample of profiles in your discovery set</p></div><Link href="/discover" className="button button-quiet button-sm">View all <ChevronRight size={13} /></Link></div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Creator</th><th>Platform</th><th>Followers</th><th>Platform reach</th><th>Activity</th></tr></thead>
                  <tbody>{recent.length ? recent.map((creator) => {
                    const account = creator.accounts[0];
                    return <tr key={creator.id}>
                      <td><Link href={`/creators/${creator.id}`} className="creator-cell"><span className="creator-avatar">{creator.avatar}</span><span><span className="creator-name">{creator.name}</span><span className="creator-handle">{account.handle}</span></span></Link></td>
                      <td><span className={`platform-label platform-badge platform-${account.platform.toLowerCase()}`}><i className="platform-dot" style={{ background: platformColors[account.platform] }} />{account.platform}</span></td>
                      <td>{currentFollowers(account) === null ? unavailable() : `${shortNumber(currentFollowers(account)!)} ${account.platform === "YouTube" ? "subs" : "followers"}`}</td>
                      <td>{currentReach(account) === null ? unavailable() : `${shortNumber(currentReach(account)!)} ${reachMetricName(account) === "avg_live_viewers" ? "avg viewers" : "avg views"}`}</td>
                      <td>{account.activity ?? unavailable()}</td>
                    </tr>;
                  }) : <tr><td colSpan={5}><div className="table-empty-state">Creator profiles will appear here when available.</div></td></tr>}</tbody>
                </table>
              </div>
            </section>
            <section className="card">
              <div className="card-head"><div><h2 className="card-title">Metric definitions</h2><p className="card-caption">Keep comparisons honest</p></div><CircleHelp size={15} color="#97a29a" /></div>
              <div className="definition-list">
                <Definition icon={<Users size={13} />} title="Followers & subscribers" text="Platform-reported audience size at the time of collection. YouTube subscribers are shown separately from other follower counts." />
                <Definition icon={<Radio size={13} />} title="Average concurrent viewers" text="Mean from collected stream-viewer snapshots over a stated window. It is not a current live-viewer count." />
                <Definition icon={<Video size={13} />} title="Average video views" text="Mean views across a stated set of recent public posts. Video and live-stream metrics are never combined." />
                <Definition icon={<CalendarDays size={13} />} title="Growth" text="Change between dated snapshots only. Missing dates are left blank rather than interpolated." />
              </div>
            </section>
          </div>
        </div>}
      </section>
    </>
  );
}

function StatCard({ label, value, note, icon, tone }: { label: string; value: number; note: string; icon: React.ReactNode; tone: "violet" | "teal" | "coral" | "yellow" }) {
  return <section className={`card stat-card stat-card-${tone}`}><div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><AnimatedKpi value={value} /><div className="stat-foot">{note}</div></section>;
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
    const duration = 550;
    function tick(timestamp: number) {
      if (startTime === undefined) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplayValue(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    }
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);
  return <div className="stat-value">{new Intl.NumberFormat("en-US").format(displayValue)}</div>;
}

function RangeTabs({ range, onChange }: { range: number; onChange: (range: number) => void }) {
  return <div className="range-tabs" aria-label="Chart date range">{[7, 30, 90].map((days) => <button key={days} className={`range-tab ${range === days ? "selected" : ""}`} onClick={() => onChange(days)}>{days}D</button>)}</div>;
}

function Definition({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="definition-row"><span className="definition-icon">{icon}</span><div><strong>{title}</strong><p>{text}</p></div></div>;
}

function aggregateSnapshots(accounts: AccountWithCreator[], metric: string, days: number, aggregation: "sum" | "mean" = "sum"): SnapshotPoint[] {
  const now = Date.now();
  const buckets = new Map<string, Map<string, Array<{ value: number; weight: number }>>>();
  accounts.forEach(({ account }) => account.snapshots.forEach((snapshot: MetricSnapshot) => {
    const keyMatches = metric === "followers" ? snapshot.metricName === "followers" : snapshot.metricName === metric;
    if (!keyMatches || snapshot.value === null || (now - new Date(snapshot.collectedAt).getTime()) / 86_400_000 > days) return;
    const day = new Date(snapshot.collectedAt).toISOString().slice(0, 10);
    const platforms = buckets.get(day) ?? new Map<string, Array<{ value: number; weight: number }>>();
    platforms.set(account.platform, [
      ...(platforms.get(account.platform) ?? []),
      { value: snapshot.value, weight: snapshot.sampleSize && snapshot.sampleSize > 0 ? snapshot.sampleSize : 1 },
    ]);
    buckets.set(day, platforms);
  }));
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, platforms]) => {
      const point: SnapshotPoint = {
        date: new Date(`${day}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
      platforms.forEach((samples, platform) => {
        point[platform] = aggregation === "mean"
          ? Math.round(samples.reduce((sum, sample) => sum + sample.value * sample.weight, 0) / samples.reduce((sum, sample) => sum + sample.weight, 0))
          : samples.reduce((sum, sample) => sum + sample.value, 0);
      });
      return point;
    });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function unavailable() { return <span className="metric-unavailable">Unavailable</span>; }
function mostRecentMetricDate(accounts: AccountWithCreator[], metric: string) {
  const dates = accounts.flatMap(({ account }) => account.snapshots.filter((snapshot) => snapshot.metricName === metric).map((snapshot) => snapshot.collectedAt));
  return dates.length ? formatDate(dates.sort().at(-1)!) : "Unavailable";
}
