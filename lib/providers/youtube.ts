import "server-only";
import { createUnconfiguredProvider } from "@/lib/providers/types";

export const youtubeProvider = createUnconfiguredProvider(
  "YouTube",
  "No YouTube API credentials or approved discovery provider are configured. API coverage and quota limits must be verified before syncing.",
);
