import test from "node:test";
import assert from "node:assert/strict";

import {
  createSignedGuestToken,
  parseCookieValue,
  signValue,
  verifySignedValue,
} from "../lib/auth/tokens";
import { getDefaultSubscription, SUBSCRIPTION_TIERS } from "../lib/subscription";
import { refreshSavedCreatorsFromConnectors } from "../lib/api-fetcher";
import { INTEGRATIONS } from "../lib/integrations";

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
});
