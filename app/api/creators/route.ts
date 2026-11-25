import { NextResponse } from "next/server";
import type { Creator, Platform } from "@/lib/model";
import { federatedSearch } from "@/lib/connectors/federated";
import { loadUserAccountData, saveCreatorsToSupabase, syncUserListsToSupabase } from "@/lib/supabase/db-sync";
import { attachGuestCookie, resolveServerSession } from "@/lib/auth/server-session";
import {
  attachQuotaCookie,
  checkServerQuotaAvailable,
  consumeServerQuota,
} from "@/lib/quota/server-quota";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const platform = searchParams.get("platform") as Platform | "All platforms" | null;
  const category = searchParams.get("category");
  const country = searchParams.get("country");

  const session = await resolveServerSession(request);

  // 1. If query is provided, enforce server-side quota BEFORE running live federated search
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
          source: "Live Platform Discovery",
          isLive: false,
        },
        { status: 429 },
      );
      attachGuestCookie(exhaustedRes, session);
      attachQuotaCookie(exhaustedRes, session, quotaCheck.subscription);
      return exhaustedRes;
    }

    const federated = await federatedSearch(q, {
      platform: platform && platform !== "All platforms" ? platform : undefined,
      limit: 20,
    });

    // Live results must strictly come from real platform connectors (never mixed with DB/seed rows)
    const liveAsCreators: Creator[] = federated.creators.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category || "General",
      language: c.language || "English",
      creatorCountry: c.country,
      creatorCountrySource: c.country ? "Live Platform API" : null,
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
                    source: c.source,
                    status: "public" as const,
                  },
                ]
              : []),
            ...(c.reach !== null
              ? [
                  {
                    id: `snap-${c.id}-reach`,
                    metricName: c.reachMetric || "avg_views",
                    value: c.reach,
                    unit: c.reachMetric === "avg_live_viewers" ? ("count" as const) : ("views" as const),
                    collectedAt: c.fetchedAt,
                    windowStart: null,
                    windowEnd: null,
                    periodLabel: c.isLiveStream ? "Current live stream" : "Recent content",
                    sampleSize: 10,
                    source: c.source,
                    status: "public" as const,
                  },
                ]
              : []),
          ],
        },
      ],
    }));

    let filtered = liveAsCreators;

    if (category && category !== "All categories") {
      filtered = filtered.filter((c) => c.category === category);
    }

    if (country) {
      filtered = filtered.filter((c) =>
        c.creatorCountry?.toLowerCase().includes(country.toLowerCase()),
      );
    }

    const succeededProviders: Platform[] = [];
    const failedProviders: Platform[] = [];
    const unconfiguredProviders: Platform[] = [];
    const unsupportedProviders: Platform[] = [];

    (Object.entries(federated.connectorStatuses) as [Platform, typeof federated.connectorStatuses[Platform]][]).forEach(
      ([p, statusObj]) => {
        if (statusObj.status === "success") {
          succeededProviders.push(p);
        } else if (statusObj.status === "error" || statusObj.status === "rate_limited") {
          failedProviders.push(p);
        } else if (statusObj.status === "unconfigured") {
          unconfiguredProviders.push(p);
        } else if (statusObj.status === "unsupported_operation") {
          unsupportedProviders.push(p);
        }
      },
    );

    // Charge quota ONLY if at least one real provider succeeded and returned live results
    const chargeSearch = succeededProviders.length > 0 && filtered.length > 0;
    const latestSubscription = chargeSearch
      ? await consumeServerQuota(session)
      : quotaCheck.subscription;

    // Sanitize internal server configuration details for non-admin callers
    const publicStatuses = session.isAdmin
      ? federated.connectorStatuses
      : Object.fromEntries(
          (
            Object.entries(federated.connectorStatuses) as [
              Platform,
              typeof federated.connectorStatuses[Platform],
            ][]
          ).map(([p, statusObj]) => [
            p,
            {
              ...statusObj,
              message:
                statusObj.status === "unconfigured"
                  ? `${p} live search is temporarily pending activation.`
                  : statusObj.message,
              capabilities: {
                ...statusObj.capabilities,
                authorizationRequirement: statusObj.capabilities.requiresApiKey
                  ? `Managed server integration for ${p}.`
                  : statusObj.capabilities.authorizationRequirement,
              },
            },
          ]),
        );

    const response = NextResponse.json({
      query: q,
      total: filtered.length,
      creators: filtered,
      connectorStatuses: publicStatuses,
      succeededProviders,
      failedProviders,
      unconfiguredProviders,
      unsupportedProviders,
      chargeSearch,
      subscription: latestSubscription,
      source: "Live Platform Discovery",
      isLive: true,
    });

    attachGuestCookie(response, session);
    attachQuotaCookie(response, session, latestSubscription);
    return response;
  }

  // 2. If no query is provided: guests get 0 creators; signed-in users get ONLY their account's saved creators
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
  return NextResponse.json({
    query: "",
    total: userSavedCreators.length,
    creators: userSavedCreators,
    source: "Authenticated User Workspace",
    isLive: false,
  });
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
      language: body.language ?? "English",
      creatorCountry: body.creatorCountry ?? null,
      creatorCountrySource: body.creatorCountrySource ?? "Platform API",
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save creator" },
      { status: 500 },
    );
  }
}
