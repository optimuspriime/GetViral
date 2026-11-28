import { NextResponse } from "next/server";
import type { Creator, Platform } from "@/lib/model";
import { federatedSearch } from "@/lib/connectors/federated";
import { getLiveBrowseCreators } from "@/lib/connectors/browse";
import type { ConnectorStatus, NormalizedCreator } from "@/lib/connectors/types";
import {
  REGIONAL_DISCOVERY_PROFILES,
  resolveCountryToIso,
  resolveLanguageToIso,
} from "@/lib/creator-metadata";
import { sanitizePublicSourceLabel } from "@/lib/public-labels";
import { sanitizePublicErrorMessage } from "@/lib/server-sanitize";
import { loadUserAccountData, saveCreatorsToSupabase, syncUserListsToSupabase } from "@/lib/supabase/db-sync";
import { attachGuestCookie, resolveServerSession } from "@/lib/auth/server-session";
import {
  attachQuotaCookie,
  checkServerQuotaAvailable,
  consumeServerQuota,
} from "@/lib/quota/server-quota";

function normalizeToWorkspaceCreator(c: NormalizedCreator): Creator {
  const publicSource = sanitizePublicSourceLabel(c.platform, c.source);
  return {
    id: c.id,
    name: c.name,
    category: c.category || "General",
    language: c.language ?? null,
    creatorCountry: c.country,
    creatorCountrySource: c.country ? "Public Channel Profile" : null,
    audienceInsights: [],
    bio: c.bio || `${c.name} on ${c.platform}`,
    avatar: c.avatarUrl || "",
    businessContact: c.businessContact,
    accounts: [
      {
        id: `acc-${c.id}`,
        platform: c.platform,
        handle: c.handle,
        profileUrl: c.profileUrl,
        activity: c.isLiveStream ? "Live Now" : "Active",
        snapshots: [
          ...(c.followers !== null
            ? [
                {
                  id: `snap-${c.id}-followers`,
                  metricName: "followers",
                  value: c.followers,
                  unit: "count" as const,
                  collectedAt: c.fetchedAt,
                  windowStart: null,
                  windowEnd: null,
                  periodLabel: null,
                  sampleSize: null,
                  source: publicSource,
                  status: "public" as const,
                },
              ]
            : []),
          ...(c.reach !== null
            ? [
                {
                  id: `snap-${c.id}-reach`,
                  metricName:
                    c.reachMetric === "avg_live_viewers" ? "avg_live_viewers" : "avg_video_views",
                  value: c.reach,
                  unit: c.reachMetric === "avg_live_viewers" ? ("count" as const) : ("views" as const),
                  collectedAt: c.fetchedAt,
                  windowStart: null,
                  windowEnd: null,
                  periodLabel: c.isLiveStream
                    ? "Current live stream"
                    : "Channel lifetime average (total views ÷ videos)",
                  sampleSize: null,
                  source: publicSource,
                  status: "public" as const,
                },
              ]
            : []),
        ],
      },
    ],
  };
}

