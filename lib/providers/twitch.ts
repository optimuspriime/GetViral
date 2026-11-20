import "server-only";
import { createUnconfiguredProvider } from "@/lib/providers/types";

export const twitchProvider = createUnconfiguredProvider(
  "Twitch",
  "No Twitch API credentials or approved discovery provider are configured. Only metrics stored by the workspace are shown.",
);
