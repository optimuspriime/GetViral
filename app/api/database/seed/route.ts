import { NextResponse } from "next/server";
import { saveCreatorsToSupabase, testSupabaseConnection } from "@/lib/supabase/db-sync";
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
    // Fetch and sync live API creators from Kick, YouTube & Twitch
    const { creators: liveCreators } = await fetchAllLiveCreators();
    let liveInserted = 0;
    if (liveCreators.length > 0) {
      const liveRes = await saveCreatorsToSupabase(liveCreators, override);
      liveInserted = liveRes.inserted;
    }

    return NextResponse.json({
      success: true,
      message: `Database synchronized with ${liveInserted} live creator channels from platform APIs!`,
      inserted: liveInserted,
      table: "public.creators",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to sync database" },
      { status: 500 },
    );
  }
}
