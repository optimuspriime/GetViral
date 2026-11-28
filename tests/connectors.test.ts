import test from "node:test";
import assert from "node:assert/strict";

import { searchYouTube } from "../lib/connectors/youtube";
import {
  buildAuthorizedCreatorRecord,
  buildGoogleOAuthAuthorizeUrl,
  fetchOwnedYouTubeChannel,
  fetchYouTubeAnalyticsReport,
} from "../lib/connectors/youtube-analytics";
import { searchTwitch } from "../lib/connectors/twitch";
import { lookupKick } from "../lib/connectors/kick";
import { searchTikTok } from "../lib/connectors/tiktok";
import { searchInstagram } from "../lib/connectors/instagram";
import { federatedSearch } from "../lib/connectors/federated";
import { getLiveBrowseCreators } from "../lib/connectors/browse";
import { searchCache } from "../lib/connectors/cache";
import type { NormalizedCreator, ConnectorResponse } from "../lib/connectors/types";
import { TEST_FIXTURE_CREATORS } from "./fixtures/sample-creators";

test("Federated Connectors Test Suite", async (t) => {
  // Save original env vars
  const origYtKey = process.env.YOUTUBE_DATA_API_KEY;
  const origTwitchId = process.env.TWITCH_CLIENT_ID;
  const origTwitchSecret = process.env.TWITCH_CLIENT_SECRET;

  await t.test("1. YouTube Connector - Unconfigured State & Capabilities Declaration", async () => {
    delete process.env.YOUTUBE_DATA_API_KEY;

    const res = await searchYouTube("tech", { bypassCache: true });
    assert.equal(res.platform, "YouTube");
    assert.equal(res.status, "unconfigured");
    assert.equal(res.items.length, 0);
    assert.equal(res.isLive, false);
    assert.ok(res.message?.includes("YOUTUBE_DATA_API_KEY"));
    assert.equal(res.capabilities.keywordDiscovery, true);
    assert.equal(res.capabilities.exactHandleLookup, true);
    assert.equal(res.capabilities.requiresApiKey, true);
  });

  await t.test("2. Twitch Connector - Unconfigured State & Capabilities Declaration", async () => {
    delete process.env.TWITCH_CLIENT_ID;
    delete process.env.TWITCH_CLIENT_SECRET;

    const res = await searchTwitch("gaming", { bypassCache: true });
    assert.equal(res.platform, "Twitch");
    assert.equal(res.status, "unconfigured");
    assert.equal(res.items.length, 0);
    assert.equal(res.isLive, false);
    assert.ok(res.message?.includes("TWITCH_CLIENT_ID"));
    assert.equal(res.capabilities.keywordDiscovery, true);
    assert.equal(res.capabilities.liveStreamStatus, true);
    assert.equal(res.capabilities.authType, "oauth_client_credentials");
  });

  await t.test("3. Kick Connector - Capabilities Declaration & Channel Lookup", async () => {
    // Kick capabilities state
    const res = await lookupKick("", { bypassCache: true });
    assert.equal(res.platform, "Kick");
    assert.equal(res.capabilities.keywordDiscovery, false);
    assert.equal(res.capabilities.exactHandleLookup, true);
    assert.equal(res.capabilities.liveStreamStatus, true);
    assert.equal(res.capabilities.authType, "public_rest");
  });

  await t.test("4. TikTok Connector - Explicit OAuth Display API Requirement", async () => {
    const res = await searchTikTok("comedy");
    assert.equal(res.platform, "TikTok");
    assert.equal(res.status, "unsupported_operation");
    assert.equal(res.items.length, 0);
    assert.equal(res.capabilities.keywordDiscovery, false);
    assert.equal(res.capabilities.authType, "user_oauth");
    assert.ok(res.message?.includes("Display API requires individual creator OAuth authorization"));
  });

  await t.test("5. Instagram Connector - Explicit Meta Professional Requirement", async () => {
    const res = await searchInstagram("fashion");
    assert.equal(res.platform, "Instagram");
    assert.equal(res.status, "unsupported_operation");
    assert.equal(res.items.length, 0);
    assert.equal(res.capabilities.keywordDiscovery, false);
    assert.equal(res.capabilities.authType, "user_oauth");
    assert.ok(res.message?.includes("Instagram Professional account token"));
  });

  await t.test("6. Short-Lived Server Cache - Retrieval and Freshness", () => {
    const dummyCreator: NormalizedCreator = {
      id: "test-cache-creator",
      platform: "YouTube",
      handle: "@CacheTest",
      name: "Cache Test Channel",
      profileUrl: "https://youtube.com/@CacheTest",
      avatarUrl: null,
      bio: "Test bio",
      country: "United States",
      category: "Tech",
      followers: 100000,
      reach: 50000,
      reachMetric: "avg_views",
      businessContact: null,
      source: "YouTube Data API v3",
      fetchedAt: new Date().toISOString(),
      freshness: "Live Platform API Response",
      isLive: true,
    };

    const mockResponse: ConnectorResponse = {
      platform: "YouTube",
      status: "success",
      items: [dummyCreator],
      capabilities: {
        platform: "YouTube",
        keywordDiscovery: true,
        exactHandleLookup: true,
        categoryDiscovery: false,
        liveStreamStatus: true,
        requiresOAuth: false,
        requiresApiKey: true,
        authType: "api_key",
        supportedMetrics: ["subscribers", "avg_views"],
        discoveryNote: "YouTube official API",
        authorizationRequirement: "API key",
      },
      fetchedAt: new Date().toISOString(),
      source: "YouTube Data API v3",
      isLive: true,
    };

    searchCache.set("youtube", "search", "cache_query", mockResponse, 2000);

    const cached = searchCache.get("youtube", "search", "cache_query");
    assert.ok(cached !== null);
    assert.equal(cached.items.length, 1);
    assert.equal(cached.items[0].handle, "@CacheTest");
    assert.equal(cached.isLive, false);
    assert.ok(cached.items[0].freshness.includes("Server Cache"));
  });

  await t.test("7. Federated Search - Deduplication Across Platforms", async () => {
    const fixtureYt: NormalizedCreator = {
      id: "carryminati-yt",
      platform: "YouTube",
      handle: "@CarryMinati",
      name: "CarryMinati",
      profileUrl: "https://youtube.com/@CarryMinati",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      bio: "CarryMinati YouTube",
      country: "India",
      category: "Entertainment",
      followers: 44200000,
      reach: 28000000,
      reachMetric: "avg_views",
      isLiveStream: false,
      businessContact: {
        email: "business@carryminati.com",
        sourceUrl: "https://www.youtube.com/@CarryMinati/about",
        lastChecked: new Date().toISOString(),
      },
      source: "YouTube Data API v3",
      fetchedAt: new Date().toISOString(),
      freshness: "Live Platform API Response",
      isLive: true,
    };

    const fixtureKick: NormalizedCreator = {
      id: "carryminati-kick",
      platform: "Kick",
      handle: "carryminati",
      name: "CarryMinati",
      profileUrl: "https://kick.com/carryminati",
      avatarUrl: null,
      bio: "CarryMinati Kick",
      country: "India",
      category: "Gaming",
      followers: 21500000,
      reach: 48000,
      reachMetric: "avg_live_viewers",
      isLiveStream: true,
      businessContact: null,
      source: "Kick Public API v2",
      fetchedAt: new Date().toISOString(),
      freshness: "Live Platform API Response",
      isLive: true,
    };

    const mockYtResponse: ConnectorResponse = {
      platform: "YouTube",
      status: "success",
      items: [fixtureYt, { ...fixtureYt, id: "carryminati-yt-dupe" }],
      capabilities: {
        platform: "YouTube",
        keywordDiscovery: true,
        exactHandleLookup: true,
        categoryDiscovery: false,
        liveStreamStatus: true,
        requiresOAuth: false,
        requiresApiKey: true,
        authType: "api_key",
        supportedMetrics: ["subscribers", "avg_views"],
        discoveryNote: "YouTube official API",
        authorizationRequirement: "API key",
      },
      fetchedAt: new Date().toISOString(),
      source: "YouTube Data API v3",
      isLive: true,
    };

    const mockKickResponse: ConnectorResponse = {
      platform: "Kick",
      status: "success",
      items: [fixtureKick],
      capabilities: {
        platform: "Kick",
        keywordDiscovery: false,
        exactHandleLookup: true,
        categoryDiscovery: true,
        liveStreamStatus: true,
        requiresOAuth: false,
        requiresApiKey: false,
        authType: "public_rest",
        supportedMetrics: ["followers", "avg_live_viewers"],
        discoveryNote: "Kick official API",
        authorizationRequirement: "Public",
      },
      fetchedAt: new Date().toISOString(),
      source: "Kick Public API v2",
      isLive: true,
    };

    searchCache.set("youtube", "search", "carryminati", mockYtResponse, 10000);
    searchCache.set("kick", "channel", "carryminati", mockKickResponse, 10000);

    const federated = await federatedSearch("carryminati");
    assert.equal(federated.query, "carryminati");
    assert.ok(federated.totalResults >= 2);

    // Ensure deduplication: only 1 instance of @CarryMinati on YouTube
    const ytMatches = federated.creators.filter(
      (c) => c.platform === "YouTube" && c.handle.toLowerCase() === "@carryminati",
    );
    assert.equal(ytMatches.length, 1);

    // Connector statuses must declare which platforms ran
    assert.ok("YouTube" in federated.connectorStatuses);
    assert.ok("Twitch" in federated.connectorStatuses);
    assert.ok("Kick" in federated.connectorStatuses);
    assert.ok("TikTok" in federated.connectorStatuses);
    assert.ok("Instagram" in federated.connectorStatuses);
  });

  await t.test("8. Federated Search - Empty Query Returns Clean Empty Result", async () => {
    const res = await federatedSearch("   ");
    assert.equal(res.query, "");
    assert.equal(res.totalResults, 0);
    assert.equal(res.creators.length, 0);
  });

  await t.test("9. Zero Hardcoded Seed Catalog in Production Path", async () => {
    delete process.env.YOUTUBE_DATA_API_KEY;
    const res = await searchYouTube("unknown_creator_xyz", { bypassCache: true });
    assert.equal(res.items.length, 0);
    assert.equal(res.status, "unconfigured");

    // Test fixture creators are strictly in test fixtures scope
    assert.ok(TEST_FIXTURE_CREATORS.length > 0);
    assert.equal(TEST_FIXTURE_CREATORS[0].name, "CarryMinati");
  });

  await t.test("10. Search Quota Protection - Zero Charge When Providers Fail or Are Unconfigured", async () => {
    // When environment has no active keys and unconfigured connectors return empty
    delete process.env.YOUTUBE_DATA_API_KEY;
    delete process.env.TWITCH_CLIENT_ID;
    delete process.env.TWITCH_CLIENT_SECRET;

    const res = await federatedSearch("nonexistent_rare_query_xyz12345", { bypassCache: true });
    assert.equal(res.creators.length, 0);

    // Connector statuses track unconfigured and unsupported operations cleanly
    assert.equal(res.connectorStatuses.YouTube.status, "unconfigured");
    assert.equal(res.connectorStatuses.Twitch.status, "unconfigured");
    assert.equal(res.connectorStatuses.TikTok.status, "unsupported_operation");
    assert.equal(res.connectorStatuses.Instagram.status, "unsupported_operation");

    // In API route, chargeSearch is computed as succeededProviders.length > 0 && liveCreators.length > 0
    const succeededCount = Object.values(res.connectorStatuses).filter((s) => s.status === "success").length;
    const shouldCharge = succeededCount > 0 && res.creators.length > 0;
    assert.equal(shouldCharge, false, "Quota must NOT be charged when providers fail or return 0 live results");
  });

  await t.test("11. Multi-word keyword query auto-skips handle-only Kick connector cleanly", async () => {
    delete process.env.YOUTUBE_DATA_API_KEY;
    delete process.env.TWITCH_CLIENT_ID;
    delete process.env.TWITCH_CLIENT_SECRET;

    const res = await federatedSearch("Gaming streamers", { bypassCache: true });
    assert.equal(res.connectorStatuses.Kick.status, "unsupported_operation");
    assert.match(res.connectorStatuses.Kick.message || "", /handle/i);
  });

  await t.test("12. Federated Search reconciles connector itemCount with unique post-dedupe count", async () => {
    const dupeA: NormalizedCreator = {
      id: "dedupe-yt-1",
      platform: "YouTube",
      handle: "@DedupeChannel",
      name: "Dedupe Channel",
      profileUrl: "https://youtube.com/@DedupeChannel",
      avatarUrl: null,
      bio: "First copy",
      country: "United States",
      category: "Gaming",
      language: "English",
      followers: 50000,
      reach: 12000,
      reachMetric: "avg_views",
      businessContact: null,
      source: "YouTube Data API v3",
      fetchedAt: new Date().toISOString(),
      freshness: "Live",
      isLive: true,
    };

    const dupedResp: ConnectorResponse = {
      platform: "YouTube",
      status: "success",
      items: [dupeA, { ...dupeA, id: "dedupe-yt-2" }],
      capabilities: {
        platform: "YouTube",
        keywordDiscovery: true,
        exactHandleLookup: true,
        categoryDiscovery: false,
        liveStreamStatus: true,
        requiresOAuth: false,
        requiresApiKey: true,
        authType: "api_key",
        supportedMetrics: ["subscribers", "avg_views"],
        discoveryNote: "YouTube official API",
        authorizationRequirement: "API key",
      },
      fetchedAt: new Date().toISOString(),
      source: "YouTube Data API v3",
      isLive: true,
    };

    searchCache.set("youtube", "search", "dedupe_reconcile_query", dupedResp, 10000);
    const federated = await federatedSearch("dedupe_reconcile_query", { platform: "YouTube" });
    assert.equal(federated.creators.length, 1);
    assert.equal(federated.connectorStatuses.YouTube.itemCount, 1);
  });

  await t.test("13. Live Browse never fabricates YouTube or Twitch creators when keys are unconfigured", async () => {
    delete process.env.YOUTUBE_DATA_API_KEY;
    delete process.env.TWITCH_CLIENT_ID;
    delete process.env.TWITCH_CLIENT_SECRET;

    const browse = await getLiveBrowseCreators({ platform: "YouTube", category: "Gaming" });
    assert.equal(browse.creators.length, 0);
    assert.equal(browse.connectorStatuses.YouTube.status, "unconfigured");
  });

  await t.test("14. YouTube regional search (Brazil) paginates and keeps blank-country regional channels", async () => {
    const prevKey = process.env.YOUTUBE_DATA_API_KEY;
    const prevFetch = globalThis.fetch;
    process.env.YOUTUBE_DATA_API_KEY = "test-yt-key";

    let searchCalls = 0;
    globalThis.fetch = (async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/youtube/v3/search")) {
        searchCalls++;
        if (!url.includes("pageToken=PAGE2")) {
          return new Response(
            JSON.stringify({
              nextPageToken: "PAGE2",
              items: [{ id: { channelId: "UCbr1" } }, { id: { channelId: "UCbr2" } }],
            }),
            { status: 200 },
          );
        }
        return new Response(
          JSON.stringify({
            items: [{ id: { channelId: "UCbr3" } }],
          }),
          { status: 200 },
        );
      }
      if (url.includes("/youtube/v3/channels")) {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: "UCbr1",
                snippet: { title: "Canal Brasil 1", country: "BR", description: "Jogos e vlog" },
                statistics: { subscriberCount: "900000", viewCount: "90000000", videoCount: "100" },
              },
              {
                id: "UCbr2",
                snippet: { title: "Canal Sem Pais", defaultAudioLanguage: "pt-BR", description: "Conteudo diario" },
                statistics: { subscriberCount: "85000", viewCount: "4000000", videoCount: "50" },
              },
              {
                id: "UCbr3",
                snippet: { title: "Global US", country: "US", description: "English channel" },
                statistics: { subscriberCount: "2000000", viewCount: "50000000", videoCount: "100" },
              },
            ],
          }),
          { status: 200 },
        );
      }
      return new Response("{}", { status: 404 });
    }) as typeof fetch;

    try {
      const res = await searchYouTube("Brazil", {
        bypassCache: true,
        limit: 50,
        regionCode: "BR",
        relevanceLanguage: "pt",
      });
      assert.ok(searchCalls >= 2, "Expected nextPageToken pagination across Brazilian pages");
      const brChannels = res.items.filter((i) => i.country === "Brazil");
      assert.equal(brChannels.length, 2, "Both BR-tagged and blank-country BR channels stay attributed to Brazil");
      assert.equal(res.items.find((i) => i.id === "yt-UCbr3")?.country, "United States");
    } finally {
      globalThis.fetch = prevFetch;
      if (prevKey) process.env.YOUTUBE_DATA_API_KEY = prevKey;
      else delete process.env.YOUTUBE_DATA_API_KEY;
    }
  });

  await t.test("15. YouTube <=100K search expands to emerging queries & recent channels when relevance is mega-only", async () => {
    const prevKey = process.env.YOUTUBE_DATA_API_KEY;
    const prevFetch = globalThis.fetch;
    process.env.YOUTUBE_DATA_API_KEY = "test-yt-key";

    const seenQueries: string[] = [];
    globalThis.fetch = (async (input: string | URL | Request) => {
      const url = new URL(String(input));
      if (url.pathname.includes("/youtube/v3/search")) {
        const q = url.searchParams.get("q") || "";
        const order = url.searchParams.get("order") || "relevance";
        seenQueries.push(`${q}|${order}`);
        if (order === "date") {
          return new Response(
            JSON.stringify({ items: [{ id: { channelId: "UCsmall1" } }, { id: { channelId: "UCsmall2" } }] }),
            { status: 200 },
          );
        }
        return new Response(
          JSON.stringify({ items: [{ id: { channelId: "UCmega1" } }] }),
          { status: 200 },
        );
      }
      if (url.pathname.includes("/youtube/v3/channels")) {
        const ids = (url.searchParams.get("id") || "").split(",");
        return new Response(
          JSON.stringify({
            items: ids.map((id) =>
              id.startsWith("UCsmall")
                ? {
                    id,
                    snippet: { title: `Indie ${id}`, description: "Creator" },
                    statistics: { subscriberCount: "48000", viewCount: "1200000", videoCount: "30" },
                  }
                : {
                    id,
                    snippet: { title: "Mega 10M", description: "Big" },
                    statistics: { subscriberCount: "10000000", viewCount: "500000000", videoCount: "200" },
                  },
            ),
          }),
          { status: 200 },
        );
      }
      return new Response("{}", { status: 404 });
    }) as typeof fetch;

    try {
      const res = await searchYouTube("gaming", {
        bypassCache: true,
        limit: 50,
        maxFollowers: 100_000,
      });
      assert.ok(seenQueries.some((entry) => entry.endsWith("|date")), "Expected recent-activity fallback for <=100K filter");
      const under100k = res.items.filter((i) => i.followers !== null && i.followers <= 100_000);
      assert.equal(under100k.length, 2, "Returned emerging <100K channels cleanly");
    } finally {
      globalThis.fetch = prevFetch;
      if (prevKey) process.env.YOUTUBE_DATA_API_KEY = prevKey;
      else delete process.env.YOUTUBE_DATA_API_KEY;
    }
  });

  await t.test("16. YouTube Creator OAuth URL builder, Analytics report parser & creator record sync", async () => {
    const prevFetch = globalThis.fetch;

    const authUrl = buildGoogleOAuthAuthorizeUrl(
      "https://get-viral.vercel.app/api/oauth/youtube/callback",
      "signed-state-token",
      { clientId: "test-client-id.apps.googleusercontent.com", clientSecret: "test-secret" },
    );
    const parsedAuth = new URL(authUrl);
    assert.equal(parsedAuth.origin, "https://accounts.google.com");
    assert.equal(parsedAuth.searchParams.get("client_id"), "test-client-id.apps.googleusercontent.com");
    assert.equal(parsedAuth.searchParams.get("redirect_uri"), "https://get-viral.vercel.app/api/oauth/youtube/callback");
    assert.equal(parsedAuth.searchParams.get("state"), "signed-state-token");
    assert.ok(parsedAuth.searchParams.get("scope")?.includes("yt-analytics.readonly"));

    globalThis.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("www.googleapis.com/youtube/v3/channels")) {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: "UCauthStudio123",
                snippet: {
                  title: "Creator Studio Lab",
                  customUrl: "@creatorstudiolab",
                  description: "Tech tutorials and analytics workflows",
                  country: "US",
                  defaultLanguage: "en",
                  thumbnails: { high: { url: "https://example.com/avatar.jpg" } },
                },
                statistics: {
                  subscriberCount: "125000",
                  viewCount: "6200000",
                  videoCount: "62",
                },
                topicDetails: {
                  topicCategories: ["https://en.wikipedia.org/wiki/Technology"],
                },
              },
            ],
          }),
          { status: 200 },
        );
      }

      if (url.includes("youtubeanalytics.googleapis.com/v2/reports")) {
        const parsed = new URL(url);
        const dims = parsed.searchParams.get("dimensions") ?? "";

        if (!dims) {
          return new Response(
            JSON.stringify({
              rows: [[450000, 1200000, 160, 18500, 1400, 620, 3400, 320]],
            }),
            { status: 200 },
          );
        }
        if (dims === "day") {
          return new Response(
            JSON.stringify({
              rows: [
                ["2026-11-26", 18000, 48000, 140],
                ["2026-11-27", 24000, 64000, 195],
              ],
            }),
            { status: 200 },
          );
        }
        if (dims === "country") {
          return new Response(
            JSON.stringify({
              rows: [
                ["US", 225000, 600000],
                ["IN", 135000, 360000],
              ],
            }),
            { status: 200 },
          );
        }
        if (dims === "ageGroup,gender") {
          return new Response(
            JSON.stringify({
              rows: [
                ["age18-24", "male", 34.2],
                ["age25-34", "female", 26.8],
              ],
            }),
            { status: 200 },
          );
        }
        if (dims === "insightTrafficSourceType") {
          return new Response(
            JSON.stringify({
              rows: [
                ["SUBSCRIBER", 200000, 520000],
                ["YT_SEARCH", 150000, 410000],
              ],
            }),
            { status: 200 },
          );
        }
      }

      return new Response("{}", { status: 404 });
    }) as typeof fetch;

    try {
      const channel = await fetchOwnedYouTubeChannel("mock-access-token");
      assert.equal(channel.creatorId, "yt-UCauthStudio123");
      assert.equal(channel.handle, "@creatorstudiolab");
      assert.equal(channel.subscribers, 125000);
      assert.equal(channel.avgViews, 100000);

      const report = await fetchYouTubeAnalyticsReport("mock-access-token", channel, 28);
      assert.equal(report.rangeDays, 28);
      assert.equal(report.summary.views, 450000);
      assert.equal(report.summary.watchTimeHours, 20000);
      assert.equal(report.summary.netSubscribers, 3080);
      assert.equal(report.dailySeries.length, 2);
      assert.equal(report.countries[0]?.countryName, "United States");
      assert.equal(report.countries[0]?.sharePercent, 62.5);
      assert.equal(report.countries[1]?.countryName, "India");
      assert.equal(report.countries[1]?.sharePercent, 37.5);
      assert.equal(report.demographics[0]?.label, "Male · 18–24");
      assert.equal(report.trafficSources[0]?.label, "Home & Subscriptions Feed");
      assert.equal(report.trafficSources[1]?.label, "YouTube Search");

      const creator = buildAuthorizedCreatorRecord(report);
      assert.equal(creator.id, "yt-UCauthStudio123");
      assert.equal(creator.avatar, "https://example.com/avatar.jpg");
      assert.ok(creator.audienceInsights.every((i) => i.status === "creator_authorized"));
      assert.ok(creator.audienceInsights.some((i) => i.dimension === "country" && i.value === "United States"));
    } finally {
      globalThis.fetch = prevFetch;
    }
  });

  // Restore env vars
  if (origYtKey) process.env.YOUTUBE_DATA_API_KEY = origYtKey;
  if (origTwitchId) process.env.TWITCH_CLIENT_ID = origTwitchId;
  if (origTwitchSecret) process.env.TWITCH_CLIENT_SECRET = origTwitchSecret;
});
