"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3, CircleHelp, Users, Video, Radio, ChevronRight,
  TrendingUp, Sparkles, CheckCircle2, X, Search, Globe, ShieldCheck
} from "lucide-react";
import { useMemo, useState } from "react";
import { useProspects } from "@/components/data-provider";
import {
  ComparisonBarChart, PlatformChart, shortNumber
} from "@/components/charts";
import { BrandMark } from "@/components/brand-mark";
import { platformColors } from "@/lib/platforms";
import { INTEGRATIONS } from "@/lib/integrations";
import type { Creator, PlatformAccount } from "@/lib/model";
import { currentFollowers, currentReach, reachMetricName } from "@/lib/metrics";
import { getCountryFlag } from "@/lib/country-detector";

type AccountWithCreator = { creator: Creator; account: PlatformAccount };

export default function DashboardPage() {
  const router = useRouter();
  const { creators, lists, activeWorkspace, subscription } = useProspects();
  const [showExplainer, setShowExplainer] = useState(false);
  const [quickSearchInput, setQuickSearchInput] = useState("");

  const platformData = useMemo(() => {
    const counts = new Map<string, number>();
    creators.forEach((creator) =>
      creator.accounts.forEach(({ platform }) => {
        counts.set(platform, (counts.get(platform) ?? 0) + 1);
      }),
    );
    return [...counts].map(([name, value]) => ({ name, value }));
  }, [creators]);

  const accounts = useMemo<AccountWithCreator[]>(
    () => creators.flatMap((creator) => creator.accounts.map((account) => ({ creator, account }))),
    [creators],
  );

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

  function filterBy(parameter: string, value: string) {
    router.push(`/discover?${parameter}=${encodeURIComponent(value)}`);
  }

  function handleQuickSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!quickSearchInput.trim()) return;
    router.push(`/discover?q=${encodeURIComponent(quickSearchInput.trim())}`);
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
            <Sparkles size={12} className="inline-icon" /> FEDERATED CREATOR INTELLIGENCE · {activeWorkspace.name.toUpperCase()}
          </div>
          <h1>Discover, analyze, and partner with creators in real-time.</h1>
          <p className="page-subtitle">
            Query live platform APIs across YouTube, Twitch, Kick, TikTok, and Instagram with verified metrics, origin timestamps, and prospect CRM shortlists.
          </p>
          
          {/* Quick Search Input */}
          <form onSubmit={handleQuickSearch} className="hero-search-form" style={{ maxWidth: 640, margin: "20px 0 16px" }}>
            <div className="search-field" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12 }}>
              <Search size={18} className="text-muted" />
              <input
                className="hero-search-input"
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15 }}
                placeholder="Search live creators by name, topic, or channel handle..."
                value={quickSearchInput}
                onChange={(e) => setQuickSearchInput(e.target.value)}
              />
              <button type="submit" className="button button-primary button-sm" style={{ padding: "7px 18px" }}>
                Search Live
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", fontSize: 12 }}>
              <span style={{ color: "var(--muted, #68836c)", alignSelf: "center" }}>Popular queries:</span>
              {["Gaming streamers", "Tech reviews", "CarryMinati", "MrBeast", "Kai Cenat"].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => router.push(`/discover?q=${encodeURIComponent(term)}`)}
                  style={{
                    background: "rgba(255, 255, 255, 0.7)",
                    border: "1px solid rgba(80, 140, 80, 0.2)",
                    borderRadius: 16,
                    padding: "3px 10px",
                    cursor: "pointer",
                    fontSize: 11,
                    color: "#285d38",
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </form>

          <div className="hero-actions">
            <Link href="/discover" className="button button-primary">
              <Users size={15} /> Open Discovery
            </Link>
            <Link href="/lists" className="button button-secondary">
              <TrendingUp size={15} /> View Saved Prospects ({creators.length})
            </Link>
          </div>
        </div>
      </section>

      {/* Live Federated Engine Status Banner */}
      <div className="system-status-banner">
        <div className="status-pill-green">
          <span className="banner-dot-green" />
          <strong>Live Federated Search Engine Active</strong>
        </div>
        <span>
          Real-time API queries execute at request time across official platform integrations. Results include provider source, fetched-at timestamps, and verified reach metrics.
        </span>
        <button
          className="info-link-btn"
          onClick={() => setShowExplainer(true)}
          type="button"
        >
          <CircleHelp size={14} /> Capability Guide
        </button>
      </div>

      {/* KPI Stat Grid: Reflects Real Workspace Data */}
      <div className="stat-grid">
        <div onClick={() => router.push("/lists")} className="stat-clickable" role="button" tabIndex={0}>
          <StatCard
            tone="violet"
            label="Saved Prospects"
            value={creators.length}
            note={creators.length === 1 ? "1 creator in your workspace CRM" : `${creators.length} creators saved to CRM`}
            icon={<Users size={16} />}
          />
        </div>
        <div onClick={() => router.push("/lists")} className="stat-clickable" role="button" tabIndex={0}>
          <StatCard
            tone="teal"
            label="Campaign Shortlists"
            value={lists.length}
            note={`${lists.length} active campaign list${lists.length === 1 ? "" : "s"}`}
            icon={<BarChart3 size={16} />}
          />
        </div>
        <div onClick={() => router.push("/settings")} className="stat-clickable" role="button" tabIndex={0}>
          <StatCard
            tone="coral"
            label="Platform Connectors"
            value={5}
            note="YouTube, Twitch, Kick, TikTok, Instagram"
            icon={<Globe size={16} />}
          />
        </div>
        <div onClick={() => router.push("/settings")} className="stat-clickable" role="button" tabIndex={0}>
          <StatCard
            tone="yellow"
            label="Searches Remaining"
            value={subscription.totalQuota === -1 ? 999999 : subscription.searchesRemaining}
            note={subscription.totalQuota === -1 ? "Unlimited Plan active" : `${subscription.searchesRemaining} / ${subscription.totalQuota} monthly quota`}
            icon={<Sparkles size={16} />}
          />
        </div>
      </div>

      {/* Connected Platforms Capabilities Matrix */}
      <section className="card" style={{ marginBottom: 24, padding: "20px 24px" }}>
        <div className="card-head" style={{ marginBottom: 16 }}>
          <div>
            <h2 className="card-title">Live Platform Connectors & Official Capabilities</h2>
            <p className="card-caption">Transparent declarations of supported operations per official provider API</p>
          </div>
          <Link href="/settings" className="button button-secondary button-sm">
            Manage Credentials <ChevronRight size={13} />
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          {INTEGRATIONS.map((integ) => (
            <div
              key={integ.platform}
              style={{
                border: "1px solid rgba(80, 140, 80, 0.15)",
                borderRadius: 12,
                padding: "14px 16px",
                background: "rgba(255, 255, 255, 0.5)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <strong style={{ fontSize: 14, color: "#1d472b" }}>{integ.platform}</strong>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 7px",
                    borderRadius: 6,
                    background: integ.supportsLiveDiscovery ? "rgba(34, 197, 94, 0.12)" : "rgba(56, 189, 248, 0.12)",
                    color: integ.supportsLiveDiscovery ? "#15803d" : "#0284c7",
                  }}
                >
                  {integ.connectorStatus}
                </span>
              </div>
              <p style={{ fontSize: 11, color: "#547359", margin: "0 0 10px", lineHeight: 1.4 }}>
                {integ.statusNote}
              </p>
              <div style={{ fontSize: 10, color: "#68836c" }}>
                {integ.supportsLiveDiscovery ? (
                  <span style={{ color: "#166534" }}>✓ Live keyword discovery & channel metrics</span>
                ) : (
                  <span>✓ Direct channel lookup by handle</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* If prospects are saved, show portfolio charts; otherwise show discovery launchpad */}
      {creators.length > 0 ? (
        <>
          {/* Primary Charts for Saved Prospects */}
          <div className="chart-grid">
            <section className="card">
              <div className="card-head">
                <div>
                  <h2 className="card-title">Saved Prospects by Platform</h2>
                  <p className="card-caption">Distribution across your shortlisted talent</p>
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
                  <h2 className="card-title">Audience Size Comparison</h2>
                  <p className="card-caption">Verified followers/subscribers across shortlisted prospects</p>
                </div>
              </div>
              <ComparisonBarChart
                data={followerComparison}
                valueLabel="Followers / Subscribers"
                onSelect={(platform) => filterBy("platform", platform)}
              />
              <div className="chart-legend">
                <span>
                  <CheckCircle2 size={12} className="inline-icon text-green" /> Verified live API snapshots
                </span>
                <span>Updated {lastCollected ? formatDate(lastCollected) : "Recently"}</span>
              </div>
            </section>
          </div>

          {/* Saved Prospects Directory */}
          <section className="card" style={{ marginTop: 24 }}>
            <div className="card-head">
              <div>
                <h2 className="card-title">Saved Workspace Prospects</h2>
                <p className="card-caption">Creators organized in your active shortlists</p>
              </div>
              <Link href="/lists" className="button button-secondary button-sm">
                Open CRM Lists <ChevronRight size={13} />
              </Link>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Creator</th>
                    <th>Platform</th>
                    <th>Followers / Subs</th>
                    <th>Reach Metric</th>
                    <th>Country</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((creator) => {
                    const account = creator.accounts[0];
                    return (
                      <tr
                        key={creator.id}
                        className="clickable-row"
                        onClick={() => router.push(`/creators/${creator.id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <div className="creator-cell">
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
                          </div>
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
                          <span>{getCountryFlag(creator.creatorCountry)} {creator.creatorCountry ?? "Global"}</span>
                        </td>
                        <td>
                          <Link
                            href={`/creators/${creator.id}`}
                            className="button button-secondary button-sm"
                            onClick={(e) => e.stopPropagation()}
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
        </>
      ) : (
        /* Empty Portfolio State: Clear Call to Action for Live Discovery */
        <section className="card" style={{ textAlign: "center", padding: "48px 24px", margin: "24px 0" }}>
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <span
              style={{
                display: "inline-flex",
                padding: 16,
                borderRadius: "50%",
                background: "rgba(56, 189, 248, 0.12)",
                color: "#0284c7",
                marginBottom: 16,
              }}
            >
              <Search size={28} />
            </span>
            <h2 style={{ fontSize: 20, marginBottom: 8, color: "#1d472b" }}>No Saved Prospects Yet</h2>
            <p style={{ color: "#547359", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Search creators live across connected platform APIs on Discover. Evaluate reach metrics, compare engagement, and bookmark creators to save them to your CRM shortlists.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <Link href="/discover" className="button button-primary">
                <Search size={15} /> Search Live Creators
              </Link>
              <Link href="/settings" className="button button-secondary">
                <Globe size={15} /> API Settings & Keys
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Explainer Modal */}
      {showExplainer && (
        <div className="modal-backdrop" onClick={() => setShowExplainer(false)}>
          <div className="explainer-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <CircleHelp size={20} className="modal-icon-green" />
                <h3>Platform Capabilities & API Architecture</h3>
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
                  <Globe size={16} /> <strong>Federated Query Execution</strong>
                </div>
                <p>
                  Searches query platform connectors in parallel at runtime. We never rely on a fixed, hardcoded creator list. Responses are normalized with explicit source provenance and fetched-at timestamps.
                </p>
              </div>
              <div className="definition-card-item">
                <div className="definition-head">
                  <Radio size={16} /> <strong>YouTube & Twitch Live Discovery</strong>
                </div>
                <p>
                  Official Google Data API v3 and Twitch Helix API support keyword search and stream status discovery. Queries return live public subscriber and viewer metrics.
                </p>
              </div>
              <div className="definition-card-item">
                <div className="definition-head">
                  <Video size={16} /> <strong>Kick Handle Resolution</strong>
                </div>
                <p>
                  Kick official endpoints resolve specific channel handles and report live stream status and viewer counts. Arbitrary global keyword discovery is not supported by Kick&apos;s API.
                </p>
              </div>
              <div className="definition-card-item">
                <div className="definition-head">
                  <ShieldCheck size={16} /> <strong>TikTok & Instagram Permissions</strong>
                </div>
                <p>
                  Official TikTok Display API and Meta Graph API require creator or professional account authorization. Public discovery does not crawl or scrape private profiles.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="button button-primary"
                onClick={() => setShowExplainer(false)}
              >
                Understood
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
      <div className="stat-value">
        {value >= 999999 ? "Unlimited" : new Intl.NumberFormat("en-US").format(value)}
      </div>
      <div className="stat-foot">{note}</div>
    </section>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
