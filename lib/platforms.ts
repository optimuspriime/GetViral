import type { Platform } from "@/lib/model";

export const PLATFORMS: Platform[] = ["Twitch", "Kick", "YouTube", "TikTok", "Instagram"];

export const platformColors: Record<Platform, string> = {
  YouTube: "#FF0000",
  Twitch: "#9146FF",
  Kick: "#10B981",
  TikTok: "#06B6D4",
  Instagram: "#E1306C",
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
