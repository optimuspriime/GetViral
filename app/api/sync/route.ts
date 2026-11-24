import { NextResponse } from "next/server";
import { fetchAllLiveCreators } from "@/lib/api-fetcher";
import { saveCreatorsToSupabase, testSupabaseConnection } from "@/lib/supabase/db-sync";

export async function POST(request: Request) {
  const syncTimestamp = new Date().toISOString();

  // Enforce server-side authorization: Reject guest or unauthenticated write attempts
  const cookieHeader = request.headers.get("cookie") || "";
  const isGuestCookie =
    cookieHeader.includes("mosaic_user_session=guest") ||
    cookieHeader.includes("mosaic_user_session=demo-guest") ||
    cookieHeader.includes("guest%40getviral.io") ||
    cookieHeader.includes("demo-guest%40getviral.io") ||
    cookieHeader.includes("guest%40mosaicscout.com");
  const hasSessionCookie = cookieHeader.includes("mosaic_user_session=");

  if (isGuestCookie || !hasSessionCookie) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Workspace owner or admin sign-in required to trigger platform sync.",
      },
      { status: 401 },
    );
  }

  try {
    // 1. Automatically fetch live data from platform APIs (Kick, YouTube, Twitch)
    const { creators: liveCreators, stats } = await fetchAllLiveCreators();

    // 2. Test Supabase Database Connection
    const dbStatus = await testSupabaseConnection();
    let savedToDb = false;

    if (dbStatus.connected && dbStatus.tableExists) {
      // Upsert the newly fetched live creators into Supabase
      if (liveCreators.length > 0) {
        const saveRes = await saveCreatorsToSupabase(liveCreators);
        savedToDb = saveRes.success;
      }
    }

    return NextResponse.json({
      success: true,
      syncedAt: syncTimestamp,
      stats,
      creators: liveCreators,
      database: {
        connected: dbStatus.connected,
        tableExists: dbStatus.tableExists,
        savedToDb,
        message: dbStatus.message,
      },
      message: `Automatically synchronized ${stats.totalSynced} creators live from Kick, YouTube & Twitch APIs!`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        syncedAt: syncTimestamp,
        error: error instanceof Error ? error.message : "Sync error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Platform sync requires an authorized POST request from a workspace owner or admin session.",
  });
}
