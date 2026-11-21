import { NextResponse } from "next/server";
import { INTEGRATIONS } from "@/lib/integrations";

export async function GET() {
  const status = INTEGRATIONS.map((item) => {
    let connected = false;
    let mode: "live_verified" | "active_api" | "ready" = "live_verified";

    if (item.platform === "YouTube") {
      connected = true;
      mode = process.env.YOUTUBE_DATA_API_KEY ? "active_api" : "live_verified";
    } else if (item.platform === "Twitch") {
      connected = true;
      mode = process.env.TWITCH_CLIENT_ID ? "active_api" : "live_verified";
    } else if (item.platform === "Kick") {
      connected = true;
      mode = "active_api";
    } else if (item.platform === "TikTok" || item.platform === "Instagram") {
      connected = true;
      mode = "live_verified";
    }

    return {
      platform: item.platform,
      connected,
      mode,
      documentationUrl: item.documentationUrl,
      setup: item.setup,
      limitation: item.limitation,
    };
  });

  return NextResponse.json({
    status: "ok",
    integrations: status,
    database: {
      configured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
      mode: process.env.NEXT_PUBLIC_SUPABASE_URL ? "supabase_cloud" : "local_workspace_persistence",
    },
  });
}
