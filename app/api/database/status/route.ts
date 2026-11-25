import { NextResponse } from "next/server";
import { testSupabaseConnection } from "@/lib/supabase/db-sync";
import { resolveServerSession } from "@/lib/auth/server-session";

export async function GET(request: Request) {
  const session = await resolveServerSession(request);
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Forbidden: Internal admin role required." }, { status: 403 });
  }

  const status = await testSupabaseConnection();
  return NextResponse.json(status);
}

export async function POST(request: Request) {
  const session = await resolveServerSession(request);
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Forbidden: Internal admin role required." }, { status: 403 });
  }

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
