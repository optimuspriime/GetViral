import { NextResponse } from "next/server";
import { INTEGRATIONS, type IntegrationHealthItem } from "@/lib/integrations";

export async function GET() {
  const hasYouTube = Boolean(process.env.YOUTUBE_DATA_API_KEY && process.env.YOUTUBE_DATA_API_KEY.trim());
  const hasTwitchId = Boolean(process.env.TWITCH_CLIENT_ID?.trim());
  const hasTwitchSecret = Boolean(process.env.TWITCH_CLIENT_SECRET?.trim());
  const hasTwitch = hasTwitchId && hasTwitchSecret;
  const hasKick = true; // Public API v2 channel endpoints active without authentication
  const hasTikTokKey = Boolean(
    process.env.TIKTOK_CLIENT_KEY?.trim() && process.env.TIKTOK_CLIENT_SECRET?.trim(),
  );
  const hasMetaApp = Boolean(
    (process.env.META_APP_ID?.trim() || process.env.INSTAGRAM_APP_ID?.trim()) &&
      (process.env.META_APP_SECRET?.trim() || process.env.INSTAGRAM_APP_SECRET?.trim()),
  );

  const integrations: IntegrationHealthItem[] = INTEGRATIONS.map((item) => {
    let connected = false;
    let mode: "active_api" | "unconfigured" | "requires_oauth" = "unconfigured";
    let connectorStatus = item.connectorStatus;
    let statusNote = item.statusNote;
    let supportsLiveDiscovery = item.supportsLiveDiscovery;
    let supportsHandleLookup = item.supportsHandleLookup;
    let availableForPublicDiscovery = false;

    if (item.platform === "YouTube") {
      connected = hasYouTube;
      mode = hasYouTube ? "active_api" : "unconfigured";
      connectorStatus = hasYouTube ? "Live API Connector Ready" : "Unconfigured (API Key Missing)";
      statusNote = hasYouTube
        ? "Official Google Data API v3 active for keyword search & channel lookup"
        : "Missing YOUTUBE_DATA_API_KEY on server — live YouTube discovery disabled";
      availableForPublicDiscovery = hasYouTube;
    } else if (item.platform === "Twitch") {
      connected = hasTwitch;
      mode = hasTwitch ? "active_api" : "unconfigured";
      connectorStatus = hasTwitch ? "Live Helix API Ready" : "Unconfigured (Twitch Credentials Missing)";
      statusNote = hasTwitch
        ? "Official Twitch Helix API active for channel search & live streams"
        : "Missing TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET on server — live Twitch discovery disabled";
      availableForPublicDiscovery = hasTwitch;
    } else if (item.platform === "Kick") {
      connected = hasKick;
      mode = "active_api";
      connectorStatus = "Direct Handle Lookup (Public API v2)";
      statusNote = "Kick Public API v2 active for exact-handle lookup (no keyword discovery)";
      supportsLiveDiscovery = false;
      supportsHandleLookup = true;
      availableForPublicDiscovery = false;
    } else if (item.platform === "TikTok") {
      connected = false; // No creator user OAuth tokens linked in app flow yet
      mode = "requires_oauth";
      connectorStatus = hasTikTokKey
        ? "Creator OAuth Flow Needed (App Configured)"
        : "Unavailable (Creator OAuth Required)";
      statusNote = hasTikTokKey
        ? "Client credentials detected, requires per-creator TikTok Login Kit OAuth authorization"
        : "Unavailable — TIKTOK_CLIENT_KEY/SECRET not configured & requires creator OAuth";
      supportsLiveDiscovery = false;
      supportsHandleLookup = false;
      availableForPublicDiscovery = false;
    } else if (item.platform === "Instagram") {
      connected = false; // No Meta Professional user OAuth tokens linked in app flow yet
      mode = "requires_oauth";
      connectorStatus = hasMetaApp
        ? "Professional OAuth Needed (App Configured)"
        : "Unavailable (Meta OAuth Required)";
      statusNote = hasMetaApp
        ? "Meta App credentials detected, requires Instagram Professional user OAuth token"
        : "Unavailable — META_APP_ID/SECRET not configured & requires Meta App Review";
      supportsLiveDiscovery = false;
      supportsHandleLookup = false;
      availableForPublicDiscovery = false;
    }

    return {
      ...item,
      connected,
      mode,
      connectorStatus,
      statusNote,
      supportsLiveDiscovery,
      supportsHandleLookup,
      availableForPublicDiscovery,
    };
  });

  const activeCount = integrations.filter((i) => i.connected).length;

  return NextResponse.json({
    status: "ok",
    activeCount,
    totalCount: integrations.length,
    integrations,
    envStatus: {
      YOUTUBE_DATA_API_KEY: hasYouTube,
      TWITCH_CLIENT_ID: hasTwitchId,
      TWITCH_CLIENT_SECRET: hasTwitchSecret,
      KICK_PUBLIC_API: hasKick,
      TIKTOK_CLIENT_KEY: hasTikTokKey,
      META_APP_ID: hasMetaApp,
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
