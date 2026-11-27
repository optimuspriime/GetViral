"use client";

import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseConfig(): { url: string; key: string } {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  };
}

export function saveSupabaseConfig() {
  // Public browser clients strictly use server-provisioned build config.
}

export function getSupabaseBrowserClient() {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  client ??= createBrowserClient(url, key);
  return client;
}
