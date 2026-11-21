import type { Platform } from "@/lib/model";

export interface ProviderCreator {
  platform: Platform;
  handle: string;
  profileUrl: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  followers?: number | null;
  reach?: number | null;
  category?: string | null;
  country?: string | null;
  source: string;
}

export interface ProviderPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type ProviderErrorCode =
  | "not_configured"
  | "expired_token"
  | "rate_limited"
  | "permission_denied"
  | "unsupported"
  | "upstream_error";

export interface ProviderRequestContext {
  accessToken?: string;
  cursor?: string | null;
  signal?: AbortSignal;
}

export interface Provider {
  platform: Platform;
  mode: "active" | "live" | "not_configured";
  coverageNote: string;
  searchCreators(
    query: string,
    context?: ProviderRequestContext,
  ): Promise<ProviderPage<ProviderCreator>>;
  getCreator(
    handle: string,
    context?: ProviderRequestContext,
  ): Promise<ProviderCreator>;
}

export class ProviderRequestError extends Error {
  readonly code: ProviderErrorCode;
  readonly retryAfterSeconds: number | null;

  constructor(
    platform: Platform,
    code: ProviderErrorCode,
    message: string,
    retryAfterSeconds: number | null = null,
  ) {
    super(`${platform}: ${message}`);
    this.name = "ProviderRequestError";
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class ProviderNotConfiguredError extends ProviderRequestError {
  constructor(platform: Platform) {
    super(
      platform,
      "not_configured",
      "Discovery connector is not yet configured. Set API credentials in environment variables or settings.",
    );
  }
}

export function createUnconfiguredProvider(
  platform: Platform,
  coverageNote: string,
): Provider {
  return {
    platform,
    mode: "not_configured",
    coverageNote,
    async searchCreators() {
      throw new ProviderNotConfiguredError(platform);
    },
    async getCreator() {
      throw new ProviderNotConfiguredError(platform);
    },
  };
}
