import { NextResponse } from "next/server";
import type { Creator, Platform } from "@/lib/model";
import { federatedSearch } from "@/lib/connectors/federated";
import { loadCreatorsFromSupabase, saveCreatorsToSupabase } from "@/lib/supabase/db-sync";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const platform = searchParams.get("platform") as Platform | "All platforms" | null;
  const category = searchParams.get("category");
  const country = searchParams.get("country");

  // 1. If query is provided, execute real federated live search across connected platform APIs
  if (q) {
    const federated = await federatedSearch(q, {
      platform: platform && platform !== "All platforms" ? platform : undefined,
      limit: 20,
    });

    // DO NOT mix catalog or saved database records into live search results.
    // Live results must strictly come from the real platform connectors.

    // Convert normalized creators into UI-compatible Creator format
    const liveAsCreators: Creator[] = federated.creators.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category || "General",
      language: c.language || "English",
      creatorCountry: c.country,
      creatorCountrySource: "Live Platform API",
      audienceInsights: [],
      bio: c.bio || `${c.name} on ${c.platform}`,
      avatar: c.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
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

    // Determine which providers succeeded, failed, or were unconfigured
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

    // Don't charge quota if every provider failed, was unconfigured, or returned 0 live results
    const chargeSearch = succeededProviders.length > 0 && filtered.length > 0;

    return NextResponse.json({
      query: q,
      total: filtered.length,
      creators: filtered,
      connectorStatuses: federated.connectorStatuses,
      succeededProviders,
      failedProviders,
      unconfiguredProviders,
      unsupportedProviders,
      chargeSearch,
      source: "Live Federated Platform Connectors",
      isLive: true,
    });
  }

  // 2. If no query is provided, return actual saved creators from user's Supabase database
  let savedCreators: Creator[] = [];
  try {
    const dbCreators = await loadCreatorsFromSupabase();
    if (dbCreators && dbCreators.length > 0) {
      savedCreators = dbCreators;
    }
  } catch {
    // Database connection fallback
  }

  return NextResponse.json({
    query: "",
    total: savedCreators.length,
    creators: savedCreators,
    source: "Saved Workspace Database",
    isLive: false,
  });
}

export async function POST(request: Request) {
  try {
    // Verify server-side authorization: Reject guest or unauthenticated write attempts
    const cookieHeader = request.headers.get("cookie") || "";
    const isGuestCookie =
      cookieHeader.includes("mosaic_user_session=guest") ||
      cookieHeader.includes("mosaic_user_session=demo-guest") ||
      cookieHeader.includes("guest%40mosaicscout.com") ||
      cookieHeader.includes("demo-guest%40mosaicscout.com");
    const hasSessionCookie = cookieHeader.includes("mosaic_user_session=");

    if (isGuestCookie || !hasSessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized: Sign-in required. Guest sandbox sessions cannot write to database." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as Partial<Creator>;
    if (!body.name || !body.accounts || body.accounts.length === 0) {
      return NextResponse.json(
        { error: "Creator name and at least one platform account are required." },
        { status: 400 },
      );
    }

    const newCreator: Creator = {
      id: body.id || `creator-user-${Date.now()}`,
      name: body.name,
      category: body.category ?? "General",
      language: body.language ?? "English",
      creatorCountry: body.creatorCountry ?? "United States",
      creatorCountrySource: "User Submission",
      bio: body.bio ?? "",
      avatar: body.avatar ?? "",
      businessContact: body.businessContact ?? null,
      accounts: body.accounts,
      audienceInsights: body.audienceInsights || [],
    };

    // Save to database
    let existing: Creator[] = [];
    try {
      existing = await loadCreatorsFromSupabase();
    } catch {}

    const updated = [newCreator, ...existing.filter((c) => c.id !== newCreator.id)];
    await saveCreatorsToSupabase(updated);

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
