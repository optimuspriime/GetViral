import { NextResponse } from "next/server";
import type { Platform } from "@/lib/model";
import { searchYouTube } from "@/lib/connectors/youtube";
import { searchTwitch } from "@/lib/connectors/twitch";
import { lookupKick } from "@/lib/connectors/kick";
import { searchTikTok } from "@/lib/connectors/tiktok";
import { searchInstagram } from "@/lib/connectors/instagram";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = (searchParams.get("platform") || "YouTube") as Platform;
  const handle = searchParams.get("handle");

  if (!handle) {
    return NextResponse.json({ error: "Handle query parameter is required." }, { status: 400 });
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
      return NextResponse.json({
        success: false,
        platform,
        status: "unconfigured",
        error: result.message || `${platform} connector is not configured with required API credentials.`,
        capabilities: result.capabilities,
      }, { status: 200 }); // Return 200 with clear unconfigured payload for sandbox
    }

    if (result.status === "unsupported_operation") {
      return NextResponse.json({
        success: false,
        platform,
        status: "unsupported_operation",
        error: result.message || `${platform} API does not support this query type.`,
        capabilities: result.capabilities,
      }, { status: 200 });
    }

    if (result.status === "rate_limited") {
      return NextResponse.json({
        success: false,
        platform,
        status: "rate_limited",
        error: result.message || `${platform} API rate limit exceeded.`,
        capabilities: result.capabilities,
      }, { status: 429 });
    }

    if (result.status === "error") {
      return NextResponse.json({
        success: false,
        platform,
        status: "error",
        error: result.message || `Failed to lookup channel on ${platform}.`,
        capabilities: result.capabilities,
      }, { status: 502 });
    }

    const creator = result.items[0] || null;

    if (!creator) {
      return NextResponse.json({
        success: false,
        platform,
        error: `No channel found for handle "${cleanHandle}" on ${platform}.`,
        source: result.source,
        fetchedAt: now,
        dataFreshness: "Live Platform API Response",
        isLive: true,
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      platform,
      source: result.source,
      fetchedAt: result.fetchedAt,
      dataFreshness: creator.freshness,
      isLive: result.isLive,
      creator,
    });
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
