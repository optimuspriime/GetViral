import { NextResponse } from "next/server";
import { attachGuestCookie, resolveServerSession } from "@/lib/auth/server-session";
import { encryptJsonValue, parseCookieValue, verifySignedValue } from "@/lib/auth/tokens";
import {
  type StoredYouTubeOAuthConnection,
  YT_ANALYTICS_CONN_COOKIE,
  YT_OAUTH_STATE_COOKIE,
  exchangeCodeForGoogleTokens,
  fetchOwnedYouTubeChannel,
  getGoogleOAuthRedirectUri,
  resolveGoogleOAuthCredentials,
} from "@/lib/connectors/youtube-analytics";
import { sanitizePublicErrorMessage } from "@/lib/server-sanitize";

type OAuthStateCookie = {
  nonce: string;
  ownerKey: string;
  returnTo: string;
  ts: number;
};

function clearStateCookie(res: NextResponse) {
  res.cookies.set(YT_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const session = await resolveServerSession(request);
  const creds = resolveGoogleOAuthCredentials();

  const rawStateCookie = parseCookieValue(session.cookieHeader, YT_OAUTH_STATE_COOKIE);
  const verifiedStateJson = verifySignedValue(rawStateCookie);

  let parsedState: OAuthStateCookie | null = null;
  if (verifiedStateJson) {
    try {
      parsedState = JSON.parse(verifiedStateJson) as OAuthStateCookie;
    } catch {
      parsedState = null;
    }
  }

  const returnTo =
    parsedState?.returnTo && /^\/[a-zA-Z0-9/_-]*$/.test(parsedState.returnTo)
      ? parsedState.returnTo
      : "/analytics";

  const oauthError = searchParams.get("error");
  if (oauthError) {
    const msg =
      oauthError === "access_denied"
        ? "Authorization canceled — no channel data was connected."
        : "Unable to authorize Google channel access.";
    const res = NextResponse.redirect(
      new URL(`${returnTo}?oauth_error=${encodeURIComponent(msg)}`, origin),
    );
    clearStateCookie(res);
    return res;
  }

  const code = searchParams.get("code");
  const queryState = searchParams.get("state");

  if (
    !creds ||
    !code ||
    !queryState ||
    !parsedState ||
    parsedState.nonce !== queryState ||
    parsedState.ownerKey !== session.quotaKey ||
    Date.now() - parsedState.ts > 15 * 60 * 1000
  ) {
    const res = NextResponse.redirect(
      new URL(`${returnTo}?oauth_error=${encodeURIComponent("Authorization session expired or invalid. Please try connecting again.")}`, origin),
    );
    clearStateCookie(res);
    return res;
  }

  try {
    const redirectUri = getGoogleOAuthRedirectUri(request.url);
    const tokens = await exchangeCodeForGoogleTokens(code, redirectUri, creds);
    const channel = await fetchOwnedYouTubeChannel(tokens.accessToken);

    const connectionPayload: StoredYouTubeOAuthConnection = {
      ownerKey: session.quotaKey,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      channelId: channel.channelId,
      channelTitle: channel.title,
      channelHandle: channel.handle,
      connectedAt: new Date().toISOString(),
    };

    const successUrl = new URL(`${returnTo}?connected=1`, origin);
    const res = NextResponse.redirect(successUrl);
    attachGuestCookie(res, session);
    clearStateCookie(res);
    res.cookies.set(YT_ANALYTICS_CONN_COOKIE, encryptJsonValue(connectionPayload), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    const safeMsg = sanitizePublicErrorMessage(
      err instanceof Error ? err.message : undefined,
      "YouTube",
      "Could not complete YouTube channel connection.",
    );
    const res = NextResponse.redirect(
      new URL(`${returnTo}?oauth_error=${encodeURIComponent(safeMsg)}`, origin),
    );
    clearStateCookie(res);
    return res;
  }
}
