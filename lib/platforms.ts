import type { Platform } from "@/lib/model";

export const PLATFORMS: Platform[] = ["Twitch", "Kick", "YouTube", "TikTok", "Instagram"];

export const platformColors: Record<Platform, string> = {
  YouTube: "#EF4444",
  Twitch: "#8B5CF6",
  Kick: "#16834B",
  TikTok: "#14B8A6",
  Instagram: "#EC4899",
};

export function platformMetricLabel(platform: Platform, metric: "reach" | "followers") {
  if (metric === "followers") return platform === "YouTube" ? "Subscribers" : "Followers";
  if (platform === "Twitch" || platform === "Kick") return "Avg. live viewers";
  if (platform === "YouTube" || platform === "TikTok") return "Avg. video views";
  return "Unavailable";
}

export function accountUrl(platform: Platform, handle: string) {
  const encoded = encodeURIComponent(handle.replace(/^@/, ""));
  const hosts: Record<Platform, string> = {
    Twitch: `https://www.twitch.tv/${encoded}`,
    Kick: `https://kick.com/${encoded}`,
    YouTube: `https://www.youtube.com/${handle.startsWith("@") ? encoded : `@${encoded}`}`,
    TikTok: `https://www.tiktok.com/@${encoded}`,
    Instagram: `https://www.instagram.com/${encoded}`,
  };
  return hosts[platform];
}
