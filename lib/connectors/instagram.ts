import "server-only";
import type { ConnectorResponse, PlatformCapability } from "./types";

export const instagramCapabilities: PlatformCapability = {
  platform: "Instagram",
  keywordDiscovery: false,
  exactHandleLookup: false,
  categoryDiscovery: false,
  liveStreamStatus: false,
  requiresOAuth: true,
  requiresApiKey: false,
  authType: "user_oauth",
  supportedMetrics: ["followers"],
  discoveryNote:
    "Meta Instagram Graph API requires Instagram Professional account token and Meta App Review. Global keyword search across consumer accounts is not supported by Meta.",
  authorizationRequirement: "Meta Developer App, Instagram Graph API permissions, and Professional account token.",
};

export async function searchInstagram(
  query: string,
): Promise<ConnectorResponse> {
  const now = new Date().toISOString();
  const q = query.trim();

  if (!q) {
    return {
      platform: "Instagram",
      status: "success",
      items: [],
      capabilities: instagramCapabilities,
      fetchedAt: now,
      source: "Instagram Graph API",
      isLive: false,
    };
  }

  // Official Instagram Graph API requires Professional authorization and does not support arbitrary consumer keyword scraping
  return {
    platform: "Instagram",
    status: "unsupported_operation",
    message: "Meta Instagram Graph API requires Instagram Professional account token and Meta App Review. Global keyword crawling across all accounts is not permitted by Meta API Terms.",
    items: [],
    capabilities: instagramCapabilities,
    fetchedAt: now,
    source: "Instagram Graph API",
    isLive: false,
  };
}
