import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  GUEST_COOKIE_NAME,
  createSignedGuestToken,
  parseCookieValue,
  verifySignedValue,
} from "./tokens";

export interface ServerSession {
  authenticated: boolean;
  isGuest: boolean;
  userId: string | null;
  email: string | null;
  quotaKey: string;
  cookieHeader: string;
  newlyMintedGuestCookie?: string;
}

/**
 * Resolves the caller's verified identity on the server.
 * Never trusts unsigned client cookies (like mosaic_user_session) for authentication or account access.
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
      // 1. Check Bearer JWT if supplied (useful for API clients & tests)
      if (bearerToken) {
        const directClient = createClient(url, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data } = await directClient.auth.getUser(bearerToken);
        if (data?.user?.id) {
          return {
            authenticated: true,
            isGuest: false,
            userId: data.user.id,
            email: data.user.email ?? null,
            quotaKey: data.user.id,
            cookieHeader,
          };
        }
      }

      // 2. Check HTTP cookies managed by @supabase/ssr
      const serverClient = await createSupabaseServerClient();
      if (serverClient) {
        const { data, error } = await serverClient.auth.getUser();
        if (!error && data?.user?.id) {
          return {
            authenticated: true,
            isGuest: false,
            userId: data.user.id,
            email: data.user.email ?? null,
            quotaKey: data.user.id,
            cookieHeader,
          };
        }
      }
    } catch {
      // Fall through cleanly to anonymous guest state without throwing on missing session
    }
  }

  // 3. Unauthenticated / Guest visitor: validate or mint an HMAC-signed HTTPOnly guest ID
  const existingSignedGuest = parseCookieValue(cookieHeader, GUEST_COOKIE_NAME);
  const verifiedGuestId = verifySignedValue(existingSignedGuest);

  if (verifiedGuestId && verifiedGuestId.startsWith("guest:")) {
    return {
      authenticated: false,
      isGuest: true,
      userId: null,
      email: null,
      quotaKey: verifiedGuestId,
      cookieHeader,
    };
  }

  const minted = createSignedGuestToken();
  return {
    authenticated: false,
    isGuest: true,
    userId: null,
    email: null,
    quotaKey: minted.guestId,
    cookieHeader,
    newlyMintedGuestCookie: minted.signedToken,
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
