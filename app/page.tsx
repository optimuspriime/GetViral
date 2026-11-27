"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3, CircleHelp, Users, Video, Radio, ChevronRight,
  Bookmark, Sparkles, CheckCircle2, X, Search, Globe, ShieldCheck
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useProspects } from "@/components/data-provider";
import {
  ComparisonBarChart, PlatformChart, shortNumber
} from "@/components/charts";
import { BrandMark } from "@/components/brand-mark";
import { platformColors } from "@/lib/platforms";
import { INTEGRATIONS, type IntegrationHealthItem } from "@/lib/integrations";
import type { Creator, PlatformAccount } from "@/lib/model";
import { currentFollowers, currentReach, reachMetricName } from "@/lib/metrics";
import { getCountryFlag } from "@/lib/country-detector";
import { useDialogAccessibility } from "@/lib/use-dialog-accessibility";
import { SearchHintsDropdown, useSearchHints } from "@/components/search-hints-menu";

type AccountWithCreator = { creator: Creator; account: PlatformAccount };

export default function DashboardPage() {
  const router = useRouter();
  const { creators, lists, activeWorkspace, subscription, isGuest, setPricingModalOpen } = useProspects();
  const [showExplainer, setShowExplainer] = useState(false);
  const [quickSearchInput, setQuickSearchInput] = useState("");
  const explainerDialogRef = useRef<HTMLDivElement>(null);
  const explainerCloseRef = useRef<HTMLButtonElement>(null);
  const knownCreatorNames = useMemo(() => creators.map((c) => c.name), [creators]);
  const heroHints = useSearchHints(quickSearchInput, knownCreatorNames);

  useDialogAccessibility(showExplainer, () => setShowExplainer(false), explainerDialogRef, explainerCloseRef);

  const isQuotaExhausted = subscription.totalQuota !== -1 && subscription.searchesRemaining <= 0;
  const [connectorsLoaded, setConnectorsLoaded] = useState(false);
  const [integrationsHealth, setIntegrationsHealth] = useState<IntegrationHealthItem[]>(() =>
    INTEGRATIONS.map((i) => ({
      ...i,
      connected: i.platform === "Kick",
      mode:
        i.platform === "Kick"
          ? "active_api"
          : i.requiresCreatorOAuth
          ? "requires_oauth"
          : "unconfigured",
      availableForPublicDiscovery: false,
    })),
  );

  useEffect(() => {
    fetch("/api/integrations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.integrations)) {
          setIntegrationsHealth(data.integrations);
        }
      })
      .catch(() => {})
      .finally(() => setConnectorsLoaded(true));
  }, []);

  const activeConnectors = useMemo(
    () => integrationsHealth.filter((i) => i.connected),
    [integrationsHealth],
  );

  // Only count shortlists that actually hold creators or were explicitly created by the user
  const activeShortlistCount = useMemo(
    () =>
      lists.filter((l) => l.creatorIds.length > 0 || l.id !== "list-default-shortlist").length,
    [lists],
  );

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
    if (isQuotaExhausted) {
      if (isGuest) {
        router.push("/auth");
      } else {
        setPricingModalOpen(true);
      }
      return;
    }
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
            <Sparkles size={12} className="inline-icon" /> LIVE CREATOR DISCOVERY · {activeWorkspace.name.toUpperCase()}
          </div>
          <h1>Discover real-time creators and manage campaign partnerships.</h1>
          <p className="page-subtitle">
            {connectorsLoaded && activeConnectors.some((c) => c.platform === "Twitch")
              ? "Search live YouTube & Twitch channels, look up Kick handles, and connect creator-authorized TikTok & Instagram accounts — with transparent source timestamps."
              : "Search live YouTube channels by topic or filter, look up Kick creators by exact @handle, and manage CRM shortlists. (Twitch pending activation; TikTok & Instagram require creator OAuth.)"}
          </p>

          {/* Primary Search CTA */}
          <form onSubmit={handleQuickSearch} className="hero-search-form" style={{ maxWidth: 640, margin: "20px 0 14px" }}>
            <div className="search-input-shell">
              <div className="search-field" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12 }}>
                <Search size={18} className="text-muted" />
                <input
                  className="hero-search-input"
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15 }}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={
                    isQuotaExhausted
                      ? isGuest
                        ? "Guest preview limit reached (0/5) — sign in for 50 monthly searches"
                        : "Monthly quota reached (0 remaining) — view plans"
                      : connectorsLoaded && activeConnectors.some((c) => c.platform === "Twitch")
                        ? "Search creators by keyword (YouTube / Twitch) or exact @handle (Kick)..."
                        : "Search live creators on YouTube by topic or look up Kick @handles..."
                  }
                  value={quickSearchInput}
                  disabled={isQuotaExhausted}
                  onFocus={() => heroHints.setOpen(true)}
                  onChange={(e) => {
                    setQuickSearchInput(e.target.value);
                    heroHints.setOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (!heroHints.isOpen || heroHints.hints.length === 0) return;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      heroHints.setActiveIndex((prev) => (prev + 1) % heroHints.hints.length);
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      heroHints.setActiveIndex((prev) => (prev <= 0 ? heroHints.hints.length - 1 : prev - 1));
                    } else if (e.key === "Escape") {
                      heroHints.setOpen(false);
                    } else if (e.key === "Enter" && heroHints.activeIndex >= 0 && heroHints.hints[heroHints.activeIndex]) {
                      e.preventDefault();
                      const chosen = heroHints.hints[heroHints.activeIndex];
                      heroHints.setOpen(false);
                      setQuickSearchInput(chosen);
                      router.push(`/discover?q=${encodeURIComponent(chosen)}`);
                    }
                  }}
                />
                <button
                  type="submit"
                  className="button button-primary button-sm"
                  style={{ padding: "7px 18px" }}
                  disabled={isQuotaExhausted}
                  title={isQuotaExhausted ? "Search quota exhausted" : undefined}
                >
                  {isQuotaExhausted ? "Limit Reached" : "Search Creators"}
                </button>
              </div>
              <SearchHintsDropdown
                query={quickSearchInput}
                hints={heroHints.hints}
                isOpen={heroHints.isOpen}
                activeIndex={heroHints.activeIndex}
                onClose={() => heroHints.setOpen(false)}
                onSelect={(hint) => {
                  heroHints.setOpen(false);
                  setQuickSearchInput(hint);
                  router.push(`/discover?q=${encodeURIComponent(hint)}`);
                }}
              />
            </div>

            {isQuotaExhausted && (
              <div className="quota-limit-banner" role="status">
                <span>
                  {isGuest
                    ? "Guest preview limit reached (0 of 5 searches left). Sign in free for 50 monthly searches."
                    : "Monthly search quota reached (0 searches remaining)."}
                </span>
                <div className="quota-limit-actions">
                  {isGuest && (
                    <Link href="/auth" className="button button-primary button-sm">
                      Sign In Free (50 Searches)
                    </Link>
                  )}
                  <button
                    type="button"
                    className="button button-secondary button-sm"
                    onClick={() => setPricingModalOpen(true)}
                  >
                    View Plans
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap", fontSize: 12, alignItems: "center" }}>
              <span style={{ color: "var(--muted, #68836c)" }}>Kick @handle:</span>
              {["@adinross", "@xqc"].map((handle) => (
                <button
                  key={handle}
                  type="button"
                  disabled={isQuotaExhausted}
                  title={isQuotaExhausted ? "Search quota exhausted" : `Look up ${handle} live on Kick`}
                  onClick={() =>
                    router.push(`/discover?platform=Kick&q=${encodeURIComponent(handle)}`)
                  }
                  style={{
                    background: "rgba(255, 255, 255, 0.85)",
                    border: "1px solid rgba(80, 140, 80, 0.28)",
                    borderRadius: 16,
                    padding: "3px 10px",
                    cursor: isQuotaExhausted ? "not-allowed" : "pointer",
                    opacity: isQuotaExhausted ? 0.5 : 1,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#15803d",
                  }}
                >
                  {handle}
                </button>
              ))}

              <span style={{ color: "var(--muted, #68836c)", marginLeft: 4 }}>
                {connectorsLoaded && activeConnectors.some((c) => c.platform === "Twitch")
                  ? "Keyword (YouTube / Twitch):"
                  : "Topic / Channel (YouTube):"}
              </span>
              {["Gaming streamers", "Tech reviews", "Kai Cenat"].map((term) => (
                <button
                  key={term}
                  type="button"
                  disabled={isQuotaExhausted}
                  title={isQuotaExhausted ? "Search quota exhausted" : `Search "${term}"`}
                  onClick={() => router.push(`/discover?q=${encodeURIComponent(term)}`)}
                  style={{
                    background: "rgba(255, 255, 255, 0.65)",
                    border: "1px solid rgba(80, 140, 80, 0.18)",
                    borderRadius: 16,
                    padding: "3px 10px",
                    cursor: isQuotaExhausted ? "not-allowed" : "pointer",
                    opacity: isQuotaExhausted ? 0.5 : 1,
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
            <Link href="/lists" className="button button-secondary">
              <Bookmark size={15} /> Saved Creators ({creators.length})
            </Link>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setShowExplainer(true)}
            >
              <CircleHelp size={15} /> Platform Capability Guide
            </button>
            {isGuest && (
              <Link href="/auth" className="button button-secondary">
                Create Free Account (50 Searches)
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* KPI Stat Grid (Consistent Saved Creators copy & non-duplicated subtitles) */}
      <div className="stat-grid">
        <div onClick={() => router.push("/lists")} className="stat-clickable" role="button" tabIndex={0}>
          <StatCard
            tone="violet"
            label="Saved Creators"
            value={creators.length}
            note="Creators saved to CRM"
            icon={<Users size={16} />}
          />
        </div>
        <div onClick={() => router.push("/lists")} className="stat-clickable" role="button" tabIndex={0}>
          <StatCard
            tone="teal"
            label="Active Shortlists"
            value={activeShortlistCount}
            note="Shortlist folders with creators"
            icon={<BarChart3 size={16} />}
          />
        </div>
        <div onClick={() => setShowExplainer(true)} className="stat-clickable" role="button" tabIndex={0}>
          <StatCard
            tone="coral"
            label="Live Platforms"
            value={
              connectorsLoaded ? (
                activeConnectors.length
              ) : (
                <span className="skeleton-pill" style={{ width: 42, height: 24, verticalAlign: "middle" }} />
              )
            }
            note={
              connectorsLoaded
                ? `of ${integrationsHealth.length} active (${activeConnectors.map((i) => i.platform).join(", ") || "None"})`
                : "Checking platform status…"
            }
            icon={<Globe size={16} />}
          />
        </div>
        <div onClick={() => router.push(isGuest ? "/auth" : "/settings")} className="stat-clickable" role="button" tabIndex={0}>
          <StatCard
            tone="yellow"
            label="Searches Remaining"
            value={subscription.totalQuota === -1 ? 999999 : subscription.searchesRemaining}
            note={
              subscription.totalQuota === -1
                ? "Unlimited enterprise plan"
                : isGuest
                ? `Guest preview limit (${subscription.totalQuota} max — sign in for 50)`
                : `Monthly quota (${subscription.totalQuota} total)`
            }
            icon={<Sparkles size={16} />}
          />
        </div>
      </div>

      {/* Platform Availability Matrix (Zero Internal Server Jargon / Skeleton Until Loaded) */}
      <section className="card" style={{ marginBottom: 24, padding: "20px 24px" }}>
        <div className="card-head" style={{ marginBottom: 16 }}>
          <div>
            <h2 className="card-title">Platform Discovery Capabilities</h2>
            <p className="card-caption">Supported live lookup and creator authorization status per platform</p>
          </div>
          <button
            type="button"
            onClick={() => setShowExplainer(true)}
            className="button button-secondary button-sm"
          >
            Capability Guide <ChevronRight size={13} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          {integrationsHealth.map((integ) => {
            const badgeBg = integ.connected
              ? "rgba(34, 197, 94, 0.12)"
              : integ.mode === "unconfigured"
              ? "rgba(234, 179, 8, 0.14)"
              : "rgba(100, 116, 139, 0.12)";
            const badgeColor = integ.connected
              ? "#15803d"
              : integ.mode === "unconfigured"
              ? "#92400e"
              : "#475569";

            return (
              <div
                key={integ.platform}
                style={{
                  border: "1px solid rgba(80, 140, 80, 0.15)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  background: "rgba(255, 255, 255, 0.5)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <strong style={{ fontSize: 14, color: "#1d472b" }}>{integ.platform}</strong>
                  {!connectorsLoaded ? (
                    <span className="skeleton-pill" aria-label="Loading connector status" />
                  ) : (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 7px",
                        borderRadius: 6,
                        background: badgeBg,
                        color: badgeColor,
                      }}
                    >
                      {integ.connectorStatus}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "#547359", margin: "0 0 10px", lineHeight: 1.4 }}>
                  {integ.statusNote}
                </p>
                <div style={{ fontSize: 10, color: "#68836c" }}>
                  {!connectorsLoaded ? (
                    <span>Refreshing platform status…</span>
                  ) : integ.connected && integ.supportsLiveDiscovery ? (
                    <span style={{ color: "#166534" }}>✓ Live keyword search &amp; @handle lookup</span>
                  ) : integ.connected && integ.supportsHandleLookup ? (
                    <span style={{ color: "#15803d" }}>✓ Exact @handle lookup active</span>
                  ) : integ.mode === "unconfigured" ? (
                    <span style={{ color: "#92400e" }}>⚡ Keyword search service pending</span>
                  ) : integ.platform === "TikTok" ? (
                    <span style={{ color: "#475569" }}>🔒 Requires TikTok Creator OAuth</span>
                  ) : (
                    <span style={{ color: "#475569" }}>🔒 Requires Meta Professional OAuth</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* If saved creators exist, render workspace portfolio charts; otherwise show clearly labeled sample preview */}
      {creators.length > 0 ? (
        <>
          <div className="chart-grid">
            <section className="card">
              <div className="card-head">
                <div>
                  <h2 className="card-title">Saved Creators by Platform</h2>
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
                  <p className="card-caption">Followers and subscribers across saved creators</p>
                </div>
              </div>
              <ComparisonBarChart
                data={followerComparison}
                valueLabel="Followers / Subscribers"
                onSelect={(platform) => filterBy("platform", platform)}
              />
              <div className="chart-legend">
                <span>
                  <CheckCircle2 size={12} className="inline-icon text-green" /> Channel data snapshots
                </span>
                <span suppressHydrationWarning>Updated {lastCollected ? formatDate(lastCollected) : "Recently"}</span>
              </div>
            </section>
          </div>

          <section className="card" style={{ marginTop: 24 }}>
            <div className="card-head">
              <div>
                <h2 className="card-title">Saved Creators</h2>
                <p className="card-caption">Creators organized in your workspace</p>
              </div>
              <Link href="/lists" className="button button-secondary button-sm">
                Manage Saved Creators <ChevronRight size={13} />
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
                            : "Unavailable"}
                        </td>
                        <td>
                          {account && currentReach(account) !== null
                            ? `${shortNumber(currentReach(account)!)} ${reachMetricName(account) === "avg_live_viewers" ? "avg viewers" : "avg views"}`
                            : "Unavailable"}
                        </td>
                        <td>
                          <span>{getCountryFlag(creator.creatorCountry)} {creator.creatorCountry ?? "Unavailable"}</span>
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
        /* Honest Live-Only Empty Workspace State (Zero Sample / Fixture Creators) */
        <section className="card" style={{ padding: "28px 24px", margin: "24px 0" }}>
          <div className="empty-state" style={{ padding: "12px 0" }}>
            <span className="empty-icon">
              <Users size={22} />
            </span>
            <strong style={{ fontSize: 17, marginTop: 10 }}>No Saved Creators Yet</strong>
            <p style={{ maxWidth: 520, margin: "6px auto 18px" }}>
              {isGuest
                ? "Guest workspaces do not pre-load sample or demo profiles. Run live creator discovery across active platforms or sign in to save creators into private shortlists."
                : "Your workspace currently has 0 saved creators. Discover creators live from connected platforms and bookmark profiles to track outreach and metrics."}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/discover" className="button button-primary button-sm">
                <Search size={13} /> Open Discovery Workspace
              </Link>
              {isGuest && (
                <Link href="/auth" className="button button-secondary button-sm">
                  Sign In to Save Creators
                </Link>
              )}
              <button
                type="button"
                className="button button-secondary button-sm"
                onClick={() => setShowExplainer(true)}
              >
                <CircleHelp size={13} /> Platform Capability Guide
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Capability Guide Modal (Technical API specs housed cleanly here rather than marketer UI) */}
      {showExplainer && (
        <div
          className="modal-backdrop"
          onClick={() => setShowExplainer(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="capability-guide-title"
        >
          <div
            ref={explainerDialogRef}
            tabIndex={-1}
            className="explainer-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <CircleHelp size={20} className="modal-icon-green" />
                <h3 id="capability-guide-title">Platform Capabilities Guide</h3>
              </div>
              <button
                ref={explainerCloseRef}
                className="icon-button"
                onClick={() => setShowExplainer(false)}
                aria-label="Close dialog"
                type="button"
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="definition-card-item">
                <div className="definition-head">
                  <Globe size={16} /> <strong>Real-Time Queries &amp; Freshness</strong>
                </div>
                <p>
                  Searches run dynamically across active channel connections without fixed mock catalogs. Every result carries a clear source label and retrieval timestamp.
                </p>
              </div>
              <div className="definition-card-item">
                <div className="definition-head">
                  <Radio size={16} /> <strong>YouTube &amp; Twitch Discovery</strong>
                </div>
                <p>
                  Support keyword search and public channel metrics when platform services are enabled. Subject to YouTube Terms of Service and Twitch developer guidelines.
                </p>
              </div>
              <div className="definition-card-item">
                <div className="definition-head">
                  <Video size={16} /> <strong>Kick Exact-Handle Lookup</strong>
                </div>
                <p>
                  Resolves single-word channel handles (e.g. <code>@adinross</code>, <code>@xqc</code>) with live stream status and follower counts. Multi-word keyword searches are automatically skipped on Kick.
                </p>
              </div>
              <div className="definition-card-item">
                <div className="definition-head">
                  <ShieldCheck size={16} /> <strong>TikTok &amp; Instagram OAuth Scope</strong>
                </div>
                <p>
                  TikTok and Instagram require direct creator or professional account authorization before metrics can be accessed. Unauthenticated scraping is never used.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="button button-primary"
                onClick={() => setShowExplainer(false)}
              >
                Got it
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
  value: React.ReactNode;
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
      <div className="stat-value" suppressHydrationWarning>
        {typeof value === "number"
          ? value >= 999999
            ? "Unlimited"
            : new Intl.NumberFormat("en-US").format(value)
          : value}
      </div>
      <div className="stat-foot" suppressHydrationWarning>{note}</div>
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
