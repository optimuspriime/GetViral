import "server-only";
import type { Provider, ProviderCreator, ProviderPage } from "@/lib/providers/types";
import { instagramCapabilities } from "@/lib/connectors/instagram";

export const instagramProvider: Provider = {
  platform: "Instagram",
  mode: "not_configured",
  coverageNote: instagramCapabilities.discoveryNote,

  async searchCreators(): Promise<ProviderPage<ProviderCreator>> {
    // Official Instagram Graph API does not support global keyword crawling
    return { items: [], nextCursor: null, hasMore: false };
  },

  async getCreator(handle: string): Promise<ProviderCreator> {
    throw new Error(`Instagram profile "${handle}" requires Instagram Professional account token under official Meta Graph API policies.`);
  },
};
