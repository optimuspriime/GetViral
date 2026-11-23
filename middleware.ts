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

  // 3. Check Supabase session if credentials are set
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // In local / workspace mode without Supabase, allow access
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return response;
    }
  } catch (error) {
    console.warn("Supabase session verification error:", error);
  }

  // 4. Redirect unauthenticated requests on protected routes to /auth
  const destination = request.nextUrl.clone();
  destination.pathname = "/auth";
  destination.searchParams.set("next", pathname);
  return NextResponse.redirect(destination);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
