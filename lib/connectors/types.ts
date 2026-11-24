import type { Platform } from "@/lib/model";

export type SupportedOperation =
  | "keyword_search"
  | "exact_handle_lookup"
  | "category_search"
  | "livestream_status";

export type PlatformCapability = {
  platform: Platform;
  keywordDiscovery: boolean;
  exactHandleLookup: boolean;
  categoryDiscovery: boolean;
  liveStreamStatus: boolean;
  requiresOAuth: boolean;
  requiresApiKey: boolean;
  authType: "api_key" | "oauth_client_credentials" | "user_oauth" | "public_rest";
  supportedMetrics: Array<"followers" | "subscribers" | "avg_views" | "avg_live_viewers" | "video_count">;
  discoveryNote: string;
  authorizationRequirement: string;
};

export interface NormalizedCreator {
  id: string;
  name: string;
  handle: string;
  platform: Platform;
  profileUrl: string;
  avatarUrl: string | null;
  bio: string | null;
  followers: number | null;
  reach: number | null;
  reachMetric: "avg_views" | "avg_live_viewers" | null;
  country: string | null;
  category: string | null;
  language?: string | null;
  businessContact: {
    email: string;
    sourceUrl: string;
    lastChecked: string;
  } | null;
  isLiveStream?: boolean;
  liveViewerCount?: number | null;
  source: string;
  fetchedAt: string;
  freshness: string;
  isLive: boolean;
}

export type ConnectorStatus =
  | "success"
  | "unconfigured"
  | "unsupported_operation"
  | "rate_limited"
  | "error";

export interface ConnectorResponse {
  platform: Platform;
  status: ConnectorStatus;
  message?: string;
  items: NormalizedCreator[];
  capabilities: PlatformCapability;
  fetchedAt: string;
  source: string;
  isLive: boolean;
  cached?: boolean;
}

export interface FederatedSearchResponse {
  query: string;
  timestamp: string;
  totalResults: number;
  creators: NormalizedCreator[];
  connectorStatuses: Record<
    Platform,
    {
      status: ConnectorStatus;
      itemCount: number;
      message?: string;
      capabilities: PlatformCapability;
      isLive: boolean;
      cached?: boolean;
    }
  >;
}
