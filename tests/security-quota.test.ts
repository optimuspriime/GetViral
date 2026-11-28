import test from "node:test";
import assert from "node:assert/strict";

import {
  createSignedGuestToken,
  decryptJsonValue,
  encryptJsonValue,
  hashClientIp,
  isAdminEmail,
  parseCookieValue,
  signValue,
  verifySignedValue,
} from "../lib/auth/tokens";
import { getDefaultSubscription, GUEST_PREVIEW_QUOTA, SUBSCRIPTION_TIERS } from "../lib/subscription";
import { refreshSavedCreatorsFromConnectors } from "../lib/api-fetcher";
import { INTEGRATIONS } from "../lib/integrations";
import { detectCreatorCountry } from "../lib/country-detector";
import {
  detectCreatorLanguage,
  extractYouTubeCategory,
  resolveCountryToIso,
  resolveLanguageToIso,
} from "../lib/creator-metadata";
import { sanitizePublicSourceLabel } from "../lib/public-labels";
import { sanitizePublicErrorMessage } from "../lib/server-sanitize";
import { currentReach } from "../lib/metrics";

test("Security, Auth Token, Quota & Sync Integrity Suite", async (t) => {
  await t.test("1. Signed Guest Tokens reject tampering and invalid signatures", () => {
    const { guestId, signedToken } = createSignedGuestToken();
    assert.ok(guestId.startsWith("guest:"));

    const verified = verifySignedValue(signedToken);
    assert.equal(verified, guestId);

    // Tamper signature
    const [encoded, sig] = signedToken.split(".");
    const badSig = `${encoded}.${sig.slice(0, -2)}XX`;
    assert.equal(verifySignedValue(badSig), null);

    // Tamper payload
    const forgedPayload = Buffer.from("user:admin-uuid", "utf8").toString("base64url");
    assert.equal(verifySignedValue(`${forgedPayload}.${sig}`), null);

    // Reject unsigned / malformed values
    assert.equal(verifySignedValue("guest:fake"), null);
    assert.equal(verifySignedValue(""), null);
    assert.equal(verifySignedValue(null), null);
  });

  await t.test("2. Quota Cookie Payload Signing rejects arbitrary quota inflation", () => {
    const payload = JSON.stringify({
      k: "guest:1234",
      p: "free",
      r: 45,
      t: 50,
      u: "2026-11-25T00:00:00.000Z",
    });
    const signed = signValue(payload);
    assert.equal(verifySignedValue(signed), payload);

    // Client trying to replace remaining=999 with old signature fails verification
    const [, sig] = signed.split(".");
    const inflated = Buffer.from(
      JSON.stringify({ k: "guest:1234", p: "unlimited", r: 999999, t: -1 }),
      "utf8",
    ).toString("base64url");
    assert.equal(verifySignedValue(`${inflated}.${sig}`), null);
  });

  await t.test("3. Cookie header parsing decodes URI values accurately", () => {
    const header = "foo=bar; gv_guest_id=dGVzdA%3D%3D.abc123; other=1";
    assert.equal(parseCookieValue(header, "gv_guest_id"), "dGVzdA==.abc123");
    assert.equal(parseCookieValue(header, "missing"), null);
  });

  await t.test("4. Subscription tier copy contains no legacy 1,035+ directory claims", () => {
    const freeTier = SUBSCRIPTION_TIERS.find((tier) => tier.id === "free");
    assert.ok(freeTier);
    assert.equal(freeTier.searchQuota, 50);
    assert.equal(
      freeTier.features.some((f) => f.includes("1,035") || f.includes("1,042")),
      false,
      "Features must not claim a fixed 1,035+ creator directory",
    );

    const def = getDefaultSubscription("free");
    assert.equal(def.searchesRemaining, 50);
    assert.equal(def.totalQuota, 50);
  });

  await t.test("5. Integrations declaration does not claim public lookup for TikTok or Instagram", () => {
    const tiktok = INTEGRATIONS.find((i) => i.platform === "TikTok");
    const ig = INTEGRATIONS.find((i) => i.platform === "Instagram");
    assert.ok(tiktok && ig);
    assert.equal(tiktok.supportsLiveDiscovery, false);
    assert.equal(tiktok.supportsHandleLookup, false);
    assert.equal(tiktok.requiresCreatorOAuth, true);
    assert.equal(ig.supportsLiveDiscovery, false);
    assert.equal(ig.supportsHandleLookup, false);
    assert.equal(ig.requiresCreatorOAuth, true);
  });

  await t.test("6. Live Sync only refreshes explicitly saved creators and never fabricates data", async () => {
    const emptySync = await refreshSavedCreatorsFromConnectors([]);
    assert.equal(emptySync.creators.length, 0);
    assert.equal(emptySync.stats.totalSynced, 0);
  });

  await t.test("7. Guest Preview quota defaults to 5 and hashes client IPs deterministically", () => {
    assert.equal(GUEST_PREVIEW_QUOTA, 5);
    const guestSub = getDefaultSubscription("free", true);
    assert.equal(guestSub.totalQuota, 5);
    assert.equal(guestSub.searchesRemaining, 5);

    const authSub = getDefaultSubscription("free", false);
    assert.equal(authSub.totalQuota, 50);
    assert.equal(authSub.searchesRemaining, 50);

    const ipHashA1 = hashClientIp("203.0.113.42");
    const ipHashA2 = hashClientIp("203.0.113.42");
    const ipHashB = hashClientIp("198.51.100.7");
    assert.equal(ipHashA1, ipHashA2);
    assert.notEqual(ipHashA1, ipHashB);
    assert.equal(ipHashA1.length, 24);
  });

  await t.test("8. Admin role check enforces ADMIN_EMAILS allowlist and TikTok copy has no Meta text", () => {
    const prevAdmins = process.env.ADMIN_EMAILS;
    try {
      delete process.env.ADMIN_EMAILS;
      assert.equal(isAdminEmail("admin@getviral.io"), false);
      assert.equal(isAdminEmail(null), false);

      process.env.ADMIN_EMAILS = " founder@getviral.io , ops@getviral.io ";
      assert.equal(isAdminEmail("Founder@GetViral.io"), true);
      assert.equal(isAdminEmail("ops@getviral.io"), true);
      assert.equal(isAdminEmail("guest@example.com"), false);
    } finally {
      if (prevAdmins === undefined) {
        delete process.env.ADMIN_EMAILS;
      } else {
        process.env.ADMIN_EMAILS = prevAdmins;
      }
    }

    const tiktok = INTEGRATIONS.find((i) => i.platform === "TikTok");
    assert.ok(tiktok);
    assert.equal(tiktok.connectorStatus.includes("Meta"), false);
    assert.equal(tiktok.setup.includes("Meta"), false);
    assert.equal(tiktok.limitation.includes("Meta"), false);
    assert.equal(tiktok.statusNote.includes("Meta"), false);
  });

  await t.test("9. Country detector returns null for unknown regions instead of defaulting to India", () => {
    assert.equal(detectCreatorCountry("adinross", "AdinRoss", "Kick streamer"), null);
    assert.equal(detectCreatorCountry("xqc", "xQc", "Variety stream"), null);
    assert.equal(detectCreatorCountry("carryminati", "CarryMinati", "Hindi comedy creator"), "India");
    assert.equal(detectCreatorCountry("creatorusa", "LA Vlog", "Los Angeles, California"), "United States");
  });

  await t.test("10. YouTube currentReach resolves both avg_video_views and avg_views snapshots", () => {
    const commonAccount = {
      id: "yt-1",
      platform: "YouTube" as const,
      handle: "@mrbeast",
      profileUrl: "https://www.youtube.com/@mrbeast",
      activity: "Active",
    };

    assert.equal(
      currentReach({
        ...commonAccount,
        snapshots: [
          {
            id: "s1",
            metricName: "avg_video_views",
            value: 145000000,
            unit: "views",
            collectedAt: "2026-11-26T00:00:00.000Z",
            windowStart: null,
            windowEnd: null,
            periodLabel: null,
            sampleSize: 10,
            source: "YouTube Data API v3",
            status: "public",
          },
        ],
      }),
      145000000,
    );

    assert.equal(
      currentReach({
        ...commonAccount,
        snapshots: [
          {
            id: "s2",
            metricName: "avg_views",
            value: 92000000,
            unit: "views",
            collectedAt: "2026-11-26T00:00:00.000Z",
            windowStart: null,
            windowEnd: null,
            periodLabel: null,
            sampleSize: 10,
            source: "YouTube Data API v3",
            status: "public",
          },
        ],
      }),
      92000000,
    );
  });

  await t.test("11. Creator language & category metadata extract real Hindi/Gaming signals accurately", () => {
    assert.equal(detectCreatorLanguage("hi-IN"), "Hindi");
    assert.equal(detectCreatorLanguage("hi"), "Hindi");
    assert.equal(
      detectCreatorLanguage(null, null, "नमस्ते दोस्तों गेमिंग चैनल में स्वागत है"),
      "Hindi",
    );
    assert.equal(detectCreatorLanguage(null, null, "Tech reviews channel"), "English");
    assert.equal(detectCreatorLanguage(null, null, ""), null);

    assert.equal(
      extractYouTubeCategory(["https://en.wikipedia.org/wiki/Video_game_culture"]),
      "Gaming",
    );
    assert.equal(
      extractYouTubeCategory(["https://en.wikipedia.org/wiki/Technology"]),
      "Technology",
    );
    assert.equal(resolveCountryToIso("India"), "IN");
    assert.equal(resolveLanguageToIso("Hindi"), "hi");
  });

  await t.test("12. Public label sanitizer strips internal API versions, env names, and endpoint leaks", () => {
    assert.equal(sanitizePublicSourceLabel("YouTube", "YouTube Data API v3"), "YouTube Public Channel");
    assert.equal(sanitizePublicSourceLabel("Kick", "Kick API v2"), "Kick Public Channel");
    assert.equal(sanitizePublicSourceLabel("Twitch", "Twitch Helix API"), "Twitch Public Channel");

    const sanitizedMissingKey = sanitizePublicErrorMessage(
      "Set YOUTUBE_DATA_API_KEY in server environment variables",
      "YouTube",
    );
    assert.equal(sanitizedMissingKey.includes("YOUTUBE_DATA_API_KEY"), false);

    const sanitizedVersion = sanitizePublicErrorMessage(
      "TikTok Display API requires user token under Graph API v3",
      "TikTok",
    );
    assert.equal(/\bAPI\b|\bv3\b|\bHelix\b/i.test(sanitizedVersion), false);
  });

  await t.test("13. AES-256-GCM JSON token encryption roundtrips and rejects tampered ciphertexts", () => {
    const payload = {
      ownerKey: "guest:123",
      accessToken: "ya29.test-access-token",
      refreshToken: "1//test-refresh-token",
      channelId: "UCtest",
    };

    const encrypted = encryptJsonValue(payload);
    assert.equal(encrypted.includes("ya29.test-access-token"), false);
    assert.equal(encrypted.includes("1//test-refresh-token"), false);

    const decrypted = decryptJsonValue<typeof payload>(encrypted);
    assert.deepEqual(decrypted, payload);

    // Tamper encrypted ciphertext
    const parts = encrypted.split(".");
    assert.equal(parts.length, 3);
    const corrupted = `${parts[0]}.${parts[1]}.${parts[2].slice(0, -4)}XXXX`;
    assert.equal(decryptJsonValue<typeof payload>(corrupted), null);

    // Preserves Creator-Authorized public source label cleanly
    assert.equal(
      sanitizePublicSourceLabel("YouTube", "YouTube Creator-Authorized Analytics"),
      "YouTube Creator-Authorized Analytics",
    );
  });
});
