import { NextResponse } from "next/server";
import { attachGuestCookie, resolveServerSession, type ServerSession } from "@/lib/auth/server-session";
import { decryptJsonValue, encryptJsonValue, parseCookieValue } from "@/lib/auth/tokens";
import {
  type StoredYouTubeOAuthConnection,
  YT_ANALYTICS_CONN_COOKIE,
  buildAuthorizedCreatorRecord,
  fetchOwnedYouTubeChannel,
  fetchYouTubeAnalyticsReport,
  refreshGoogleAccessToken,
  resolveGoogleOAuthCredentials,
} from "@/lib/connectors/youtube-analytics";
import {
  loadUserAccountData,
  saveCreatorsToSupabase,
  syncUserListsToSupabase,
} from "@/lib/supabase/db-sync";
import { sanitizePublicErrorMessage } from "@/lib/server-sanitize";

function normalizeDays(raw: string | number | null | undefined): 7 | 28 | 90 {
  const num = Number(raw);
  if (num === 7) return 7;
  if (num === 90) return 90;
  return 28;
}

async function resolveActiveConnection(session: ServerSession): Promise<{
  conn: StoredYouTubeOAuthConnection | null;
  refreshed: boolean;
}> {
  const raw = parseCookieValue(session.cookieHeader, YT_ANALYTICS_CONN_COOKIE);
  const conn = decryptJsonValue<StoredYouTubeOAuthConnection>(raw);
  if (!conn || conn.ownerKey !== session.quotaKey) {
    return { conn: null, refreshed: false };
  }

  if (Date.now() < conn.expiresAt - 60_000) {
    return { conn, refreshed: false };
  }

  const creds = resolveGoogleOAuthCredentials();
  if (!creds || !conn.refreshToken) {
    return { conn: null, refreshed: false };
  }

  const fresh = await refreshGoogleAccessToken(conn.refreshToken, creds);
  return {
    conn: {
      ...conn,
      accessToken: fresh.accessToken,
      expiresAt: fresh.expiresAt,
    },
    refreshed: true,
  };
}

function attachUpdatedConnCookie(res: NextResponse, conn: StoredYouTubeOAuthConnection) {
  res.cookies.set(YT_ANALYTICS_CONN_COOKIE, encryptJsonValue(conn), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = normalizeDays(searchParams.get("days"));
  const session = await resolveServerSession(request);
  const oauthConfigured = Boolean(resolveGoogleOAuthCredentials());

  try {
    const { conn, refreshed } = await resolveActiveConnection(session);
    if (!conn) {
      const res = NextResponse.json(
        {
          connected: false,
          oauthConfigured,
          rangeDays: days,
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
      attachGuestCookie(res, session);
      return res;
    }

    const channel = await fetchOwnedYouTubeChannel(conn.accessToken);
    const report = await fetchYouTubeAnalyticsReport(conn.accessToken, channel, days);
    const creatorRecord = buildAuthorizedCreatorRecord(report);

    const res = NextResponse.json(
      {
        connected: true,
        oauthConfigured,
        connectedAt: conn.connectedAt,
        rangeDays: days,
        channel,
        report,
        creatorRecord,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
    attachGuestCookie(res, session);
    if (refreshed) {
      attachUpdatedConnCookie(res, conn);
    }
    return res;
  } catch (err) {
    const safeError = sanitizePublicErrorMessage(
      err instanceof Error ? err.message : undefined,
      "YouTube",
      "Unable to retrieve authorized channel analytics right now.",
    );
    const res = NextResponse.json(
      {
        connected: false,
        oauthConfigured,
        requiresReconnect: true,
        error: safeError,
      },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
    attachGuestCookie(res, session);
    return res;
  }
}

export async function POST(request: Request) {
  const session = await resolveServerSession(request);
  const oauthConfigured = Boolean(resolveGoogleOAuthCredentials());

  if (!oauthConfigured) {
    return NextResponse.json({ error: "Channel authorization is unavailable." }, { status: 400 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { days?: number };
    const days = normalizeDays(body.days);
    const { conn, refreshed } = await resolveActiveConnection(session);

    if (!conn) {
      return NextResponse.json(
        { error: "Connect your YouTube channel first to sync verified insights." },
        { status: 401 },
      );
    }

    const channel = await fetchOwnedYouTubeChannel(conn.accessToken);
    const report = await fetchYouTubeAnalyticsReport(conn.accessToken, channel, days);
    const creatorRecord = buildAuthorizedCreatorRecord(report);

    let syncedToCloud = false;
    if (session.authenticated && session.userId) {
      const saveRes = await saveCreatorsToSupabase([creatorRecord]);
      const userData = await loadUserAccountData(session.userId);
      const targetList = userData.lists[0];
      if (targetList && !targetList.creatorIds.includes(creatorRecord.id)) {
        const updatedLists = userData.lists.map((l) =>
          l.id === targetList.id
            ? {
                ...l,
                creatorIds: [...l.creatorIds, creatorRecord.id],
                statuses: { ...l.statuses, [creatorRecord.id]: "Shortlisted" as const },
              }
            : l,
        );
        await syncUserListsToSupabase(session.userId, updatedLists, [creatorRecord]);
      }
      syncedToCloud = saveRes.success;
    }

    const res = NextResponse.json(
      {
        success: true,
        syncedToCloud,
        requiresSignInForCloud: !session.authenticated,
        creatorRecord,
        report,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
    if (refreshed) {
      attachUpdatedConnCookie(res, conn);
    }
    return res;
  } catch (err) {
    const safeError = sanitizePublicErrorMessage(
      err instanceof Error ? err.message : undefined,
      "YouTube",
      "Unable to sync authorized creator profile right now.",
    );
    return NextResponse.json({ error: safeError }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json(
    { connected: false, disconnected: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  res.cookies.set(YT_ANALYTICS_CONN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
