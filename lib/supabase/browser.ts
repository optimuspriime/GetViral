"use client";

import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseConfig(): { url: string; key: string } {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (typeof window !== "undefined") {
    if (!url) url = window.localStorage.getItem("mosaic_supabase_url") || "";
    if (!key) key = window.localStorage.getItem("mosaic_supabase_anon_key") || "";
  }
  return { url, key };
}

export function saveSupabaseConfig(url: string, key: string) {
  if (typeof window !== "undefined") {
    if (url.trim()) {
      window.localStorage.setItem("mosaic_supabase_url", url.trim());
    } else {
      window.localStorage.removeItem("mosaic_supabase_url");
    }
    if (key.trim()) {
      window.localStorage.setItem("mosaic_supabase_anon_key", key.trim());
    } else {
      window.localStorage.removeItem("mosaic_supabase_anon_key");
    }
    client = null;
  }
}

export function getSupabaseBrowserClient() {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  client ??= createBrowserClient(url, key);
  return client;
}
