import "server-only";
import { createUnconfiguredProvider } from "@/lib/providers/types";

export const tiktokProvider = createUnconfiguredProvider(
  "TikTok",
  "No creator-authorized TikTok connection or approved data provider is configured. Authorization does not grant access to other creators' private analytics.",
);
