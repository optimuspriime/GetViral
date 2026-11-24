import type { Platform } from "@/lib/model";

export type IntegrationInfo = {
  platform: Platform;
  documentationUrl: string;
  setup: string;
  limitation: string;
  connectorStatus: string;
  statusNote: string;
  supportsLiveDiscovery: boolean;
  supportsHandleLookup: boolean;
};

export const INTEGRATIONS: IntegrationInfo[] = [
  {
    platform: "YouTube",
    documentationUrl: "https://developers.google.com/youtube/v3/docs",
    setup: "Google Cloud project with YouTube Data API v3 enabled and YOUTUBE_DATA_API_KEY environment variable.",
    limitation: "Official YouTube API supports live keyword discovery and channel statistics (subscribers, views). Subject to daily Google quota units.",
    connectorStatus: "Official Data API v3",
    statusNote: "Requires YOUTUBE_DATA_API_KEY",
    supportsLiveDiscovery: true,
    supportsHandleLookup: true,
  },
  {
    platform: "Twitch",
    documentationUrl: "https://dev.twitch.tv/docs/api/reference/",
    setup: "Twitch Developer Application with TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET environment variables.",
    limitation: "Official Twitch Helix API supports live channel keyword search, stream status, and concurrent viewer metrics using App Access OAuth tokens.",
    connectorStatus: "Official Twitch Helix API",
    statusNote: "Requires TWITCH_CLIENT_ID & SECRET",
    supportsLiveDiscovery: true,
    supportsHandleLookup: true,
  },
  {
    platform: "Kick",
    documentationUrl: "https://docs.kick.com/apis/",
    setup: "Direct handle resolution via Kick Public API v2 channel endpoints.",
    limitation: "Kick official endpoints support exact channel/handle lookup with real-time viewer and follower count. Broad keyword crawling is not supported by Kick's API.",
    connectorStatus: "Direct Handle Lookup (Public API v2)",
    statusNote: "Kick Public API v2 Active",
    supportsLiveDiscovery: false,
    supportsHandleLookup: true,
  },
  {
    platform: "TikTok",
    documentationUrl: "https://developers.tiktok.com/doc/display-api-overview/",
    setup: "TikTok Developer Display API application with authorized creator user access token.",
    limitation: "Official TikTok Display API requires creator OAuth authorization. Arbitrary global keyword discovery is not permitted under TikTok's Developer Terms.",
    connectorStatus: "Authorized Account Display (OAuth)",
    statusNote: "TikTok Display API (Creator OAuth)",
    supportsLiveDiscovery: false,
    supportsHandleLookup: true,
  },
  {
    platform: "Instagram",
    documentationUrl: "https://developers.facebook.com/documentation/instagram-platform/",
    setup: "Meta Developer App with Instagram Professional Account User Token and Graph API permissions.",
    limitation: "Official Meta Graph API supports registered Professional Accounts. Meta strictly prohibits open scraping and unauthenticated keyword crawling.",
    connectorStatus: "Professional Account Graph (OAuth)",
    statusNote: "Meta Graph API (Professional)",
    supportsLiveDiscovery: false,
    supportsHandleLookup: true,
  },
];
