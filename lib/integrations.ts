import type { Platform } from "@/lib/model";

export type IntegrationInfo = {
  platform: Platform;
  documentationUrl: string;
  setup: string;
  limitation: string;
  connectorStatus: "Catalog Snapshot Mode" | "Live API Connector Ready";
  statusNote: string;
};

export const INTEGRATIONS: IntegrationInfo[] = [
  {
    platform: "YouTube",
    documentationUrl: "https://developers.google.com/youtube/v3/docs",
    setup: "Google Cloud project, YouTube Data API v3 enabled, and an API key or approved OAuth client.",
    limitation: "Search and channel resources have quota limits. Catalog baseline provides verified subscriber baselines; live queries require YOUTUBE_DATA_API_KEY.",
    connectorStatus: "Catalog Snapshot Mode",
    statusNote: "Verified Baseline Catalog Active",
  },
  {
    platform: "Twitch",
    documentationUrl: "https://dev.twitch.tv/docs/api/reference/",
    setup: "Twitch developer application and server-side OAuth client credentials (TWITCH_CLIENT_ID).",
    limitation: "Viewer averages require stored snapshots over a measurement window. Catalog snapshots provide verified baseline streamer metrics.",
    connectorStatus: "Catalog Snapshot Mode",
    statusNote: "Verified Baseline Catalog Active",
  },
  {
    platform: "Kick",
    documentationUrl: "https://docs.kick.com/apis/",
    setup: "Kick developer application and approved OAuth scopes.",
    limitation: "The documented user and channel endpoints resolve supplied IDs or slugs; broad creator discovery is maintained via verified snapshots.",
    connectorStatus: "Catalog Snapshot Mode",
    statusNote: "Verified Baseline Catalog Active",
  },
  {
    platform: "TikTok",
    documentationUrl: "https://developers.tiktok.com/doc/display-api-overview/",
    setup: "TikTok developer app, creator authorization, approved scopes, and any required review.",
    limitation: "Creator authorization covers that creator's permitted data only; it does not grant access to other creators' private analytics or broad discovery.",
    connectorStatus: "Catalog Snapshot Mode",
    statusNote: "Verified Baseline Catalog Active",
  },
  {
    platform: "Instagram",
    documentationUrl: "https://developers.facebook.com/documentation/instagram-platform/",
    setup: "Meta developer app, Instagram Professional account authorization, and any required app review.",
    limitation: "Instagram APIs are limited to eligible Professional accounts and documented access. They do not expose private analytics for every creator or all consumer accounts.",
    connectorStatus: "Catalog Snapshot Mode",
    statusNote: "Verified Baseline Catalog Active",
  },
];
