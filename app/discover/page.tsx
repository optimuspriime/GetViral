"use client";

import Link from "next/link";
import { Bookmark, Download, Search, SlidersHorizontal, UserRoundSearch, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useProspects } from "@/components/data-provider";
import { platformColors } from "@/lib/platforms";
import type { Creator, PlatformAccount } from "@/lib/model";
import { currentFollowers, currentReach, latestMetric, reachMetricName } from "@/lib/metrics";

type Filters = {
  query: string; platform: string; category: string; language: string; country: string;
  audienceCountry: string;
  minFollowers: string; maxFollowers: string; minLive: string; maxLive: string;
  minViews: string; maxViews: string; activity: string; hasContact: boolean;
};
type Result = { creator: Creator; account: PlatformAccount };

const initialFilters: Filters = {
  query: "", platform: "All platforms", category: "All categories", language: "All languages", audienceCountry: "",
  country: "", minFollowers: "", maxFollowers: "", minLive: "", maxLive: "",
  minViews: "", maxViews: "", activity: "Any activity", hasContact: false,
};
const statuses = ["All platforms", "Twitch", "Kick", "YouTube", "TikTok", "Instagram"];

export default function DiscoverPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState("name");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { creators, lists, hydrated, storageError, addCreator, createList } = useProspects();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFilters((current) => ({
      ...current,
      platform: statuses.includes(params.get("platform") ?? "") ? params.get("platform")! : current.platform,
      category: params.get("category") ?? current.category,
      country: params.get("country") ?? current.country,
      audienceCountry: params.get("audienceCountry") ?? current.audienceCountry,
      minFollowers: params.get("minFollowers") ?? current.minFollowers,
      maxFollowers: params.get("maxFollowers") ?? current.maxFollowers,
    }));
  }, []);

  const results = useMemo(() => {
    const all: Result[] = creators.flatMap((creator) => creator.accounts.map((account) => ({ creator, account })));
    const filtered = all.filter(({ creator, account }) => {
      const q = filters.query.trim().toLowerCase();
      const matchesText = !q || [creator.name, account.handle, creator.bio, creator.category ?? ""].some((value) => value.toLowerCase().includes(q));
      const followers = currentFollowers(account);
      const reach = currentReach(account);
      const live = reachMetricName(account) === "avg_live_viewers" ? reach : null;
      const views = reachMetricName(account) === "avg_video_views" ? reach : null;
      const rangeMatches = (value: number | null, min: string, max: string) =>
        (!min && !max) || (value !== null && (!min || value >= Number(min)) && (!max || value <= Number(max)));
      const profileActivity = (account.activity ?? "").toLowerCase();
      return matchesText
        && (filters.platform === "All platforms" || account.platform === filters.platform)
        && (filters.category === "All categories" || creator.category === filters.category)
        && (filters.language === "All languages" || creator.language === filters.language)
        && (!filters.country || creator.creatorCountry?.toLowerCase().includes(filters.country.toLowerCase()))
        && (!filters.audienceCountry || creator.audienceInsights.some((insight) =>
          ["country", "audience_country"].includes(insight.dimension.toLowerCase()) &&
          insight.amount !== null &&
          insight.value.toLowerCase() === filters.audienceCountry.toLowerCase()
        ))
        && rangeMatches(followers, filters.minFollowers, filters.maxFollowers)
        && rangeMatches(live, filters.minLive, filters.maxLive)
        && rangeMatches(views, filters.minViews, filters.maxViews)
        && (filters.activity === "Any activity" || (filters.activity === "Active this week" && profileActivity.includes("week")) || (filters.activity === "Active this month" && !!account.activity && !profileActivity.includes("no recent")))
        && (!filters.hasContact || creator.businessContact !== null);
    });
    return filtered.sort((a, b) => {
      if (sort === "followers") return (currentFollowers(b.account) ?? -1) - (currentFollowers(a.account) ?? -1);
      if (sort === "reach") return (currentReach(b.account) ?? -1) - (currentReach(a.account) ?? -1);
      if (sort === "platform") return a.account.platform.localeCompare(b.account.platform) || a.creator.name.localeCompare(b.creator.name);
      if (sort === "updated") return newestTimestamp(b.account) - newestTimestamp(a.account);
      return a.creator.name.localeCompare(b.creator.name);
    });
  }, [creators, filters, sort]);

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  const appliedFilters: { label: string; clear: () => void }[] = [];
  if (filters.query.trim()) appliedFilters.push({ label: `Search: ${filters.query.trim()}`, clear: () => update("query", "") });
  if (filters.platform !== initialFilters.platform) appliedFilters.push({ label: filters.platform, clear: () => update("platform", initialFilters.platform) });
  if (filters.category !== initialFilters.category) appliedFilters.push({ label: filters.category, clear: () => update("category", initialFilters.category) });
  if (filters.country) appliedFilters.push({ label: `Country: ${filters.country}`, clear: () => update("country", "") });
  if (filters.audienceCountry) appliedFilters.push({ label: `Audience: ${filters.audienceCountry}`, clear: () => update("audienceCountry", "") });
  if (filters.minFollowers) appliedFilters.push({ label: `Followers ≥ ${formatNumber(Number(filters.minFollowers))}`, clear: () => update("minFollowers", "") });
  if (filters.maxFollowers) appliedFilters.push({ label: `Followers ≤ ${formatNumber(Number(filters.maxFollowers))}`, clear: () => update("maxFollowers", "") });
  if (filters.minLive) appliedFilters.push({ label: `Avg. viewers ≥ ${formatNumber(Number(filters.minLive))}`, clear: () => update("minLive", "") });
  if (filters.maxLive) appliedFilters.push({ label: `Avg. viewers ≤ ${formatNumber(Number(filters.maxLive))}`, clear: () => update("maxLive", "") });
  if (filters.minViews) appliedFilters.push({ label: `Avg. views ≥ ${formatNumber(Number(filters.minViews))}`, clear: () => update("minViews", "") });
  if (filters.maxViews) appliedFilters.push({ label: `Avg. views ≤ ${formatNumber(Number(filters.maxViews))}`, clear: () => update("maxViews", "") });
  if (filters.language !== initialFilters.language) appliedFilters.push({ label: filters.language, clear: () => update("language", initialFilters.language) });
  if (filters.activity !== initialFilters.activity) appliedFilters.push({ label: filters.activity, clear: () => update("activity", initialFilters.activity) });
  if (filters.hasContact) appliedFilters.push({ label: "Public email available", clear: () => update("hasContact", false) });

  function saveCreator(creatorId: string) {
    if (!hydrated) return;
    const list = lists[0];
    if (list) addCreator(list.id, creatorId);
    else addCreator(createList("Campaign shortlist"), creatorId);
  }

  function exportResults() {
    const headers = ["Creator", "Platform", "Handle", "Profile URL", "Category", "Language", "Creator country", "Country source", "Followers / subscribers", "Follower unit", "Average concurrent viewers", "Average video views per post", "Reach sample size", "Reach measurement window", "Reach source", "Reach status", "Activity", "Public business email", "Contact source URL", "Contact last checked", "Data source", "Updated at"];
    const lines = results.map(({ creator, account }) => [
      creator.name, account.platform, account.handle, account.profileUrl, creator.category, creator.language,
      creator.creatorCountry, creator.creatorCountrySource, currentFollowers(account), account.platform === "YouTube" ? "subscribers" : "followers",
      reachMetricName(account) === "avg_live_viewers" ? currentReach(account) : null,
      reachMetricName(account) === "avg_video_views" ? currentReach(account) : null,
      latestMetric(account, reachMetricName(account) ?? "")?.sampleSize,
      latestMetric(account, reachMetricName(account) ?? "")?.periodLabel,
      latestMetric(account, reachMetricName(account) ?? "")?.source,
      latestMetric(account, reachMetricName(account) ?? "")?.status,
      account.activity, creator.businessContact?.email, creator.businessContact?.sourceUrl,
      creator.businessContact?.lastChecked, "Synthetic demo record", newestTimestamp(account) ? new Date(newestTimestamp(account)).toISOString() : "",
    ]);
    const csv = [headers, ...lines].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "mosaic-creator-shortlist-demo.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const categories = [...new Set(creators.map((creator) => creator.category).filter((value): value is string => !!value))].sort();
  const languages = [...new Set(creators.map((creator) => creator.language).filter((value): value is string => !!value))].sort();
  const audienceCountries = [...new Set(creators.flatMap((creator) => creator.audienceInsights
    .filter((insight) => ["country", "audience_country"].includes(insight.dimension.toLowerCase()) && insight.amount !== null)
    .map((insight) => insight.value)))].sort();
  const savedAccountIds = new Set(lists.flatMap((list) => list.creatorIds));

  return (
    <>
      <div className="page-heading">
        <div><div className="eyebrow">DISCOVERY WORKSPACE</div><h1>Find your next great fit.</h1><p className="page-subtitle">Search across platforms with transparent, platform-specific reach metrics.</p></div>
        <button className="button button-secondary" onClick={exportResults} disabled={!results.length}><Download size={14} /> Export CSV</button>
      </div>
      <div className="discovery-note"><span className="demo-pill">DEMO</span><span>Search covers this synthetic sample catalogue only; no live platform creator search is connected. Audience geography and unsupported metrics stay unavailable.</span></div>
      {storageError && <div className="storage-error" role="alert">{storageError}</div>}
      <div className="discovery-controls">
        <div className="search-field discovery-search"><Search size={16} /><input type="search" aria-label="Search creators" placeholder="Search creator name, handle, or niche..." value={filters.query} onChange={(e) => update("query", e.target.value)} />{filters.query && <button className="clear-search" onClick={() => update("query", "")} aria-label="Clear search"><X size={14} /></button>}</div>
        <label className="platform-select-wrap"><span>Platform</span><select className="filter-select" aria-label="Filter by platform" value={filters.platform} onChange={(e) => update("platform", e.target.value)}>{statuses.map((platform) => <option key={platform}>{platform}</option>)}</select></label>
        <button className="button button-secondary mobile-filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}><SlidersHorizontal size={15} />Filters{appliedFilters.length > 0 && <span className="filter-count">{appliedFilters.length}</span>}</button>
      </div>
      {appliedFilters.length > 0 && <div className="applied-filters" aria-label="Applied filters">
        <span className="applied-filters-label">Applied</span>
        {appliedFilters.map((filter) => <button key={filter.label} className="filter-chip" onClick={filter.clear}>{filter.label}<X size={12} /></button>)}
        <button className="clear-all-filters" onClick={() => setFilters(initialFilters)}>Clear all</button>
      </div>}
      <div className="filters-layout">
        <aside className={`card filter-card ${filtersOpen ? "filters-open" : ""}`}>
          <div className="filter-head"><strong><SlidersHorizontal size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />Filters</strong><button onClick={() => setFilters(initialFilters)}>Clear all</button></div>
          <div className="filter-groups">
            <FilterGroup label="Category">
              <select className="filter-select" value={filters.category} onChange={(e) => update("category", e.target.value)}><option>All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>
            </FilterGroup>
            <FilterGroup label="Country">
              <input className="filter-input" value={filters.country} onChange={(e) => update("country", e.target.value)} placeholder="Creator country, e.g. Canada" />
            </FilterGroup>
            <FilterGroup label="Followers / subscribers">
              <span className="filter-hint">Platform account totals</span>
              <div className="range-inputs"><input aria-label="Minimum followers" type="number" min="0" className="filter-input" value={filters.minFollowers} onChange={(e) => update("minFollowers", e.target.value)} placeholder="Min" /><input aria-label="Maximum followers" type="number" min="0" className="filter-input" value={filters.maxFollowers} onChange={(e) => update("maxFollowers", e.target.value)} placeholder="Max" /></div>
            </FilterGroup>
            <FilterGroup label="Average viewers">
              <span className="filter-hint">Twitch & Kick only · historical average</span>
              <div className="range-inputs"><input aria-label="Minimum average concurrent viewers" type="number" min="0" className="filter-input" value={filters.minLive} onChange={(e) => update("minLive", e.target.value)} placeholder="Min" /><input aria-label="Maximum average concurrent viewers" type="number" min="0" className="filter-input" value={filters.maxLive} onChange={(e) => update("maxLive", e.target.value)} placeholder="Max" /></div>
            </FilterGroup>
            <FilterGroup label="Language">
              <select className="filter-select" value={filters.language} onChange={(e) => update("language", e.target.value)}><option>All languages</option>{languages.map((language) => <option key={language}>{language}</option>)}</select>
            </FilterGroup>
            <FilterGroup label="Audience country">
              <span className="filter-hint">Separate from creator country; shown only when a source supplies it.</span>
              {audienceCountries.length
                ? <select className="filter-select" value={filters.audienceCountry} onChange={(e) => update("audienceCountry", e.target.value)}><option value="">All sourced countries</option>{audienceCountries.map((country) => <option key={country}>{country}</option>)}</select>
                : <select className="filter-select unavailable-select" disabled value=""><option value="">Unavailable in demo data</option></select>}
            </FilterGroup>
            <FilterGroup label="Average video views per post">
              <span className="filter-hint">Supported video account metrics only</span>
              <div className="range-inputs"><input aria-label="Minimum average video views" type="number" min="0" className="filter-input" value={filters.minViews} onChange={(e) => update("minViews", e.target.value)} placeholder="Min" /><input aria-label="Maximum average video views" type="number" min="0" className="filter-input" value={filters.maxViews} onChange={(e) => update("maxViews", e.target.value)} placeholder="Max" /></div>
            </FilterGroup>
            <FilterGroup label="Recent activity"><select className="filter-select" value={filters.activity} onChange={(e) => update("activity", e.target.value)}><option>Any activity</option><option>Active this week</option><option>Active this month</option></select></FilterGroup>
            <FilterGroup label="Business contact"><label className="check-row"><input type="checkbox" checked={filters.hasContact} onChange={(e) => update("hasContact", e.target.checked)} /> Public email available</label></FilterGroup>
          </div>
        </aside>
        <section>
          <div className="results-toolbar">
            <span className="results-count"><strong>{results.length}</strong> {results.length === 1 ? "account" : "accounts"} match your filters</span>
            <div className="results-actions"><label className="sort-label">Sort by</label><select className="sort-select" aria-label="Sort results" value={sort} onChange={(e) => setSort(e.target.value)}><option value="name">Creator name</option><option value="followers">Followers / subscribers</option><option value="reach">Platform reach</option><option value="platform">Platform</option><option value="updated">Latest snapshot</option></select></div>
          </div>
          <div className="card results-card">
            {!hydrated && <div className="save-loading-note" role="status">Saved lists are loading from this browser. Save actions will be available in a moment.</div>}
            {results.length ? <div className="table-wrap">
              <table className="data-table discovery-table">
                <thead><tr><th>Creator</th><th>Platform</th><th>Category · language</th><th>Creator country</th><th>Followers / subs</th><th>Platform reach</th><th>Activity</th><th>Business contact</th><th>Updated · source</th><th aria-label="Save creator" /></tr></thead>
                <tbody>{results.map(({ creator, account }) => {
                  const saved = savedAccountIds.has(creator.id);
                  const followers = currentFollowers(account);
                  const reach = currentReach(account);
                  const reachMetric = reachMetricName(account);
                  const reachSnapshot = reachMetric ? latestMetric(account, reachMetric) : undefined;
                  const reachLabel = reachMetric === "avg_live_viewers" ? "Avg. live viewers" : reachMetric === "avg_video_views" ? "Avg. video views" : "Reach unavailable";
                  return <tr key={`${creator.id}:${account.id}`}>
                    <td><Link href={`/creators/${creator.id}`} className="creator-cell"><span className="creator-avatar">{creator.avatar}</span><span><span className="creator-name">{creator.name}</span><span className="creator-handle">{account.handle}</span></span></Link></td>
                    <td><span className={`platform-label platform-badge platform-${account.platform.toLowerCase()}`}><i className="platform-dot" style={{ background: platformColors[account.platform] }} />{account.platform}</span></td>
                    <td><span className="creator-name">{creator.category ?? "Unavailable"}</span><span className="creator-handle">{creator.language ?? "Unavailable"}</span></td>
                    <td>{creator.creatorCountry ? <span title={`Source: ${creator.creatorCountrySource ?? "Unavailable"}`}>{creator.creatorCountry}<span className="creator-handle">{creator.creatorCountrySource ?? "Source unavailable"}</span></span> : unavailable()}</td>
                    <td>{followers === null ? unavailable() : <>{formatNumber(followers)}<span className="creator-handle">{account.platform === "YouTube" ? "subscribers" : "followers"}</span></>}</td>
                    <td>{reach === null ? unavailable() : <>{formatNumber(reach)}<span className="creator-handle">{reachLabel} · {reachSnapshot?.sampleSize ?? "?"} {reachMetric === "avg_live_viewers" ? "snapshots" : "posts"} · {reachSnapshot?.periodLabel ?? "window unavailable"}</span></>}</td>
                    <td>{account.activity ?? unavailable()}</td>
                    <td>{creator.businessContact ? <a href={`mailto:${creator.businessContact.email}`} title={`Public source: ${creator.businessContact.sourceUrl}`} className="contact-badge">{creator.businessContact.email}<span className="creator-handle">Source checked {dateLabel(creator.businessContact.lastChecked)}</span></a> : <span className="contact-missing">Unavailable</span>}</td>
                    <td><span>{dateLabel(snapshotDate(account))}</span><span className="creator-handle">{latestMetric(account, "followers")?.source ?? "Source unavailable"}</span></td>
                    <td><button className={`save-button ${saved ? "saved" : ""}`} disabled={!hydrated} onClick={() => saveCreator(creator.id)} title={!hydrated ? "Saved lists are loading from this browser" : saved ? "Already in a saved list" : "Save to a list"} aria-label={!hydrated ? `Saved lists are loading; ${creator.name} is not saved yet` : saved ? `Saved ${creator.name}` : `Save ${creator.name}`}><Bookmark size={14} fill={saved ? "currentColor" : "none"} /></button></td>
                  </tr>;
                })}</tbody>
              </table>
            </div> : <div className="empty-state"><span className="empty-icon"><UserRoundSearch size={20} /></span><strong>No creators match these filters</strong><p>Try broadening a range or clearing one of your filters to see more profiles.</p><button className="button button-secondary button-sm" onClick={() => setFilters(initialFilters)}>Clear all filters</button></div>}
            <div className="results-footnote">Followers and subscribers are collected separately. Live-viewer and video-view metrics are never combined. “Unavailable” means this source does not provide that field.</div>
          </div>
        </section>
      </div>
    </>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="filter-group"><label className="filter-label">{label}</label>{children}</div>;
}
function formatNumber(value: number) { return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value); }
function unavailable() { return <span className="metric-unavailable">Unavailable</span>; }
function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
function snapshotDate(account: PlatformAccount) { return account.snapshots.reduce((latest, item) => item.collectedAt > latest ? item.collectedAt : latest, ""); }
function newestTimestamp(account: PlatformAccount) { const latest = snapshotDate(account); return latest ? new Date(latest).getTime() : 0; }
function dateLabel(value: string) { return value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Unavailable"; }
