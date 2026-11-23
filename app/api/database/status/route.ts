import { NextResponse } from "next/server";
import { testSupabaseConnection } from "@/lib/supabase/db-sync";

export async function GET() {
  const status = await testSupabaseConnection();
  return NextResponse.json(status);
}
