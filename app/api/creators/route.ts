import { NextResponse } from "next/server";
import { REAL_CREATORS } from "@/lib/real-creators";
import type { Creator } from "@/lib/model";
import { currentFollowers, currentReach } from "@/lib/metrics";
import { loadCreatorsFromSupabase, saveCreatorsToSupabase } from "@/lib/supabase/db-sync";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase().trim() || "";
  const platform = searchParams.get("platform");
  const category = searchParams.get("category");
  const country = searchParams.get("country");
  const minFollowers = searchParams.get("minFollowers");
  const maxFollowers = searchParams.get("maxFollowers");
  const sort = searchParams.get("sort") || "name";

  // Attempt loading from Supabase Database if connected
  let baseList: Creator[] = REAL_CREATORS;
  try {
    const dbCreators = await loadCreatorsFromSupabase();
    if (dbCreators && dbCreators.length > 0) {
      baseList = dbCreators;
    }
  } catch {
    // Fallback to verified catalog
  }

  let filtered = [...baseList];

  if (q) {
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        c.accounts.some((a) => a.handle.toLowerCase().includes(q)),
    );
  }

  if (platform && platform !== "All platforms") {
    filtered = filtered.filter((c) =>
      c.accounts.some((a) => a.platform.toLowerCase() === platform.toLowerCase()),
    );
  }

  if (category && category !== "All categories") {
    filtered = filtered.filter((c) => c.category === category);
  }

  if (country) {
    filtered = filtered.filter((c) =>
      c.creatorCountry?.toLowerCase().includes(country.toLowerCase()),
    );
  }

  if (minFollowers || maxFollowers) {
    const min = minFollowers ? parseInt(minFollowers, 10) : 0;
    const max = maxFollowers ? parseInt(maxFollowers, 10) : Infinity;
    filtered = filtered.filter((c) =>
      c.accounts.some((a) => {
        const followers = currentFollowers(a);
        return followers !== null && followers >= min && followers <= max;
      }),
    );
  }

  filtered.sort((a, b) => {
    if (sort === "followers") {
      const aMax = Math.max(...a.accounts.map((acc) => currentFollowers(acc) ?? 0));
      const bMax = Math.max(...b.accounts.map((acc) => currentFollowers(acc) ?? 0));
      return bMax - aMax;
    }
    if (sort === "reach") {
      const aMax = Math.max(...a.accounts.map((acc) => currentReach(acc) ?? 0));
      const bMax = Math.max(...b.accounts.map((acc) => currentReach(acc) ?? 0));
      return bMax - aMax;
    }
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({
    total: filtered.length,
    creators: filtered,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<Creator>;
    if (!body.name || !body.accounts || body.accounts.length === 0) {
      return NextResponse.json(
        { error: "Creator name and at least one platform account are required." },
        { status: 400 },
      );
    }

    const newCreator: Creator = {
      id: body.id || `creator-user-${Date.now()}`,
      name: body.name,
      category: body.category ?? "General",
      language: body.language ?? "English",
      creatorCountry: body.creatorCountry ?? "Global",
      creatorCountrySource: body.creatorCountrySource ?? "User Submitted Record",
      bio: body.bio ?? "",
      avatar: body.avatar ?? "",
      accounts: body.accounts,
      audienceInsights: body.audienceInsights ?? [],
      businessContact: body.businessContact ?? null,
    };

    // Save to Supabase if connected
    try {
      await saveCreatorsToSupabase([newCreator]);
    } catch (saveErr) {
      console.warn("Could not save creator to Supabase:", saveErr);
    }

    return NextResponse.json(newCreator, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid creator payload." }, { status: 400 });
  }
}
