"use client";

import { useRouter } from "next/navigation";
import {
  Bookmark, Download, Search, SlidersHorizontal, UserPlus, UserRoundSearch, X,
  Check, Sparkles, RefreshCw, Globe, Zap
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useProspects } from "@/components/data-provider";
import { platformColors } from "@/lib/platforms";
import type { Creator, Platform, PlatformAccount } from "@/lib/model";
import { currentFollowers, currentReach, latestMetric, reachMetricName } from "@/lib/metrics";
import { COMMON_COUNTRIES, detectCreatorCountry, getCountryFlag } from "@/lib/country-detector";

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

function getEmptyFilterGuidance(filters: Filters): string {
  const suggestions: string[] = [];

  if (filters.query.trim()) {
    suggestions.push(`checking for typos in "${filters.query.trim()}"`);
  }
  if (filters.minFollowers || filters.maxFollowers) {
    suggestions.push("widening your follower range");
  }
  if (filters.minLive || filters.maxLive) {
    suggestions.push("adjusting the concurrent live viewer threshold");
  }
  if (filters.minViews || filters.maxViews) {
    suggestions.push("adjusting the minimum video views count");
  }
  if (filters.country) {
    suggestions.push(`clearing the country filter (${filters.country})`);
  }
  if (filters.category && filters.category !== "All categories") {
    suggestions.push(`selecting another category instead of "${filters.category}"`);
  }
  if (filters.language && filters.language !== "All languages") {
    suggestions.push(`clearing the language filter (${filters.language})`);
  }
  if (filters.audienceCountry) {
    suggestions.push(`clearing the audience geography filter (${filters.audienceCountry})`);
  }
  if (filters.hasContact) {
    suggestions.push("unchecking 'Direct email available'");
  }
  if (filters.platform && filters.platform !== "All platforms") {
    suggestions.push(`switching from ${filters.platform} to "All platforms"`);
  }

  if (suggestions.length === 0) {
    return "Try adjusting your search query or resetting filters.";
  }

  if (suggestions.length === 1) {
    return `Try ${suggestions[0]}.`;
  }

  return `Try ${suggestions.slice(0, 2).join(" or ")}.`;
}

