import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  GUEST_COOKIE_NAME,
  createSignedGuestToken,
  hashClientIp,
  isAdminEmail,
  parseCookieValue,
  verifySignedValue,
} from "./tokens";

export interface ServerSession {
  authenticated: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  userId: string | null;
  email: string | null;
  quotaKey: string;
  cookieHeader: string;
  newlyMintedGuestCookie?: string;
}

function extractClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || null;
}

/**
 * Resolves the caller's verified identity on the server.
 * Authenticated users receive a canonical userId & isAdmin flag.
 * Guests receive an IP-hashed (and signed cookie backed) quotaKey so clearing cookies cannot reset preview quota.
 */
export async function resolveServerSession(request: Request): Promise<ServerSession> {
  const cookieHeader = request.headers.get("cookie") || "";
  const authHeader = request.headers.get("authorization") || "";
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const bearerToken = bearerMatch?.[1]?.trim();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anonKey) {
    try {
      if (bearerToken) {
        const directClient = createClient(url, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data } = await directClient.auth.getUser(bearerToken);
        if (data?.user?.id) {
          const email = data.user.email ?? null;
          return {
            authenticated: true,
            isGuest: false,
            isAdmin: isAdminEmail(email),
            userId: data.user.id,
            email,
            quotaKey: data.user.id,
            cookieHeader,
          };
        }
      }

      const serverClient = await createSupabaseServerClient();
      if (serverClient) {
        const { data, error } = await serverClient.auth.getUser();
        if (!error && data?.user?.id) {
          const email = data.user.email ?? null;
          return {
            authenticated: true,
            isGuest: false,
            isAdmin: isAdminEmail(email),
            userId: data.user.id,
            email,
            quotaKey: data.user.id,
            cookieHeader,
          };
        }
      }
    } catch {
      // Fall through cleanly to guest state
    }
  }

  // Unauthenticated Guest: prefer hashed IP for persistent server rate limit, backed by signed HTTPOnly cookie
  const clientIp = extractClientIp(request);
  const existingSignedGuest = parseCookieValue(cookieHeader, GUEST_COOKIE_NAME);
  const verifiedGuestId = verifySignedValue(existingSignedGuest);

  const guestCookieId = verifiedGuestId && verifiedGuestId.startsWith("guest:")
    ? verifiedGuestId
    : null;
  const minted = guestCookieId ? null : createSignedGuestToken();

  const quotaKey = clientIp
    ? `guest-ip:${hashClientIp(clientIp)}`
    : guestCookieId || minted!.guestId;

  return {
    authenticated: false,
    isGuest: true,
    isAdmin: false,
    userId: null,
    email: null,
    quotaKey,
    cookieHeader,
    newlyMintedGuestCookie: minted?.signedToken,
  };
}

export function attachGuestCookie(response: NextResponse, session: ServerSession): void {
  if (session.newlyMintedGuestCookie) {
    response.cookies.set(GUEST_COOKIE_NAME, session.newlyMintedGuestCookie, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}
