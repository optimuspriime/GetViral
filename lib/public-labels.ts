import type { Platform } from "@/lib/model";

const PLATFORM_PUBLIC_SOURCES: Record<string, string> = {
  YouTube: "YouTube Public Channel",
  Kick: "Kick Public Channel",
  Twitch: "Twitch Public Channel",
  TikTok: "TikTok Creator Account",
  Instagram: "Instagram Professional Account",
};

/**
 * Normalizes any legacy or internal connector source label into clean user-facing copy
 * without bundling internal version strings or vendor names in client code.
 */
export function sanitizePublicSourceLabel(
  platform?: Platform | string | null,
  rawSource?: string | null,
): string {
  const sourceText = (rawSource || "").trim();
  const normalized = sourceText.toLowerCase();

  if (normalized.includes("creator-authorized") || normalized.includes("channel analytics")) {
    return "YouTube Creator-Authorized Analytics";
  }

  if (!sourceText || /\b(api|v\d+|endpoint|live|platform|official|workspace|database)\b/i.test(sourceText)) {
    if (platform && PLATFORM_PUBLIC_SOURCES[platform]) {
      return PLATFORM_PUBLIC_SOURCES[platform];
    }
    if (normalized.includes("youtube")) return PLATFORM_PUBLIC_SOURCES.YouTube;
    if (normalized.includes("kick")) return PLATFORM_PUBLIC_SOURCES.Kick;
    if (normalized.includes("twitch")) return PLATFORM_PUBLIC_SOURCES.Twitch;
    if (normalized.includes("tiktok")) return PLATFORM_PUBLIC_SOURCES.TikTok;
    if (normalized.includes("instagram") || normalized.includes("meta")) {
      return PLATFORM_PUBLIC_SOURCES.Instagram;
    }
    if (normalized.includes("saved") || normalized.includes("workspace")) {
      return "Saved Workspace";
    }
    return "Public Channel Data";
  }

  return sourceText;
}
