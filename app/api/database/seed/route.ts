import { NextResponse } from "next/server";
import { saveCreatorsToSupabase, testSupabaseConnection } from "@/lib/supabase/db-sync";
import { REAL_CREATORS } from "@/lib/real-creators";
import { fetchAllLiveCreators } from "@/lib/api-fetcher";

export async function POST(request: Request) {
  let body: { url?: string; key?: string; limit?: number } = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional
  }

  const override = body.url && body.key ? { url: body.url, key: body.key } : undefined;
  const dbStatus = await testSupabaseConnection(override);

  if (!dbStatus.connected) {
    return NextResponse.json(
      { success: false, message: "Database is not connected. Configure NEXT_PUBLIC_SUPABASE_URL and Keys first." },
      { status: 400 },
    );
  }

  if (!dbStatus.tableExists) {
    return NextResponse.json(
      {
        success: false,
        message: "The 'creators' table does not exist. Please run the SQL schema script in your Supabase SQL Editor first.",
      },
      { status: 400 },
    );
  }

  try {
    const limit = typeof body.limit === "number" ? body.limit : 50;

    // 1. Seed base catalog
    const baseToSeed = REAL_CREATORS.slice(0, limit);
    const baseRes = await saveCreatorsToSupabase(baseToSeed, override);

    // 2. Fetch and seed live API creators
    const { creators: liveCreators } = await fetchAllLiveCreators();
    let liveInserted = 0;
    if (liveCreators.length > 0) {
      const liveRes = await saveCreatorsToSupabase(liveCreators, override);
      liveInserted = liveRes.inserted;
    }

    return NextResponse.json({
      success: true,
      baseInserted: baseRes.inserted,
      liveApiInserted: liveInserted,
      totalInserted: baseRes.inserted + liveInserted,
      message: `Successfully populated Supabase with ${baseRes.inserted + liveInserted} creators (including live Kick & YouTube API channels)!`,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Seeding failed." },
      { status: 500 },
    );
  }
}
