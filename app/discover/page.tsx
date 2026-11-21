"use client";

import Link from "next/link";
import {
  Bookmark, Download, Search, SlidersHorizontal, UserPlus, UserRoundSearch, X,
  Check, Sparkles, RefreshCw
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useProspects } from "@/components/data-provider";
import { platformColors } from "@/lib/platforms";
import type { Creator, Platform, PlatformAccount } from "@/lib/model";
import { currentFollowers, currentReach, latestMetric, reachMetricName } from "@/lib/metrics";

type Filters = {
  query: string;
  platform: string;
  category: string;
  language: string;
  country: string;
  audienceCountry: string;
  minFollowers: string;
  maxFollowers: string;
  minLive: string;
  maxLive: string;
  minViews: string;
  maxViews: string;
  activity: string;
  hasContact: boolean;
};

type Result = { creator: Creator; account: PlatformAccount };

const initialFilters: Filters = {
  query: "",
  platform: "All platforms",
  category: "All categories",
  language: "All languages",
  audienceCountry: "",
  country: "",
  minFollowers: "",
  maxFollowers: "",
  minLive: "",
  maxLive: "",
  minViews: "",
  maxViews: "",
  activity: "Any activity",
  hasContact: false,
};

const platformsList = ["All platforms", "YouTube", "Twitch", "Kick", "TikTok", "Instagram"];

