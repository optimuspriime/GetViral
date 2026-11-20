import "server-only";
import { createUnconfiguredProvider } from "@/lib/providers/types";

export const instagramProvider = createUnconfiguredProvider(
  "Instagram",
  "No creator-authorized Instagram connection or approved data provider is configured. Authorization does not grant access to other creators' private analytics.",
);
