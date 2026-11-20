import type { Platform } from "@/lib/model";

export type IntegrationInfo = {
  platform: Platform;
  documentationUrl: string;
  setup: string;
  limitation: string;
};

export const INTEGRATIONS: IntegrationInfo[] = [
  {
    platform: "Twitch",
    documentationUrl: "https://dev.twitch.tv/docs/api/reference/",
    setup: "Twitch developer application and server-side OAuth client credentials.",
    limitation: "No connector is active. Viewer averages require stored snapshots over a measurement window; a current stream count is not a historical average.",
  },
  {
    platform: "Kick",
    documentationUrl: "https://docs.kick.com/apis/",
    setup: "Kick developer application and approved OAuth scopes.",
    limitation: "The documented user and channel endpoints resolve supplied IDs or slugs; broad creator discovery is not assumed. Current viewer counts are not historical averages.",
  },
  {
    platform: "YouTube",
    documentationUrl: "https://developers.google.com/youtube/v3/docs",
    setup: "Google Cloud project, YouTube Data API v3 enabled, and an API key or approved OAuth client.",
    limitation: "Search and channel resources have quota limits. Average views need a defined set of recent public videos and a dated collection window.",
  },
  {
    platform: "TikTok",
    documentationUrl: "https://developers.tiktok.com/doc/display-api-overview/",
    setup: "TikTok developer app, creator authorization, approved scopes, and any required review.",
    limitation: "Creator authorization covers that creator's permitted data only; it does not grant access to other creators' private analytics or broad discovery.",
  },
  {
    platform: "Instagram",
    documentationUrl: "https://developers.facebook.com/documentation/instagram-platform/",
    setup: "Meta developer app, Instagram Professional account authorization, and any required app review.",
    limitation: "Instagram APIs are limited to eligible Professional accounts and documented access. They do not expose private analytics for every creator or all consumer accounts.",
  },
];
