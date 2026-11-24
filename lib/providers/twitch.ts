import "server-only";
import type { Provider, ProviderCreator, ProviderPage } from "@/lib/providers/types";
import { searchTwitch, twitchCapabilities } from "@/lib/connectors/twitch";

export const twitchProvider: Provider = {
  platform: "Twitch",
  mode: process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET ? "active" : "not_configured",
  coverageNote: twitchCapabilities.discoveryNote,

  async searchCreators(query: string): Promise<ProviderPage<ProviderCreator>> {
    const res = await searchTwitch(query);
    const items: ProviderCreator[] = res.items.map((c) => ({
      platform: "Twitch",
      handle: c.handle,
      profileUrl: c.profileUrl,
      displayName: c.name,
      avatarUrl: c.avatarUrl,
      bio: c.bio,
      followers: c.followers,
      reach: c.reach,
      category: c.category,
      country: c.country,
      source: c.source,
    }));
    return { items, nextCursor: null, hasMore: false };
  },

  async getCreator(handle: string): Promise<ProviderCreator> {
    const res = await searchTwitch(handle, { limit: 1 });
    const c = res.items[0];
    if (!c) {
      throw new Error(`Twitch channel "${handle}" was not found or Twitch API credentials not configured.`);
    }
    return {
      platform: "Twitch",
      handle: c.handle,
      profileUrl: c.profileUrl,
      displayName: c.name,
      avatarUrl: c.avatarUrl,
      bio: c.bio,
      followers: c.followers,
      reach: c.reach,
      category: c.category,
      country: c.country,
      source: c.source,
    };
  },
};
