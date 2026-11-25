import { NextResponse } from "next/server";
import type { Platform } from "@/lib/model";
import { searchYouTube } from "@/lib/connectors/youtube";
import { searchTwitch } from "@/lib/connectors/twitch";
import { lookupKick } from "@/lib/connectors/kick";
import { searchTikTok } from "@/lib/connectors/tiktok";
import { searchInstagram } from "@/lib/connectors/instagram";
import { attachGuestCookie, resolveServerSession } from "@/lib/auth/server-session";
import {
  attachQuotaCookie,
  checkServerQuotaAvailable,
  consumeServerQuota,
} from "@/lib/quota/server-quota";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = (searchParams.get("platform") || "YouTube") as Platform;
  const handle = searchParams.get("handle");
  const mode = searchParams.get("mode") || "lookup"; // "probe" for read-only connectivity checks

  if (!handle) {
    return NextResponse.json({ error: "Handle query parameter is required." }, { status: 400 });
  }

  const session = await resolveServerSession(request);
  const quotaCheck = await checkServerQuotaAvailable(session);

  if (mode !== "probe" && !quotaCheck.allowed) {
    const res = NextResponse.json(
      {
        success: false,
        platform,
        quotaExhausted: true,
        error: "Monthly search quota exhausted (0 searches remaining).",
        subscription: quotaCheck.subscription,
      },
      { status: 429 },
    );
    attachGuestCookie(res, session);
    attachQuotaCookie(res, session, quotaCheck.subscription);
    return res;
  }

  const cleanHandle = handle.trim();
  const now = new Date().toISOString();

  try {
    let result;
    if (platform === "YouTube") {
      result = await searchYouTube(cleanHandle, { bypassCache: true, limit: 1 });
    } else if (platform === "Twitch") {
      result = await searchTwitch(cleanHandle, { bypassCache: true, limit: 1 });
    } else if (platform === "Kick") {
      result = await lookupKick(cleanHandle, { bypassCache: true });
    } else if (platform === "TikTok") {
      result = await searchTikTok(cleanHandle);
    } else if (platform === "Instagram") {
      result = await searchInstagram(cleanHandle);
    } else {
      return NextResponse.json({ error: `Platform ${platform} is not supported.` }, { status: 400 });
    }

    if (result.status === "unconfigured") {
      const res = NextResponse.json({
        success: false,
        platform,
        status: "unconfigured",
        chargeSearch: false,
        subscription: quotaCheck.subscription,
        error: result.message || `${platform} connector is not configured with required API credentials.`,
        capabilities: result.capabilities,
      }, { status: 200 });
      attachGuestCookie(res, session);
      attachQuotaCookie(res, session, quotaCheck.subscription);
      return res;
    }

    if (result.status === "unsupported_operation") {
      const res = NextResponse.json({
        success: false,
        platform,
        status: "unsupported_operation",
        chargeSearch: false,
        subscription: quotaCheck.subscription,
        error: result.message || `${platform} API does not support this query type.`,
        capabilities: result.capabilities,
      }, { status: 200 });
      attachGuestCookie(res, session);
      attachQuotaCookie(res, session, quotaCheck.subscription);
      return res;
    }

    if (result.status === "rate_limited") {
      return NextResponse.json({
        success: false,
        platform,
        status: "rate_limited",
        chargeSearch: false,
        error: result.message || `${platform} API rate limit exceeded.`,
        capabilities: result.capabilities,
      }, { status: 429 });
    }

    if (result.status === "error") {
      return NextResponse.json({
        success: false,
        platform,
        status: "error",
        chargeSearch: false,
        error: result.message || `Failed to lookup channel on ${platform}.`,
        capabilities: result.capabilities,
      }, { status: 502 });
    }

    const creator = result.items[0] || null;

    if (!creator) {
      return NextResponse.json({
        success: false,
        platform,
        chargeSearch: false,
        error: `No channel found for handle "${cleanHandle}" on ${platform}.`,
        source: result.source,
        fetchedAt: now,
        dataFreshness: "Live Platform API Response",
        isLive: true,
      }, { status: 404 });
    }

    // Charge quota ONLY on live discovery lookups that return real data
    const chargeSearch = mode === "charge" || mode === "discover";
    const latestSub = chargeSearch
      ? await consumeServerQuota(session)
      : quotaCheck.subscription;

    const res = NextResponse.json({
      success: true,
      platform,
      source: result.source,
      fetchedAt: result.fetchedAt,
      dataFreshness: creator.freshness,
      isLive: result.isLive,
      chargeSearch,
      subscription: latestSub,
      creator,
    });
    attachGuestCookie(res, session);
    attachQuotaCookie(res, session, latestSub);
    return res;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        platform,
        error: error instanceof Error ? error.message : "Failed to execute platform lookup.",
      },
      { status: 500 },
    );
  }
}