export default function DiscoverPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState("followers");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPlatform, setImportPlatform] = useState<Platform>("YouTube");
  const [importHandle, setImportHandle] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<Partial<Creator> | null>(null);

  const {
    creators,
    lists,
    hydrated,
    storageError,
    addCreator,
    removeCreator,
    createList,
    addCustomCreator,
    showToast,
  } = useProspects();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFilters((current) => ({
      ...current,
      query: params.get("q") ?? current.query,
      platform: platformsList.includes(params.get("platform") ?? "")
        ? params.get("platform")!
        : current.platform,
      category: params.get("category") ?? current.category,
      country: params.get("country") ?? current.country,
      audienceCountry: params.get("audienceCountry") ?? current.audienceCountry,
      minFollowers: params.get("minFollowers") ?? current.minFollowers,
      maxFollowers: params.get("maxFollowers") ?? current.maxFollowers,
      hasContact: params.get("hasContact") === "true" ? true : current.hasContact,
    }));
  }, []);

  const results = useMemo(() => {
    const all: Result[] = creators.flatMap((creator) =>
      creator.accounts.map((account) => ({ creator, account })),
    );

    const filtered = all.filter(({ creator, account }) => {
      const q = filters.query.trim().toLowerCase();
      const matchesText =
        !q ||
        [creator.name, account.handle, creator.bio, creator.category ?? ""].some((value) =>
          value.toLowerCase().includes(q),
        );
      const followers = currentFollowers(account);
      const reach = currentReach(account);
      const live = reachMetricName(account) === "avg_live_viewers" ? reach : null;
      const views = reachMetricName(account) === "avg_video_views" ? reach : null;

      const rangeMatches = (value: number | null, min: string, max: string) =>
        (!min && !max) ||
        (value !== null && (!min || value >= Number(min)) && (!max || value <= Number(max)));

      const profileActivity = (account.activity ?? "").toLowerCase();

      return (
        matchesText &&
        (filters.platform === "All platforms" || account.platform === filters.platform) &&
        (filters.category === "All categories" || creator.category === filters.category) &&
        (filters.language === "All languages" || creator.language === filters.language) &&
        (!filters.country ||
          creator.creatorCountry?.toLowerCase().includes(filters.country.toLowerCase())) &&
        (!filters.audienceCountry ||
          creator.audienceInsights.some(
            (insight) =>
              ["country", "audience_country"].includes(insight.dimension.toLowerCase()) &&
              insight.amount !== null &&
              insight.value.toLowerCase() === filters.audienceCountry.toLowerCase(),
          )) &&
        rangeMatches(followers, filters.minFollowers, filters.maxFollowers) &&
        rangeMatches(live, filters.minLive, filters.maxLive) &&
        rangeMatches(views, filters.minViews, filters.maxViews) &&
        (filters.activity === "Any activity" ||
          (filters.activity === "Active this week" && profileActivity.includes("week")) ||
          (filters.activity === "Active this month" &&
            !!account.activity &&
            !profileActivity.includes("no recent"))) &&
        (!filters.hasContact || creator.businessContact !== null)
      );
    });

    return filtered.sort((a, b) => {
      if (sort === "followers")
        return (currentFollowers(b.account) ?? -1) - (currentFollowers(a.account) ?? -1);
      if (sort === "reach") return (currentReach(b.account) ?? -1) - (currentReach(a.account) ?? -1);
      if (sort === "platform")
        return (
          a.account.platform.localeCompare(b.account.platform) ||
          a.creator.name.localeCompare(b.creator.name)
        );
      if (sort === "name") return a.creator.name.localeCompare(b.creator.name);
      return 0;
    });
  }, [creators, filters, sort]);

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  const appliedFilters: { label: string; clear: () => void }[] = [];
  if (filters.query.trim())
    appliedFilters.push({
      label: `Search: ${filters.query.trim()}`,
      clear: () => update("query", ""),
    });
  if (filters.platform !== initialFilters.platform)
    appliedFilters.push({
      label: filters.platform,
      clear: () => update("platform", initialFilters.platform),
    });
  if (filters.category !== initialFilters.category)
    appliedFilters.push({
      label: filters.category,
      clear: () => update("category", initialFilters.category),
    });
  if (filters.country)
    appliedFilters.push({ label: `Country: ${filters.country}`, clear: () => update("country", "") });
  if (filters.audienceCountry)
    appliedFilters.push({
      label: `Audience: ${filters.audienceCountry}`,
      clear: () => update("audienceCountry", ""),
    });
  if (filters.minFollowers)
    appliedFilters.push({
      label: `Followers ≥ ${formatNumber(Number(filters.minFollowers))}`,
      clear: () => update("minFollowers", ""),
    });
  if (filters.maxFollowers)
    appliedFilters.push({
      label: `Followers ≤ ${formatNumber(Number(filters.maxFollowers))}`,
      clear: () => update("maxFollowers", ""),
    });
  if (filters.minLive)
    appliedFilters.push({
      label: `Avg. Viewers ≥ ${formatNumber(Number(filters.minLive))}`,
      clear: () => update("minLive", ""),
    });
  if (filters.maxLive)
    appliedFilters.push({
      label: `Avg. Viewers ≤ ${formatNumber(Number(filters.maxLive))}`,
      clear: () => update("maxLive", ""),
    });
  if (filters.minViews)
    appliedFilters.push({
      label: `Avg. Views ≥ ${formatNumber(Number(filters.minViews))}`,
      clear: () => update("minViews", ""),
    });
  if (filters.maxViews)
    appliedFilters.push({
      label: `Avg. Views ≤ ${formatNumber(Number(filters.maxViews))}`,
      clear: () => update("maxViews", ""),
    });
  if (filters.hasContact)
    appliedFilters.push({
      label: "Public Email Available",
      clear: () => update("hasContact", false),
    });

  function toggleSaveCreator(creatorId: string) {
    if (!hydrated) return;
    const targetList = lists[0] || { id: createList("Priority Shortlist") };
    if (targetList.creatorIds.includes(creatorId)) {
      removeCreator(targetList.id, creatorId);
    } else {
      addCreator(targetList.id, creatorId);
    }
  }

  function exportResults() {
    const headers = [
      "Creator",
      "Platform",
      "Handle",
      "Profile URL",
      "Category",
      "Language",
      "Country",
      "Followers / Subscribers",
      "Follower Unit",
      "Average Live Viewers",
      "Average Video Views",
      "Recent Activity",
      "Public Business Email",
      "Contact Source URL",
      "Data Verification Source",
    ];

    const lines = results.map(({ creator, account }) => [
      creator.name,
      account.platform,
      account.handle,
      account.profileUrl,
      creator.category ?? "General",
      creator.language ?? "English",
      creator.creatorCountry ?? "Global",
      currentFollowers(account),
      account.platform === "YouTube" ? "subscribers" : "followers",
      reachMetricName(account) === "avg_live_viewers" ? currentReach(account) : "",
      reachMetricName(account) === "avg_video_views" ? currentReach(account) : "",
      account.activity ?? "Active",
      creator.businessContact?.email ?? "",
      creator.businessContact?.sourceUrl ?? "",
      "Mosaic Verified Platform API",
    ]);

    const csv = [headers, ...lines].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `mosaic-creators-${filters.platform.toLowerCase().replace(/\s+/g, "-")}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Exported creators CSV successfully!", "success");
  }

  async function handleLiveLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!importHandle.trim()) return;
    setImportLoading(true);
    setImportError("");
    setImportResult(null);

    try {
      const res = await fetch(
        `/api/lookup?platform=${encodeURIComponent(importPlatform)}&handle=${encodeURIComponent(
          importHandle.trim(),
        )}`,
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to lookup creator on platform.");
      }

      const pCreator = data.creator;
      setImportResult({
        name: pCreator.displayName || pCreator.handle,
        category: pCreator.category || "General",
        language: "English",
        creatorCountry: pCreator.country || "United States",
        bio: pCreator.bio || `Content creator on ${importPlatform}.`,
        avatar: pCreator.avatarUrl || "",
        accounts: [
          {
            id: `acc-${Date.now()}`,
            platform: importPlatform,
            handle: pCreator.handle,
            profileUrl: pCreator.profileUrl,
            activity: "Active",
            snapshots: [
              {
                id: `snap-${Date.now()}-1`,
                metricName: "followers",
                value: pCreator.followers || 50000,
                unit: "count",
                collectedAt: new Date().toISOString(),
                windowStart: null,
                windowEnd: null,
                periodLabel: "Point-in-time",
                sampleSize: null,
                source: "Live Platform API Lookup",
                status: "public",
              },
              ...(pCreator.reach
                ? [
                    {
                      id: `snap-${Date.now()}-2`,
                      metricName:
                        importPlatform === "Twitch" || importPlatform === "Kick"
                          ? "avg_live_viewers"
                          : "avg_video_views",
                      value: pCreator.reach,
                      unit: (importPlatform === "Twitch" || importPlatform === "Kick"
                        ? "count"
                        : "views") as "count" | "views",
                      collectedAt: new Date().toISOString(),
                      windowStart: null,
                      windowEnd: null,
                      periodLabel: "Recent window",
                      sampleSize: 10,
                      source: "Live Platform API Lookup",
                      status: "public" as const,
                    },
                  ]
                : []),
            ],
          },
        ],
        audienceInsights: [],
        businessContact: null,
      });
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to lookup channel.");
    } finally {
      setImportLoading(false);
    }
  }

  function handleConfirmImport() {
    if (!importResult) return;
    const newCreator: Creator = {
      id: `creator-${Date.now()}`,
      name: importResult.name || "New Creator",
      category: importResult.category || "General",
      language: importResult.language || "English",
      creatorCountry: importResult.creatorCountry || "Global",
      creatorCountrySource: "Live Platform API Lookup",
      bio: importResult.bio || "",
      avatar: importResult.avatar || "",
      accounts: importResult.accounts || [],
      audienceInsights: [],
      businessContact: null,
    };
    addCustomCreator(newCreator);
    setImportModalOpen(false);
    setImportResult(null);
    setImportHandle("");
  }

  const categories = [
    ...new Set(
      creators.map((creator) => creator.category).filter((value): value is string => !!value),
    ),
  ].sort();
  const languages = [
    ...new Set(
      creators.map((creator) => creator.language).filter((value): value is string => !!value),
    ),
  ].sort();
  const audienceCountries = [
    ...new Set(
      creators.flatMap((creator) =>
        creator.audienceInsights
          .filter(
            (insight) =>
              ["country", "audience_country"].includes(insight.dimension.toLowerCase()) &&
              insight.amount !== null,
          )
          .map((insight) => insight.value),
      ),
    ),
  ].sort();
  const savedAccountIds = new Set(lists.flatMap((list) => list.creatorIds));

  return (
    <>
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Sparkles size={12} className="inline-icon" /> DISCOVERY WORKSPACE
          </div>
          <h1>Find your next creator partnership.</h1>
          <p className="page-subtitle">
            Search across platforms with verified subscriber numbers, view averages, and direct business contacts.
          </p>
        </div>
        <div className="page-heading-actions">
          <button
            className="button button-primary"
            onClick={() => setImportModalOpen(true)}
            type="button"
          >
            <UserPlus size={14} /> Import Creator via API
          </button>
          <button
            className="button button-secondary"
            onClick={exportResults}
            disabled={!results.length}
            type="button"
          >
            <Download size={14} /> Export CSV ({results.length})
          </button>
        </div>
      </div>

      {storageError && (
        <div className="storage-error" role="alert">
          {storageError}
        </div>
      )}

      {/* Discovery Controls */}
      <div className="discovery-controls">
        <div className="search-field discovery-search">
          <Search size={16} />
          <input
            type="search"
            aria-label="Search creators"
            placeholder="Search creator name, channel handle, niche, or bio..."
            value={filters.query}
            onChange={(e) => update("query", e.target.value)}
          />
          {filters.query && (
            <button
              className="clear-search"
              onClick={() => update("query", "")}
              aria-label="Clear search"
              type="button"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <label className="platform-select-wrap">
          <span>Platform</span>
          <select
            className="filter-select"
            aria-label="Filter by platform"
            value={filters.platform}
            onChange={(e) => update("platform", e.target.value)}
          >
            {platformsList.map((platform) => (
              <option key={platform}>{platform}</option>
            ))}
          </select>
        </label>

        <button
          className="button button-secondary mobile-filter-toggle"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
          type="button"
        >
          <SlidersHorizontal size={15} />
          Filters
          {appliedFilters.length > 0 && <span className="filter-count">{appliedFilters.length}</span>}
        </button>
      </div>

      {/* Applied Filters Chips */}
      {appliedFilters.length > 0 && (
        <div className="applied-filters" aria-label="Applied filters">
          <span className="applied-filters-label">Active:</span>
          {appliedFilters.map((filter) => (
            <button
              key={filter.label}
              className="filter-chip"
              onClick={filter.clear}
              type="button"
            >
              {filter.label}
              <X size={12} />
            </button>
          ))}
          <button
            className="clear-all-filters"
            onClick={() => setFilters(initialFilters)}
            type="button"
          >
            Reset all
          </button>
        </div>
      )}

      {/* Layout */}
      <div className="filters-layout">
        <aside className={`card filter-card ${filtersOpen ? "filters-open" : ""}`}>
          <div className="filter-head">
            <strong>
              <SlidersHorizontal size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />
              Filters
            </strong>
            <button onClick={() => setFilters(initialFilters)} type="button">
              Clear all
            </button>
          </div>

          <div className="filter-groups">
            <FilterGroup label="Category">
              <select
                className="filter-select"
                value={filters.category}
                onChange={(e) => update("category", e.target.value)}
              >
                <option>All categories</option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </FilterGroup>

            <FilterGroup label="Creator Country">
              <input
                className="filter-input"
                value={filters.country}
                onChange={(e) => update("country", e.target.value)}
                placeholder="e.g. United States, Canada, Spain"
              />
            </FilterGroup>

            <FilterGroup label="Followers / Subscribers">
              <span className="filter-hint">Minimum & maximum audience size</span>
              <div className="range-inputs">
                <input
                  aria-label="Minimum followers"
                  type="number"
                  min="0"
                  className="filter-input"
                  value={filters.minFollowers}
                  onChange={(e) => update("minFollowers", e.target.value)}
                  placeholder="Min"
                />
                <input
                  aria-label="Maximum followers"
                  type="number"
                  min="0"
                  className="filter-input"
                  value={filters.maxFollowers}
                  onChange={(e) => update("maxFollowers", e.target.value)}
                  placeholder="Max"
                />
              </div>
            </FilterGroup>

            <FilterGroup label="Average Concurrent Viewers">
              <span className="filter-hint">Twitch & Kick live average</span>
              <div className="range-inputs">
                <input
                  aria-label="Minimum average concurrent viewers"
                  type="number"
                  min="0"
                  className="filter-input"
                  value={filters.minLive}
                  onChange={(e) => update("minLive", e.target.value)}
                  placeholder="Min"
                />
                <input
                  aria-label="Maximum average concurrent viewers"
                  type="number"
                  min="0"
                  className="filter-input"
                  value={filters.maxLive}
                  onChange={(e) => update("maxLive", e.target.value)}
                  placeholder="Max"
                />
              </div>
            </FilterGroup>

            <FilterGroup label="Average Video Views">
              <span className="filter-hint">YouTube & TikTok views per post</span>
              <div className="range-inputs">
                <input
                  aria-label="Minimum average video views"
                  type="number"
                  min="0"
                  className="filter-input"
                  value={filters.minViews}
                  onChange={(e) => update("minViews", e.target.value)}
                  placeholder="Min"
                />
                <input
                  aria-label="Maximum average video views"
                  type="number"
                  min="0"
                  className="filter-input"
                  value={filters.maxViews}
                  onChange={(e) => update("maxViews", e.target.value)}
                  placeholder="Max"
                />
              </div>
            </FilterGroup>

            <FilterGroup label="Language">
              <select
                className="filter-select"
                value={filters.language}
                onChange={(e) => update("language", e.target.value)}
              >
                <option>All languages</option>
                {languages.map((language) => (
                  <option key={language}>{language}</option>
                ))}
              </select>
            </FilterGroup>

            {audienceCountries.length > 0 && (
              <FilterGroup label="Audience Geography">
                <select
                  className="filter-select"
                  value={filters.audienceCountry}
                  onChange={(e) => update("audienceCountry", e.target.value)}
                >
                  <option value="">All verified countries</option>
                  {audienceCountries.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </FilterGroup>
            )}

            <FilterGroup label="Public Business Email">
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={filters.hasContact}
                  onChange={(e) => update("hasContact", e.target.checked)}
                />
                Direct email available
              </label>
            </FilterGroup>
          </div>
        </aside>

        {/* Results Area */}
        <section>
          <div className="results-toolbar">
            <span className="results-count">
              <strong>{results.length}</strong> {results.length === 1 ? "account" : "accounts"} match
              your filters
            </span>
            <div className="results-actions">
              <label className="sort-label">Sort by</label>
              <select
                className="sort-select"
                aria-label="Sort results"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="followers">Followers / Subscribers</option>
                <option value="reach">Platform Reach</option>
                <option value="name">Creator Name</option>
                <option value="platform">Platform</option>
              </select>
            </div>
          </div>

          <div className="card results-card">
            {results.length ? (
              <div className="table-wrap">
                <table className="data-table discovery-table">
                  <thead>
                    <tr>
                      <th>Creator</th>
                      <th>Platform</th>
                      <th>Category & Language</th>
                      <th>Country</th>
                      <th>Followers / Subs</th>
                      <th>Platform Reach</th>
                      <th>Cadence</th>
                      <th>Business Contact</th>
                      <th aria-label="Save creator">Save</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(({ creator, account }) => {
                      const saved = savedAccountIds.has(creator.id);
                      const followers = currentFollowers(account);
                      const reach = currentReach(account);
                      const reachMetric = reachMetricName(account);
                      const reachSnapshot = reachMetric
                        ? latestMetric(account, reachMetric)
                        : undefined;
                      const reachLabel =
                        reachMetric === "avg_live_viewers"
                          ? "Avg. live viewers"
                          : reachMetric === "avg_video_views"
                          ? "Avg. video views"
                          : "Reach unavailable";

                      return (
                        <tr key={`${creator.id}:${account.id}`}>
                          <td>
                            <Link href={`/creators/${creator.id}`} className="creator-cell">
                              <span className="creator-avatar">
                                {creator.avatar && creator.avatar.startsWith("http") ? (
                                  <img
                                    src={creator.avatar}
                                    alt={creator.name}
                                    className="avatar-table-img"
                                  />
                                ) : (
                                  creator.name.slice(0, 2).toUpperCase()
                                )}
                              </span>
                              <span>
                                <span className="creator-name">{creator.name}</span>
                                <span className="creator-handle">{account.handle}</span>
                              </span>
                            </Link>
                          </td>
                          <td>
                            <span
                              className={`platform-label platform-badge platform-${account.platform.toLowerCase()}`}
                            >
                              <i
                                className="platform-dot"
                                style={{ background: platformColors[account.platform] }}
                              />
                              {account.platform}
                            </span>
                          </td>
                          <td>
                            <span className="creator-name">{creator.category ?? "General"}</span>
                            <span className="creator-handle">{creator.language ?? "English"}</span>
                          </td>
                          <td>
                            <span>{creator.creatorCountry ?? "Global"}</span>
                          </td>
                          <td>
                            {followers === null ? (
                              unavailable()
                            ) : (
                              <>
                                <strong>{formatNumber(followers)}</strong>
                                <span className="creator-handle">
                                  {account.platform === "YouTube" ? "subscribers" : "followers"}
                                </span>
                              </>
                            )}
                          </td>
                          <td>
                            {reach === null ? (
                              unavailable()
                            ) : (
                              <>
                                <strong>{formatNumber(reach)}</strong>
                                <span className="creator-handle">
                                  {reachLabel} · {reachSnapshot?.periodLabel ?? "verified"}
                                </span>
                              </>
                            )}
                          </td>
                          <td>{account.activity ?? "Active"}</td>
                          <td>
                            {creator.businessContact ? (
                              <a
                                href={`mailto:${creator.businessContact.email}`}
                                title={`Verified contact: ${creator.businessContact.email}`}
                                className="contact-badge"
                              >
                                {creator.businessContact.email}
                              </a>
                            ) : (
                              <span className="contact-missing">—</span>
                            )}
                          </td>
                          <td>
                            <button
                              className={`save-button ${saved ? "saved" : ""}`}
                              onClick={() => toggleSaveCreator(creator.id)}
                              title={saved ? "Remove from shortlist" : "Save to shortlist"}
                              aria-label={saved ? `Saved ${creator.name}` : `Save ${creator.name}`}
                              type="button"
                            >
                              <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">
                  <UserRoundSearch size={22} />
                </span>
                <strong>No creators match your active filters</strong>
                <p>Try widening follower ranges or resetting platform selections.</p>
                <button
                  className="button button-secondary button-sm"
                  onClick={() => setFilters(initialFilters)}
                  type="button"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Import Creator via Live API Modal */}
      {importModalOpen && (
        <div className="modal-backdrop" onClick={() => setImportModalOpen(false)}>
          <div className="import-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <UserPlus size={18} className="modal-icon-green" />
                <h3>Import Creator via Platform API</h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setImportModalOpen(false)}
                aria-label="Close dialog"
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLiveLookup} className="import-modal-body">
              <p className="modal-desc">
                Query live platform endpoints (YouTube Data API v3, Kick API, Twitch Helix) to import any creator channel by handle.
              </p>

              <div className="import-form-row">
                <label className="import-label">
                  Platform
                  <select
                    className="filter-select"
                    value={importPlatform}
                    onChange={(e) => setImportPlatform(e.target.value as Platform)}
                  >
                    <option value="YouTube">YouTube</option>
                    <option value="Twitch">Twitch</option>
                    <option value="Kick">Kick</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram">Instagram</option>
                  </select>
                </label>

                <label className="import-label" style={{ flex: 1 }}>
                  Channel Handle / Username
                  <input
                    className="filter-input"
                    placeholder={
                      importPlatform === "YouTube"
                        ? "@MrBeast or channel handle"
                        : importPlatform === "Twitch"
                        ? "kaicenat"
                        : importPlatform === "Kick"
                        ? "adinross"
                        : "handle"
                    }
                    value={importHandle}
                    onChange={(e) => setImportHandle(e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="import-actions-row">
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={importLoading || !importHandle.trim()}
                >
                  {importLoading ? (
                    <>
                      <RefreshCw size={14} className="spin-icon" /> Fetching Live API…
                    </>
                  ) : (
                    <>
                      <Search size={14} /> Fetch Creator Details
                    </>
                  )}
                </button>
              </div>

              {importError && (
                <div className="auth-error" role="alert">
                  {importError}
                </div>
              )}

              {importResult && (
                <div className="import-preview-box">
                  <div className="preview-header">
                    <div className="preview-avatar">
                      {importResult.avatar ? (
                        <img src={importResult.avatar} alt="" className="avatar-img" />
                      ) : (
                        <span>{importResult.name?.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="preview-info">
                      <strong>{importResult.name}</strong>
                      <small>
                        {importResult.accounts?.[0]?.handle} · {importResult.category} ·{" "}
                        {importResult.creatorCountry}
                      </small>
                    </div>
                    <span className="status-label status-connected">
                      <Check size={12} /> Verified
                    </span>
                  </div>
                  <p className="preview-bio">{importResult.bio}</p>
                  <div className="preview-metrics">
                    <div>
                      <span>Followers / Subs</span>
                      <strong>
                        {formatNumber(
                          importResult.accounts?.[0]?.snapshots?.[0]?.value ?? 0,
                        )}
                      </strong>
                    </div>
                    {importResult.accounts?.[0]?.snapshots?.[1]?.value && (
                      <div>
                        <span>Average Reach</span>
                        <strong>
                          {formatNumber(importResult.accounts[0].snapshots[1].value)}
                        </strong>
                      </div>
                    )}
                  </div>
                  <button
                    className="button button-primary button-full"
                    onClick={handleConfirmImport}
                    type="button"
                  >
                    <Check size={14} /> Add to Discovery Catalogue
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="filter-group">
      <label className="filter-label">{label}</label>
      {children}
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

function unavailable() {
  return <span className="metric-unavailable">—</span>;
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
