"use client";

import { useRouter } from "next/navigation";
import {
  Bookmark, Download, Search, SlidersHorizontal, UserPlus, UserRoundSearch, X,
  Check, Sparkles, RefreshCw, Zap, Info, AlertCircle
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

function getEmptyFilterGuidance(
  filters: Filters,
  providerSummary?: {
    succeeded: string[];
    failed: string[];
    unconfigured: string[];
    unsupported: string[];
  } | null,
): string {
  // If broad discovery connectors (YouTube & Twitch) are unconfigured in server env
  const isBroadSearchUnconfigured =
    providerSummary &&
    providerSummary.succeeded.length === 0 &&
    providerSummary.unconfigured.includes("YouTube") &&
    providerSummary.unconfigured.includes("Twitch");

  if (isBroadSearchUnconfigured) {
    return 'Live keyword discovery across YouTube and Twitch is pending activation. Meanwhile, look up Kick creators directly by exact @handle (e.g. @adinross or @xqc) or use Direct Handle Lookup below.';
  }

  const suggestions: string[] = [];

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
  if (filters.hasContact) {
    suggestions.push("unchecking 'Direct email available'");
  }
  if (filters.platform && filters.platform !== "All platforms") {
    suggestions.push(`switching from ${filters.platform} to "All platforms"`);
  }
  if (filters.query.trim()) {
    suggestions.push(`checking for typos in "${filters.query.trim()}"`);
  }

  if (suggestions.length === 0) {
    return "Try adjusting your search query or exploring popular searches below.";
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
  const pageSize = 50;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshingCreatorId, setRefreshingCreatorId] = useState<string | null>(null);

  // Live federated search state
  const [isSearching, setIsSearching] = useState(false);
  const [liveSearchResults, setLiveSearchResults] = useState<Creator[] | null>(null);
  const [connectorStatuses, setConnectorStatuses] = useState<
    Record<string, { status: string; itemCount?: number; count?: number; message?: string }>
  >({});
  const [searchProvenance, setSearchProvenance] = useState<{ source: string; isLive: boolean } | null>(null);
  const [providerSummary, setProviderSummary] = useState<{
    succeeded: string[];
    failed: string[];
    unconfigured: string[];
    unsupported: string[];
    chargeSearch: boolean;
  } | null>(null);

  // Direct handle lookup modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPlatform, setImportPlatform] = useState<Platform>("YouTube");
  const [importHandle, setImportHandle] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<Partial<Creator> | null>(null);

  const {
    creators: savedCreators,
    lists,
    hydrated,
    storageError,
    isGuest,
    addCreator,
    removeCreator,
    createList,
    addCustomCreator,
    showToast,
    isSyncing,
    syncAllPlatforms,
    subscription,
    syncServerQuota,
    hasAvailableQuota,
    deductSearch,
    setPricingModalOpen,
  } = useProspects();

  const [searchInput, setSearchInput] = useState(filters.query);

  const update = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  // Execute real federated search
  const executeSearch = useCallback(
    async (queryToSearch?: string) => {
      const val = (queryToSearch !== undefined ? queryToSearch : searchInput).trim();
      if (!val) {
        update("query", "");
        setLiveSearchResults(null);
        setSearchProvenance(null);
        setProviderSummary(null);
        return;
      }

      const allowed = hasAvailableQuota();
      if (!allowed) return;

      setIsSearching(true);
      update("query", val);

      try {
        const platformParam = filters.platform !== "All platforms" ? `&platform=${encodeURIComponent(filters.platform)}` : "";
        const res = await fetch(`/api/creators?q=${encodeURIComponent(val)}${platformParam}`);
        const data = await res.json();

        if (data?.subscription) {
          syncServerQuota(data.subscription);
        }

        if (res.status === 429 || data?.quotaExhausted) {
          setLiveSearchResults([]);
          setPricingModalOpen(true);
          showToast(
            data?.error || "Search quota exhausted (0 remaining). Quota is enforced on the server.",
            "error",
          );
          return;
        }

        if (Array.isArray(data.creators)) {
          setLiveSearchResults(data.creators);
          try {
            window.sessionStorage.setItem("gv_recent_live_creators_v1", JSON.stringify(data.creators));
          } catch {}
          if (data.connectorStatuses) {
            setConnectorStatuses(data.connectorStatuses);
          }
          setSearchProvenance({
            source: data.source || "Live Federated Platform Connectors",
            isLive: Boolean(data.isLive),
          });
          setProviderSummary({
            succeeded: data.succeededProviders || [],
            failed: data.failedProviders || [],
            unconfigured: data.unconfiguredProviders || [],
            unsupported: data.unsupportedProviders || [],
            chargeSearch: Boolean(data.chargeSearch),
          });

          // Authoritative server quota already updated via data.subscription above
          if (data.chargeSearch) {
            const subToShow = data.subscription;
            if (!subToShow) {
              deductSearch();
            }
            const remaining = subToShow
              ? subToShow.searchesRemaining
              : Math.max(0, subscription.searchesRemaining - 1);
            const totalQ = subToShow ? subToShow.totalQuota : subscription.totalQuota;
            const leftText = totalQ === -1 ? "Unlimited" : `${remaining} searches left`;
            showToast(
              `Found ${data.creators.length} live creators across ${(data.succeededProviders || []).join(", ") || "platforms"} (${leftText})`,
              "info",
            );
          } else {
            // Search was not charged
            if (data.failedProviders?.length > 0 && (!data.succeededProviders || data.succeededProviders.length === 0)) {
              showToast(
                `All queried providers failed or require credentials. Your search credit was NOT charged.`,
                "info",
              );
            } else {
              showToast(
                `No live creators found for "${val}". Your search credit was NOT charged.`,
                "info",
              );
            }
          }
        } else {
          setLiveSearchResults([]);
        }
      } catch {
        showToast("Live federated search request failed. Quota was NOT charged.", "error");
        setLiveSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [searchInput, hasAvailableQuota, deductSearch, syncServerQuota, setPricingModalOpen, update, filters.platform, subscription.totalQuota, subscription.searchesRemaining, showToast],
  );

  // Parse initial query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get("q");
    if (qParam) {
      setSearchInput(qParam);
      void executeSearch(qParam);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determine active creators dataset: live search results take precedence; otherwise saved prospects
  const activeDataset: Creator[] = useMemo(() => {
    if (liveSearchResults !== null) {
      return liveSearchResults;
    }
    return savedCreators;
  }, [liveSearchResults, savedCreators]);

  // Refresh single creator from live platform API
  async function refreshCreatorLive(platform: Platform, handle: string, creatorId: string) {
    setRefreshingCreatorId(creatorId);
    try {
      const res = await fetch(`/api/lookup?platform=${encodeURIComponent(platform)}&handle=${encodeURIComponent(handle)}`);
      const data = await res.json();
      if (res.ok && data.success && data.creator) {
        const fresh = data.creator;
        setLiveSearchResults((prev) => {
          if (!prev) return prev;
          return prev.map((c) => {
            if (c.id !== creatorId) return c;
            return {
              ...c,
              accounts: c.accounts.map((a) => {
                if (a.platform !== platform) return a;
                return {
                  ...a,
                  snapshots: [
                    ...(fresh.followers !== null
                      ? [
                          {
                            id: `snap-${creatorId}-fresh-f`,
                            metricName: "followers" as const,
                            value: fresh.followers,
                            unit: "count" as const,
                            collectedAt: data.fetchedAt || new Date().toISOString(),
                            windowStart: null,
                            windowEnd: null,
                            periodLabel: null,
                            sampleSize: null,
                            source: data.source || `${platform} Platform API`,
                            status: "public" as const,
                          },
                        ]
                      : []),
                    ...(fresh.reach !== null
                      ? [
                          {
                            id: `snap-${creatorId}-fresh-r`,
                            metricName: (fresh.reachMetric || "avg_views") as "avg_views" | "avg_live_viewers",
                            value: fresh.reach,
                            unit: fresh.reachMetric === "avg_live_viewers" ? ("count" as const) : ("views" as const),
                            collectedAt: data.fetchedAt || new Date().toISOString(),
                            windowStart: null,
                            windowEnd: null,
                            periodLabel: fresh.isLiveStream ? "Live broadcast" : "Recent content",
                            sampleSize: 10,
                            source: data.source || `${platform} Platform API`,
                            status: "public" as const,
                          },
                        ]
                      : []),
                  ],
                };
              }),
            };
          });
        });
        showToast(`Refreshed metrics for @${handle} directly from ${platform} API!`, "success");
      } else {
        showToast(data.error || `Could not refresh @${handle}`, "error");
      }
    } catch {
      showToast(`Network error refreshing @${handle}`, "error");
    } finally {
      setRefreshingCreatorId(null);
    }
  }

  // Filter and sort active results
  const results = useMemo(() => {
    const all: Result[] = activeDataset.flatMap((creator) =>
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

      return (
        matchesText &&
        (filters.platform === "All platforms" || account.platform === filters.platform) &&
        (filters.category === "All categories" || creator.category === filters.category) &&
        (filters.language === "All languages" || creator.language === filters.language) &&
        (!filters.country ||
          creator.creatorCountry?.toLowerCase().includes(filters.country.toLowerCase())) &&
        rangeMatches(followers, filters.minFollowers, filters.maxFollowers) &&
        rangeMatches(live, filters.minLive, filters.maxLive) &&
        rangeMatches(views, filters.minViews, filters.maxViews) &&
        (!filters.hasContact || Boolean(creator.businessContact?.email))
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
  }, [activeDataset, filters, sort]);

  const uniqueCreatorCount = useMemo(
    () => new Set(results.map((r) => r.creator.id)).size,
    [results],
  );

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
        setLiveSearchResults(null);
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
    if (isGuest) {
      showToast("Sign in required: Guest preview sessions cannot save creators to CRM shortlists.", "error");
      return;
    }
    const targetList = lists[0] || { id: createList("Priority Shortlist") };
    if (targetList.creatorIds.includes(creatorId)) {
      removeCreator(targetList.id, creatorId);
    } else {
      addCreator(targetList.id, creatorId);
      // Also ensure creator is saved in workspace state if it came from live search
      const searched = liveSearchResults?.find((c) => c.id === creatorId);
      if (searched) {
        addCustomCreator(searched);
      }
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
      "Fetched Timestamp",
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
      account.snapshots[0]?.source || "Live Platform API",
      account.snapshots[0]?.collectedAt || new Date().toISOString(),
    ]);

    const csv = [headers, ...lines].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `getviral-creators-${filters.platform.toLowerCase().replace(/\s+/g, "-")}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Exported creators CSV successfully!", "success");
  }

  // Exact Handle Lookup Modal handler
  async function handleLiveLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!importHandle.trim()) return;
    if (!hasAvailableQuota()) return;
    setImportLoading(true);
    setImportError("");
    setImportResult(null);

    try {
      const res = await fetch(
        `/api/lookup?mode=discover&platform=${encodeURIComponent(importPlatform)}&handle=${encodeURIComponent(
          importHandle.trim(),
        )}`,
      );
      const data = await res.json();
      if (data?.subscription) {
        syncServerQuota(data.subscription);
      }
      if (res.status === 429 || data?.quotaExhausted) {
        setPricingModalOpen(true);
        throw new Error(data?.error || "Search quota exhausted (0 searches remaining).");
      }
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to lookup channel on ${importPlatform}.`);
      }

      const pCreator = data.creator;
      const detectedCountry =
        pCreator.country ||
        detectCreatorCountry(pCreator.handle, pCreator.name || pCreator.displayName, pCreator.bio) ||
        null;

      const detectedLanguage = pCreator.language || "English";
      const parsedFollowers =
        pCreator.followers !== null && pCreator.followers !== undefined
          ? Number(pCreator.followers)
          : null;
      const parsedReach =
        pCreator.reach !== null && pCreator.reach !== undefined
          ? Number(pCreator.reach)
          : null;

      setImportResult({
        id: pCreator.id || `creator-${importPlatform.toLowerCase()}-${Date.now()}`,
        name: pCreator.name || pCreator.displayName || pCreator.handle,
        category: pCreator.category || "General",
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
            activity: pCreator.isLiveStream ? "Live Now" : "Active",
            snapshots: [
              ...(parsedFollowers !== null && !Number.isNaN(parsedFollowers)
                ? [
                    {
                      id: `snap-${Date.now()}-1`,
                      metricName: "followers",
                      value: parsedFollowers,
                      unit: "count" as const,
                      collectedAt: data.fetchedAt || new Date().toISOString(),
                      windowStart: null,
                      windowEnd: null,
                      periodLabel: "Point-in-time",
                      sampleSize: null,
                      source: data.source || `${importPlatform} Platform API`,
                      status: "public" as const,
                    },
                  ]
                : []),
              ...(parsedReach !== null && !Number.isNaN(parsedReach)
                ? [
                    {
                      id: `snap-${Date.now()}-2`,
                      metricName:
                        importPlatform === "Twitch" || importPlatform === "Kick"
                          ? "avg_live_viewers"
                          : "avg_video_views",
                      value: parsedReach,
                      unit: (importPlatform === "Twitch" || importPlatform === "Kick"
                        ? "count"
                        : "views") as "count" | "views",
                      collectedAt: data.fetchedAt || new Date().toISOString(),
                      windowStart: null,
                      windowEnd: null,
                      periodLabel: pCreator.isLiveStream ? "Current live broadcast" : "Recent content",
                      sampleSize: 10,
                      source: data.source || `${importPlatform} Platform API`,
                      status: "public" as const,
                    },
                  ]
                : []),
            ],
          },
        ],
        audienceInsights: [],
        businessContact: pCreator.businessContact || null,
      });
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to lookup channel.");
    } finally {
      setImportLoading(false);
    }
  }

  function handleConfirmImport() {
    if (!importResult) return;
    if (isGuest) {
      showToast("Sign in required: Guest preview sessions cannot save creators to workspace.", "error");
      return;
    }
    const finalCountry = importResult.creatorCountry || null;
    const newCreator: Creator = {
      id: importResult.id || `creator-${Date.now()}`,
      name: importResult.name || "New Creator",
      category: importResult.category || "General",
      language: importResult.language || "English",
      creatorCountry: finalCountry,
      creatorCountrySource: "Platform API / Verified Channel Data",
      bio: importResult.bio || "",
      avatar: importResult.avatar || "",
      accounts: importResult.accounts || [],
      audienceInsights: [],
      businessContact: importResult.businessContact || null,
    };
    addCustomCreator(newCreator);
    setImportModalOpen(false);
    setImportResult(null);
    setImportHandle("");
  }

  const categories = [
    ...new Set(
      activeDataset.map((creator) => creator.category).filter((value): value is string => !!value),
    ),
  ].sort();
  const languages = [
    ...new Set(
      activeDataset.map((creator) => creator.language).filter((value): value is string => !!value),
    ),
  ].sort();
  const savedAccountIds = new Set(lists.flatMap((list) => list.creatorIds));

  return (
    <>
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Sparkles size={12} className="inline-icon" /> LIVE CREATOR DISCOVERY
          </div>
          <h1>Find creators across live platforms.</h1>
          <p className="page-subtitle">
            Discover YouTube &amp; Twitch creators, look up Kick channels by @handle, and view live reach with verified timestamps.
          </p>
        </div>
        <div className="page-heading-actions">
          <button
            className="button button-secondary sync-live-button"
            onClick={() => {
              if (isGuest) {
                showToast("Sign in required: Guest preview sessions cannot refresh saved workspace metrics.", "error");
                return;
              }
              void syncAllPlatforms();
            }}
            disabled={isGuest || isSyncing}
            title={
              isGuest
                ? "Sign in to refresh saved creator metrics"
                : "Refresh live metrics for your saved creators"
            }
            type="button"
            style={isGuest ? { opacity: 0.65, cursor: "not-allowed" } : undefined}
          >
            <RefreshCw size={14} className={isSyncing ? "spin-icon" : ""} />
            <span>{isSyncing ? "Refreshing…" : "Refresh Saved"}</span>
          </button>
          <button
            className="button button-primary"
            onClick={() => setImportModalOpen(true)}
            type="button"
          >
            <UserPlus size={14} /> Direct Handle Lookup
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
            void executeSearch();
          }}
        >
          <Search size={16} />
          <input
            type="search"
            aria-label="Search creators"
            placeholder="Search live creators by name, topic, channel handle, or niche..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              className="clear-search"
              onClick={() => {
                setSearchInput("");
                update("query", "");
                setLiveSearchResults(null);
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
            disabled={isSearching}
            title="Search creators across active platforms"
          >
            {isSearching ? <RefreshCw size={13} className="spin-icon" /> : <Search size={13} />}
            <span>{isSearching ? "Searching…" : "Search"}</span>
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
                : isGuest
                  ? `Guest Preview: ${subscription.searchesRemaining} / ${subscription.totalQuota}`
                  : `${subscription.searchesRemaining} / ${subscription.totalQuota} searches`}
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

      {/* Federated Search Provenance & Provider Status Bar */}
      {searchProvenance && (
        <div
          className="search-provenance-bar"
          style={{
            background: "rgba(34, 197, 94, 0.08)",
            border: "1px solid rgba(34, 197, 94, 0.22)",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 12,
            marginBottom: 14,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              <strong style={{ color: "#166534" }}>{searchProvenance.source}</strong>
              <span style={{ color: "#4b6c51" }}>· Live platform lookup</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: providerSummary?.chargeSearch ? "#15803d" : "#68836c" }}>
              {providerSummary?.chargeSearch ? "✓ 1 Search Quota Used" : "✓ Search Quota NOT Charged"}
            </div>
          </div>

          {/* Provider Execution Results Badges */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#285d38" }}>Provider Status:</span>
            {Object.entries(connectorStatuses).map(([plat, stat]) => {
              const isSuccess = stat.status === "success" || stat.status === "ok";
              const isUnconfigured = stat.status === "unconfigured";
              const isUnsupported = stat.status === "unsupported_operation";
              const isRateLimited = stat.status === "rate_limited";
              const isError = stat.status === "error";

              let bg = "rgba(100, 116, 139, 0.12)";
              let color = "#475569";
              let text = `${plat}: ${stat.status}`;

              if (isSuccess) {
                const resultCount = stat.itemCount ?? stat.count ?? 0;
                bg = "rgba(34, 197, 94, 0.16)";
                color = "#15803d";
                text = `✓ ${plat}: ${resultCount} ${resultCount === 1 ? "result" : "results"}`;
              } else if (isUnconfigured) {
                bg = "rgba(234, 179, 8, 0.14)";
                color = "#854d0e";
                text = `⚡ ${plat}: Service Pending`;
              } else if (isUnsupported) {
                if (plat === "TikTok" || plat === "Instagram") {
                  bg = "rgba(100, 116, 139, 0.14)";
                  color = "#475569";
                  text = `🔒 ${plat}: OAuth Required`;
                } else {
                  const isMultiWord = /\s/.test(filters.query.trim());
                  bg = "rgba(56, 189, 248, 0.14)";
                  color = "#0369a1";
                  text = isMultiWord
                    ? `ℹ ${plat}: @handle only (skipped multi-word)`
                    : `ℹ ${plat}: Handle Lookup Only`;
                }
              } else if (isRateLimited) {
                bg = "rgba(249, 115, 22, 0.14)";
                color = "#c2410c";
                text = `⏳ ${plat}: Rate Limited`;
              } else if (isError) {
                bg = "rgba(239, 68, 68, 0.14)";
                color = "#b91c1c";
                text = `✕ ${plat}: Request Error`;
              }

              return (
                <span
                  key={plat}
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: bg,
                    color: color,
                    fontWeight: 500,
                  }}
                  title={stat.message || `Connector status for ${plat}`}
                >
                  {text}
                </span>
              );
            })}
          </div>
        </div>
      )}

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
            onClick={() => {
              setFilters(initialFilters);
              setLiveSearchResults(null);
              setSearchProvenance(null);
            }}
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
                {COMMON_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {getCountryFlag(c)} {c}
                  </option>
                ))}
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
                <span className="filter-hint">YouTube views per post</span>
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

            {/* Audience Geography Info Box */}
            <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(255,255,255,0.4)", borderRadius: 8, border: "1px solid rgba(80,140,80,0.12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#285d38", marginBottom: 4 }}>
                <Info size={12} /> Audience Demographics
              </div>
              <p style={{ fontSize: 10, color: "#68836c", margin: 0, lineHeight: 1.4 }}>
                Audience geography requires creator-authorized OAuth tokens; public discovery APIs do not return private audience country metrics.
              </p>
            </div>

            <FilterGroup label="Public Business Email">
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={filters.hasContact}
                  onChange={(e) => update("hasContact", e.target.checked)}
                />
                Direct verified email only
              </label>
            </FilterGroup>
          </div>
        </aside>

        {/* Results Area */}
        <section>
          <div className="results-toolbar">
            <span className="results-count">
              <strong>{uniqueCreatorCount}</strong> unique {uniqueCreatorCount === 1 ? "creator" : "creators"} · <strong>{results.length}</strong> platform {results.length === 1 ? "account" : "accounts"}
              {liveSearchResults !== null && (
                <span style={{ marginLeft: 6, color: "#166534", fontWeight: 600 }}>
                  (Live Search Results)
                </span>
              )}
              {liveSearchResults === null && savedCreators.length > 0 && (
                <span style={{ marginLeft: 6, color: "#547359" }}>
                  (Saved Creators)
                </span>
              )}
              {totalPages > 1 && (
                <span style={{ marginLeft: 8, color: "var(--text-muted)", fontSize: "12px", fontWeight: 500 }}>
                  · Page {currentPage} of {totalPages}
                </span>
              )}
            </span>
            <div className="results-actions">
              <button
                className="icon-button sync-quick-btn"
                onClick={() => {
                  if (isGuest) {
                    showToast("Sign in required: Guest preview sessions cannot refresh saved workspace metrics.", "error");
                    return;
                  }
                  void syncAllPlatforms();
                }}
                disabled={isGuest || isSyncing}
                title={
                  isGuest
                    ? "Sign in to refresh saved creator metrics"
                    : "Refresh live metrics for your saved creators"
                }
                type="button"
                aria-label="Sync all platform data"
                style={isGuest ? { opacity: 0.65, cursor: "not-allowed" } : undefined}
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
            {isSearching ? (
              <div style={{ textAlign: "center", padding: "64px 20px" }}>
                <RefreshCw size={28} className="spin-icon" style={{ color: "#22c55e", margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: 16, color: "#1d472b", marginBottom: 6 }}>
                  Searching active platforms…
                </h3>
                <p style={{ color: "#547359", fontSize: 13, margin: 0 }}>
                  Checking live discovery connectors and deduplicating matching creator profiles.
                </p>
              </div>
            ) : results.length ? (
              <>
                {/* Desktop Results Table (>= 769px) */}
                <div className="discovery-table-wrap">
                  <div className="table-scroll-cue">
                    <span>← Swipe horizontally to view all columns & verification details →</span>
                  </div>
                  <div className="table-wrap">
                    <table className="data-table discovery-table">
                      <thead>
                        <tr>
                          <th>Creator</th>
                          <th>Platform</th>
                          <th>Category</th>
                          <th>Country</th>
                          <th>Followers / Subs</th>
                          <th>Reach Metric</th>
                          <th>Verification & Source</th>
                          <th>Business Email</th>
                          <th aria-label="Save creator">Save</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedResults.map(({ creator, account }) => {
                          const saved = savedAccountIds.has(creator.id);
                          const followers = currentFollowers(account);
                          const reach = currentReach(account);
                          const reachMetric = reachMetricName(account);
                          const reachSnapshot = reachMetric ? latestMetric(account, reachMetric) : undefined;
                          const reachLabel =
                            reachMetric === "avg_live_viewers"
                              ? "Avg. live viewers"
                              : reachMetric === "avg_video_views"
                              ? "Avg. video views"
                              : "Reach unavailable";

                          const isRefreshing = refreshingCreatorId === creator.id;

                          return (
                            <tr
                              key={`${creator.id}:${account.id}`}
                              className="clickable-row"
                              onClick={() =>
                                router.push(
                                  `/creators/${creator.id}?platform=${encodeURIComponent(
                                    account.platform,
                                  )}&handle=${encodeURIComponent(account.handle)}`,
                                )
                              }
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
                              </td>
                              <td>
                                <span>
                                  {getCountryFlag(creator.creatorCountry)} {creator.creatorCountry ?? "Global"}
                                </span>
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
                                      {reachLabel} · {liveSearchResults !== null ? (reachSnapshot?.periodLabel ?? "live") : `Saved (${new Date(reachSnapshot?.collectedAt || Date.now()).toLocaleDateString()})`}
                                    </span>
                                  </>
                                )}
                              </td>
                              <td>
                                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                  <span style={{ fontSize: 10, color: liveSearchResults !== null ? "#166534" : "#475569", fontWeight: 600 }}>
                                    {liveSearchResults !== null
                                      ? (account.snapshots[0]?.source || `${account.platform} API`)
                                      : "Saved Workspace Database"}
                                  </span>
                                  {liveSearchResults === null && account.snapshots[0]?.collectedAt && (
                                    <small style={{ fontSize: 9, color: "var(--muted, #64748b)" }}>
                                      Collected: {new Date(account.snapshots[0].collectedAt).toLocaleDateString()}
                                    </small>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void refreshCreatorLive(account.platform, account.handle, creator.id);
                                    }}
                                    disabled={isRefreshing}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 3,
                                      fontSize: 9,
                                      padding: "2px 5px",
                                      borderRadius: 4,
                                      border: "1px solid rgba(80, 140, 80, 0.2)",
                                      background: "rgba(255, 255, 255, 0.6)",
                                      color: "#285d38",
                                      cursor: "pointer",
                                      width: "fit-content",
                                    }}
                                    title="Query provider API to refresh metrics now"
                                  >
                                    <RefreshCw size={9} className={isRefreshing ? "spin-icon" : ""} />
                                    <span>{isRefreshing ? "Refreshing…" : "Refresh"}</span>
                                  </button>
                                </div>
                              </td>
                              <td>
                                {creator.businessContact?.email ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <a
                                      href={`mailto:${creator.businessContact.email}`}
                                      onClick={(e) => e.stopPropagation()}
                                      title={`Verified contact source: ${creator.businessContact.sourceUrl || "Public channel listing"}`}
                                      className="contact-badge"
                                    >
                                      {creator.businessContact.email}
                                    </a>
                                    <small style={{ fontSize: 9, color: "var(--muted, #64748b)" }}>
                                      Source: {creator.businessContact.sourceUrl || "Public Channel About Page"}
                                    </small>
                                  </div>
                                ) : (
                                  <span className="contact-missing">Unavailable</span>
                                )}
                              </td>
                              <td>
                                <button
                                  className={`save-button ${saved ? "saved" : ""}`}
                                  disabled={isGuest}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isGuest) {
                                      showToast("Sign in required: Guest preview sessions cannot save creators to CRM shortlists.", "error");
                                      return;
                                    }
                                    toggleSaveCreator(creator.id);
                                  }}
                                  title={
                                    isGuest
                                      ? "Sign in required to save creators to CRM shortlists"
                                      : saved
                                      ? "Remove from shortlist"
                                      : "Save to shortlist"
                                  }
                                  aria-label={
                                    isGuest
                                      ? "Sign in to save creator"
                                      : saved
                                      ? `Saved ${creator.name}`
                                      : `Save ${creator.name}`
                                  }
                                  style={isGuest ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
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
                </div>

                {/* Mobile Results Cards View (< 769px) */}
                <div className="discovery-mobile-cards">
                  {paginatedResults.map(({ creator, account }) => {
                    const saved = savedAccountIds.has(creator.id);
                    const followers = currentFollowers(account);
                    const reach = currentReach(account);
                    const reachMetric = reachMetricName(account);
                    const reachSnapshot = reachMetric ? latestMetric(account, reachMetric) : undefined;
                    const isRefreshing = refreshingCreatorId === creator.id;

                    return (
                      <div key={`m-${creator.id}:${account.id}`} className="creator-mobile-card">
                        <div className="mobile-card-header">
                          <div
                            className="creator-cell"
                            onClick={() =>
                              router.push(
                                `/creators/${creator.id}?platform=${encodeURIComponent(
                                  account.platform,
                                )}&handle=${encodeURIComponent(account.handle)}`,
                              )
                            }
                            style={{ cursor: "pointer" }}
                          >
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
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <strong className="creator-name">{creator.name}</strong>
                                {creator.creatorCountry && (
                                  <span style={{ fontSize: 11 }}>
                                    {getCountryFlag(creator.creatorCountry)}
                                  </span>
                                )}
                              </div>
                              <span className="creator-handle">{account.handle}</span>
                            </div>
                          </div>

                          <button
                            className={`save-button ${saved ? "saved" : ""}`}
                            disabled={isGuest}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isGuest) {
                                showToast("Sign in required: Guest preview sessions cannot save creators to CRM shortlists.", "error");
                                return;
                              }
                              toggleSaveCreator(creator.id);
                            }}
                            type="button"
                            title={
                              isGuest
                                ? "Sign in required to save creators to CRM shortlists"
                                : saved
                                ? "Remove from shortlist"
                                : "Save to shortlist"
                            }
                            aria-label={
                              isGuest
                                ? "Sign in to save creator"
                                : saved
                                ? `Remove ${creator.name}`
                                : `Save ${creator.name}`
                            }
                            style={isGuest ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                          >
                            <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
                          </button>
                        </div>

                        <div className="mobile-card-meta">
                          <span
                            className={`platform-label platform-badge platform-${account.platform.toLowerCase()}`}
                          >
                            <i
                              className="platform-dot"
                              style={{ background: platformColors[account.platform] }}
                            />
                            {account.platform}
                          </span>
                          <span className="category-pill" style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(80,140,80,0.1)", color: "#1d472b" }}>
                            {creator.category ?? "General"}
                          </span>
                          <span className="activity-pill" style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: account.activity === "Live Now" ? "rgba(239,68,68,0.15)" : "rgba(80,140,80,0.08)", color: account.activity === "Live Now" ? "#b91c1c" : "#285d38", fontWeight: 600 }}>
                            {account.activity ?? "Active"}
                          </span>
                        </div>

                        <div className="mobile-card-metrics-grid">
                          <div className="mobile-metric-item">
                            <span className="mobile-metric-label">Followers / Subs</span>
                            <strong className="mobile-metric-value">
                              {followers !== null
                                ? `${formatNumber(followers)} ${account.platform === "YouTube" ? "subs" : "followers"}`
                                : "Unavailable"}
                            </strong>
                          </div>
                          <div className="mobile-metric-item">
                            <span className="mobile-metric-label">
                              {reachMetric === "avg_live_viewers" ? "Avg. Live Viewers" : "Avg. Video Views"}
                            </span>
                            <strong className="mobile-metric-value">
                              {reach !== null ? formatNumber(reach) : "Unavailable"}
                            </strong>
                          </div>
                        </div>

                        <div className="mobile-card-provenance">
                          <div className="provenance-row">
                            <span className="provenance-label">Data Source:</span>
                            <span className="provenance-val">
                              {liveSearchResults !== null
                                ? (reachSnapshot?.source || (account.snapshots[0]?.source ? account.snapshots[0].source : `${account.platform} Official API`))
                                : `Saved Workspace Database (Collected: ${new Date(account.snapshots[0]?.collectedAt || Date.now()).toLocaleDateString()})`}
                            </span>
                          </div>
                          <div className="provenance-row">
                            <span className="provenance-label">Public Email:</span>
                            <span className="provenance-val">
                              {creator.businessContact?.email ? (
                                <span>
                                  <a href={`mailto:${creator.businessContact.email}`} className="email-link">
                                    {creator.businessContact.email}
                                  </a>
                                  <small style={{ display: "block", color: "var(--muted)", fontSize: 9 }}>
                                    Source: {creator.businessContact.sourceUrl || "Channel About Page"}
                                  </small>
                                </span>
                              ) : (
                                <span className="text-muted">Unavailable</span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="mobile-card-actions">
                          <button
                            className="button button-secondary button-sm"
                            onClick={() => router.push(`/creators/${creator.id}`)}
                            type="button"
                          >
                            View Profile
                          </button>
                          <button
                            className="button button-secondary button-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              void refreshCreatorLive(account.platform, account.handle, creator.id);
                            }}
                            disabled={isRefreshing}
                            type="button"
                          >
                            <RefreshCw size={11} className={isRefreshing ? "spin-icon" : ""} />
                            <span>{isRefreshing ? "Refreshing…" : "Refresh Live"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pagination-bar">
                    <div className="pagination-info">
                      Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, results.length)} of {results.length} creators
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
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Empty Search State */
              <div className="empty-state" style={{ padding: "48px 24px" }}>
                <span className="empty-icon">
                  <UserRoundSearch size={24} />
                </span>
                <strong style={{ fontSize: 16, marginTop: 12 }}>
                  {filters.query ? `No creators found for "${filters.query}"` : "Discover Creators Across Live Platforms"}
                </strong>
                <p style={{ maxWidth: 480, margin: "8px auto 20px" }}>
                  {filters.query
                    ? getEmptyFilterGuidance(filters, providerSummary)
                    : "Search YouTube & Twitch by keyword when active, look up Kick creators by exact @handle, or use Direct Handle Lookup below."}
                </p>

                {/* Quick suggestions separated by Kick @handle vs Keyword */}
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
                  {[
                    { term: "@adinross", hint: "Kick @handle" },
                    { term: "@xqc", hint: "Kick @handle" },
                    { term: "Gaming streamers", hint: "Keyword" },
                    { term: "Tech reviews", hint: "Keyword" },
                    { term: "Kai Cenat", hint: "Keyword" },
                  ].map((item) => (
                    <button
                      key={item.term}
                      className="button button-secondary button-sm"
                      onClick={() => {
                        setSearchInput(item.term);
                        void executeSearch(item.term);
                      }}
                      type="button"
                      title={item.hint}
                    >
                      <Search size={12} /> {item.term}
                      <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 500 }}>· {item.hint}</span>
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                  <button
                    className="button button-primary button-sm"
                    onClick={() => setImportModalOpen(true)}
                    type="button"
                  >
                    <UserPlus size={13} /> Direct Handle Lookup
                  </button>
                  {filters.query && (
                    <button
                      className="button button-secondary button-sm"
                      onClick={() => {
                        setFilters(initialFilters);
                        setSearchInput("");
                        setLiveSearchResults(null);
                      }}
                      type="button"
                    >
                      Clear Search Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Direct Handle Lookup via Live API Modal */}
      {importModalOpen && (
        <div className="modal-backdrop" onClick={() => setImportModalOpen(false)}>
          <div className="import-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <UserPlus size={18} className="modal-icon-green" />
                <h3>Direct Channel Handle Lookup</h3>
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
                Look up any creator channel directly by exact @handle or username across active platform integrations.
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
                    <option value="YouTube">YouTube (Channel Lookup — Service Pending)</option>
                    <option value="Twitch">Twitch (Channel Lookup — Service Pending)</option>
                    <option value="Kick">Kick (Exact @handle Lookup — Active)</option>
                    <option value="TikTok">TikTok (Requires Creator OAuth)</option>
                    <option value="Instagram">Instagram (Requires Meta Professional OAuth)</option>
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
                    disabled={importPlatform === "TikTok" || importPlatform === "Instagram"}
                    required
                  />
                </label>
              </div>

              {(importPlatform === "TikTok" || importPlatform === "Instagram") && (
                <div className="auth-error" role="status" style={{ marginTop: 10 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>
                    {importPlatform} lookup is currently unavailable for unauthenticated queries. Official{" "}
                    {importPlatform === "TikTok" ? "TikTok Display API" : "Meta Instagram Graph API"} requires{" "}
                    {importPlatform === "TikTok"
                      ? "creator OAuth authorization"
                      : "Meta App Review and an Instagram Professional account token"}
                    .
                  </span>
                </div>
              )}

              <div className="import-actions-row">
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={
                    importLoading ||
                    !importHandle.trim() ||
                    importPlatform === "TikTok" ||
                    importPlatform === "Instagram"
                  }
                >
                  {importLoading ? (
                    <>
                      <RefreshCw size={14} className="spin-icon" /> Querying Platform API…
                    </>
                  ) : (
                    <>
                      <Search size={14} /> Query Handle Live
                    </>
                  )}
                </button>
              </div>

              {importError && (
                <div className="auth-error" role="alert" style={{ marginTop: 12 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{importError}</span>
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
                      <Check size={12} /> Live Verified
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
                    disabled={isGuest}
                    title={
                      isGuest
                        ? "Sign in required: Guest preview sessions cannot save creators to workspace"
                        : undefined
                    }
                    type="button"
                  >
                    <Check size={14} />{" "}
                    {isGuest
                      ? `Sign In to Save ${importResult.name} to Workspace`
                      : `Save ${importResult.name} to Saved Creators`}
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
  return <span className="metric-unavailable">Unavailable</span>;
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
