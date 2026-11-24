import "server-only";
import type { Provider, ProviderCreator, ProviderPage } from "@/lib/providers/types";
import { tiktokCapabilities } from "@/lib/connectors/tiktok";

export const tiktokProvider: Provider = {
  platform: "TikTok",
  mode: "not_configured",
  coverageNote: tiktokCapabilities.discoveryNote,

  async searchCreators(): Promise<ProviderPage<ProviderCreator>> {
    // Official TikTok Display API does not support global keyword crawling
    return { items: [], nextCursor: null, hasMore: false };
  },

  async getCreator(handle: string): Promise<ProviderCreator> {
    throw new Error(`TikTok handle "${handle}" requires creator OAuth authorization under official TikTok Display API policies.`);
  },
};
