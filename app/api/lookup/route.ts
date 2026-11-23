import { NextResponse } from "next/server";
import { providers } from "@/lib/providers";
import type { Platform } from "@/lib/model";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = (searchParams.get("platform") || "YouTube") as Platform;
  const handle = searchParams.get("handle");

  if (!handle) {
    return NextResponse.json({ error: "Handle query parameter is required." }, { status: 400 });
  }

  const provider = providers[platform];
  if (!provider) {
    return NextResponse.json({ error: `Platform ${platform} is not supported.` }, { status: 400 });
  }

  try {
    const creator = await provider.getCreator(handle);
    const fetchedAt = new Date().toISOString();
    const source = creator.source || `${platform} Verified Catalog Snapshot`;
    const dataFreshness = creator.source?.includes("API")
      ? "Live Platform API Response"
      : "Verified Catalog Baseline (Snapshot)";

    return NextResponse.json({
      success: true,
      platform,
      source,
      fetchedAt,
      dataFreshness,
      providerMode: provider.mode,
      coverageNote: provider.coverageNote,
      creator: {
        ...creator,
        source,
        fetchedAt,
        dataFreshness,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        platform,
        error: error instanceof Error ? error.message : "Failed to lookup creator on platform.",
      },
      { status: 500 },
    );
  }
}
