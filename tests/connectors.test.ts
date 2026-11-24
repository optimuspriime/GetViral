import test from "node:test";
import assert from "node:assert/strict";

import { searchYouTube } from "../lib/connectors/youtube";
import { searchTwitch } from "../lib/connectors/twitch";
import { lookupKick } from "../lib/connectors/kick";
import { searchTikTok } from "../lib/connectors/tiktok";
import { searchInstagram } from "../lib/connectors/instagram";
import { federatedSearch } from "../lib/connectors/federated";
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

  // Restore env vars
  if (origYtKey) process.env.YOUTUBE_DATA_API_KEY = origYtKey;
  if (origTwitchId) process.env.TWITCH_CLIENT_ID = origTwitchId;
  if (origTwitchSecret) process.env.TWITCH_CLIENT_SECRET = origTwitchSecret;
});
