import { NextResponse } from "next/server";
import { resolveServerSession } from "@/lib/auth/server-session";
import { isCreatorOwnedByUser, loadCreatorsFromSupabase } from "@/lib/supabase/db-sync";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await resolveServerSession(request);

  if (!session.authenticated || !session.userId) {
    return NextResponse.json(
      { error: "Unauthorized: Sign-in required to access saved workspace creators." },
      { status: 401 },
    );
  }

  try {
    const owned = await isCreatorOwnedByUser(session.userId, id);
    if (!owned) {
      return NextResponse.json(
        { error: "Creator profile not found in your saved workspace." },
        { status: 404 },
      );
    }

    const dbCreators = await loadCreatorsFromSupabase(undefined, [id]);
    const creator = dbCreators.find((c) => c.id === id);
    if (!creator) {
      return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
    }
    return NextResponse.json(creator, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    console.error("[creators/[id]] error:", err);
    return NextResponse.json(
      { error: "Unable to load creator profile right now." },
      { status: 500 },
    );
  }
}
