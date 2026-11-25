import { NextResponse } from "next/server";
import { resolveServerSession, attachGuestCookie } from "@/lib/auth/server-session";
import { loadUserAccountData, syncUserListsToSupabase } from "@/lib/supabase/db-sync";
import type { Creator, ProspectList } from "@/lib/model";

export async function GET(request: Request) {
  const session = await resolveServerSession(request);

  if (!session.authenticated || !session.userId) {
    const response = NextResponse.json({
      authenticated: false,
      isGuest: true,
      lists: [
        {
          id: "list-default-shortlist",
          name: "Campaign Prospects Shortlist",
          creatorIds: [],
          notes: {},
          tags: {},
          statuses: {},
        },
      ],
      creators: [],
    });
    attachGuestCookie(response, session);
    return response;
  }

  const { lists, creators } = await loadUserAccountData(session.userId);
  return NextResponse.json({
    authenticated: true,
    isGuest: false,
    userId: session.userId,
    lists,
    creators,
  });
}

export async function POST(request: Request) {
  const session = await resolveServerSession(request);

  if (!session.authenticated || !session.userId) {
    return NextResponse.json(
      { error: "Unauthorized: Sign-in required to modify workspace shortlists." },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as {
      lists?: ProspectList[];
      creators?: Creator[];
    };

    if (!Array.isArray(body.lists)) {
      return NextResponse.json({ error: "lists array is required." }, { status: 400 });
    }

    const res = await syncUserListsToSupabase(session.userId, body.lists, body.creators);
    if (!res.success) {
      return NextResponse.json({ error: res.error || "Sync failed" }, { status: 500 });
    }

    const updated = await loadUserAccountData(session.userId);
    return NextResponse.json({
      success: true,
      lists: updated.lists,
      creators: updated.creators,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save shortlists" },
      { status: 500 },
    );
  }
}
