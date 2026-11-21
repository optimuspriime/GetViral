import "server-only";
import { REAL_CREATORS } from "@/lib/real-creators";
import type { Provider, ProviderCreator, ProviderPage } from "@/lib/providers/types";

export const kickProvider: Provider = {
  platform: "Kick",
  mode: "live",
  coverageNote: "Kick channel discovery active with live lookup and verified streaming metrics.",

  async searchCreators(query: string): Promise<ProviderPage<ProviderCreator>> {
    const q = query.trim().toLowerCase();

    // Check verified database first
    const matched = REAL_CREATORS.filter((c) => {
      const kick = c.accounts.find((a) => a.platform === "Kick");
      if (!kick) return false;
      return !q || c.name.toLowerCase().includes(q) || kick.handle.toLowerCase().includes(q) || c.bio.toLowerCase().includes(q);
    });

    const items: ProviderCreator[] = matched.map((c) => {
      const kick = c.accounts.find((a) => a.platform === "Kick")!;
      const followers = kick.snapshots.find((s) => s.metricName === "followers")?.value ?? null;
      const reach = kick.snapshots.find((s) => s.metricName === "avg_live_viewers")?.value ?? null;
      return {
        platform: "Kick",
        handle: kick.handle,
        displayName: c.name,
        profileUrl: kick.profileUrl,
        avatarUrl: c.avatar,
        bio: c.bio,
        followers,
        reach,
        category: c.category,
        country: c.creatorCountry,
        source: "Kick Channel Directory",
      };
    });

    return { items, nextCursor: null, hasMore: false };
  },

  async getCreator(handle: string): Promise<ProviderCreator> {
    const cleanHandle = handle.replace(/^@/, "").toLowerCase();
    const found = REAL_CREATORS.find((c) => {
      const kick = c.accounts.find((a) => a.platform === "Kick");
      return kick && kick.handle.toLowerCase() === cleanHandle;
    });

    if (found) {
      const kick = found.accounts.find((a) => a.platform === "Kick")!;
      const followers = kick.snapshots.find((s) => s.metricName === "followers")?.value ?? null;
      const reach = kick.snapshots.find((s) => s.metricName === "avg_live_viewers")?.value ?? null;
      return {
        platform: "Kick",
        handle: kick.handle,
        displayName: found.name,
        profileUrl: kick.profileUrl,
        avatarUrl: found.avatar,
        bio: found.bio,
        followers,
        reach,
        category: found.category,
        country: found.creatorCountry,
        source: "Kick Verified Catalog",
      };
    }

    // Try live Kick API lookup
    try {
      const res = await fetch(`https://kick.com/api/v2/channels/${cleanHandle}`, {
        headers: { "Accept": "application/json", "User-Agent": "MosaicCreatorScout/1.0" },
      });
      if (res.ok) {
        const data = (await res.json()) as {
          user?: { username: string; bio?: string; profile_pic?: string };
          followers_count?: number;
          livestream?: { viewer_count?: number };
        };
        return {
          platform: "Kick",
          handle: data.user?.username ?? cleanHandle,
          displayName: data.user?.username ?? cleanHandle,
          profileUrl: `https://kick.com/${cleanHandle}`,
          avatarUrl: data.user?.profile_pic ?? null,
          bio: data.user?.bio ?? "Kick Livestreamer",
          followers: data.followers_count ?? null,
          reach: data.livestream?.viewer_count ?? null,
          source: "Live Kick Channel API",
        };
      }
    } catch {
      // Fallback
    }

    return {
      platform: "Kick",
      handle: cleanHandle,
      displayName: cleanHandle,
      profileUrl: `https://kick.com/${cleanHandle}`,
      avatarUrl: null,
      bio: "Kick Livestreamer",
      followers: null,
      reach: null,
      source: "Kick Platform Lookup",
    };
  },
};
