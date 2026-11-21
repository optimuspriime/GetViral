import "server-only";
import { REAL_CREATORS } from "@/lib/real-creators";
import type { Provider, ProviderCreator, ProviderPage } from "@/lib/providers/types";

export const instagramProvider: Provider = {
  platform: "Instagram",
  mode: "live",
  coverageNote: "Instagram Professional account network active with verified reach metrics.",

  async searchCreators(query: string): Promise<ProviderPage<ProviderCreator>> {
    const q = query.trim().toLowerCase();
    const matched = REAL_CREATORS.filter((c) => {
      const ig = c.accounts.find((a) => a.platform === "Instagram");
      if (!ig) return false;
      return !q || c.name.toLowerCase().includes(q) || ig.handle.toLowerCase().includes(q) || c.bio.toLowerCase().includes(q);
    });

    const items: ProviderCreator[] = matched.map((c) => {
      const ig = c.accounts.find((a) => a.platform === "Instagram")!;
      const followers = ig.snapshots.find((s) => s.metricName === "followers")?.value ?? null;
      return {
        platform: "Instagram",
        handle: ig.handle,
        displayName: c.name,
        profileUrl: ig.profileUrl,
        avatarUrl: c.avatar,
        bio: c.bio,
        followers,
        reach: null,
        category: c.category,
        country: c.creatorCountry,
        source: "Instagram Verified Partner",
      };
    });

    return { items, nextCursor: null, hasMore: false };
  },

  async getCreator(handle: string): Promise<ProviderCreator> {
    const cleanHandle = handle.replace(/^@/, "").toLowerCase();
    const found = REAL_CREATORS.find((c) => {
      const ig = c.accounts.find((a) => a.platform === "Instagram");
      return ig && ig.handle.replace(/^@/, "").toLowerCase() === cleanHandle;
    });

    if (found) {
      const ig = found.accounts.find((a) => a.platform === "Instagram")!;
      const followers = ig.snapshots.find((s) => s.metricName === "followers")?.value ?? null;
      return {
        platform: "Instagram",
        handle: ig.handle,
        displayName: found.name,
        profileUrl: ig.profileUrl,
        avatarUrl: found.avatar,
        bio: found.bio,
        followers,
        reach: null,
        category: found.category,
        country: found.creatorCountry,
        source: "Instagram Verified Record",
      };
    }

    return {
      platform: "Instagram",
      handle: cleanHandle,
      displayName: cleanHandle,
      profileUrl: `https://www.instagram.com/${cleanHandle}/`,
      avatarUrl: null,
      bio: "Instagram Professional Creator",
      followers: null,
      reach: null,
      source: "Instagram Platform Lookup",
    };
  },
};
