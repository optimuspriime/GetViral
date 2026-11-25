import type { Platform } from "@/lib/model";

export type IntegrationInfo = {
  platform: Platform;
  documentationUrl: string;
  setup: string;
  limitation: string;
  apiSpec: string;
  connectorStatus: string;
  statusNote: string;
  supportsLiveDiscovery: boolean;
  supportsHandleLookup: boolean;
  requiresCreatorOAuth?: boolean;
};

export interface IntegrationHealthItem extends IntegrationInfo {
  connected: boolean;
  mode: "active_api" | "unconfigured" | "requires_oauth";
  availableForPublicDiscovery: boolean;
}

export interface IntegrationsHealthPayload {
  status: string;
  activeCount: number;
  totalCount: number;
  isAdmin?: boolean;
  integrations: IntegrationHealthItem[];
  envStatus?: {
    YOUTUBE_DATA_API_KEY: boolean;
    TWITCH_CLIENT_ID: boolean;
    TWITCH_CLIENT_SECRET: boolean;
    KICK_PUBLIC_API: boolean;
    TIKTOK_CLIENT_KEY: boolean;
    META_APP_ID: boolean;
    NEXT_PUBLIC_SUPABASE_URL: boolean;
  };
  database?: {
    configured: boolean;
    mode: "supabase_cloud" | "local_workspace_persistence";
  };
}

export const INTEGRATIONS: IntegrationInfo[] = [
  {
    platform: "YouTube",
    documentationUrl: "https://developers.google.com/youtube/v3/docs",
    setup: "Live channel keyword search and public subscriber & view metrics.",
    limitation: "Subject to daily YouTube API Services quota limits.",
    apiSpec: "YouTube Data API v3 (keyword search + channel statistics)",
    connectorStatus: "Service Unavailable",
    statusNote: "Channel keyword search & public statistics",
    supportsLiveDiscovery: true,
    supportsHandleLookup: true,
  },
  {
    platform: "Twitch",
    documentationUrl: "https://dev.twitch.tv/docs/api/reference/",
    setup: "Live streamer discovery, category filtering, and concurrent viewer metrics.",
    limitation: "Requires active Twitch Developer app credentials configured on the server.",
    apiSpec: "Twitch Helix API (App Access OAuth + streams lookup)",
    connectorStatus: "Service Unavailable",
    statusNote: "Streamer keyword search & live viewer metrics",
    supportsLiveDiscovery: true,
    supportsHandleLookup: true,
  },
  {
    platform: "Kick",
    documentationUrl: "https://docs.kick.com/apis/",
    setup: "Direct lookup by exact single-word channel @handle with live viewer & follower counts.",
    limitation: "Supports exact single-word @handle lookup only; multi-word keyword browsing is unsupported by Kick.",
    apiSpec: "Kick Channel Endpoint (exact handle resolution; api.kick.com OAuth 2.1 for partner tier)",
    connectorStatus: "Handle Lookup Active",
    statusNote: "Exact @handle lookup (single-word channels)",
    supportsLiveDiscovery: false,
    supportsHandleLookup: true,
  },
  {
    platform: "TikTok",
    documentationUrl: "https://developers.tiktok.com/doc/display-api-overview/",
    setup: "Connect verified TikTok creator accounts with explicit creator permission.",
    limitation: "Requires TikTok Creator OAuth authorization. Public keyword search across arbitrary accounts is not permitted.",
    apiSpec: "TikTok Display API (Creator OAuth token required)",
    connectorStatus: "Creator OAuth Required",
    statusNote: "Requires TikTok Creator OAuth",
    supportsLiveDiscovery: false,
    supportsHandleLookup: false,
    requiresCreatorOAuth: true,
  },
  {
    platform: "Instagram",
    documentationUrl: "https://developers.facebook.com/documentation/instagram-platform/",
    setup: "Connect authorized Instagram Professional accounts via Meta permissions.",
    limitation: "Requires Meta App Review and an Instagram Professional account token. Open keyword search is prohibited.",
    apiSpec: "Meta Instagram Graph API (Professional account token required)",
    connectorStatus: "Meta OAuth Required",
    statusNote: "Requires Meta Professional OAuth",
    supportsLiveDiscovery: false,
    supportsHandleLookup: false,
    requiresCreatorOAuth: true,
  },
];