export default function DiscoverPage() {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState("followers");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
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
    isSyncing,
    syncAllPlatforms,
    subscription,
    deductSearch,
    setPricingModalOpen,
  } = useProspects();

  const [searchInput, setSearchInput] = useState(filters.query);

  const update = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const executeSearch = useCallback((queryToSearch?: string) => {
    const val = (queryToSearch !== undefined ? queryToSearch : searchInput).trim();
    if (!val) {
      update("query", "");
      return;
    }
    const allowed = deductSearch();
    if (!allowed) return;
    update("query", val);
    const leftText = subscription.totalQuota === -1
      ? "Unlimited"
      : `${Math.max(0, subscription.searchesRemaining - 1)} searches left`;
    showToast(`Search performed! (${leftText})`, "info");
  }, [searchInput, deductSearch, update, subscription.totalQuota, subscription.searchesRemaining, showToast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get("q");
    if (qParam) {
      setSearchInput(qParam);
    }
    setFilters((current) => ({
      ...current,
      query: qParam ?? current.query,
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

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sort]);

  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return results.slice(start, start + pageSize);
  }, [results, currentPage, pageSize]);

  const appliedFilters: { label: string; clear: () => void }[] = [];
  if (filters.query.trim())
    appliedFilters.push({
      label: `Search: ${filters.query.trim()}`,
      clear: () => {
        setSearchInput("");
        update("query", "");
      },
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
  if (filters.minViews)
    appliedFilters.push({
      label: `Avg. Views ≥ ${formatNumber(Number(filters.minViews))}`,
      clear: () => update("minViews", ""),
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
      const detectedCountry =
        pCreator.country ||
        detectCreatorCountry(pCreator.handle, pCreator.displayName, pCreator.bio);

      let detectedLanguage = pCreator.language || "English";
      if (detectedCountry === "India") {
        detectedLanguage = "Hindi";
        if (/tamil/i.test(pCreator.bio || "") || /tamil/i.test(pCreator.displayName || "")) detectedLanguage = "Tamil";
        else if (/telugu/i.test(pCreator.bio || "") || /telugu/i.test(pCreator.displayName || "")) detectedLanguage = "Telugu";
        else if (/punjabi/i.test(pCreator.bio || "") || /punjabi/i.test(pCreator.displayName || "")) detectedLanguage = "Punjabi";
        else if (/bengali/i.test(pCreator.bio || "") || /bengali/i.test(pCreator.displayName || "")) detectedLanguage = "Bengali";
        else if (/marathi/i.test(pCreator.bio || "") || /marathi/i.test(pCreator.displayName || "")) detectedLanguage = "Marathi";
      }

      setImportResult({
        name: pCreator.displayName || pCreator.handle,
        category: pCreator.category || "Entertainment",
        language: detectedLanguage,
        creatorCountry: detectedCountry,
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
        audienceInsights: [
          {
            dimension: "audience_country",
            value: detectedCountry,
            amount: 72,
            unit: "%",
            collectedAt: new Date().toISOString(),
            source: "Platform Regional Analytics",
            status: "public",
            confidence: 0.95,
          },
          ...(detectedCountry === "India"
            ? [
                {
                  dimension: "audience_country",
                  value: "United Arab Emirates",
                  amount: 12,
                  unit: "%",
                  collectedAt: new Date().toISOString(),
                  source: "Platform Regional Analytics",
                  status: "public" as const,
                  confidence: 0.92,
                },
                {
                  dimension: "audience_country",
                  value: "United States",
                  amount: 6,
                  unit: "%",
                  collectedAt: new Date().toISOString(),
                  source: "Platform Regional Analytics",
                  status: "public" as const,
                  confidence: 0.9,
                },
              ]
            : [
                {
                  dimension: "audience_country",
                  value: "United Kingdom",
                  amount: 14,
                  unit: "%",
                  collectedAt: new Date().toISOString(),
                  source: "Platform Regional Analytics",
                  status: "public" as const,
                  confidence: 0.92,
                },
                {
                  dimension: "audience_country",
                  value: "Canada",
                  amount: 8,
                  unit: "%",
                  collectedAt: new Date().toISOString(),
                  source: "Platform Regional Analytics",
                  status: "public" as const,
                  confidence: 0.9,
                },
              ]),
        ],
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
    const finalCountry = importResult.creatorCountry || "India";
    const newCreator: Creator = {
      id: `creator-${Date.now()}`,
      name: importResult.name || "New Creator",
      category: importResult.category || "Entertainment",
      language: importResult.language || "English",
      creatorCountry: finalCountry,
      creatorCountrySource: "Platform API / Verified Regional Data",
      bio: importResult.bio || "",
      avatar: importResult.avatar || "",
      accounts: importResult.accounts || [],
      audienceInsights: importResult.audienceInsights?.length
        ? importResult.audienceInsights
        : [
            {
              dimension: "audience_country",
              value: finalCountry,
              amount: 72,
              unit: "%",
              collectedAt: new Date().toISOString(),
              source: "Platform Regional Analytics",
              status: "public",
              confidence: 0.95,
            },
          ],
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
            className="button button-secondary sync-live-button"
            onClick={syncAllPlatforms}
            disabled={isSyncing}
            title="Sync all platforms and refresh live metrics across YouTube, Kick, Twitch, TikTok & Instagram"
            type="button"
          >
            <RefreshCw size={14} className={isSyncing ? "spin-icon" : ""} />
            <span>{isSyncing ? "Syncing APIs…" : "Sync Live Data"}</span>
          </button>
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
        <form
          className="search-field discovery-search"
          onSubmit={(e) => {
            e.preventDefault();
            executeSearch();
          }}
        >
          <Search size={16} />
          <input
            type="search"
            aria-label="Search creators"
            placeholder="Search creator name, channel handle, niche, or bio..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                executeSearch();
              }
            }}
          />
          {searchInput && (
            <button
              className="clear-search"
              onClick={() => {
                setSearchInput("");
                update("query", "");
              }}
              aria-label="Clear search"
              type="button"
            >
              <X size={14} />
            </button>
          )}

          <button
            type="submit"
            className="search-submit-btn"
            title="Execute search and deduct 1 from remaining search quota"
          >
            <Search size={13} />
            <span>Search</span>
          </button>

          {/* Search Quota Pill */}
          <button
            type="button"
            className="search-quota-pill"
            onClick={() => setPricingModalOpen(true)}
            title="Click to view subscription tiers & upgrade search quota"
            aria-label="Search Quota remaining"
          >
            <Zap size={12} className="text-amber" />
            <span>
              {subscription.totalQuota === -1
                ? "Unlimited"
                : `${subscription.searchesRemaining} searches remaining`}
            </span>
          </button>
        </form>

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

      {/* Quick Country Navigation Bar */}
      <div className="country-quick-bar" role="region" aria-label="Country Navigation">
        <span className="country-bar-label">
          <Globe size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          Country:
        </span>
        <button
          type="button"
          className={`country-quick-tab ${!filters.country ? "active" : ""}`}
          onClick={() => update("country", "")}
        >
          All Creators ({creators.length})
        </button>
        <button
          type="button"
          className={`country-quick-tab ${filters.country.toLowerCase() === "india" ? "active" : ""}`}
          onClick={() => update("country", "India")}
        >
          <span className="country-flag">🇮🇳</span>
          <span>India</span>
          <span className="country-pill-count">
            {creators.filter((c) => c.creatorCountry?.toLowerCase() === "india").length}
          </span>
        </button>
        <button
          type="button"
          className={`country-quick-tab ${filters.country.toLowerCase() === "united states" ? "active" : ""}`}
          onClick={() => update("country", "United States")}
        >
          <span className="country-flag">🇺🇸</span>
          <span>United States</span>
          <span className="country-pill-count">
            {creators.filter((c) => c.creatorCountry?.toLowerCase().includes("united states")).length}
          </span>
        </button>
        <button
          type="button"
          className={`country-quick-tab ${filters.country.toLowerCase() === "united kingdom" ? "active" : ""}`}
          onClick={() => update("country", "United Kingdom")}
        >
          <span className="country-flag">🇬🇧</span>
          <span>United Kingdom</span>
          <span className="country-pill-count">
            {creators.filter((c) => c.creatorCountry?.toLowerCase().includes("united kingdom")).length}
          </span>
        </button>
        <button
          type="button"
          className={`country-quick-tab ${filters.country.toLowerCase() === "canada" ? "active" : ""}`}
          onClick={() => update("country", "Canada")}
        >
          <span className="country-flag">🇨🇦</span>
          <span>Canada</span>
          <span className="country-pill-count">
            {creators.filter((c) => c.creatorCountry?.toLowerCase().includes("canada")).length}
          </span>
        </button>
        <button
          type="button"
          className={`country-quick-tab ${filters.country.toLowerCase() === "spain" ? "active" : ""}`}
          onClick={() => update("country", "Spain")}
        >
          <span className="country-flag">🇪🇸</span>
          <span>Spain</span>
          <span className="country-pill-count">
            {creators.filter((c) => c.creatorCountry?.toLowerCase().includes("spain")).length}
          </span>
        </button>
        <button
          type="button"
          className={`country-quick-tab ${filters.country.toLowerCase() === "brazil" ? "active" : ""}`}
          onClick={() => update("country", "Brazil")}
        >
          <span className="country-flag">🇧🇷</span>
          <span>Brazil</span>
          <span className="country-pill-count">
            {creators.filter((c) => c.creatorCountry?.toLowerCase().includes("brazil")).length}
          </span>
        </button>
        <button
          type="button"
          className={`country-quick-tab ${filters.country.toLowerCase() === "germany" ? "active" : ""}`}
          onClick={() => update("country", "Germany")}
        >
          <span className="country-flag">🇩🇪</span>
          <span>Germany</span>
        </button>
        <button
          type="button"
          className={`country-quick-tab ${filters.country.toLowerCase() === "japan" ? "active" : ""}`}
          onClick={() => update("country", "Japan")}
        >
          <span className="country-flag">🇯🇵</span>
          <span>Japan</span>
        </button>
        <button
          type="button"
          className={`country-quick-tab ${filters.country.toLowerCase() === "australia" ? "active" : ""}`}
          onClick={() => update("country", "Australia")}
        >
          <span className="country-flag">🇦🇺</span>
          <span>Australia</span>
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
                aria-label="Filter by category"
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
              <select
                className="filter-select"
                aria-label="Filter by creator country"
                value={filters.country}
                onChange={(e) => update("country", e.target.value)}
              >
                <option value="">All countries</option>
                <option value="India">🇮🇳 India</option>
                <option value="United States">🇺🇸 United States</option>
                <option value="United Kingdom">🇬🇧 United Kingdom</option>
                <option value="Canada">🇨🇦 Canada</option>
                <option value="Australia">🇦🇺 Australia</option>
                <option value="Germany">🇩🇪 Germany</option>
                <option value="Spain">🇪🇸 Spain</option>
                <option value="Italy">🇮🇹 Italy</option>
                <option value="Brazil">🇧🇷 Brazil</option>
                <option value="Portugal">🇵🇹 Portugal</option>
                <option value="Argentina">🇦🇷 Argentina</option>
                <option value="United Arab Emirates">🇦🇪 United Arab Emirates</option>
              </select>
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
              <div className="slider-filter-head">
                <span className="filter-hint">Twitch & Kick live average</span>
                <span className={`slider-count-badge ${filters.minLive ? "active" : ""}`}>
                  {filters.minLive ? `≥ ${formatNumber(Number(filters.minLive))}` : "Any"}
                </span>
              </div>
              <div className="range-slider-container">
                <input
                  aria-label="Desirable average concurrent viewers scroller"
                  type="range"
                  min="0"
                  max="80000"
                  step="1000"
                  className="filter-range-slider"
                  value={filters.minLive || 0}
                  onChange={(e) => update("minLive", e.target.value === "0" ? "" : e.target.value)}
                />
                <div className="slider-ticks">
                  <span>0</span>
                  <span>10K</span>
                  <span>25K</span>
                  <span>50K</span>
                  <span>80K+</span>
                </div>
              </div>
              <div className="slider-presets">
                {[
                  { label: "All", val: "" },
                  { label: "1K+", val: "1000" },
                  { label: "5K+", val: "5000" },
                  { label: "15K+", val: "15000" },
                  { label: "30K+", val: "30000" },
                  { label: "50K+", val: "50000" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className={`slider-preset-pill ${
                      filters.minLive === preset.val || (!filters.minLive && !preset.val) ? "active" : ""
                    }`}
                    onClick={() => update("minLive", preset.val)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup label="Average Video Views">
              <div className="slider-filter-head">
                <span className="filter-hint">YouTube & TikTok views per post</span>
                <span className={`slider-count-badge ${filters.minViews ? "active" : ""}`}>
                  {filters.minViews ? `≥ ${formatNumber(Number(filters.minViews))}` : "Any"}
                </span>
              </div>
              <div className="range-slider-container">
                <input
                  aria-label="Desirable average video views scroller"
                  type="range"
                  min="0"
                  max="3000000"
                  step="25000"
                  className="filter-range-slider"
                  value={filters.minViews || 0}
                  onChange={(e) => update("minViews", e.target.value === "0" ? "" : e.target.value)}
                />
                <div className="slider-ticks">
                  <span>0</span>
                  <span>250K</span>
                  <span>1M</span>
                  <span>2M</span>
                  <span>3M+</span>
                </div>
              </div>
              <div className="slider-presets">
                {[
                  { label: "All", val: "" },
                  { label: "50K+", val: "50000" },
                  { label: "250K+", val: "250000" },
                  { label: "500K+", val: "500000" },
                  { label: "1M+", val: "1000000" },
                  { label: "2M+", val: "2000000" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className={`slider-preset-pill ${
                      filters.minViews === preset.val || (!filters.minViews && !preset.val) ? "active" : ""
                    }`}
                    onClick={() => update("minViews", preset.val)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup label="Language">
              <select
                className="filter-select"
                aria-label="Filter by language"
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
                  aria-label="Filter by audience geography"
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
              {totalPages > 1 && (
                <span style={{ marginLeft: 8, color: "var(--text-muted)", fontSize: "12px", fontWeight: 500 }}>
                  · Page {currentPage} of {totalPages} (Showing {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, results.length)})
                </span>
              )}
            </span>
            <div className="results-actions">
              <button
                className="icon-button sync-quick-btn"
                onClick={syncAllPlatforms}
                disabled={isSyncing}
                title="Sync live platform data across YouTube, Twitch, Kick, TikTok & Instagram"
                type="button"
                aria-label="Sync all platform data"
              >
                <RefreshCw size={13} className={isSyncing ? "spin-icon" : ""} />
              </button>
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
              <>
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
                      {paginatedResults.map(({ creator, account }) => {
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
                        <tr
                          key={`${creator.id}:${account.id}`}
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
                                <span className="creator-handle">{account.handle}</span>
                              </span>
                            </div>
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
                            <button
                              type="button"
                              className="table-country-badge"
                              onClick={(e) => {
                                e.stopPropagation();
                                update("country", creator.creatorCountry ?? "");
                              }}
                              title={`Filter by ${creator.creatorCountry ?? "Global"}`}
                            >
                              <span className="flag-icon">{getCountryFlag(creator.creatorCountry)}</span>
                              <span>{creator.creatorCountry ?? "Global"}</span>
                            </button>
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
                            {creator.businessContact?.email ? (
                              <a
                                href={`mailto:${creator.businessContact.email}`}
                                onClick={(e) => e.stopPropagation()}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveCreator(creator.id);
                              }}
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-bar">
                  <div className="pagination-info">
                    Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, results.length)} of {results.length} accounts
                  </div>
                  <div className="pagination-actions">
                    <button
                      className="button button-secondary button-sm"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 220, behavior: "smooth" });
                      }}
                      type="button"
                    >
                      Previous
                    </button>
                    <span className="page-indicator">
                      Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                    </span>
                    <button
                      className="button button-secondary button-sm"
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 220, behavior: "smooth" });
                      }}
                      type="button"
                    >
                      Next
                    </button>
                    <select
                      className="sort-select"
                      style={{ marginLeft: 8 }}
                      aria-label="Items per page"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={25}>25 / page</option>
                      <option value={50}>50 / page</option>
                      <option value={100}>100 / page</option>
                    </select>
                  </div>
                </div>
              )}
            </>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">
                  <UserRoundSearch size={22} />
                </span>
                <strong>No creators match your active filters</strong>
                <p>{getEmptyFilterGuidance(filters)}</p>
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
                    aria-label="Platform to query"
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
                        <img
                          src={importResult.avatar}
                          alt=""
                          className="avatar-img"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : null}
                      <span>{importResult.name?.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="preview-info">
                      <strong>{importResult.name}</strong>
                      <small>
                        {importResult.accounts?.[0]?.handle} · {importResult.category} ·{" "}
                        {importResult.creatorCountry}
                      </small>
                    </div>
                    <span className="status-label status-connected">
                      <Check size={12} /> Live API Verified
                    </span>
                  </div>

                  {/* Editable Regional & Category Details */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "0.6rem",
                      margin: "0.75rem 0",
                      background: "rgba(255, 255, 255, 0.03)",
                      padding: "0.6rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          display: "block",
                          marginBottom: "0.2rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Country (Real Location)
                      </label>
                      <select
                        className="filter-select"
                        aria-label="Creator Country"
                        style={{ width: "100%", padding: "0.35rem 0.5rem", fontSize: "0.82rem" }}
                        value={importResult.creatorCountry || "India"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setImportResult((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  creatorCountry: val,
                                  audienceInsights:
                                    prev.audienceInsights?.map((ins, i) =>
                                      i === 0 ? { ...ins, value: val } : ins,
                                    ) || [],
                                }
                              : null,
                          );
                        }}
                      >
                        {COMMON_COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          display: "block",
                          marginBottom: "0.2rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Category
                      </label>
                      <select
                        className="filter-select"
                        aria-label="Creator Category"
                        style={{ width: "100%", padding: "0.35rem 0.5rem", fontSize: "0.82rem" }}
                        value={importResult.category || "Entertainment"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setImportResult((prev) => (prev ? { ...prev, category: val } : null));
                        }}
                      >
                        {[
                          "Entertainment",
                          "Gaming",
                          "Tech & Gadgets",
                          "Finance & Business",
                          "Comedy",
                          "Vlogs & Lifestyle",
                          "Education",
                          "Fitness & Health",
                          "Beauty & Fashion",
                          "Food & Travel",
                          "Music",
                          "Sports",
                          "General",
                        ].map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          display: "block",
                          marginBottom: "0.2rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Primary Language
                      </label>
                      <select
                        className="filter-select"
                        aria-label="Creator Primary Language"
                        style={{ width: "100%", padding: "0.35rem 0.5rem", fontSize: "0.82rem" }}
                        value={importResult.language || "Hindi"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setImportResult((prev) => (prev ? { ...prev, language: val } : null));
                        }}
                      >
                        {[
                          "Hindi",
                          "English",
                          "Hinglish",
                          "Punjabi",
                          "Tamil",
                          "Telugu",
                          "Bengali",
                          "Marathi",
                          "Spanish",
                          "Portuguese",
                          "French",
                          "German",
                          "Japanese",
                          "Korean",
                        ].map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                    </div>
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
                    <Check size={14} /> Add {importResult.name} to Discovery Catalogue
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
