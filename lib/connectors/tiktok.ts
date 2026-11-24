import "server-only";
import type { ConnectorResponse, PlatformCapability } from "./types";

export const tiktokCapabilities: PlatformCapability = {
  platform: "TikTok",
  keywordDiscovery: false,
  exactHandleLookup: true,
  categoryDiscovery: false,
  liveStreamStatus: false,
  requiresOAuth: true,
  requiresApiKey: false,
  authType: "user_oauth",
  supportedMetrics: ["followers", "avg_views"],
  discoveryNote:
    "Official TikTok Display API requires creator OAuth authorization. Global keyword discovery across arbitrary third-party creators is prohibited by TikTok Developer Terms.",
  authorizationRequirement: "TikTok Developer App Review & Creator OAuth Authorization (TikTok Login Kit / Display API).",
};

export async function searchTikTok(
  query: string,
): Promise<ConnectorResponse> {
  const now = new Date().toISOString();
  const q = query.trim();

  if (!q) {
    return {
      platform: "TikTok",
      status: "success",
      items: [],
      capabilities: tiktokCapabilities,
      fetchedAt: now,
      source: "TikTok Display API",
      isLive: false,
    };
  }

  // Official TikTok API does not provide open global keyword crawling
  return {
    platform: "TikTok",
    status: "unsupported_operation",
    message: "TikTok official Display API requires individual creator OAuth authorization. Global keyword crawling across unauthenticated creators is restricted by TikTok API policies.",
    items: [],
    capabilities: tiktokCapabilities,
    fetchedAt: now,
    source: "TikTok Display API",
    isLive: false,
  };
}
