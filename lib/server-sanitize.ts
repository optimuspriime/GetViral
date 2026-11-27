import "server-only";

/**
 * Strips internal env key names, URLs, HTTP status codes, and API version strings
 * from error or status messages on the server before returning responses to clients.
 */
export function sanitizePublicErrorMessage(
  rawMessage?: string | null,
  platform?: string | null,
  fallback = "Unable to complete request right now. Please try again.",
): string {
  if (!rawMessage) return fallback;
  const lower = rawMessage.toLowerCase();

  if (
    lower.includes("youtube_data_api_key") ||
    lower.includes("twitch_client") ||
    lower.includes("tiktok_client") ||
    lower.includes("meta_app") ||
    lower.includes("supabase_") ||
    lower.includes("quota_signing_secret") ||
    lower.includes("http ") ||
    lower.includes("https://") ||
    lower.includes("api v3") ||
    lower.includes("api v2") ||
    lower.includes("helix") ||
    lower.includes("econnrefused") ||
    lower.includes("fetch failed")
  ) {
    if (lower.includes("quota") || lower.includes("rate limit")) {
      return platform
        ? `${platform} search capacity is temporarily busy. Please try again shortly.`
        : "Search capacity is temporarily busy. Please try again shortly.";
    }
    if (lower.includes("not configured") || lower.includes("unconfigured") || lower.includes("credentials")) {
      return platform
        ? `${platform} discovery is temporarily unavailable.`
        : "This platform integration is temporarily unavailable.";
    }
    return fallback;
  }

  return rawMessage
    .replace(/\bData API v\d+\b/gi, "Channel Directory")
    .replace(/\bAPI v\d+\b/gi, "Channel Service")
    .replace(/\bPlatform APIs?\b/gi, "connected channels")
    .replace(/\bOfficial APIs?\b/gi, "connected platforms")
    .replace(/\bDisplay API\b/gi, "Creator Authorization")
    .replace(/\bGraph API\b/gi, "Creator Authorization")
    .replace(/\bTwitch Helix\b/gi, "Twitch")
    .replace(/\bHelix\b/gi, "Twitch")
    .trim();
}
