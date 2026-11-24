import "server-only";
import type { Provider, ProviderCreator, ProviderPage } from "@/lib/providers/types";
import { lookupKick, kickCapabilities } from "@/lib/connectors/kick";

export const kickProvider: Provider = {
  platform: "Kick",
  mode: "active",
  coverageNote: kickCapabilities.discoveryNote,

  async searchCreators(query: string): Promise<ProviderPage<ProviderCreator>> {
    const res = await lookupKick(query);
    const items: ProviderCreator[] = res.items.map((c) => ({
      platform: "Kick",
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
    const res = await lookupKick(handle);
    const c = res.items[0];
    if (!c) {
      throw new Error(`Kick channel "${handle}" was not found via public Kick API.`);
    }
    return {
      platform: "Kick",
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
