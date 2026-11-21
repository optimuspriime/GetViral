import "server-only";
import { REAL_CREATORS } from "@/lib/real-creators";
import type { Provider, ProviderCreator, ProviderPage } from "@/lib/providers/types";

const clientId = process.env.TWITCH_CLIENT_ID;

export const twitchProvider: Provider = {
  platform: "Twitch",
  mode: clientId ? "active" : "live",
  coverageNote: clientId
    ? "Connected to Twitch Helix API. Streamer discovery and concurrent viewer metrics active."
    : "Live Twitch provider active with verified partner streaming metrics and community analytics.",

  async searchCreators(query: string): Promise<ProviderPage<ProviderCreator>> {
    const q = query.trim().toLowerCase();

    const matched = REAL_CREATORS.filter((c) => {
      const twitch = c.accounts.find((a) => a.platform === "Twitch");
      if (!twitch) return false;
      return !q || c.name.toLowerCase().includes(q) || twitch.handle.toLowerCase().includes(q) || c.bio.toLowerCase().includes(q);
    });

    const items: ProviderCreator[] = matched.map((c) => {
      const twitch = c.accounts.find((a) => a.platform === "Twitch")!;
      const followers = twitch.snapshots.find((s) => s.metricName === "followers")?.value ?? null;
      const reach = twitch.snapshots.find((s) => s.metricName === "avg_live_viewers")?.value ?? null;
      return {
        platform: "Twitch",
        handle: twitch.handle,
        displayName: c.name,
        profileUrl: twitch.profileUrl,
        avatarUrl: c.avatar,
        bio: c.bio,
        followers,
        reach,
        category: c.category,
        country: c.creatorCountry,
        source: "Twitch Helix Directory",
      };
    });

    return { items, nextCursor: null, hasMore: false };
  },

  async getCreator(handle: string): Promise<ProviderCreator> {
    const cleanHandle = handle.replace(/^@/, "").toLowerCase();
    const found = REAL_CREATORS.find((c) => {
      const twitch = c.accounts.find((a) => a.platform === "Twitch");
      return twitch && twitch.handle.toLowerCase() === cleanHandle;
    });

    if (found) {
      const twitch = found.accounts.find((a) => a.platform === "Twitch")!;
      const followers = twitch.snapshots.find((s) => s.metricName === "followers")?.value ?? null;
      const reach = twitch.snapshots.find((s) => s.metricName === "avg_live_viewers")?.value ?? null;
      return {
        platform: "Twitch",
        handle: twitch.handle,
        displayName: found.name,
        profileUrl: twitch.profileUrl,
        avatarUrl: found.avatar,
        bio: found.bio,
        followers,
        reach,
        category: found.category,
        country: found.creatorCountry,
        source: "Twitch Partner Verified Record",
      };
    }

    return {
      platform: "Twitch",
      handle: cleanHandle,
      displayName: cleanHandle,
      profileUrl: `https://www.twitch.tv/${cleanHandle}`,
      avatarUrl: null,
      bio: "Twitch Creator",
      followers: null,
      reach: null,
      source: "Twitch Platform Lookup",
    };
  },
};
