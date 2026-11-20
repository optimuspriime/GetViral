import "server-only";
import { createUnconfiguredProvider } from "@/lib/providers/types";

export const kickProvider = createUnconfiguredProvider(
  "Kick",
  "No approved Kick integration is configured. Availability and permission must be verified before adding a connector.",
);
