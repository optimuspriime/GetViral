import { NextResponse } from "next/server";
import { refreshSavedCreatorsFromConnectors } from "@/lib/api-fetcher";
import {
  loadUserAccountData,
  saveCreatorsToSupabase,
  testSupabaseConnection,
} from "@/lib/supabase/db-sync";
import { resolveServerSession } from "@/lib/auth/server-session";

export async function POST(request: Request) {
  const syncTimestamp = new Date().toISOString();

  // Require real verified authentication on the server
  const session = await resolveServerSession(request);
  if (!session.authenticated || !session.userId) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Signed-in workspace account required to trigger platform sync.",
      },
      { status: 401 },
    );
  }

  try {
    // 1. Load ONLY this authenticated user's saved creators
    const { creators: userCreators } = await loadUserAccountData(session.userId);

    if (userCreators.length === 0) {
      return NextResponse.json({
        success: true,
        syncedAt: syncTimestamp,
        stats: {
          kickCount: 0,
          youtubeCount: 0,
          twitchCount: 0,
          unconfiguredPlatforms: [],
          unsupportedPlatforms: [],
          totalSynced: 0,
          timestamp: syncTimestamp,
        },
        creators: [],
        database: { connected: true, tableExists: true, savedToDb: false },
        message: "No saved creators in your workspace yet. Search or look up creators first, then save them to sync live metrics.",
      });
    }

    // 2. Refresh ONLY this user's saved creators from live connectors
    const { creators: refreshedCreators, stats } = await refreshSavedCreatorsFromConnectors(userCreators);

    // 3. Persist updated snapshots into Supabase
    const dbStatus = await testSupabaseConnection();
    let savedToDb = false;

    if (dbStatus.connected && dbStatus.tableExists && stats.totalSynced > 0) {
      const saveRes = await saveCreatorsToSupabase(refreshedCreators);
      savedToDb = saveRes.success;
    }

    return NextResponse.json({
      success: true,
      syncedAt: syncTimestamp,
      stats,
      creators: refreshedCreators,
      database: {
        connected: dbStatus.connected,
        tableExists: dbStatus.tableExists,
        savedToDb,
        message: dbStatus.message,
      },
      message:
        stats.totalSynced > 0
          ? `Refreshed ${stats.totalSynced} saved platform account(s) from live APIs.`
          : `Checked ${userCreators.length} saved creator(s). Configure unconfigured provider keys in Settings to refresh YouTube/Twitch accounts.`,
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
    message: "Platform sync requires an authenticated POST request.",
  });
}
