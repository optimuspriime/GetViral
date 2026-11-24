import { NextResponse } from "next/server";
import { loadCreatorsFromSupabase } from "@/lib/supabase/db-sync";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const dbCreators = await loadCreatorsFromSupabase();
    const creator = dbCreators.find((c) => c.id === id);
    if (!creator) {
      return NextResponse.json({ error: "Creator profile not found in saved database." }, { status: 404 });
    }
    return NextResponse.json(creator);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load creator" },
      { status: 500 },
    );
  }
}
