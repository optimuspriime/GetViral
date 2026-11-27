import { NextResponse } from "next/server";
import type { Platform } from "@/lib/model";
import { searchYouTube } from "@/lib/connectors/youtube";
import { searchTwitch } from "@/lib/connectors/twitch";
import { lookupKick } from "@/lib/connectors/kick";
import { searchTikTok } from "@/lib/connectors/tiktok";
import { searchInstagram } from "@/lib/connectors/instagram";
import { sanitizePublicSourceLabel } from "@/lib/public-labels";
import { sanitizePublicErrorMessage } from "@/lib/server-sanitize";
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

  const cleanHandle = handle.trim().slice(0, 80);
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

    const sanitizedCapabilities = {
      platform: result.capabilities.platform,
      keywordDiscovery: result.capabilities.keywordDiscovery,
      exactHandleLookup: result.capabilities.exactHandleLookup,
      requiresOAuth: result.capabilities.requiresOAuth,
    };

    if (result.status === "unconfigured") {
      const publicError = `${platform} channel lookup is temporarily pending activation.`;
      const res = NextResponse.json(
        {
          success: false,
          platform,
          status: "unconfigured",
          chargeSearch: false,
          subscription: quotaCheck.subscription,
          error: publicError,
          capabilities: sanitizedCapabilities,
        },
        { status: 200 },
      );
      attachGuestCookie(res, session);
      attachQuotaCookie(res, session, quotaCheck.subscription);
      return res;
    }

    if (result.status === "unsupported_operation") {
      const res = NextResponse.json(
        {
          success: false,
          platform,
          status: "unsupported_operation",
          chargeSearch: false,
          subscription: quotaCheck.subscription,
          error: sanitizePublicErrorMessage(
            result.message,
            platform,
            `${platform} does not support this lookup mode.`,
          ),
          capabilities: sanitizedCapabilities,
        },
        { status: 200 },
      );
      attachGuestCookie(res, session);
      attachQuotaCookie(res, session, quotaCheck.subscription);
      return res;
    }

    if (result.status === "rate_limited") {
      return NextResponse.json(
        {
          success: false,
          platform,
          status: "rate_limited",
          chargeSearch: false,
          error: `${platform} search capacity is temporarily busy. Please try again shortly.`,
          capabilities: sanitizedCapabilities,
        },
        { status: 429 },
      );
    }

    if (result.status === "error") {
      return NextResponse.json(
        {
          success: false,
          platform,
          status: "error",
          chargeSearch: false,
          error: sanitizePublicErrorMessage(
            result.message,
            platform,
            `Failed to look up channel on ${platform}.`,
          ),
          capabilities: sanitizedCapabilities,
        },
        { status: 502 },
      );
    }

    const rawCreator = result.items[0] || null;
    const publicSource = sanitizePublicSourceLabel(platform, result.source);

    if (!rawCreator) {
      return NextResponse.json(
        {
          success: false,
          platform,
          chargeSearch: false,
          error: `No channel found for handle "${cleanHandle}" on ${platform}.`,
          source: publicSource,
          fetchedAt: now,
          dataFreshness: "Live Channel Snapshot",
          isLive: true,
        },
        { status: 404 },
      );
    }

    const creator = {
      ...rawCreator,
      source: sanitizePublicSourceLabel(platform, rawCreator.source),
      freshness: "Live Channel Snapshot",
    };

    // Charge quota ONLY on live discovery lookups that return real data
    const chargeSearch = mode === "charge" || mode === "discover";
    const latestSub = chargeSearch
      ? await consumeServerQuota(session)
      : quotaCheck.subscription;

    const res = NextResponse.json({
      success: true,
      platform,
      source: publicSource,
      fetchedAt: result.fetchedAt,
      dataFreshness: "Live Channel Snapshot",
      isLive: result.isLive,
      chargeSearch,
      subscription: latestSub,
      creator,
    });
    attachGuestCookie(res, session);
    attachQuotaCookie(res, session, latestSub);
    return res;
  } catch (error) {
    console.error("[lookup] unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        platform,
        error: "Failed to complete channel lookup. Please try again.",
      },
      { status: 500 },
    );
  }
}
