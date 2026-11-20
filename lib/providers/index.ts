import "server-only";
import type { Platform } from "@/lib/model";
import type { Provider } from "@/lib/providers/types";
import { instagramProvider } from "@/lib/providers/instagram";
import { kickProvider } from "@/lib/providers/kick";
import { tiktokProvider } from "@/lib/providers/tiktok";
import { twitchProvider } from "@/lib/providers/twitch";
import { youtubeProvider } from "@/lib/providers/youtube";

export const providers: Record<Platform, Provider> = {
  Twitch: twitchProvider,
  Kick: kickProvider,
  YouTube: youtubeProvider,
  TikTok: tiktokProvider,
  Instagram: instagramProvider,
};
