import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { attachGuestCookie, resolveServerSession } from "@/lib/auth/server-session";
import { signValue } from "@/lib/auth/tokens";
import {
  YT_OAUTH_STATE_COOKIE,
  buildGoogleOAuthAuthorizeUrl,
  getGoogleOAuthRedirectUri,
  resolveGoogleOAuthCredentials,
} from "@/lib/connectors/youtube-analytics";

function safeReturnPath(raw: string | null): string {
  if (!raw) return "/analytics";
  if (/^\/[a-zA-Z0-9/_-]*$/.test(raw) && !raw.startsWith("//")) {
    return raw;
  }
  return "/analytics";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const returnTo = safeReturnPath(searchParams.get("returnTo"));
  const session = await resolveServerSession(request);
  const creds = resolveGoogleOAuthCredentials();

  if (!creds) {
    const errRes = NextResponse.redirect(
      new URL(`${returnTo}?oauth_error=${encodeURIComponent("YouTube channel authorization is not configured on this server.")}`, origin),
    );
    attachGuestCookie(errRes, session);
    return errRes;
  }

  const nonce = randomUUID();
  const statePayload = JSON.stringify({
    nonce,
    ownerKey: session.quotaKey,
    returnTo,
    ts: Date.now(),
  });
  const signedState = signValue(statePayload);
  const redirectUri = getGoogleOAuthRedirectUri(request.url);
  const authorizeUrl = buildGoogleOAuthAuthorizeUrl(redirectUri, nonce, creds);

  const res = NextResponse.redirect(authorizeUrl);
  attachGuestCookie(res, session);
  res.cookies.set(YT_OAUTH_STATE_COOKIE, signedState, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
  });
  return res;
}
