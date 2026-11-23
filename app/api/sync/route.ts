import { NextResponse } from "next/server";
import { fetchAllLiveCreators } from "@/lib/api-fetcher";
import { saveCreatorsToSupabase, testSupabaseConnection } from "@/lib/supabase/db-sync";
import { REAL_CREATORS } from "@/lib/real-creators";

export async function POST() {
  const syncTimestamp = new Date().toISOString();

  try {
    // 1. Automatically fetch live data from platform APIs (Kick, YouTube, Twitch)
    const { creators: liveCreators, stats } = await fetchAllLiveCreators();

    // 2. Test Supabase Database Connection
    const dbStatus = await testSupabaseConnection();
    let savedToDb = false;

    if (dbStatus.connected && dbStatus.tableExists) {
      // If database is empty, seed it with the core catalog first
      if (dbStatus.creatorCount === 0) {
        await saveCreatorsToSupabase(REAL_CREATORS.slice(0, 50));
      }

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
  return POST();
}
