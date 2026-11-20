import "server-only";
import type { Platform } from "@/lib/model";
import { ProviderRequestError } from "@/lib/providers/types";

export async function fetchProviderJson<T>(
  platform: Platform,
  url: URL,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, cache: "no-store" });
  } catch {
    throw new ProviderRequestError(platform, "upstream_error", "Could not reach the platform API.");
  }

  if (response.status === 401) {
    throw new ProviderRequestError(platform, "expired_token", "The access token is expired or invalid.");
  }
  if (response.status === 403) {
    throw new ProviderRequestError(platform, "permission_denied", "The token does not have permission for this field or endpoint.");
  }
  if (response.status === 429) {
    const rawRetryAfter = response.headers.get("retry-after");
    const retryAfter = rawRetryAfter ? Number(rawRetryAfter) : NaN;
    throw new ProviderRequestError(
      platform,
      "rate_limited",
      "The platform rate limit was reached.",
      Number.isFinite(retryAfter) ? retryAfter : null,
    );
  }
  if (!response.ok) {
    throw new ProviderRequestError(platform, "upstream_error", `The platform API returned HTTP ${response.status}.`);
  }
  try {
    return await response.json() as T;
  } catch {
    throw new ProviderRequestError(platform, "upstream_error", "The platform returned an invalid JSON response.");
  }
}
