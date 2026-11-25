import { NextResponse } from "next/server";
import { INTEGRATIONS, type IntegrationHealthItem } from "@/lib/integrations";
import { resolveServerSession } from "@/lib/auth/server-session";

export async function GET(request: Request) {
  const session = await resolveServerSession(request);

  const hasYouTube = Boolean(process.env.YOUTUBE_DATA_API_KEY && process.env.YOUTUBE_DATA_API_KEY.trim());
  const hasTwitchId = Boolean(process.env.TWITCH_CLIENT_ID?.trim());
  const hasTwitchSecret = Boolean(process.env.TWITCH_CLIENT_SECRET?.trim());
  const hasTwitch = hasTwitchId && hasTwitchSecret;
  const hasKick = true;
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
      connectorStatus = hasYouTube ? "Live Search Active" : "Service Pending";
      statusNote = hasYouTube
        ? "Live channel discovery & public statistics active"
        : "YouTube live search is currently disabled (activation pending)";
      availableForPublicDiscovery = hasYouTube;
    } else if (item.platform === "Twitch") {
      connected = hasTwitch;
      mode = hasTwitch ? "active_api" : "unconfigured";
      connectorStatus = hasTwitch ? "Live Search Active" : "Service Pending";
      statusNote = hasTwitch
        ? "Live channel discovery & viewer metrics active"
        : "Twitch live search is currently disabled (activation pending)";
      availableForPublicDiscovery = hasTwitch;
    } else if (item.platform === "Kick") {
      connected = hasKick;
      mode = "active_api";
      connectorStatus = "Handle Lookup Active";
      statusNote = "Exact @handle lookup active (single-word channels only)";
      supportsLiveDiscovery = false;
      supportsHandleLookup = true;
      availableForPublicDiscovery = false;
    } else if (item.platform === "TikTok") {
      connected = false;
      mode = "requires_oauth";
      connectorStatus = "OAuth Required";
      statusNote = "Requires TikTok Creator OAuth";
      supportsLiveDiscovery = false;
      supportsHandleLookup = false;
      availableForPublicDiscovery = false;
    } else if (item.platform === "Instagram") {
      connected = false;
      mode = "requires_oauth";
      connectorStatus = "OAuth Required";
      statusNote = "Requires Meta Professional OAuth";
      supportsLiveDiscovery = false;
      supportsHandleLookup = false;
      availableForPublicDiscovery = false;
    }

    return {
      ...item,
      // Omit technical setup details for unauthenticated non-admin viewers if needed, keep marketer summary clean
      apiSpec: session.isAdmin ? item.apiSpec : "",
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

  // Never expose server environment variable names or DB topology to non-admin users
  const payload: Record<string, unknown> = {
    status: "ok",
    activeCount,
    totalCount: integrations.length,
    isAdmin: session.isAdmin,
    integrations,
  };

  if (session.isAdmin) {
    payload.envStatus = {
      YOUTUBE_DATA_API_KEY: hasYouTube,
      TWITCH_CLIENT_ID: hasTwitchId,
      TWITCH_CLIENT_SECRET: hasTwitchSecret,
      KICK_PUBLIC_API: hasKick,
      TIKTOK_CLIENT_KEY: hasTikTokKey,
      META_APP_ID: hasMetaApp,
      NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    };
    payload.database = {
      configured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
      mode: process.env.NEXT_PUBLIC_SUPABASE_URL ? "supabase_cloud" : "local_workspace_persistence",
    };
  }

  return NextResponse.json(payload);
}
