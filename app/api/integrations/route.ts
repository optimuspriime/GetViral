import { NextResponse } from "next/server";
import { INTEGRATIONS } from "@/lib/integrations";

export async function GET() {
  const hasYouTube = Boolean(process.env.YOUTUBE_DATA_API_KEY && process.env.YOUTUBE_DATA_API_KEY.trim());
  const hasTwitch = Boolean(
    process.env.TWITCH_CLIENT_ID &&
    process.env.TWITCH_CLIENT_ID.trim() &&
    process.env.TWITCH_CLIENT_SECRET &&
    process.env.TWITCH_CLIENT_SECRET.trim(),
  );
  const hasKick = true; // Public API v2 channel endpoints active without authentication
  const hasTikTok = Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_KEY.trim());
  const hasInstagram = Boolean(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_ID.trim());

  const status = INTEGRATIONS.map((item) => {
    let connected = false;
    let mode: "live_verified" | "active_api" | "unconfigured" | "requires_oauth" = "unconfigured";
    let connectorStatus = item.connectorStatus;
    let statusNote = item.statusNote;

    if (item.platform === "YouTube") {
      connected = hasYouTube;
      mode = hasYouTube ? "active_api" : "unconfigured";
      connectorStatus = hasYouTube ? "Live API Connector Ready" : "Unconfigured (API Key Missing)";
      statusNote = hasYouTube
        ? "Official Google Data API v3 (Active Key)"
        : "Missing YOUTUBE_DATA_API_KEY in server environment";
    } else if (item.platform === "Twitch") {
      connected = hasTwitch;
      mode = hasTwitch ? "active_api" : "unconfigured";
      connectorStatus = hasTwitch ? "Live Helix API Ready" : "Unconfigured (Twitch Credentials Missing)";
      statusNote = hasTwitch
        ? "Official Twitch Helix API (Active Client Credentials)"
        : "Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET in server environment";
    } else if (item.platform === "Kick") {
      connected = true;
      mode = "active_api";
      connectorStatus = "Direct Handle Lookup (Public API v2)";
      statusNote = "Kick Public API v2 (Handle Lookup Active)";
    } else if (item.platform === "TikTok") {
      connected = hasTikTok;
      mode = "requires_oauth";
      connectorStatus = hasTikTok ? "Authorized Display API Active" : "Requires Creator OAuth";
      statusNote = hasTikTok
        ? "TikTok Display API Connected"
        : "Requires creator authorization token under TikTok Developer Terms";
    } else if (item.platform === "Instagram") {
      connected = hasInstagram;
      mode = "requires_oauth";
      connectorStatus = hasInstagram ? "Professional Account Graph Active" : "Requires Meta Professional Token";
      statusNote = hasInstagram
        ? "Meta Graph API Connected"
        : "Requires registered Instagram Professional Account token";
    }

    return {
      platform: item.platform,
      connected,
      mode,
      connectorStatus,
      statusNote,
      documentationUrl: item.documentationUrl,
      setup: item.setup,
      limitation: item.limitation,
      supportsLiveDiscovery: item.supportsLiveDiscovery,
      supportsHandleLookup: item.supportsHandleLookup,
    };
  });

  return NextResponse.json({
    status: "ok",
    integrations: status,
    envStatus: {
      YOUTUBE_DATA_API_KEY: hasYouTube,
      TWITCH_CLIENT_ID: Boolean(process.env.TWITCH_CLIENT_ID?.trim()),
      TWITCH_CLIENT_SECRET: Boolean(process.env.TWITCH_CLIENT_SECRET?.trim()),
      KICK_PUBLIC_API: hasKick,
      NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    },
    database: {
      configured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
      mode: process.env.NEXT_PUBLIC_SUPABASE_URL ? "supabase_cloud" : "local_workspace_persistence",
    },
  });
}
