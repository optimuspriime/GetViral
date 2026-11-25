import { NextResponse } from "next/server";
import {
  loadUserAccountData,
  saveCreatorsToSupabase,
  testSupabaseConnection,
} from "@/lib/supabase/db-sync";
import { refreshSavedCreatorsFromConnectors } from "@/lib/api-fetcher";
import { resolveServerSession } from "@/lib/auth/server-session";

export async function POST(request: Request) {
  // Enforce verified server-side authentication
  const session = await resolveServerSession(request);
  if (!session.authenticated || !session.userId) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized: Signed-in workspace account required to synchronize database.",
      },
      { status: 401 },
    );
  }

  let body: { url?: string; key?: string } = {};
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
    const { creators: userCreators } = await loadUserAccountData(session.userId);
    if (userCreators.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Database connected! You have 0 saved creators in your workspace yet — save creators from Discover to sync their metrics.",
        inserted: 0,
        table: "public.creators",
      });
    }

    const { creators: refreshed, stats } = await refreshSavedCreatorsFromConnectors(userCreators);
    let liveInserted = 0;
    if (stats.totalSynced > 0) {
      const liveRes = await saveCreatorsToSupabase(refreshed, override);
      liveInserted = liveRes.inserted;
    }

    return NextResponse.json({
      success: true,
      message: `Synchronized ${liveInserted} saved workspace creator(s) with live platform APIs!`,
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
