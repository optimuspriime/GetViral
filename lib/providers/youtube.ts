import "server-only";
import type { Provider, ProviderCreator, ProviderPage } from "@/lib/providers/types";
import { searchYouTube, youtubeCapabilities } from "@/lib/connectors/youtube";

export const youtubeProvider: Provider = {
  platform: "YouTube",
  mode: process.env.YOUTUBE_DATA_API_KEY ? "active" : "not_configured",
  coverageNote: youtubeCapabilities.discoveryNote,

  async searchCreators(query: string): Promise<ProviderPage<ProviderCreator>> {
    const res = await searchYouTube(query);
    const items: ProviderCreator[] = res.items.map((c) => ({
      platform: "YouTube",
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
    const res = await searchYouTube(handle, { limit: 1 });
    const c = res.items[0];
    if (!c) {
      throw new Error(`YouTube channel "${handle}" was not found or API credentials not configured.`);
    }
    return {
      platform: "YouTube",
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
