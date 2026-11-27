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
    youtubeConfigured: boolean;
    twitchClientConfigured: boolean;
    twitchSecretConfigured: boolean;
    kickConfigured: boolean;
    tiktokConfigured: boolean;
    metaConfigured: boolean;
    supabaseConfigured: boolean;
  };
  database?: {
    configured: boolean;
    mode: "supabase_cloud" | "local_workspace_persistence";
  };
}

export const INTEGRATIONS: IntegrationInfo[] = [
  {
    platform: "YouTube",
    documentationUrl: "",
    setup: "Live channel keyword search and public subscriber & view metrics.",
    limitation: "Subject to daily platform search capacity limits.",
    apiSpec: "",
    connectorStatus: "Service Unavailable",
    statusNote: "Channel keyword search & public statistics",
    supportsLiveDiscovery: true,
    supportsHandleLookup: true,
  },
  {
    platform: "Twitch",
    documentationUrl: "",
    setup: "Live streamer discovery, category filtering, and concurrent viewer metrics.",
    limitation: "Requires active Twitch integration activation on server.",
    apiSpec: "",
    connectorStatus: "Service Unavailable",
    statusNote: "Streamer keyword search & live viewer metrics",
    supportsLiveDiscovery: true,
    supportsHandleLookup: true,
  },
  {
    platform: "Kick",
    documentationUrl: "",
    setup: "Direct lookup by exact single-word channel @handle with live viewer & follower counts.",
    limitation: "Supports exact single-word @handle lookup only; multi-word keyword browsing is unsupported by Kick.",
    apiSpec: "",
    connectorStatus: "Handle Lookup Active",
    statusNote: "Exact @handle lookup (single-word channels)",
    supportsLiveDiscovery: false,
    supportsHandleLookup: true,
  },
  {
    platform: "TikTok",
    documentationUrl: "",
    setup: "Connect verified TikTok creator accounts with explicit creator permission.",
    limitation: "Requires TikTok Creator OAuth authorization. Public keyword search across arbitrary accounts is not permitted.",
    apiSpec: "",
    connectorStatus: "Creator OAuth Required",
    statusNote: "Requires TikTok Creator OAuth",
    supportsLiveDiscovery: false,
    supportsHandleLookup: false,
    requiresCreatorOAuth: true,
  },
  {
    platform: "Instagram",
    documentationUrl: "",
    setup: "Connect authorized Instagram Professional accounts with explicit account permission.",
    limitation: "Requires an Instagram Professional account authorization. Open keyword search is unsupported.",
    apiSpec: "",
    connectorStatus: "Creator OAuth Required",
    statusNote: "Requires Instagram Professional OAuth",
    supportsLiveDiscovery: false,
    supportsHandleLookup: false,
    requiresCreatorOAuth: true,
  },
];
