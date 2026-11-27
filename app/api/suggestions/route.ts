import { NextResponse } from "next/server";
import { searchCache } from "@/lib/connectors/cache";

const HINT_TTL_MS = 5 * 60 * 1000;
const hintCache = new Map<string, { items: string[]; expiresAt: number }>();

const CURATED_CREATOR_AND_TOPIC_HINTS = [
  "MrBeast",
  "MrBeast Gaming",
  "Mrwhosetheboss",
  "Marques Brownlee",
  "CarryMinati",
  "CaseOh",
  "Casey Neistat",
  "CarterPCS",
  "Camila",
  "Callum",
  "Caylus",
  "Carl",
  "PewDiePie",
  "Pokimane",
  "Pewds",
  "Kai Cenat",
  "Karl Jacobs",
  "Kevin Langue",
  "IShowSpeed",
  "Adin Ross",
  "xQc",
  "Shroud",
  "Ninja",
  "Nickmercs",
  "TimTheTatman",
  "SypherPK",
  "Ludwig",
  "HasanAbi",
  "Valkyrae",
  "Techno Gamerz",
  "Total Gaming",
  "Triggered Insaan",
  "Fukra Insaan",
  "Sourav Joshi Vlogs",
  "Mythpat",
  "BB Ki Vines",
  "Ashish Chanchlani",
  "Technical Guruji",
  "Tanmay Bhat",
  "Samay Raina",
  "Mark Rober",
  "Ryan Trahan",
  "Airrack",
  "Dude Perfect",
  "Linus Tech Tips",
  "MKBHD",
  "Veritasium",
  "Sidemen",
  "KSIOlajidebt",
  "Logan Paul",
  "Speed",
  "Gaming streamers",
  "Tech reviews",
  "Comedy creators",
  "Podcast hosts",
  "Fitness influencers",
  "Finance creators",
  "Music artists",
  "Beauty & fashion",
  "Food & travel vlogs",
  "Esports players",
];

function rankAndFilterHints(candidates: Iterable<string>, query: string, limit = 8): string[] {
  const qLower = query.toLowerCase().replace(/^@+/, "");
  const isAtHandle = query.startsWith("@");
  const seen = new Set<string>();
  const prefixMatches: string[] = [];
  const containsMatches: string[] = [];

  for (const raw of candidates) {
    const clean = raw.trim();
    if (!clean || clean.length < 2 || clean.length > 60) continue;
    const display = isAtHandle && !clean.includes(" ") ? `@${clean.replace(/^@+/, "")}` : clean;
    const dedupeKey = display.toLowerCase().replace(/^@+/, "");
    if (seen.has(dedupeKey)) continue;

    const matchTarget = dedupeKey;
    if (matchTarget.startsWith(qLower)) {
      seen.add(dedupeKey);
      prefixMatches.push(display);
    } else if (matchTarget.includes(qLower)) {
      seen.add(dedupeKey);
      containsMatches.push(display);
    }
  }

  return [...prefixMatches, ...containsMatches].slice(0, limit);
}

async function fetchPublicQueryCompletions(query: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
      query,
    )}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(900),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[1])) return [];
    return (data[1] as unknown[])
      .filter((item): item is string => typeof item === "string")
      .slice(0, 8);
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("q") || "").trim().slice(0, 80);

  if (!raw) {
    return NextResponse.json(
      { suggestions: [] },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  }

  const cacheKey = raw.toLowerCase();
  const cached = hintCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json({ suggestions: cached.items });
  }

  const cachedCreatorNames = searchCache.getCachedNames();
  const liveCompletions = raw.length >= 2 ? await fetchPublicQueryCompletions(raw) : [];

  const merged = rankAndFilterHints(
    [...cachedCreatorNames, ...CURATED_CREATOR_AND_TOPIC_HINTS, ...liveCompletions],
    raw,
    8,
  );

  hintCache.set(cacheKey, { items: merged, expiresAt: Date.now() + HINT_TTL_MS });

  return NextResponse.json(
    { suggestions: merged },
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
}
