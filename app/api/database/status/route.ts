import { NextResponse } from "next/server";
import { testSupabaseConnection } from "@/lib/supabase/db-sync";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") || undefined;
  const key = searchParams.get("key") || undefined;
  const status = await testSupabaseConnection(url && key ? { url, key } : undefined);
  return NextResponse.json(status);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = body.url || undefined;
    const key = body.key || undefined;
    const status = await testSupabaseConnection(url && key ? { url, key } : undefined);
    return NextResponse.json(status);
  } catch {
    const status = await testSupabaseConnection();
    return NextResponse.json(status);
  }
}
