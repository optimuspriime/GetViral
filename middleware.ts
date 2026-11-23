import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Public routes that are always accessible without logging in
const PUBLIC_PREFIXES = [
  "/auth",
  "/api",
  "/discover",
  "/creators",
  "/_next",
  "/favicon.ico",
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Allow root and public routes
  if (
    pathname === "/" ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.next({ request });
  }

  // 2. Check workspace cookie first for fast access
  const workspaceCookie = request.cookies.get("mosaic_user_session");
  if (workspaceCookie && workspaceCookie.value) {
    return NextResponse.next({ request });
  }

  // 3. Allow seamless guest exploration for any visitor (auto-assigns guest session cookie)
  const guestResponse = NextResponse.next({ request });
  guestResponse.cookies.set("mosaic_user_session", "guest@mosaicscout.com", {
    path: "/",
    maxAge: 2592000,
    sameSite: "lax",
  });
  return guestResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