function buildFilteredCreatorsAndStatuses(
  rawCreators: NormalizedCreator[],
  rawStatuses: Record<Platform, { status: ConnectorStatus; itemCount: number; message?: string; capabilities: unknown; isLive: boolean; cached?: boolean }>,
  filters: {
    category: string | null;
    country: string | null;
    language: string | null;
    minFollowers: number | null;
    maxFollowers: number | null;
    minLive: number | null;
    maxLive: number | null;
    minViews: number | null;
    maxViews: number | null;
  },
) {
  let filtered = rawCreators.map(normalizeToWorkspaceCreator);

  if (filters.category && filters.category !== "All categories") {
    filtered = filtered.filter((c) => (c.category || "").toLowerCase() === filters.category!.toLowerCase());
  }

  if (filters.country && filters.country.toLowerCase() !== "global") {
    const requestedLower = filters.country.toLowerCase();
    filtered = filtered.filter((c) =>
      c.creatorCountry?.toLowerCase().includes(requestedLower),
    );
  }

  if (filters.language && filters.language !== "All languages") {
    filtered = filtered.filter(
      (c) => (c.language || "").toLowerCase() === filters.language!.toLowerCase(),
    );
  }

  if (filters.minFollowers !== null || filters.maxFollowers !== null) {
    filtered = filtered.filter((c) =>
      c.accounts.some((a) => {
        const fSnap = a.snapshots.find((s) => s.metricName === "followers")?.value ?? null;
        if (fSnap === null) return false;
        if (filters.minFollowers !== null && fSnap < filters.minFollowers) return false;
        if (filters.maxFollowers !== null && fSnap > filters.maxFollowers) return false;
        return true;
      }),
    );
  }

  if (filters.minLive !== null || filters.maxLive !== null) {
    filtered = filtered.filter((c) =>
      c.accounts.some((a) => {
        const lSnap = a.snapshots.find((s) => s.metricName === "avg_live_viewers")?.value ?? null;
        if (lSnap === null) return false;
        if (filters.minLive !== null && lSnap < filters.minLive) return false;
        if (filters.maxLive !== null && lSnap > filters.maxLive) return false;
        return true;
      }),
    );
  }

  if (filters.minViews !== null || filters.maxViews !== null) {
    filtered = filtered.filter((c) =>
      c.accounts.some((a) => {
        const vSnap = a.snapshots.find((s) => s.metricName === "avg_video_views")?.value ?? null;
        if (vSnap === null) return false;
        if (filters.minViews !== null && vSnap < filters.minViews) return false;
        if (filters.maxViews !== null && vSnap > filters.maxViews) return false;
        return true;
      }),
    );
  }

  const displayedByPlatform: Partial<Record<Platform, number>> = {};
  for (const creator of filtered) {
    for (const acc of creator.accounts) {
      displayedByPlatform[acc.platform] = (displayedByPlatform[acc.platform] ?? 0) + 1;
    }
  }

  const succeededProviders: Platform[] = [];
  const failedProviders: Platform[] = [];
  const unconfiguredProviders: Platform[] = [];
  const unsupportedProviders: Platform[] = [];

  const finalStatuses = Object.fromEntries(
    (Object.entries(rawStatuses) as [Platform, typeof rawStatuses[Platform]][]).map(([p, statusObj]) => {
      const shownCount = displayedByPlatform[p] ?? 0;
      const upstreamCount = statusObj.itemCount;
      let msg = statusObj.message;

      if (statusObj.status === "success") {
        succeededProviders.push(p);
        if (upstreamCount > shownCount && shownCount > 0) {
          msg = `${shownCount} displayed (${upstreamCount} matched before filters)`;
        } else if (msg) {
          msg = sanitizePublicErrorMessage(msg, p);
        }
      } else if (statusObj.status === "error" || statusObj.status === "rate_limited") {
        failedProviders.push(p);
        msg = sanitizePublicErrorMessage(msg, p, `${p} lookup is temporarily unavailable.`);
      } else if (statusObj.status === "unconfigured") {
        unconfiguredProviders.push(p);
        msg = `${p} live search is temporarily pending activation.`;
      } else if (statusObj.status === "unsupported_operation") {
        unsupportedProviders.push(p);
        msg = sanitizePublicErrorMessage(msg, p);
      }

      return [
        p,
        {
          status: statusObj.status,
          isLive: statusObj.isLive,
          cached: statusObj.cached,
          itemCount: statusObj.status === "success" ? shownCount : statusObj.itemCount,
          fetchedCount: upstreamCount,
          message: msg,
        },
      ];
    }),
  );

  return {
    filtered,
    finalStatuses,
    succeededProviders,
    failedProviders,
    unconfiguredProviders,
    unsupportedProviders,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q")?.trim() || "").slice(0, 120);
  const browse = searchParams.get("browse") === "1";
  const platform = searchParams.get("platform") as Platform | "All platforms" | null;
  const category = searchParams.get("category");
  const country = searchParams.get("country");
  const language = searchParams.get("language");
  const minRaw = searchParams.get("minFollowers");
  const maxRaw = searchParams.get("maxFollowers");
  const minLiveRaw = searchParams.get("minLive");
  const maxLiveRaw = searchParams.get("maxLive");
  const minViewsRaw = searchParams.get("minViews");
  const maxViewsRaw = searchParams.get("maxViews");
  const parseOptNum = (raw: string | null) =>
    raw !== null && raw.trim() !== "" && !Number.isNaN(Number(raw)) ? Number(raw) : null;
  const minFollowers = parseOptNum(minRaw);
  const maxFollowers = parseOptNum(maxRaw);
  const minLive = parseOptNum(minLiveRaw);
  const maxLive = parseOptNum(maxLiveRaw);
  const minViews = parseOptNum(minViewsRaw);
  const maxViews = parseOptNum(maxViewsRaw);

  const session = await resolveServerSession(request);

  // 1. Live explicit search query (quota-gated on server)
  if (q) {
    const quotaCheck = await checkServerQuotaAvailable(session);
    if (!quotaCheck.allowed) {
      const exhaustedRes = NextResponse.json(
        {
          query: q,
          total: 0,
          creators: [],
          error: "Monthly search quota exhausted (0 searches remaining).",
          quotaExhausted: true,
          chargeSearch: false,
          subscription: quotaCheck.subscription,
          source: "Live Channel Discovery",
          isLive: false,
        },
        { status: 429 },
      );
      attachGuestCookie(exhaustedRes, session);
      attachQuotaCookie(exhaustedRes, session, quotaCheck.subscription);
      return exhaustedRes;
    }

    // Detect if the user searched a country name directly in the search bar (e.g., "Brazil")
    const queryAsCountryIso = resolveCountryToIso(q);
    const regionCode = resolveCountryToIso(country) || queryAsCountryIso;
    const regionalProfile = regionCode ? REGIONAL_DISCOVERY_PROFILES[regionCode] : undefined;
    const relevanceLanguage = resolveLanguageToIso(language) || (queryAsCountryIso ? regionalProfile?.languageIso ?? null : null);

    const federated = await federatedSearch(q, {
      platform: platform && platform !== "All platforms" ? platform : undefined,
      limit: 50,
      regionCode,
      relevanceLanguage,
      maxFollowers,
      maxViews,
      extraQueries: queryAsCountryIso && regionalProfile ? regionalProfile.browseTopics : undefined,
    });

    const processed = buildFilteredCreatorsAndStatuses(
      federated.creators,
      federated.connectorStatuses,
      { category, country, language, minFollowers, maxFollowers, minLive, maxLive, minViews, maxViews },
    );

    // Charge quota ONLY if at least one real provider succeeded and returned results
    const chargeSearch = processed.succeededProviders.length > 0 && processed.filtered.length > 0;
    const latestSubscription = chargeSearch
      ? await consumeServerQuota(session)
      : quotaCheck.subscription;

    const response = NextResponse.json({
      query: q,
      total: processed.filtered.length,
      creators: processed.filtered,
      connectorStatuses: processed.finalStatuses,
      succeededProviders: processed.succeededProviders,
      failedProviders: processed.failedProviders,
      unconfiguredProviders: processed.unconfiguredProviders,
      unsupportedProviders: processed.unsupportedProviders,
      chargeSearch,
      subscription: latestSubscription,
      source: "Live Channel Discovery",
      isLive: true,
    });

    attachGuestCookie(response, session);
    attachQuotaCookie(response, session, latestSubscription);
    return response;
  }

  // 2. Server-cached live browse feed (populates /discover on load & filter browse without charging user quota)
  if (browse) {
    const quotaCheck = await checkServerQuotaAvailable(session);
    const browseData = await getLiveBrowseCreators({
      platform,
      category,
      country,
      language,
      maxFollowers,
      maxViews,
    });

    const processed = buildFilteredCreatorsAndStatuses(
      browseData.creators,
      browseData.connectorStatuses,
      { category, country, language, minFollowers, maxFollowers, minLive, maxLive, minViews, maxViews },
    );

    const browseRes = NextResponse.json({
      query: "",
      total: processed.filtered.length,
      creators: processed.filtered,
      connectorStatuses: processed.finalStatuses,
      succeededProviders: processed.succeededProviders,
      failedProviders: processed.failedProviders,
      unconfiguredProviders: processed.unconfiguredProviders,
      unsupportedProviders: processed.unsupportedProviders,
      chargeSearch: false,
      subscription: quotaCheck.subscription,
      source: "Live Channel Directory",
      isLive: false,
      isBrowse: true,
    });
    attachGuestCookie(browseRes, session);
    return browseRes;
  }

  // 3. No query & not browse: guests get 0 saved creators; signed-in users get their workspace's saved creators
  if (!session.authenticated || !session.userId) {
    const guestRes = NextResponse.json({
      query: "",
      total: 0,
      creators: [],
      source: "Guest Sandbox (Read-Only)",
      isLive: false,
    });
    attachGuestCookie(guestRes, session);
    return guestRes;
  }

  const { creators: userSavedCreators } = await loadUserAccountData(session.userId);
  return NextResponse.json(
    {
      query: "",
      total: userSavedCreators.length,
      creators: userSavedCreators,
      source: "Authenticated User Workspace",
      isLive: false,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  try {
    const session = await resolveServerSession(request);
    if (!session.authenticated || !session.userId) {
      return NextResponse.json(
        { error: "Unauthorized: Valid account sign-in required. Guest sandbox sessions cannot save creators." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as Partial<Creator> & { listId?: string };
    if (!body.name || !body.accounts || body.accounts.length === 0) {
      return NextResponse.json(
        { error: "Creator name and at least one platform account are required." },
        { status: 400 },
      );
    }

    const newCreator: Creator = {
      id: body.id || `creator-${Date.now()}`,
      name: body.name,
      category: body.category ?? "General",
      language: body.language ?? null,
      creatorCountry: body.creatorCountry ?? null,
      creatorCountrySource: body.creatorCountrySource ?? "Public Channel Profile",
      bio: body.bio ?? "",
      avatar: body.avatar ?? "",
      businessContact: body.businessContact ?? null,
      accounts: body.accounts,
      audienceInsights: body.audienceInsights || [],
    };

    await saveCreatorsToSupabase([newCreator]);

    // Link saved creator strictly into this user's own shortlist so other accounts never see it
    const userData = await loadUserAccountData(session.userId);
    const targetList =
      (body.listId && userData.lists.find((l) => l.id === body.listId)) || userData.lists[0];
    const updatedLists = userData.lists.map((list) =>
      list.id === targetList.id && !list.creatorIds.includes(newCreator.id)
        ? {
            ...list,
            creatorIds: [...list.creatorIds, newCreator.id],
            statuses: { ...list.statuses, [newCreator.id]: "To review" as const },
          }
        : list,
    );
    await syncUserListsToSupabase(session.userId, updatedLists, [newCreator]);

    return NextResponse.json({
      success: true,
      creator: newCreator,
    });
  } catch (error) {
    console.error("[creators POST] unexpected error:", error);
    return NextResponse.json(
      { error: "Unable to save creator right now." },
      { status: 500 },
    );
  }
}
