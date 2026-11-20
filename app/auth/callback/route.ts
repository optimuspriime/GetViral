import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const client = await createSupabaseServerClient();
  if (!client || !code) {
    return NextResponse.redirect(new URL("/auth?error=callback", request.url));
  }
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Supabase auth callback failed.", error);
    return NextResponse.redirect(new URL("/auth?error=callback", request.url));
  }
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return NextResponse.redirect(new URL(destination, request.url));
}
