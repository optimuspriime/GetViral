import { NextResponse } from "next/server";
import {
  loadUserAccountData,
  saveCreatorsToSupabase,
  testSupabaseConnection,
} from "@/lib/supabase/db-sync";
import { refreshSavedCreatorsFromConnectors } from "@/lib/api-fetcher";
import { resolveServerSession } from "@/lib/auth/server-session";

export async function POST(request: Request) {
  const session = await resolveServerSession(request);
  if (!session.authenticated || !session.userId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized: Signed-in admin account required." },
      { status: 401 },
    );
  }
  if (!session.isAdmin) {
    return NextResponse.json(
      { success: false, message: "Forbidden: Internal admin role required for database operations." },
      { status: 403 },
    );
  }

  let body: { url?: string; key?: string } = {};
  try {
    body = await request.json();
  } catch {}

  const override = body.url && body.key ? { url: body.url, key: body.key } : undefined;
  const dbStatus = await testSupabaseConnection(override);

  if (!dbStatus.connected) {
    return NextResponse.json(
      { success: false, message: "Database is not connected." },
      { status: 400 },
    );
  }

  if (!dbStatus.tableExists) {
    return NextResponse.json(
      { success: false, message: "Required database tables have not been created yet." },
      { status: 400 },
    );
  }

  try {
    const { creators: userCreators } = await loadUserAccountData(session.userId);
    if (userCreators.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Database connected! Save creators from Discover first to refresh their records.",
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
      message: `Synchronized ${liveInserted} saved creator(s) with live channels!`,
      inserted: liveInserted,
      table: "public.creators",
    });
  } catch (error) {
    console.error("[database/seed] unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to complete database refresh right now." },
      { status: 500 },
    );
  }
}
