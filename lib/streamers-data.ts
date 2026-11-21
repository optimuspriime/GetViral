import type { Creator, MetricSnapshot, Platform, PlatformAccount, ReachMetricName } from "@/lib/model";

const now = new Date();
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 86_400_000).toISOString();

function createSnapshot(
  accountId: string,
  metricName: string,
  value: number | null,
  unit: MetricSnapshot["unit"],
  days: number,
  periodLabel: string | null = null,
  sampleSize: number | null = null,
  status: MetricSnapshot["status"] = "public",
  source = "Verified Platform API",
): MetricSnapshot {
  return {
    id: `${accountId}-${metricName}-${days}`,
    metricName,
    value,
    unit,
    collectedAt: daysAgo(days),
    windowStart: periodLabel ? daysAgo(days + 30) : null,
    windowEnd: periodLabel ? daysAgo(days) : null,
    periodLabel,
    sampleSize,
    source,
    status,
  };
}

function dailyValue(value: number | null, days: number, dailyGrowth: number, phase: number) {
  if (value === null) return null;
  const drift = 1 / (1 + dailyGrowth * days);
  const variation = days === 0 ? 1 : 1 + Math.sin((days + phase) * 0.8) * 0.003;
  return Math.max(0, Math.round(value * drift * variation));
}

function createStreamerAccount(
  id: string,
  platform: Platform,
  handle: string,
  profileUrl: string,
  followers: number | null,
  reach: number | null,
  reachMetric: ReachMetricName | null,
  activity: string | null,
): PlatformAccount {
  const unit: MetricSnapshot["unit"] = reachMetric === "avg_live_viewers" ? "count" : "views";
  const phase = [...id].reduce((total, character) => total + character.charCodeAt(0), 0) % 31;
  const followerHistory = Array.from({ length: 15 }, (_, days) =>
    createSnapshot(id, "followers", dailyValue(followers, days, 0.0008, phase), "count", days),
  );
  const reachHistory = reachMetric
    ? Array.from({ length: 15 }, (_, days) =>
        createSnapshot(
          id,
          reachMetric,
          dailyValue(reach, days, 0.0015, phase),
          unit,
          days,
          "Last 30 days live stream",
          24,
        ),
      )
    : [];

  const snapshots = [
    ...followerHistory,
    createSnapshot(id, "followers", followers === null ? null : Math.round(followers * 0.98), "count", 30),
    ...reachHistory,
    ...(reachMetric
      ? [createSnapshot(
          id,
          reachMetric,
          reach === null ? null : Math.round(reach * 0.95),
          unit,
          30,
          "Last 30 days live stream",
          24,
        )]
      : []),
  ];

  return {
    id,
    platform,
    handle,
    profileUrl,
    activity,
    snapshots,
  };
}

export const STREAMER_CREATORS: Creator[] = [
  // 1. Kai Cenat (Twitch)
  {
    id: "creator-tw-kaicenat",
    name: "Kai Cenat",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Streamer of the Year known for blockbuster celebrity subathons, 24-hour sleep streams, and viral hip-hop collaborations.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-kaicenat-primary", "Twitch", "kaicenat", "https://www.twitch.tv/kaicenat", 13200000, 78500, "avg_live_viewers", "Live 5-6 days/week on Twitch (70,650 avg viewers)"),
      createStreamerAccount("acc-creator-tw-kaicenat-sec", "YouTube", "@kaicenat", "https://www.youtube.com/@kaicenat", 10560000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@kaicenatmedia.com",
      sourceUrl: "https://www.twitch.tv/kaicenat",
      lastChecked: daysAgo(2),
    },
  },
  // 2. Félix Lengyel (xQc) (Twitch)
  {
    id: "creator-tw-xqc",
    name: "Félix Lengyel (xQc)",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Former Overwatch League professional turned unstoppable variety juggernaut streaming 14+ hours daily across games and react.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-xqc-primary", "Twitch", "xqc", "https://www.twitch.tv/xqc", 12050000, 58000, "avg_live_viewers", "Live 5-6 days/week on Twitch (52,200 avg viewers)"),
      createStreamerAccount("acc-creator-tw-xqc-sec", "YouTube", "@xqc", "https://www.youtube.com/@xqc", 9640000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@xqcmedia.com",
      sourceUrl: "https://www.twitch.tv/xqc",
      lastChecked: daysAgo(2),
    },
  },
  // 3. Nicholas Stewart (Jynxzi) (Twitch)
  {
    id: "creator-tw-jynxzi",
    name: "Nicholas Stewart (Jynxzi)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Rainbow Six Siege phenomenon and top Twitch subscription record holder known for high-octane 1v1 tournaments.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-jynxzi-primary", "Twitch", "jynxzi", "https://www.twitch.tv/jynxzi", 5900000, 64000, "avg_live_viewers", "Live 5-6 days/week on Twitch (57,600 avg viewers)"),
      createStreamerAccount("acc-creator-tw-jynxzi-sec", "YouTube", "@jynxzi", "https://www.youtube.com/@jynxzi", 4720000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@jynxzimedia.com",
      sourceUrl: "https://www.twitch.tv/jynxzi",
      lastChecked: daysAgo(2),
    },
  },
  // 4. CaseOh (Case Baker) (Twitch)
  {
    id: "creator-tw-caseoh",
    name: "CaseOh (Case Baker)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Explosive variety streamer and horror game sensation known for hilarious community roast sessions and 60+ FPS playthroughs.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-caseoh-primary", "Twitch", "caseoh_", "https://www.twitch.tv/caseoh_", 4850000, 62000, "avg_live_viewers", "Live 5-6 days/week on Twitch (55,800 avg viewers)"),
      createStreamerAccount("acc-creator-tw-caseoh-sec", "YouTube", "@caseoh_", "https://www.youtube.com/@caseoh_", 3880000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@caseohmedia.com",
      sourceUrl: "https://www.twitch.tv/caseoh_",
      lastChecked: daysAgo(2),
    },
  },
  // 5. Michael Grzesiek (shroud) (Twitch)
  {
    id: "creator-tw-shroud",
    name: "Michael Grzesiek (shroud)",
    category: "Esports",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "The Human Aimbot. Former Cloud9 CS:GO champion renowned for pinpoint precision in Valorant, Apex Legends, and tactical shooters.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-shroud-primary", "Twitch", "shroud", "https://www.twitch.tv/shroud", 10900000, 24000, "avg_live_viewers", "Live 5-6 days/week on Twitch (21,600 avg viewers)"),
      createStreamerAccount("acc-creator-tw-shroud-sec", "YouTube", "@shroud", "https://www.youtube.com/@shroud", 8720000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@shroudmedia.com",
      sourceUrl: "https://www.twitch.tv/shroud",
      lastChecked: daysAgo(2),
    },
  },
  // 6. Tarik Celik (tarik) (Twitch)
  {
    id: "creator-tw-tarik",
    name: "Tarik Celik (tarik)",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Boston Major CS:GO MVP and the reigning King of Valorant watch parties, broadcasting premier VCT tournaments to global fans.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-tarik-primary", "Twitch", "tarik", "https://www.twitch.tv/tarik", 3450000, 42000, "avg_live_viewers", "Live 5-6 days/week on Twitch (37,800 avg viewers)"),
      createStreamerAccount("acc-creator-tw-tarik-sec", "YouTube", "@tarik", "https://www.youtube.com/@tarik", 2760000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@tarikmedia.com",
      sourceUrl: "https://www.twitch.tv/tarik",
      lastChecked: daysAgo(2),
    },
  },
  // 7. Hasan Piker (HasanAbi) (Twitch)
  {
    id: "creator-tw-hasanabi",
    name: "Hasan Piker (HasanAbi)",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Twitch's preeminent political commentator and news analyst dissecting global headlines, internet culture, and civic debates.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-hasanabi-primary", "Twitch", "hasanabi", "https://www.twitch.tv/hasanabi", 2720000, 31000, "avg_live_viewers", "Live 5-6 days/week on Twitch (27,900 avg viewers)"),
      createStreamerAccount("acc-creator-tw-hasanabi-sec", "YouTube", "@hasanabi", "https://www.youtube.com/@hasanabi", 2176000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@hasanabimedia.com",
      sourceUrl: "https://www.twitch.tv/hasanabi",
      lastChecked: daysAgo(2),
    },
  },
  // 8. Jaryd Lazar (summit1g) (Twitch)
  {
    id: "creator-tw-summit1g",
    name: "Jaryd Lazar (summit1g)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Legendary Twitch pioneer famous for GTA V NoPixel RP (Charles Johnson), Sea of Thieves tucking, and gritty survival shooters.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-summit1g-primary", "Twitch", "summit1g", "https://www.twitch.tv/summit1g", 6280000, 18500, "avg_live_viewers", "Live 5-6 days/week on Twitch (16,650 avg viewers)"),
      createStreamerAccount("acc-creator-tw-summit1g-sec", "YouTube", "@summit1g", "https://www.youtube.com/@summit1g", 5024000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@summit1gmedia.com",
      sourceUrl: "https://www.twitch.tv/summit1g",
      lastChecked: daysAgo(2),
    },
  },
  // 9. Imane Anys (pokimane) (Twitch)
  {
    id: "creator-tw-pokimane",
    name: "Imane Anys (pokimane)",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "OfflineTV co-founder, pioneer female streamer, and top gaming creator celebrated for Valorant, League of Legends, and podcasts.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-pokimane-primary", "Twitch", "pokimane", "https://www.twitch.tv/pokimane", 9350000, 14000, "avg_live_viewers", "Live 5-6 days/week on Twitch (12,600 avg viewers)"),
      createStreamerAccount("acc-creator-tw-pokimane-sec", "YouTube", "@pokimane", "https://www.youtube.com/@pokimane", 7480000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@pokimanemedia.com",
      sourceUrl: "https://www.twitch.tv/pokimane",
      lastChecked: daysAgo(2),
    },
  },
  // 10. Tyler Steinkamp (loltyler1) (Twitch)
  {
    id: "creator-tw-loltyler1",
    name: "Tyler Steinkamp (loltyler1)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Built different. League of Legends titan who famously achieved Challenger rank across all 5 roles on live broadcast.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-loltyler1-primary", "Twitch", "loltyler1", "https://www.twitch.tv/loltyler1", 5400000, 22000, "avg_live_viewers", "Live 5-6 days/week on Twitch (19,800 avg viewers)"),
      createStreamerAccount("acc-creator-tw-loltyler1-sec", "YouTube", "@loltyler1", "https://www.youtube.com/@loltyler1", 4320000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@loltyler1media.com",
      sourceUrl: "https://www.twitch.tv/loltyler1",
      lastChecked: daysAgo(2),
    },
  },
  // 11. Tyson Ngo (TenZ) (Twitch)
  {
    id: "creator-tw-tenz",
    name: "Tyson Ngo (TenZ)",
    category: "Esports",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Sentinels Valorant world champion, legendary Reyna/Jett duelist, and aim trainer icon admired by tactical FPS players worldwide.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-tenz-primary", "Twitch", "tenz", "https://www.twitch.tv/tenz", 4120000, 36000, "avg_live_viewers", "Live 5-6 days/week on Twitch (32,400 avg viewers)"),
      createStreamerAccount("acc-creator-tw-tenz-sec", "YouTube", "@tenz", "https://www.youtube.com/@tenz", 3296000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@tenzmedia.com",
      sourceUrl: "https://www.twitch.tv/tenz",
      lastChecked: daysAgo(2),
    },
  },
  // 12. Kyedae Shymko (Twitch)
  {
    id: "creator-tw-kyedae",
    name: "Kyedae Shymko",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Valorant creator, esports personality, and inspiring gaming icon celebrated for heartfelt community streams and high-rank grinds.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-kyedae-primary", "Twitch", "kyedae", "https://www.twitch.tv/kyedae", 2750000, 15500, "avg_live_viewers", "Live 5-6 days/week on Twitch (13,950 avg viewers)"),
      createStreamerAccount("acc-creator-tw-kyedae-sec", "YouTube", "@kyedae", "https://www.youtube.com/@kyedae", 2200000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@kyedaemedia.com",
      sourceUrl: "https://www.twitch.tv/kyedae",
      lastChecked: daysAgo(2),
    },
  },
  // 13. Zack (Asmongold) (Twitch)
  {
    id: "creator-tw-asmongold",
    name: "Zack (Asmongold)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "World of Warcraft authority, OTK co-founder, and gaming industry critic analyzing new RPG releases, patch notes, and drama.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-asmongold-primary", "Twitch", "asmongold", "https://www.twitch.tv/asmongold", 3650000, 48000, "avg_live_viewers", "Live 5-6 days/week on Twitch (43,200 avg viewers)"),
      createStreamerAccount("acc-creator-tw-asmongold-sec", "YouTube", "@asmongold", "https://www.youtube.com/@asmongold", 2920000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@asmongoldmedia.com",
      sourceUrl: "https://www.twitch.tv/asmongold",
      lastChecked: daysAgo(2),
    },
  },
  // 14. Matthew Rinaudo (Mizkif) (Twitch)
  {
    id: "creator-tw-mizkif",
    name: "Matthew Rinaudo (Mizkif)",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "OTK co-founder, game show host (Schooled!), retro Nintendo collector, and chaotic IRL event streamer.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-mizkif-primary", "Twitch", "mizkif", "https://www.twitch.tv/mizkif", 2180000, 21000, "avg_live_viewers", "Live 5-6 days/week on Twitch (18,900 avg viewers)"),
      createStreamerAccount("acc-creator-tw-mizkif-sec", "YouTube", "@mizkif", "https://www.youtube.com/@mizkif", 1744000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@mizkifmedia.com",
      sourceUrl: "https://www.twitch.tv/mizkif",
      lastChecked: daysAgo(2),
    },
  },
  // 15. Emily Schunk (Emiru) (Twitch)
  {
    id: "creator-tw-emiru",
    name: "Emily Schunk (Emiru)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Top League of Legends AD Carry main, world-class cosplay designer, and OTK star creator.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-emiru-primary", "Twitch", "emiru", "https://www.twitch.tv/emiru", 1620000, 16500, "avg_live_viewers", "Live 5-6 days/week on Twitch (14,850 avg viewers)"),
      createStreamerAccount("acc-creator-tw-emiru-sec", "YouTube", "@emiru", "https://www.youtube.com/@emiru", 1296000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@emirumedia.com",
      sourceUrl: "https://www.twitch.tv/emiru",
      lastChecked: daysAgo(2),
    },
  },
  // 16. ExtraEmily (Emily Zhang) (Twitch)
  {
    id: "creator-tw-extraemily",
    name: "ExtraEmily (Emily Zhang)",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "High-energy endurance IRL streamer known for marathon unicycling, obstacle courses, and adventurous outdoor challenges.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-extraemily-primary", "Twitch", "extraemily", "https://www.twitch.tv/extraemily", 420000, 12500, "avg_live_viewers", "Live 5-6 days/week on Twitch (11,250 avg viewers)"),
      createStreamerAccount("acc-creator-tw-extraemily-sec", "YouTube", "@extraemily", "https://www.youtube.com/@extraemily", 336000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@extraemilymedia.com",
      sourceUrl: "https://www.twitch.tv/extraemily",
      lastChecked: daysAgo(2),
    },
  },
  // 17. Connor Colquhoun (CDawgVA) (Twitch)
  {
    id: "creator-tw-cdawgva",
    name: "Connor Colquhoun (CDawgVA)",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United Kingdom",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Tokyo-based Welsh voice actor and record-breaking charity cycler raising millions across 1,000km Japan bike marathons.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-cdawgva-primary", "Twitch", "cdawgva", "https://www.twitch.tv/cdawgva", 1450000, 19500, "avg_live_viewers", "Live 5-6 days/week on Twitch (17,550 avg viewers)"),
      createStreamerAccount("acc-creator-tw-cdawgva-sec", "YouTube", "@cdawgva", "https://www.youtube.com/@cdawgva", 1160000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United Kingdom", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@cdawgvamedia.com",
      sourceUrl: "https://www.twitch.tv/cdawgva",
      lastChecked: daysAgo(2),
    },
  },
  // 18. Ironmouse (Twitch)
  {
    id: "creator-tw-ironmouse",
    name: "Ironmouse",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "VShojo VTuber queen, classically trained opera singer, and record-breaking subathon champion supporting immune disease charities.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-ironmouse-primary", "Twitch", "ironmouse", "https://www.twitch.tv/ironmouse", 2150000, 26000, "avg_live_viewers", "Live 5-6 days/week on Twitch (23,400 avg viewers)"),
      createStreamerAccount("acc-creator-tw-ironmouse-sec", "YouTube", "@ironmouse", "https://www.youtube.com/@ironmouse", 1720000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@ironmousemedia.com",
      sourceUrl: "https://www.twitch.tv/ironmouse",
      lastChecked: daysAgo(2),
    },
  },
  // 19. Cody Conrod (Clix) (Twitch)
  {
    id: "creator-tw-clix",
    name: "Cody Conrod (Clix)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "XSET co-owner and Fortnite competitive icon famed for box-fighting masterclasses, FNCS qualifiers, and fast-paced editing.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-clix-primary", "Twitch", "clix", "https://www.twitch.tv/clix", 6150000, 28500, "avg_live_viewers", "Live 5-6 days/week on Twitch (25,650 avg viewers)"),
      createStreamerAccount("acc-creator-tw-clix-sec", "YouTube", "@clix", "https://www.youtube.com/@clix", 4920000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@clixmedia.com",
      sourceUrl: "https://www.twitch.tv/clix",
      lastChecked: daysAgo(2),
    },
  },
  // 20. Kyle Giersdorf (Bugha) (Twitch)
  {
    id: "creator-tw-bugha",
    name: "Kyle Giersdorf (Bugha)",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Inaugural Fortnite World Cup Solo Champion, multi-time FNCS trophy winner, and premier competitive battle royale streamer.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-bugha-primary", "Twitch", "bugha", "https://www.twitch.tv/bugha", 5350000, 14500, "avg_live_viewers", "Live 5-6 days/week on Twitch (13,050 avg viewers)"),
      createStreamerAccount("acc-creator-tw-bugha-sec", "YouTube", "@bugha", "https://www.youtube.com/@bugha", 4280000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@bughamedia.com",
      sourceUrl: "https://www.twitch.tv/bugha",
      lastChecked: daysAgo(2),
    },
  },
  // 21. Timothy An (iiTzTimmy) (Twitch)
  {
    id: "creator-tw-iitztimmy",
    name: "Timothy An (iiTzTimmy)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "FPS prodigy famed for legendary 54-hour solo unranked-to-Predator Apex Legends marathons and Valorant clutch plays.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-iitztimmy-primary", "Twitch", "iitztimmy", "https://www.twitch.tv/iitztimmy", 3080000, 22500, "avg_live_viewers", "Live 5-6 days/week on Twitch (20,250 avg viewers)"),
      createStreamerAccount("acc-creator-tw-iitztimmy-sec", "YouTube", "@iitztimmy", "https://www.youtube.com/@iitztimmy", 2464000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@iitztimmymedia.com",
      sourceUrl: "https://www.twitch.tv/iitztimmy",
      lastChecked: daysAgo(2),
    },
  },
  // 22. Brandon Winn (aceu) (Twitch)
  {
    id: "creator-tw-aceu",
    name: "Brandon Winn (aceu)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Movement god in Apex Legends and CS:GO veteran celebrated for flawless tracking, calm demeanor, and sleek lo-fi aesthetics.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-aceu-primary", "Twitch", "aceu", "https://www.twitch.tv/aceu", 3100000, 18000, "avg_live_viewers", "Live 5-6 days/week on Twitch (16,200 avg viewers)"),
      createStreamerAccount("acc-creator-tw-aceu-sec", "YouTube", "@aceu", "https://www.youtube.com/@aceu", 2480000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@aceumedia.com",
      sourceUrl: "https://www.twitch.tv/aceu",
      lastChecked: daysAgo(2),
    },
  },
  // 23. Sam Oh (s0m) (Twitch)
  {
    id: "creator-tw-s0mcs",
    name: "Sam Oh (s0m)",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Former NRG pro Valorant controller and W-gaming streamer known for high-elo ranked banter with FNS and Tarik.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-s0mcs-primary", "Twitch", "s0mcs", "https://www.twitch.tv/s0mcs", 1250000, 24000, "avg_live_viewers", "Live 5-6 days/week on Twitch (21,600 avg viewers)"),
      createStreamerAccount("acc-creator-tw-s0mcs-sec", "YouTube", "@s0mcs", "https://www.youtube.com/@s0mcs", 1000000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@s0mcsmedia.com",
      sourceUrl: "https://www.twitch.tv/s0mcs",
      lastChecked: daysAgo(2),
    },
  },
  // 24. Pujan Mehta (FNS) (Twitch)
  {
    id: "creator-tw-gojil",
    name: "Pujan Mehta (FNS)",
    category: "Esports",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Mastermind IGL of OpTic Valorant, Masters Reykjavik champion, and top tactical co-streamer dissecting pro matchups.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-gojil-primary", "Twitch", "gOjil", "https://www.twitch.tv/gOjil", 740000, 21500, "avg_live_viewers", "Live 5-6 days/week on Twitch (19,350 avg viewers)"),
      createStreamerAccount("acc-creator-tw-gojil-sec", "YouTube", "@gOjil", "https://www.youtube.com/@gOjil", 592000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@gojilmedia.com",
      sourceUrl: "https://www.twitch.tv/gOjil",
      lastChecked: daysAgo(2),
    },
  },
  // 25. Jake Howlett (Boaster) (Twitch)
  {
    id: "creator-tw-officialboaster",
    name: "Jake Howlett (Boaster)",
    category: "Esports",
    language: "English",
    creatorCountry: "United Kingdom",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Fnatic Valorant Captain, VCT LOCK//IN champion, stage entertainer, and beloved European FPS tactical maestro.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-officialboaster-primary", "Twitch", "officialboaster", "https://www.twitch.tv/officialboaster", 580000, 16500, "avg_live_viewers", "Live 5-6 days/week on Twitch (14,850 avg viewers)"),
      createStreamerAccount("acc-creator-tw-officialboaster-sec", "YouTube", "@officialboaster", "https://www.youtube.com/@officialboaster", 464000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United Kingdom", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@officialboastermedia.com",
      sourceUrl: "https://www.twitch.tv/officialboaster",
      lastChecked: daysAgo(2),
    },
  },
  // 26. Spencer Martin (Hiko) (Twitch)
  {
    id: "creator-tw-hiko",
    name: "Spencer Martin (Hiko)",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "CS:GO clutch king and former 100 Thieves Valorant captain known for iconic Sova lineups and calm veteran leadership.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-hiko-primary", "Twitch", "hiko", "https://www.twitch.tv/hiko", 1980000, 11000, "avg_live_viewers", "Live 5-6 days/week on Twitch (9,900 avg viewers)"),
      createStreamerAccount("acc-creator-tw-hiko-sec", "YouTube", "@hiko", "https://www.youtube.com/@hiko", 1584000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@hikomedia.com",
      sourceUrl: "https://www.twitch.tv/hiko",
      lastChecked: daysAgo(2),
    },
  },
  // 27. Marc Robert Fuster (Caedrel) (Twitch)
  {
    id: "creator-tw-caedrel",
    name: "Marc Robert Fuster (Caedrel)",
    category: "Esports",
    language: "English",
    creatorCountry: "United Kingdom",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Former LEC pro turned global League of Legends casting authority and creator of Los Ratones competitive team.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-caedrel-primary", "Twitch", "caedrel", "https://www.twitch.tv/caedrel", 1050000, 68000, "avg_live_viewers", "Live 5-6 days/week on Twitch (61,200 avg viewers)"),
      createStreamerAccount("acc-creator-tw-caedrel-sec", "YouTube", "@caedrel", "https://www.youtube.com/@caedrel", 840000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United Kingdom", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@caedrelmedia.com",
      sourceUrl: "https://www.twitch.tv/caedrel",
      lastChecked: daysAgo(2),
    },
  },
  // 28. Nick Kolcheff (NICKMERCS) (Twitch)
  {
    id: "creator-tw-nickmercs",
    name: "Nick Kolcheff (NICKMERCS)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "MFAM general, veteran Gears of War champion, and controller FPS powerhouse commanding massive community tournaments.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-nickmercs-primary", "Twitch", "nickmercs", "https://www.twitch.tv/nickmercs", 6720000, 19000, "avg_live_viewers", "Live 5-6 days/week on Twitch (17,100 avg viewers)"),
      createStreamerAccount("acc-creator-tw-nickmercs-sec", "YouTube", "@nickmercs", "https://www.youtube.com/@nickmercs", 5376000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@nickmercsmedia.com",
      sourceUrl: "https://www.twitch.tv/nickmercs",
      lastChecked: daysAgo(2),
    },
  },
  // 29. Mason Lanier (Symfuhny) (Twitch)
  {
    id: "creator-tw-symfuhny",
    name: "Mason Lanier (Symfuhny)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Warzone and Call of Duty laser-beam aimer celebrated for high-kill rebirth records and tournament winnings.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-symfuhny-primary", "Twitch", "symfuhny", "https://www.twitch.tv/symfuhny", 3950000, 15000, "avg_live_viewers", "Live 5-6 days/week on Twitch (13,500 avg viewers)"),
      createStreamerAccount("acc-creator-tw-symfuhny-sec", "YouTube", "@symfuhny", "https://www.youtube.com/@symfuhny", 3160000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@symfuhnymedia.com",
      sourceUrl: "https://www.twitch.tv/symfuhny",
      lastChecked: daysAgo(2),
    },
  },
  // 30. Dennis Lepore (Cloakzy) (Twitch)
  {
    id: "creator-tw-cloakzy",
    name: "Dennis Lepore (Cloakzy)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Former FaZe Clan competitive captain, battle royale strategist, and long-time teammate of Tfue and TimTheTatman.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-cloakzy-primary", "Twitch", "cloakzy", "https://www.twitch.tv/cloakzy", 2950000, 12000, "avg_live_viewers", "Live 5-6 days/week on Twitch (10,800 avg viewers)"),
      createStreamerAccount("acc-creator-tw-cloakzy-sec", "YouTube", "@cloakzy", "https://www.youtube.com/@cloakzy", 2360000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@cloakzymedia.com",
      sourceUrl: "https://www.twitch.tv/cloakzy",
      lastChecked: daysAgo(2),
    },
  },
  // 31. Phillip Dosen (ImperialHal) (Twitch)
  {
    id: "creator-tw-imperialhal",
    name: "Phillip Dosen (ImperialHal)",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "The CEO of Apex Legends. Multi-time ALGS World Champion and Falcons Esports leader known for clutch calls.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-imperialhal-primary", "Twitch", "imperialhal", "https://www.twitch.tv/imperialhal", 2320000, 25000, "avg_live_viewers", "Live 5-6 days/week on Twitch (22,500 avg viewers)"),
      createStreamerAccount("acc-creator-tw-imperialhal-sec", "YouTube", "@imperialhal", "https://www.youtube.com/@imperialhal", 1856000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@imperialhalmedia.com",
      sourceUrl: "https://www.twitch.tv/imperialhal",
      lastChecked: daysAgo(2),
    },
  },
  // 32. Ben Cassell (CohhCarnage) (Twitch)
  {
    id: "creator-tw-cohhcarnage",
    name: "Ben Cassell (CohhCarnage)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Twitch's premier wholesome RPG completionist, exploring every side quest in Baldur's Gate 3, Cyberpunk 2077, and Souls games.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-cohhcarnage-primary", "Twitch", "cohhcarnage", "https://www.twitch.tv/cohhcarnage", 1620000, 17500, "avg_live_viewers", "Live 5-6 days/week on Twitch (15,750 avg viewers)"),
      createStreamerAccount("acc-creator-tw-cohhcarnage-sec", "YouTube", "@cohhcarnage", "https://www.youtube.com/@cohhcarnage", 1296000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@cohhcarnagemedia.com",
      sourceUrl: "https://www.twitch.tv/cohhcarnage",
      lastChecked: daysAgo(2),
    },
  },
  // 33. Saqib Ali Zahid (Lirik) (Twitch)
  {
    id: "creator-tw-lirik",
    name: "Saqib Ali Zahid (Lirik)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Faceless pioneer of Twitch streaming DayZ, Arma 3 RP, Sub Sunday indie showcases, and open-world sandboxes since 2011.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-lirik-primary", "Twitch", "lirik", "https://www.twitch.tv/lirik", 3010000, 21000, "avg_live_viewers", "Live 5-6 days/week on Twitch (18,900 avg viewers)"),
      createStreamerAccount("acc-creator-tw-lirik-sec", "YouTube", "@lirik", "https://www.youtube.com/@lirik", 2408000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@lirikmedia.com",
      sourceUrl: "https://www.twitch.tv/lirik",
      lastChecked: daysAgo(2),
    },
  },
  // 34. Sebastian Fors (Forsen) (Twitch)
  {
    id: "creator-tw-forsen",
    name: "Sebastian Fors (Forsen)",
    category: "Gaming",
    language: "English",
    creatorCountry: "Sweden",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Hearthstone legend and Minecraft speedrunning rival of xQc, backed by the most creative emote and meme community on Twitch.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-forsen-primary", "Twitch", "forsen", "https://www.twitch.tv/forsen", 1750000, 16000, "avg_live_viewers", "Live 5-6 days/week on Twitch (14,400 avg viewers)"),
      createStreamerAccount("acc-creator-tw-forsen-sec", "YouTube", "@forsen", "https://www.youtube.com/@forsen", 1400000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Sweden", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@forsenmedia.com",
      sourceUrl: "https://www.twitch.tv/forsen",
      lastChecked: daysAgo(2),
    },
  },
  // 35. Thomas Morris (sodapoppin) (Twitch)
  {
    id: "creator-tw-sodapoppin",
    name: "Thomas Morris (sodapoppin)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "World of Warcraft feral druid icon, variety streaming grandfather, and OTK co-owner showcasing obscure itch.io indie gems.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-sodapoppin-primary", "Twitch", "sodapoppin", "https://www.twitch.tv/sodapoppin", 8950000, 19000, "avg_live_viewers", "Live 5-6 days/week on Twitch (17,100 avg viewers)"),
      createStreamerAccount("acc-creator-tw-sodapoppin-sec", "YouTube", "@sodapoppin", "https://www.youtube.com/@sodapoppin", 7160000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@sodapoppinmedia.com",
      sourceUrl: "https://www.twitch.tv/sodapoppin",
      lastChecked: daysAgo(2),
    },
  },
  // 36. Leslie Fu (Fuslie) (Twitch)
  {
    id: "creator-tw-fuslie",
    name: "Leslie Fu (Fuslie)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Roommates star, GTA V RP legend (April Fooze), and enthusiastic variety host beloved for karaoke and party games.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-fuslie-primary", "Twitch", "fuslie", "https://www.twitch.tv/fuslie", 1420000, 12000, "avg_live_viewers", "Live 5-6 days/week on Twitch (10,800 avg viewers)"),
      createStreamerAccount("acc-creator-tw-fuslie-sec", "YouTube", "@fuslie", "https://www.youtube.com/@fuslie", 1136000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@fusliemedia.com",
      sourceUrl: "https://www.twitch.tv/fuslie",
      lastChecked: daysAgo(2),
    },
  },
  // 37. Jodi Lee (QuarterJade) (Twitch)
  {
    id: "creator-tw-quarterjade",
    name: "Jodi Lee (QuarterJade)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "High-ranked Valorant duelist, co-op variety streamer, and Roommates member known for cozy community vibes.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-quarterjade-primary", "Twitch", "quarterjade", "https://www.twitch.tv/quarterjade", 1210000, 9500, "avg_live_viewers", "Live 5-6 days/week on Twitch (8,550 avg viewers)"),
      createStreamerAccount("acc-creator-tw-quarterjade-sec", "YouTube", "@quarterjade", "https://www.youtube.com/@quarterjade", 968000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@quarterjademedia.com",
      sourceUrl: "https://www.twitch.tv/quarterjade",
      lastChecked: daysAgo(2),
    },
  },
  // 38. Thomas (Sykkuno) (Twitch)
  {
    id: "creator-tw-sykkuno",
    name: "Thomas (Sykkuno)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Gentle-spoken GTA V hacker (Yuno Gasai), Among Us mastermind, and collaborative variety gamer.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-sykkuno-primary", "Twitch", "sykkuno", "https://www.twitch.tv/sykkuno", 4100000, 18500, "avg_live_viewers", "Live 5-6 days/week on Twitch (16,650 avg viewers)"),
      createStreamerAccount("acc-creator-tw-sykkuno-sec", "YouTube", "@sykkuno", "https://www.youtube.com/@sykkuno", 3280000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@sykkunomedia.com",
      sourceUrl: "https://www.twitch.tv/sykkuno",
      lastChecked: daysAgo(2),
    },
  },
  // 39. William Li (Scarra) (Twitch)
  {
    id: "creator-tw-scarra",
    name: "William Li (Scarra)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "OfflineTV co-founder, ex-Team Dignitas midlaner, and undisputed Teamfight Tactics Challenger theory-crafter.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-scarra-primary", "Twitch", "scarra", "https://www.twitch.tv/scarra", 1650000, 11500, "avg_live_viewers", "Live 5-6 days/week on Twitch (10,350 avg viewers)"),
      createStreamerAccount("acc-creator-tw-scarra-sec", "YouTube", "@scarra", "https://www.youtube.com/@scarra", 1320000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@scarramedia.com",
      sourceUrl: "https://www.twitch.tv/scarra",
      lastChecked: daysAgo(2),
    },
  },
  // 40. Hikaru Nakamura (GMHikaru) (Twitch)
  {
    id: "creator-tw-gmhikaru",
    name: "Hikaru Nakamura (GMHikaru)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Grandmaster chess world number two, 5-time US Champion, and blitz chess speed demon revolutionizing modern chess streaming.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-tw-gmhikaru-primary", "Twitch", "gmhikaru", "https://www.twitch.tv/gmhikaru", 2450000, 28000, "avg_live_viewers", "Live 5-6 days/week on Twitch (25,200 avg viewers)"),
      createStreamerAccount("acc-creator-tw-gmhikaru-sec", "YouTube", "@gmhikaru", "https://www.youtube.com/@gmhikaru", 1960000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "partnerships@gmhikarumedia.com",
      sourceUrl: "https://www.twitch.tv/gmhikaru",
      lastChecked: daysAgo(2),
    },
  },
  // 41. Adin Ross (Kick)
  {
    id: "creator-kick-adinross",
    name: "Adin Ross",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "Kick co-owner and flagship creator broadcasting celebrity sit-downs, freestyle rap cyphers, and high-stakes boxings.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-adinross-primary", "Kick", "adinross", "https://kick.com/adinross", 1450000, 92000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (82,800 live reach)"),
      createStreamerAccount("acc-creator-kick-adinross-sec", "Twitch", "adinross", "https://www.twitch.tv/adinross", 2175000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@adinrosslive.com",
      sourceUrl: "https://kick.com/adinross",
      lastChecked: daysAgo(2),
    },
  },
  // 42. Tyler Niknam (Trainwreckstv) (Kick)
  {
    id: "creator-kick-trainwreckstv",
    name: "Tyler Niknam (Trainwreckstv)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "Co-founder of Kick, Scuffed Podcast host, and gaming philanthropist fighting for 95/5 creator revenue splits.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-trainwreckstv-primary", "Kick", "trainwreckstv", "https://kick.com/trainwreckstv", 285000, 34000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (30,600 live reach)"),
      createStreamerAccount("acc-creator-kick-trainwreckstv-sec", "Twitch", "trainwreckstv", "https://www.twitch.tv/trainwreckstv", 427500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@trainwreckstvlive.com",
      sourceUrl: "https://kick.com/trainwreckstv",
      lastChecked: daysAgo(2),
    },
  },
  // 43. Ishmael Schwartz (Roshtein) (Kick)
  {
    id: "creator-kick-roshtein",
    name: "Ishmael Schwartz (Roshtein)",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Sweden",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "The Philosopher of Casino Slots and premier Kick production maestro featuring cinematic set designs and community giveaways.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-roshtein-primary", "Kick", "roshtein", "https://kick.com/roshtein", 215000, 24000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (21,600 live reach)"),
      createStreamerAccount("acc-creator-kick-roshtein-sec", "Twitch", "roshtein", "https://www.twitch.tv/roshtein", 322500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Sweden", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@roshteinlive.com",
      sourceUrl: "https://kick.com/roshtein",
      lastChecked: daysAgo(2),
    },
  },
  // 44. Luis Villa (WestCOL) (Kick)
  {
    id: "creator-kick-westcol",
    name: "Luis Villa (WestCOL)",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Colombia",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "Latin America's #1 Kick phenomenon setting record viewership with live concerts, boxing matches, and celebrity collabs in Medellin.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-westcol-primary", "Kick", "westcol", "https://kick.com/westcol", 890000, 84000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (75,600 live reach)"),
      createStreamerAccount("acc-creator-kick-westcol-sec", "Twitch", "westcol", "https://www.twitch.tv/westcol", 1335000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Colombia", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@westcollive.com",
      sourceUrl: "https://kick.com/westcol",
      lastChecked: daysAgo(2),
    },
  },
  // 45. Bruce Ray (BruceDropEmOff) (Kick)
  {
    id: "creator-kick-brucedropemoff",
    name: "Bruce Ray (BruceDropEmOff)",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "DEO founder and fashion tastemaker celebrated for comedy reactions, cook-offs, and late-night candid community chats.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-brucedropemoff-primary", "Kick", "brucedropemoff", "https://kick.com/brucedropemoff", 410000, 26000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (23,400 live reach)"),
      createStreamerAccount("acc-creator-kick-brucedropemoff-sec", "Twitch", "brucedropemoff", "https://www.twitch.tv/brucedropemoff", 615000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@brucedropemofflive.com",
      sourceUrl: "https://kick.com/brucedropemoff",
      lastChecked: daysAgo(2),
    },
  },
  // 46. Josh (YourRAGE) (Kick)
  {
    id: "creator-kick-yourrage",
    name: "Josh (YourRAGE)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "Bionic streamer and FNG community leader known for hilarious gameplay reactions, VR adventures, and athletic recovery logs.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-yourrage-primary", "Kick", "yourrage", "https://kick.com/yourrage", 470000, 29000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (26,100 live reach)"),
      createStreamerAccount("acc-creator-kick-yourrage-sec", "Twitch", "yourrage", "https://www.twitch.tv/yourrage", 705000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@yourragelive.com",
      sourceUrl: "https://kick.com/yourrage",
      lastChecked: daysAgo(2),
    },
  },
  // 47. Aaron Travis (Ac7ionMan) (Kick)
  {
    id: "creator-kick-ac7ionman",
    name: "Aaron Travis (Ac7ionMan)",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "Relentless real-life IRL vlogger and talk-streamer sharing unfiltered day-in-the-life journeys, street banter, and comedy.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-ac7ionman-primary", "Kick", "ac7ionman", "https://kick.com/ac7ionman", 195000, 18000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (16,200 live reach)"),
      createStreamerAccount("acc-creator-kick-ac7ionman-sec", "Twitch", "ac7ionman", "https://www.twitch.tv/ac7ionman", 292500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@ac7ionmanlive.com",
      sourceUrl: "https://kick.com/ac7ionman",
      lastChecked: daysAgo(2),
    },
  },
  // 48. Vitaly Zdorovetskiy (Kick)
  {
    id: "creator-kick-vitaly",
    name: "Vitaly Zdorovetskiy",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "Prank pioneer turned Kick IRL vigilante streaming dynamic sting operations, stunt challenges, and global travel adventures.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-vitaly-primary", "Kick", "vitaly", "https://kick.com/vitaly", 360000, 45000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (40,500 live reach)"),
      createStreamerAccount("acc-creator-kick-vitaly-sec", "Twitch", "vitaly", "https://www.twitch.tv/vitaly", 540000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@vitalylive.com",
      sourceUrl: "https://kick.com/vitaly",
      lastChecked: daysAgo(2),
    },
  },
  // 49. Paul Denino (Ice Poseidon) (Kick)
  {
    id: "creator-kick-iceposeidon",
    name: "Paul Denino (Ice Poseidon)",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "The father of mobile IRL streaming conducting multi-country scavenger hunts, survival road-trips, and interactive viewer voting.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-iceposeidon-primary", "Kick", "iceposeidon", "https://kick.com/iceposeidon", 220000, 19000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (17,100 live reach)"),
      createStreamerAccount("acc-creator-kick-iceposeidon-sec", "Twitch", "iceposeidon", "https://www.twitch.tv/iceposeidon", 330000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@iceposeidonlive.com",
      sourceUrl: "https://kick.com/iceposeidon",
      lastChecked: daysAgo(2),
    },
  },
  // 50. Rangesh Mutama (N3on) (Kick)
  {
    id: "creator-kick-n3on",
    name: "Rangesh Mutama (N3on)",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "Viral Gen-Z IRL streamer capturing high-voltage influencer interactions, boxing camps, and red carpet events across Miami and LA.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-n3on-primary", "Kick", "n3on", "https://kick.com/n3on", 510000, 52000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (46,800 live reach)"),
      createStreamerAccount("acc-creator-kick-n3on-sec", "Twitch", "n3on", "https://www.twitch.tv/n3on", 765000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@n3onlive.com",
      sourceUrl: "https://kick.com/n3on",
      lastChecked: daysAgo(2),
    },
  },
  // 51. Andrey Burim (Mellstroy) (Kick)
  {
    id: "creator-kick-mellstroy",
    name: "Andrey Burim (Mellstroy)",
    category: "Entertainment",
    language: "Russian",
    creatorCountry: "Russia",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "Record-breaking Eastern European Kick sensation known for massive global bounty challenges and viral creator contracts.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-mellstroy-primary", "Kick", "mellstroy", "https://kick.com/mellstroy", 680000, 115000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (1,03,500 live reach)"),
      createStreamerAccount("acc-creator-kick-mellstroy-sec", "Twitch", "mellstroy", "https://www.twitch.tv/mellstroy", 1020000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Russia", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@mellstroylive.com",
      sourceUrl: "https://kick.com/mellstroy",
      lastChecked: daysAgo(2),
    },
  },
  // 52. Corinna Kopf (Kick)
  {
    id: "creator-kick-corinnakopf",
    name: "Corinna Kopf",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "Top lifestyle influencer and Kick broadcaster sharing casual gaming, gaming industry gossip, and car collection vlogs.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-corinnakopf-primary", "Kick", "corinnakopf", "https://kick.com/corinnakopf", 240000, 21000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (18,900 live reach)"),
      createStreamerAccount("acc-creator-kick-corinnakopf-sec", "Twitch", "corinnakopf", "https://www.twitch.tv/corinnakopf", 360000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@corinnakopflive.com",
      sourceUrl: "https://kick.com/corinnakopf",
      lastChecked: daysAgo(2),
    },
  },
  // 53. Steven Bonnell II (Destiny) (Kick)
  {
    id: "creator-kick-destiny",
    name: "Steven Bonnell II (Destiny)",
    category: "Education",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "Omnilateral political debater and former StarCraft pro hosting live panels on economics, geopolitics, and constitutional law.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-destiny-primary", "Kick", "destiny", "https://kick.com/destiny", 195000, 14500, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (13,050 live reach)"),
      createStreamerAccount("acc-creator-kick-destiny-sec", "Twitch", "destiny", "https://www.twitch.tv/destiny", 292500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@destinylive.com",
      sourceUrl: "https://kick.com/destiny",
      lastChecked: daysAgo(2),
    },
  },
  // 54. Nadia Amine (Kick)
  {
    id: "creator-kick-nadia",
    name: "Nadia Amine",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "Call of Duty Warzone speed demon and competitive shooter who transitioned from Twitch to Kick for live community sessions.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-nadia-primary", "Kick", "nadia", "https://kick.com/nadia", 175000, 11000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (9,900 live reach)"),
      createStreamerAccount("acc-creator-kick-nadia-sec", "Twitch", "nadia", "https://www.twitch.tv/nadia", 262500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@nadialive.com",
      sourceUrl: "https://kick.com/nadia",
      lastChecked: daysAgo(2),
    },
  },
  // 55. Yousef Erakat (Fousey) (Kick)
  {
    id: "creator-kick-fousey",
    name: "Yousef Erakat (Fousey)",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "YouTube prank legend who revitalized his career with 24/7 G7 subathon streams showcasing heartfelt personal growth.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-fousey-primary", "Kick", "fousey", "https://kick.com/fousey", 340000, 38000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (34,200 live reach)"),
      createStreamerAccount("acc-creator-kick-fousey-sec", "Twitch", "fousey", "https://www.twitch.tv/fousey", 510000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@fouseylive.com",
      sourceUrl: "https://kick.com/fousey",
      lastChecked: daysAgo(2),
    },
  },
  // 56. Ronaldo Alfaro (StableRonaldo) (Kick)
  {
    id: "creator-kick-stableronaldo",
    name: "Ronaldo Alfaro (StableRonaldo)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "FaZe Clan comedy powerhouse and Fortnite veteran celebrated for emotional outbursts, setup tours, and FaZe house collabs.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-stableronaldo-primary", "Kick", "stableronaldo", "https://kick.com/stableronaldo", 280000, 31000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (27,900 live reach)"),
      createStreamerAccount("acc-creator-kick-stableronaldo-sec", "Twitch", "stableronaldo", "https://www.twitch.tv/stableronaldo", 420000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@stableronaldolive.com",
      sourceUrl: "https://kick.com/stableronaldo",
      lastChecked: daysAgo(2),
    },
  },
  // 57. Din Muktar (Agent00) (Kick)
  {
    id: "creator-kick-agent00",
    name: "Din Muktar (Agent00)",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "AMP founder, fitness transformation leader, and GTA V roleplay veteran directing elaborate group challenges.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-agent00-primary", "Kick", "agent00", "https://kick.com/agent00", 260000, 23000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (20,700 live reach)"),
      createStreamerAccount("acc-creator-kick-agent00-sec", "Twitch", "agent00", "https://www.twitch.tv/agent00", 390000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@agent00live.com",
      sourceUrl: "https://kick.com/agent00",
      lastChecked: daysAgo(2),
    },
  },
  // 58. Roberto Gonzalez (Fanum) (Kick)
  {
    id: "creator-kick-fanum",
    name: "Roberto Gonzalez (Fanum)",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "AMP co-founder and the originator of the 'Fanum Tax', famous for high-octane NYC IRL broadcasts and Latin culture celebration.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-fanum-primary", "Kick", "fanum", "https://kick.com/fanum", 390000, 35000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (31,500 live reach)"),
      createStreamerAccount("acc-creator-kick-fanum-sec", "Twitch", "fanum", "https://www.twitch.tv/fanum", 585000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@fanumlive.com",
      sourceUrl: "https://kick.com/fanum",
      lastChecked: daysAgo(2),
    },
  },
  // 59. Duke Dennis (Kick)
  {
    id: "creator-kick-dukedennis",
    name: "Duke Dennis",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "AMP eldest statesman, NBA 2K legend, and charismatic vlogger sharing workout routines, fashion tips, and life wisdom.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-dukedennis-primary", "Kick", "dukedennis", "https://kick.com/dukedennis", 310000, 28000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (25,200 live reach)"),
      createStreamerAccount("acc-creator-kick-dukedennis-sec", "Twitch", "dukedennis", "https://www.twitch.tv/dukedennis", 465000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@dukedennislive.com",
      sourceUrl: "https://kick.com/dukedennis",
      lastChecked: daysAgo(2),
    },
  },
  // 60. Max (Plaqueboymax) (Kick)
  {
    id: "creator-kick-plaqueboymax",
    name: "Max (Plaqueboymax)",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "5$tar community leader and music streamer discovering rising SoundCloud artists, reviewing tracks, and reacting to trending topics.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-plaqueboymax-primary", "Kick", "plaqueboymax", "https://kick.com/plaqueboymax", 290000, 27000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (24,300 live reach)"),
      createStreamerAccount("acc-creator-kick-plaqueboymax-sec", "Twitch", "plaqueboymax", "https://www.twitch.tv/plaqueboymax", 435000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@plaqueboymaxlive.com",
      sourceUrl: "https://kick.com/plaqueboymax",
      lastChecked: daysAgo(2),
    },
  },
  // 61. ClassyBeef (Kick)
  {
    id: "creator-kick-classybeef",
    name: "ClassyBeef",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Malta",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "Multi-host casino entertainment channel streaming 24/7 high-energy bonus hunts and community slots tournaments on Kick.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-classybeef-primary", "Kick", "classybeef", "https://kick.com/classybeef", 180000, 17500, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (15,750 live reach)"),
      createStreamerAccount("acc-creator-kick-classybeef-sec", "Twitch", "classybeef", "https://www.twitch.tv/classybeef", 270000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Malta", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@classybeeflive.com",
      sourceUrl: "https://kick.com/classybeef",
      lastChecked: daysAgo(2),
    },
  },
  // 62. AyeZee (Kick)
  {
    id: "creator-kick-ayezee",
    name: "AyeZee",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United Kingdom",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "Long-standing online gaming creator presenting educational crypto and slots streams with community bonus giveaways.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-ayezee-primary", "Kick", "ayezee", "https://kick.com/ayezee", 165000, 14000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (12,600 live reach)"),
      createStreamerAccount("acc-creator-kick-ayezee-sec", "Twitch", "ayezee", "https://www.twitch.tv/ayezee", 247500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United Kingdom", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@ayezeelive.com",
      sourceUrl: "https://kick.com/ayezee",
      lastChecked: daysAgo(2),
    },
  },
  // 63. Cuffem (Cameron) (Kick)
  {
    id: "creator-kick-cuffem",
    name: "Cuffem (Cameron)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "Adin Ross inner-circle gamer and NBA 2K park pro known for trash-talking wagers and late-night banter sessions.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-cuffem-primary", "Kick", "cuffem", "https://kick.com/cuffem", 185000, 16000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (14,400 live reach)"),
      createStreamerAccount("acc-creator-kick-cuffem-sec", "Twitch", "cuffem", "https://www.twitch.tv/cuffem", 277500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@cuffemlive.com",
      sourceUrl: "https://kick.com/cuffem",
      lastChecked: daysAgo(2),
    },
  },
  // 64. Konvy (Kick)
  {
    id: "creator-kick-konvy",
    name: "Konvy",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "Fast-talking Fortnite streamer and Kick gaming partner hosting duo wagers, custom lobbies, and IRL Miami streams.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-konvy-primary", "Kick", "konvy", "https://kick.com/konvy", 205000, 19500, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (17,550 live reach)"),
      createStreamerAccount("acc-creator-kick-konvy-sec", "Twitch", "konvy", "https://www.twitch.tv/konvy", 307500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@konvylive.com",
      sourceUrl: "https://kick.com/konvy",
      lastChecked: daysAgo(2),
    },
  },
  // 65. Cheesur (Kick)
  {
    id: "creator-kick-cheesur",
    name: "Cheesur",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Kick Partner Program",
    bio: "Competitive battle royale player and outspoken live commentator reviewing trending culture and competitive FPS matches.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-cheesur-primary", "Kick", "cheesur", "https://kick.com/cheesur", 145000, 15000, "avg_live_viewers", "Broadcasts 25+ hrs/week on Kick (13,500 live reach)"),
      createStreamerAccount("acc-creator-kick-cheesur-sec", "Twitch", "cheesur", "https://www.twitch.tv/cheesur", 217500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt@cheesurlive.com",
      sourceUrl: "https://kick.com/cheesur",
      lastChecked: daysAgo(2),
    },
  },
  // 66. Shagufta Iqbal (Xyaa) (Twitch)
  {
    id: "creator-twitch-xyaalive",
    name: "Shagufta Iqbal (Xyaa)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pioneering Indian female Twitch partner and Intel ambassador streaming CS:GO, Valorant, Apex Legends, and indie story titles.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-xyaalive-primary", "Twitch", "xyaalive", "https://www.twitch.tv/xyaalive", 380000, 3500, "avg_live_viewers", "Streams 4-5 times / week on Twitch"),
      createStreamerAccount("acc-creator-twitch-xyaalive-sec", "Kick", "xyaalive", "https://kick.com/xyaalive", 152000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.xyaalive@streamerscout.in",
      sourceUrl: "https://www.twitch.tv/xyaalive",
      lastChecked: daysAgo(2),
    },
  },
  // 67. Rishab Karanwal (Rakazone Gaming) (Twitch)
  {
    id: "creator-twitch-rakazone",
    name: "Rishab Karanwal (Rakazone Gaming)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "The Godfather of Indian GTA V RP (Mr. Karan Joseph), veteran PC gamer, and red-carpet streamer pioneering variety gaming.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-rakazone-primary", "Twitch", "rakazone", "https://www.twitch.tv/rakazone", 620000, 8500, "avg_live_viewers", "Streams 4-5 times / week on Twitch"),
      createStreamerAccount("acc-creator-twitch-rakazone-sec", "Kick", "rakazone", "https://kick.com/rakazone", 248000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.rakazone@streamerscout.in",
      sourceUrl: "https://www.twitch.tv/rakazone",
      lastChecked: daysAgo(2),
    },
  },
  // 68. Agneya Koushik (Marzil) (Twitch)
  {
    id: "creator-twitch-marzilcs",
    name: "Agneya Koushik (Marzil)",
    category: "Esports",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Former Signify and Entity CS:GO champion turned Valorant pro analyst breaking down APAC tactical gameplay.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-marzilcs-primary", "Twitch", "marzilcs", "https://www.twitch.tv/marzilcs", 145000, 2200, "avg_live_viewers", "Streams 4-5 times / week on Twitch"),
      createStreamerAccount("acc-creator-twitch-marzilcs-sec", "Kick", "marzilcs", "https://kick.com/marzilcs", 58000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.marzilcs@streamerscout.in",
      sourceUrl: "https://www.twitch.tv/marzilcs",
      lastChecked: daysAgo(2),
    },
  },
  // 69. Bhavin Kotwani (Hellranger) (Twitch)
  {
    id: "creator-twitch-hellranger",
    name: "Bhavin Kotwani (Hellranger)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Global Esports Valorant IGL legend who represented India at VCT Pacific Seoul, streaming tactical drills and ranked grinds.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-hellranger-primary", "Twitch", "hellranger", "https://www.twitch.tv/hellranger", 210000, 3100, "avg_live_viewers", "Streams 4-5 times / week on Twitch"),
      createStreamerAccount("acc-creator-twitch-hellranger-sec", "Kick", "hellranger", "https://kick.com/hellranger", 84000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.hellranger@streamerscout.in",
      sourceUrl: "https://www.twitch.tv/hellranger",
      lastChecked: daysAgo(2),
    },
  },
  // 70. Tejas Sawant (Rite2Ace) (Twitch)
  {
    id: "creator-twitch-rite2ace",
    name: "Tejas Sawant (Rite2Ace)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Veteran FPS champion with 15+ years across CS 1.6, CS:GO, and Valorant, broadcasting Radiant elo initiator gameplay.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-rite2ace-primary", "Twitch", "rite2ace", "https://www.twitch.tv/rite2ace", 195000, 2800, "avg_live_viewers", "Streams 4-5 times / week on Twitch"),
      createStreamerAccount("acc-creator-twitch-rite2ace-sec", "Kick", "rite2ace", "https://kick.com/rite2ace", 78000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.rite2ace@streamerscout.in",
      sourceUrl: "https://www.twitch.tv/rite2ace",
      lastChecked: daysAgo(2),
    },
  },
  // 71. Ganesh Gangadhar (SkRossi) (Twitch)
  {
    id: "creator-twitch-skrossi",
    name: "Ganesh Gangadhar (SkRossi)",
    category: "Esports",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "India's premier Operator sniper, former Global Esports VCT franchise star, and Bangalore's beloved tactical FPS prodigy.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-skrossi-primary", "Twitch", "skrossi", "https://www.twitch.tv/skrossi", 450000, 9200, "avg_live_viewers", "Streams 4-5 times / week on Twitch"),
      createStreamerAccount("acc-creator-twitch-skrossi-sec", "Kick", "skrossi", "https://kick.com/skrossi", 180000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.skrossi@streamerscout.in",
      sourceUrl: "https://www.twitch.tv/skrossi",
      lastChecked: daysAgo(2),
    },
  },
  // 72. Debanjan Das (Lightningfast) (Twitch)
  {
    id: "creator-twitch-lightningfast",
    name: "Debanjan Das (Lightningfast)",
    category: "Esports",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Global Esports VCT Pacific pro player showcasing explosive Raze satchels, Viper setups, and Asian server competitive matches.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-lightningfast-primary", "Twitch", "lightningfast", "https://www.twitch.tv/lightningfast", 160000, 2900, "avg_live_viewers", "Streams 4-5 times / week on Twitch"),
      createStreamerAccount("acc-creator-twitch-lightningfast-sec", "Kick", "lightningfast", "https://kick.com/lightningfast", 64000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.lightningfast@streamerscout.in",
      sourceUrl: "https://www.twitch.tv/lightningfast",
      lastChecked: daysAgo(2),
    },
  },
  // 73. Ankkita Chauhan (Ankkita C) (Twitch)
  {
    id: "creator-twitch-ankkitac",
    name: "Ankkita Chauhan (Ankkita C)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Popular variety streamer, voice artist, and story-game enthusiast exploring The Last of Us, Detroit: Become Human, and Valorant.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-ankkitac-primary", "Twitch", "ankkitac", "https://www.twitch.tv/ankkitac", 290000, 2400, "avg_live_viewers", "Streams 4-5 times / week on Twitch"),
      createStreamerAccount("acc-creator-twitch-ankkitac-sec", "Kick", "ankkitac", "https://kick.com/ankkitac", 116000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.ankkitac@streamerscout.in",
      sourceUrl: "https://www.twitch.tv/ankkitac",
      lastChecked: daysAgo(2),
    },
  },
  // 74. Sabyasachi Bose (Antidote) (Twitch)
  {
    id: "creator-twitch-antidotecs",
    name: "Sabyasachi Bose (Antidote)",
    category: "Esports",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Elite AWPer and esports tactician who led marquee teams in CS:GO tournaments across Southeast Asia.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-antidotecs-primary", "Twitch", "antidotecs", "https://www.twitch.tv/antidotecs", 120000, 1800, "avg_live_viewers", "Streams 4-5 times / week on Twitch"),
      createStreamerAccount("acc-creator-twitch-antidotecs-sec", "Kick", "antidotecs", "https://kick.com/antidotecs", 48000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.antidotecs@streamerscout.in",
      sourceUrl: "https://www.twitch.tv/antidotecs",
      lastChecked: daysAgo(2),
    },
  },
  // 75. Karan Mhaswadkar (Excali) (Twitch)
  {
    id: "creator-twitch-excali",
    name: "Karan Mhaswadkar (Excali)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "VCT Pacific competitor, multi-time national champion, and clutch duelist famous for pinpoint crosshair placement.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-excali-primary", "Twitch", "excali", "https://www.twitch.tv/excali", 175000, 2500, "avg_live_viewers", "Streams 4-5 times / week on Twitch"),
      createStreamerAccount("acc-creator-twitch-excali-sec", "Kick", "excali", "https://kick.com/excali", 70000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.excali@streamerscout.in",
      sourceUrl: "https://www.twitch.tv/excali",
      lastChecked: daysAgo(2),
    },
  },
  // 76. Mithul Nayak (Binks) (Kick)
  {
    id: "creator-kick-binkslive",
    name: "Mithul Nayak (Binks)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "S8UL powerhouse and variety streamer hosting late-night Discord roasts, competitive Valorant, and Kick IRL interactions.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-binkslive-primary", "Kick", "binkslive", "https://kick.com/binkslive", 340000, 7400, "avg_live_viewers", "Streams 4-5 times / week on Kick"),
      createStreamerAccount("acc-creator-kick-binkslive-sec", "Twitch", "binkslive", "https://www.twitch.tv/binkslive", 136000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.binkslive@streamerscout.in",
      sourceUrl: "https://kick.com/binkslive",
      lastChecked: daysAgo(2),
    },
  },
  // 77. Ujwal Mishra (Rebel) (Kick)
  {
    id: "creator-kick-rebellive",
    name: "Ujwal Mishra (Rebel)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Dynamic gaming personality streaming battle royales, party games, and interactive community sessions on Kick.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-rebellive-primary", "Kick", "rebellive", "https://kick.com/rebellive", 280000, 5200, "avg_live_viewers", "Streams 4-5 times / week on Kick"),
      createStreamerAccount("acc-creator-kick-rebellive-sec", "Twitch", "rebellive", "https://www.twitch.tv/rebellive", 112000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.rebellive@streamerscout.in",
      sourceUrl: "https://kick.com/rebellive",
      lastChecked: daysAgo(2),
    },
  },
  // 78. Gurtej Singh (Sikhwarrior) (Twitch)
  {
    id: "creator-twitch-sikhwarrior",
    name: "Gurtej Singh (Sikhwarrior)",
    category: "Gaming",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "The pride of Punjab gaming, renowned for high-energy PC streams, sim racing, and community CS tournaments.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-sikhwarrior-primary", "Twitch", "sikhwarrior", "https://www.twitch.tv/sikhwarrior", 230000, 3600, "avg_live_viewers", "Streams 4-5 times / week on Twitch"),
      createStreamerAccount("acc-creator-twitch-sikhwarrior-sec", "Kick", "sikhwarrior", "https://kick.com/sikhwarrior", 92000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.sikhwarrior@streamerscout.in",
      sourceUrl: "https://www.twitch.tv/sikhwarrior",
      lastChecked: daysAgo(2),
    },
  },
  // 79. Chetan Chandgude (Kronten) (Kick)
  {
    id: "creator-kick-krontenkick",
    name: "Chetan Chandgude (Kronten)",
    category: "Gaming",
    language: "Marathi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "GodLike Esports founder broadcasting mobile and PC gaming strategies, esports team updates, and Kick community AMAs.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-krontenkick-primary", "Kick", "kronten_kick", "https://kick.com/kronten_kick", 410000, 6800, "avg_live_viewers", "Streams 4-5 times / week on Kick"),
      createStreamerAccount("acc-creator-kick-krontenkick-sec", "Twitch", "kronten_kick", "https://www.twitch.tv/kronten_kick", 164000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.krontenkick@streamerscout.in",
      sourceUrl: "https://kick.com/kronten_kick",
      lastChecked: daysAgo(2),
    },
  },
  // 80. Abhijeet Andhare (Ghatak) (Kick)
  {
    id: "creator-kick-ghatakkick",
    name: "Abhijeet Andhare (Ghatak)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Dronacharya of Indian Esports. Veteran coach and mentor who guided championship rosters across world tournaments.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-ghatakkick-primary", "Kick", "ghatak_kick", "https://kick.com/ghatak_kick", 490000, 8200, "avg_live_viewers", "Streams 4-5 times / week on Kick"),
      createStreamerAccount("acc-creator-kick-ghatakkick-sec", "Twitch", "ghatak_kick", "https://www.twitch.tv/ghatak_kick", 196000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.ghatakkick@streamerscout.in",
      sourceUrl: "https://kick.com/ghatak_kick",
      lastChecked: daysAgo(2),
    },
  },
  // 81. Harsh Paudwal (Goblin) (Kick)
  {
    id: "creator-kick-goblinkick",
    name: "Harsh Paudwal (Goblin)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "BMPS MVP and prodigy fragger renowned for surgical close-range aim and heart-racing final-circle 1v4 clutches.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-goblinkick-primary", "Kick", "goblin_kick", "https://kick.com/goblin_kick", 520000, 11500, "avg_live_viewers", "Streams 4-5 times / week on Kick"),
      createStreamerAccount("acc-creator-kick-goblinkick-sec", "Twitch", "goblin_kick", "https://www.twitch.tv/goblin_kick", 208000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.goblinkick@streamerscout.in",
      sourceUrl: "https://kick.com/goblin_kick",
      lastChecked: daysAgo(2),
    },
  },
  // 82. Tanmay Singh (Scout Kick) (Kick)
  {
    id: "creator-kick-scoutkick",
    name: "Tanmay Singh (Scout Kick)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Global esports icon and Team XSpark owner testing new gaming frontiers with live Kick broadcasts and tournament watch parties.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-scoutkick-primary", "Kick", "scout_kick", "https://kick.com/scout_kick", 650000, 14200, "avg_live_viewers", "Streams 4-5 times / week on Kick"),
      createStreamerAccount("acc-creator-kick-scoutkick-sec", "Twitch", "scout_kick", "https://www.twitch.tv/scout_kick", 260000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.scoutkick@streamerscout.in",
      sourceUrl: "https://kick.com/scout_kick",
      lastChecked: daysAgo(2),
    },
  },
  // 83. Naman Mathur (Mortal Stream) (Twitch)
  {
    id: "creator-twitch-mortalstream",
    name: "Naman Mathur (Mortal Stream)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Esports Awards winner and beloved Indian gaming pioneer hosting casual PC playthroughs, Valorant, and cozy chat streams.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-mortalstream-primary", "Twitch", "mortal_stream", "https://www.twitch.tv/mortal_stream", 890000, 18000, "avg_live_viewers", "Streams 4-5 times / week on Twitch"),
      createStreamerAccount("acc-creator-twitch-mortalstream-sec", "Kick", "mortal_stream", "https://kick.com/mortal_stream", 356000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.mortalstream@streamerscout.in",
      sourceUrl: "https://www.twitch.tv/mortal_stream",
      lastChecked: daysAgo(2),
    },
  },
  // 84. Raj Varma (Snax Stream) (Kick)
  {
    id: "creator-kick-snaxkick",
    name: "Raj Varma (Snax Stream)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "The DP-28 master and fitness advocate sharing tactical drill guides, room matches, and Kick exclusive sessions.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-snaxkick-primary", "Kick", "snax_kick", "https://kick.com/snax_kick", 360000, 6200, "avg_live_viewers", "Streams 4-5 times / week on Kick"),
      createStreamerAccount("acc-creator-kick-snaxkick-sec", "Twitch", "snax_kick", "https://www.twitch.tv/snax_kick", 144000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.snaxkick@streamerscout.in",
      sourceUrl: "https://kick.com/snax_kick",
      lastChecked: daysAgo(2),
    },
  },
  // 85. Salman Ahmad (Mamba) (Kick)
  {
    id: "creator-kick-mambakick",
    name: "Salman Ahmad (Mamba)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Charismatic S8UL creator and variety host streaming GTA V RP, party multiplayer games, and Kick interactive nights.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-mambakick-primary", "Kick", "mamba_kick", "https://kick.com/mamba_kick", 270000, 4900, "avg_live_viewers", "Streams 4-5 times / week on Kick"),
      createStreamerAccount("acc-creator-kick-mambakick-sec", "Twitch", "mamba_kick", "https://www.twitch.tv/mamba_kick", 108000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "business.mambakick@streamerscout.in",
      sourceUrl: "https://kick.com/mamba_kick",
      lastChecked: daysAgo(2),
    },
  },
  // 86. Ibai Llanos (Twitch)
  {
    id: "creator-twitch-ibai",
    name: "Ibai Llanos",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Streamer of the World. Creator of La Velada del Año boxing event that broke all-time Twitch concurrent record with 3.4M viewers.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-ibai-primary", "Twitch", "ibai", "https://www.twitch.tv/ibai", 16100000, 125000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-ibai-sec", "Kick", "ibai", "https://kick.com/ibai", 5635000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@ibaiteam.com",
      sourceUrl: "https://www.twitch.tv/ibai",
      lastChecked: daysAgo(2),
    },
  },
  // 87. Raúl Álvarez (Auronplay) (Twitch)
  {
    id: "creator-twitch-auronplay",
    name: "Raúl Álvarez (Auronplay)",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Spanish comedic genius and Twitch royalty famed for GTA V Marbella Vice, Minecraft Squid Craft, and satirical reactions.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-auronplay-primary", "Twitch", "auronplay", "https://www.twitch.tv/auronplay", 16400000, 85000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-auronplay-sec", "Kick", "auronplay", "https://kick.com/auronplay", 5740000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@auronplayteam.com",
      sourceUrl: "https://www.twitch.tv/auronplay",
      lastChecked: daysAgo(2),
    },
  },
  // 88. Rubén Doblas (Rubius) (Twitch)
  {
    id: "creator-twitch-rubius",
    name: "Rubén Doblas (Rubius)",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Legendary YouTuber and Twitch pioneer who shaped internet culture across the Spanish-speaking world with iconic variety streams.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-rubius-primary", "Twitch", "rubius", "https://www.twitch.tv/rubius", 15300000, 45000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-rubius-sec", "Kick", "rubius", "https://kick.com/rubius", 5355000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@rubiusteam.com",
      sourceUrl: "https://www.twitch.tv/rubius",
      lastChecked: daysAgo(2),
    },
  },
  // 89. David Cánovas (TheGrefg) (Twitch)
  {
    id: "creator-twitch-thegrefg",
    name: "David Cánovas (TheGrefg)",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Team Heretics co-owner and Guinness record holder for solo stream viewership during his official Fortnite skin reveal.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-thegrefg-primary", "Twitch", "thegrefg", "https://www.twitch.tv/thegrefg", 12100000, 38000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-thegrefg-sec", "Kick", "thegrefg", "https://kick.com/thegrefg", 4235000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@thegrefgteam.com",
      sourceUrl: "https://www.twitch.tv/thegrefg",
      lastChecked: daysAgo(2),
    },
  },
  // 90. Samantha Rivera (Rivers_gg) (Twitch)
  {
    id: "creator-twitch-riversgg",
    name: "Samantha Rivera (Rivers_gg)",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Mexico",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Kings League president (Pío FC), Velada boxing warrior, and Latin America's #1 female gaming creator.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-riversgg-primary", "Twitch", "rivers_gg", "https://www.twitch.tv/rivers_gg", 6200000, 42000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-riversgg-sec", "Kick", "rivers_gg", "https://kick.com/rivers_gg", 2170000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Mexico", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@riversggteam.com",
      sourceUrl: "https://www.twitch.tv/rivers_gg",
      lastChecked: daysAgo(2),
    },
  },
  // 91. Alexandre Borba (Gaules) (Twitch)
  {
    id: "creator-twitch-gaules",
    name: "Alexandre Borba (Gaules)",
    category: "Esports",
    language: "Portuguese",
    creatorCountry: "Brazil",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "The leader of the Tribo. CS:GO world champion coach whose emotional community streams set global esports records.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-gaules-primary", "Twitch", "gaules", "https://www.twitch.tv/gaules", 4250000, 75000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-gaules-sec", "Kick", "gaules", "https://kick.com/gaules", 1487500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Brazil", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@gaulesteam.com",
      sourceUrl: "https://www.twitch.tv/gaules",
      lastChecked: daysAgo(2),
    },
  },
  // 92. Alan Ferreira (Alanzoka) (Twitch)
  {
    id: "creator-twitch-alanzoka",
    name: "Alan Ferreira (Alanzoka)",
    category: "Gaming",
    language: "Portuguese",
    creatorCountry: "Brazil",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "The King of Brazilian variety streaming renowned for hilarious horror game reactions, multiplayer titles, and AAA walkthroughs.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-alanzoka-primary", "Twitch", "alanzoka", "https://www.twitch.tv/alanzoka", 6850000, 32000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-alanzoka-sec", "Kick", "alanzoka", "https://kick.com/alanzoka", 2397500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Brazil", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@alanzokateam.com",
      sourceUrl: "https://www.twitch.tv/alanzoka",
      lastChecked: daysAgo(2),
    },
  },
  // 93. Rafael Lange (Cellbit) (Twitch)
  {
    id: "creator-twitch-cellbit",
    name: "Rafael Lange (Cellbit)",
    category: "Entertainment",
    language: "Portuguese",
    creatorCountry: "Brazil",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Mastermind creator of Ordem Paranormal tabletop RPG universe, setting Brazilian crowdfunding and stream records.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-cellbit-primary", "Twitch", "cellbit", "https://www.twitch.tv/cellbit", 3450000, 28000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-cellbit-sec", "Kick", "cellbit", "https://kick.com/cellbit", 1207500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Brazil", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@cellbitteam.com",
      sourceUrl: "https://www.twitch.tv/cellbit",
      lastChecked: daysAgo(2),
    },
  },
  // 94. Bruno Goes (Nobru) (Twitch)
  {
    id: "creator-twitch-nobru",
    name: "Bruno Goes (Nobru)",
    category: "Esports",
    language: "Portuguese",
    creatorCountry: "Brazil",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Free Fire World Champion and Fluxo esports co-founder leading South American mobile and PC battle royale streaming.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-nobru-primary", "Twitch", "nobru", "https://www.twitch.tv/nobru", 3950000, 36000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-nobru-sec", "Kick", "nobru", "https://kick.com/nobru", 1382500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Brazil", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@nobruteam.com",
      sourceUrl: "https://www.twitch.tv/nobru",
      lastChecked: daysAgo(2),
    },
  },
  // 95. Lucas Hauchard (Squeezie) (Twitch)
  {
    id: "creator-twitch-squeezie",
    name: "Lucas Hauchard (Squeezie)",
    category: "Entertainment",
    language: "French",
    creatorCountry: "France",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "France's #1 creator and visionary organizer of the GP Explorer Formula 4 race attracting 1.3M peak live viewers.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-squeezie-primary", "Twitch", "squeezie", "https://www.twitch.tv/squeezie", 5100000, 95000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-squeezie-sec", "Kick", "squeezie", "https://kick.com/squeezie", 1785000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "France", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@squeezieteam.com",
      sourceUrl: "https://www.twitch.tv/squeezie",
      lastChecked: daysAgo(2),
    },
  },
  // 96. Kamel Kebir (Kameto) (Twitch)
  {
    id: "creator-twitch-kamet0",
    name: "Kamel Kebir (Kameto)",
    category: "Esports",
    language: "French",
    creatorCountry: "France",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "CEO of Karmine Corp (KCorp), League of Legends icon, and French general of Reddit r/place pixel wars.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-kamet0-primary", "Twitch", "kamet0", "https://www.twitch.tv/kamet0", 1980000, 52000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-kamet0-sec", "Kick", "kamet0", "https://kick.com/kamet0", 693000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "France", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@kamet0team.com",
      sourceUrl: "https://www.twitch.tv/kamet0",
      lastChecked: daysAgo(2),
    },
  },
  // 97. Adrien Nougaret (ZeratoR) (Twitch)
  {
    id: "creator-twitch-zerator",
    name: "Adrien Nougaret (ZeratoR)",
    category: "Entertainment",
    language: "French",
    creatorCountry: "France",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Creator of ZEvent charity marathon raising over €10M annually and founder of TrackMania Cup and Mandatory esports.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-zerator-primary", "Twitch", "zerator", "https://www.twitch.tv/zerator", 1650000, 48000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-zerator-sec", "Kick", "zerator", "https://kick.com/zerator", 577500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "France", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@zeratorteam.com",
      sourceUrl: "https://www.twitch.tv/zerator",
      lastChecked: daysAgo(2),
    },
  },
  // 98. Marcel Eris (MontanaBlack88) (Twitch)
  {
    id: "creator-twitch-montanablack88",
    name: "Marcel Eris (MontanaBlack88)",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Germany's biggest variety streamer and bestseller author sharing candid life experiences, FIFA pack openings, and IRL vlogs.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-montanablack88-primary", "Twitch", "montanablack88", "https://www.twitch.tv/montanablack88", 5350000, 38000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-montanablack88-sec", "Kick", "montanablack88", "https://kick.com/montanablack88", 1872500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@montanablack88team.com",
      sourceUrl: "https://www.twitch.tv/montanablack88",
      lastChecked: daysAgo(2),
    },
  },
  // 99. Kevin Teller (Papaplatte) (Twitch)
  {
    id: "creator-twitch-papaplatte",
    name: "Kevin Teller (Papaplatte)",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "7 vs. Wild survivor, podcast host (Edeltalk), and Germany's #1 fast-talking variety streamer known for Lego builds and IRL trips.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-papaplatte-primary", "Twitch", "papaplatte", "https://www.twitch.tv/papaplatte", 2520000, 34000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-papaplatte-sec", "Kick", "papaplatte", "https://kick.com/papaplatte", 882000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@papaplatteteam.com",
      sourceUrl: "https://www.twitch.tv/papaplatte",
      lastChecked: daysAgo(2),
    },
  },
  // 100. Maximilian Stemmler (Trymacs) (Twitch)
  {
    id: "creator-twitch-trymacs",
    name: "Maximilian Stemmler (Trymacs)",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Clash Royale legend, esports event organizer, and creator of the Great Fight boxing spectacle in Cologne.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-trymacs-primary", "Twitch", "trymacs", "https://www.twitch.tv/trymacs", 3650000, 29000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-trymacs-sec", "Kick", "trymacs", "https://kick.com/trymacs", 1277500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@trymacsteam.com",
      sourceUrl: "https://www.twitch.tv/trymacs",
      lastChecked: daysAgo(2),
    },
  },
  // 101. Elias Nerlich (EliasN97) (Twitch)
  {
    id: "creator-twitch-eliasn97",
    name: "Elias Nerlich (EliasN97)",
    category: "Sports",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Delay Sports Berlin president, former professional FIFA player, and record-setting German football live streamer.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-eliasn97-primary", "Twitch", "eliasn97", "https://www.twitch.tv/eliasn97", 1950000, 42000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-eliasn97-sec", "Kick", "eliasn97", "https://kick.com/eliasn97", 682500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@eliasn97team.com",
      sourceUrl: "https://www.twitch.tv/eliasn97",
      lastChecked: daysAgo(2),
    },
  },
  // 102. Lee Sang-hyeok (Faker) (Twitch)
  {
    id: "creator-twitch-faker",
    name: "Lee Sang-hyeok (Faker)",
    category: "Esports",
    language: "Korean",
    creatorCountry: "South Korea",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "The Unkillable Demon King. 4-time League of Legends World Champion with T1 and undisputed greatest of all time (GOAT).",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-faker-primary", "Twitch", "faker", "https://www.twitch.tv/faker", 4350000, 55000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-faker-sec", "Kick", "faker", "https://kick.com/faker", 1522500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "South Korea", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@fakerteam.com",
      sourceUrl: "https://www.twitch.tv/faker",
      lastChecked: daysAgo(2),
    },
  },
  // 103. Shaka (fps_shaka) (Twitch)
  {
    id: "creator-twitch-fpsshaka",
    name: "Shaka (fps_shaka)",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "Former Alliance Alliance pro and the central pillar of Japan's VTuber/streamer esports boom across Apex and Street Fighter 6.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-fpsshaka-primary", "Twitch", "fps_shaka", "https://www.twitch.tv/fps_shaka", 1450000, 38000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-fpsshaka-sec", "Kick", "fps_shaka", "https://kick.com/fps_shaka", 507500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@fpsshakateam.com",
      sourceUrl: "https://www.twitch.tv/fps_shaka",
      lastChecked: daysAgo(2),
    },
  },
  // 104. StylishNoob (Sekito Yuta) (Twitch)
  {
    id: "creator-twitch-stylishnoob4",
    name: "StylishNoob (Sekito Yuta)",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Official Verified Streamer Partner",
    bio: "ZETA DIVISION streamer, former Overwatch tank, and beloved pioneer of modern Japanese competitive FPS streaming.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-stylishnoob4-primary", "Twitch", "stylishnoob4", "https://www.twitch.tv/stylishnoob4", 920000, 24000, "avg_live_viewers", "Daily broadcasts on Twitch"),
      createStreamerAccount("acc-creator-twitch-stylishnoob4-sec", "Kick", "stylishnoob4", "https://kick.com/stylishnoob4", 322000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "contact@stylishnoob4team.com",
      sourceUrl: "https://www.twitch.tv/stylishnoob4",
      lastChecked: daysAgo(2),
    },
  },
  // 105. Arjun Singh (Storm) (Kick)
  {
    id: "creator-kick-stormarjun6",
    name: "Arjun Singh (Storm)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-stormarjun6-primary", "Kick", "storm_arjun6", "https://kick.com/storm_arjun6", 1581545, 22395, "avg_live_viewers", "Streams 4-6 days / week on Kick (22,395 avg live)"),
      createStreamerAccount("acc-creator-kick-stormarjun6-sec", "Twitch", "storm_arjun6", "https://www.twitch.tv/storm_arjun6", 711695, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.stormarjun6@streamerscout.net",
      sourceUrl: "https://kick.com/storm_arjun6",
      lastChecked: daysAgo(2),
    },
  },
  // 106. Anthony "Havoc" Lee (Twitch)
  {
    id: "creator-twitch-havocanthony7",
    name: "Anthony \"Havoc\" Lee",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-havocanthony7-primary", "Twitch", "havocanthony7", "https://www.twitch.tv/havocanthony7", 1596274, 22834, "avg_live_viewers", "Streams 4-6 days / week on Twitch (22,834 avg live)"),
      createStreamerAccount("acc-creator-twitch-havocanthony7-sec", "Kick", "havocanthony7", "https://kick.com/havocanthony7", 718323, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.havocanthony7@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/havocanthony7",
      lastChecked: daysAgo(2),
    },
  },
  // 107. Diya Chatterjee (Reaper) (Kick)
  {
    id: "creator-kick-reaperdiya8",
    name: "Diya Chatterjee (Reaper)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-reaperdiya8-primary", "Kick", "reaper_diya8", "https://kick.com/reaper_diya8", 1611003, 23273, "avg_live_viewers", "Streams 4-6 days / week on Kick (23,273 avg live)"),
      createStreamerAccount("acc-creator-kick-reaperdiya8-sec", "Twitch", "reaper_diya8", "https://www.twitch.tv/reaper_diya8", 724951, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.reaperdiya8@streamerscout.net",
      sourceUrl: "https://kick.com/reaper_diya8",
      lastChecked: daysAgo(2),
    },
  },
  // 108. Grayson "Zenith" Harris (Twitch)
  {
    id: "creator-twitch-zenithgrayson9",
    name: "Grayson \"Zenith\" Harris",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-zenithgrayson9-primary", "Twitch", "zenithgrayson9", "https://www.twitch.tv/zenithgrayson9", 1625732, 23712, "avg_live_viewers", "Streams 4-6 days / week on Twitch (23,712 avg live)"),
      createStreamerAccount("acc-creator-twitch-zenithgrayson9-sec", "Kick", "zenithgrayson9", "https://kick.com/zenithgrayson9", 731579, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zenithgrayson9@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/zenithgrayson9",
      lastChecked: daysAgo(2),
    },
  },
  // 109. Aadhya Chopra (Glitch) (Kick)
  {
    id: "creator-kick-glitchaadhya10",
    name: "Aadhya Chopra (Glitch)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-glitchaadhya10-primary", "Kick", "glitch_aadhya10", "https://kick.com/glitch_aadhya10", 1640461, 24151, "avg_live_viewers", "Streams 4-6 days / week on Kick (24,151 avg live)"),
      createStreamerAccount("acc-creator-kick-glitchaadhya10-sec", "Twitch", "glitch_aadhya10", "https://www.twitch.tv/glitch_aadhya10", 738207, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.glitchaadhya10@streamerscout.net",
      sourceUrl: "https://kick.com/glitch_aadhya10",
      lastChecked: daysAgo(2),
    },
  },
  // 110. Leo "Echo" Lewis (Twitch)
  {
    id: "creator-twitch-echoleo11",
    name: "Leo \"Echo\" Lewis",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-echoleo11-primary", "Twitch", "echoleo11", "https://www.twitch.tv/echoleo11", 1655190, 24590, "avg_live_viewers", "Streams 4-6 days / week on Twitch (24,590 avg live)"),
      createStreamerAccount("acc-creator-twitch-echoleo11-sec", "Kick", "echoleo11", "https://kick.com/echoleo11", 744836, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.echoleo11@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/echoleo11",
      lastChecked: daysAgo(2),
    },
  },
  // 111. Isha Rathore (Siren) (Kick)
  {
    id: "creator-kick-sirenisha12",
    name: "Isha Rathore (Siren)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-sirenisha12-primary", "Kick", "siren_isha12", "https://kick.com/siren_isha12", 1669919, 25029, "avg_live_viewers", "Streams 4-6 days / week on Kick (25,029 avg live)"),
      createStreamerAccount("acc-creator-kick-sirenisha12-sec", "Twitch", "siren_isha12", "https://www.twitch.tv/siren_isha12", 751464, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.sirenisha12@streamerscout.net",
      sourceUrl: "https://kick.com/siren_isha12",
      lastChecked: daysAgo(2),
    },
  },
  // 112. Emma "Cyber" Smith (Twitch)
  {
    id: "creator-twitch-cyberemma13",
    name: "Emma \"Cyber\" Smith",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-cyberemma13-primary", "Twitch", "cyberemma13", "https://www.twitch.tv/cyberemma13", 1684648, 968, "avg_live_viewers", "Streams 4-6 days / week on Twitch (968 avg live)"),
      createStreamerAccount("acc-creator-twitch-cyberemma13-sec", "Kick", "cyberemma13", "https://kick.com/cyberemma13", 758092, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cyberemma13@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/cyberemma13",
      lastChecked: daysAgo(2),
    },
  },
  // 113. Pooja Singh (Pixel) (Kick)
  {
    id: "creator-kick-pixelpooja14",
    name: "Pooja Singh (Pixel)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-pixelpooja14-primary", "Kick", "pixel_pooja14", "https://kick.com/pixel_pooja14", 1699377, 1407, "avg_live_viewers", "Streams 4-6 days / week on Kick (1,407 avg live)"),
      createStreamerAccount("acc-creator-kick-pixelpooja14-sec", "Twitch", "pixel_pooja14", "https://www.twitch.tv/pixel_pooja14", 764720, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pixelpooja14@streamerscout.net",
      sourceUrl: "https://kick.com/pixel_pooja14",
      lastChecked: daysAgo(2),
    },
  },
  // 114. Ava "Quantum" Jones (Twitch)
  {
    id: "creator-twitch-quantumava15",
    name: "Ava \"Quantum\" Jones",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-quantumava15-primary", "Twitch", "quantumava15", "https://www.twitch.tv/quantumava15", 1714106, 1846, "avg_live_viewers", "Streams 4-6 days / week on Twitch (1,846 avg live)"),
      createStreamerAccount("acc-creator-twitch-quantumava15-sec", "Kick", "quantumava15", "https://kick.com/quantumava15", 771348, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.quantumava15@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/quantumava15",
      lastChecked: daysAgo(2),
    },
  },
  // 115. Siddharth Chatterjee (Specter) (Kick)
  {
    id: "creator-kick-spectersiddharth16",
    name: "Siddharth Chatterjee (Specter)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-spectersiddharth16-primary", "Kick", "specter_siddharth16", "https://kick.com/specter_siddharth16", 1728835, 2285, "avg_live_viewers", "Streams 4-6 days / week on Kick (2,285 avg live)"),
      createStreamerAccount("acc-creator-kick-spectersiddharth16-sec", "Twitch", "specter_siddharth16", "https://www.twitch.tv/specter_siddharth16", 777976, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.spectersiddharth16@streamerscout.net",
      sourceUrl: "https://kick.com/specter_siddharth16",
      lastChecked: daysAgo(2),
    },
  },
  // 116. Isabella "Raptor" Rodriguez (Twitch)
  {
    id: "creator-twitch-raptorisabella17",
    name: "Isabella \"Raptor\" Rodriguez",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-raptorisabella17-primary", "Twitch", "raptorisabella17", "https://www.twitch.tv/raptorisabella17", 1743564, 2724, "avg_live_viewers", "Streams 4-6 days / week on Twitch (2,724 avg live)"),
      createStreamerAccount("acc-creator-twitch-raptorisabella17-sec", "Kick", "raptorisabella17", "https://kick.com/raptorisabella17", 784604, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.raptorisabella17@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/raptorisabella17",
      lastChecked: daysAgo(2),
    },
  },
  // 117. Karan Chopra (Venom) (Kick)
  {
    id: "creator-kick-venomkaran18",
    name: "Karan Chopra (Venom)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-venomkaran18-primary", "Kick", "venom_karan18", "https://kick.com/venom_karan18", 1758293, 3163, "avg_live_viewers", "Streams 4-6 days / week on Kick (3,163 avg live)"),
      createStreamerAccount("acc-creator-kick-venomkaran18-sec", "Twitch", "venom_karan18", "https://www.twitch.tv/venom_karan18", 791232, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.venomkaran18@streamerscout.net",
      sourceUrl: "https://kick.com/venom_karan18",
      lastChecked: daysAgo(2),
    },
  },
  // 118. Charlotte "Thunder" Gonzalez (Twitch)
  {
    id: "creator-twitch-thundercharlotte19",
    name: "Charlotte \"Thunder\" Gonzalez",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-thundercharlotte19-primary", "Twitch", "thundercharlotte19", "https://www.twitch.tv/thundercharlotte19", 1773022, 3602, "avg_live_viewers", "Streams 4-6 days / week on Twitch (3,602 avg live)"),
      createStreamerAccount("acc-creator-twitch-thundercharlotte19-sec", "Kick", "thundercharlotte19", "https://kick.com/thundercharlotte19", 797860, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.thundercharlotte19@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/thundercharlotte19",
      lastChecked: daysAgo(2),
    },
  },
  // 119. Nikhil Rathore (Vortex) (Kick)
  {
    id: "creator-kick-vortexnikhil20",
    name: "Nikhil Rathore (Vortex)",
    category: "Gaming",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-vortexnikhil20-primary", "Kick", "vortex_nikhil20", "https://kick.com/vortex_nikhil20", 1787751, 4041, "avg_live_viewers", "Streams 4-6 days / week on Kick (4,041 avg live)"),
      createStreamerAccount("acc-creator-kick-vortexnikhil20-sec", "Twitch", "vortex_nikhil20", "https://www.twitch.tv/vortex_nikhil20", 804488, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.vortexnikhil20@streamerscout.net",
      sourceUrl: "https://kick.com/vortex_nikhil20",
      lastChecked: daysAgo(2),
    },
  },
  // 120. Jack "Striker" Taylor (Twitch)
  {
    id: "creator-twitch-strikerjack21",
    name: "Jack \"Striker\" Taylor",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-strikerjack21-primary", "Twitch", "strikerjack21", "https://www.twitch.tv/strikerjack21", 1802480, 4480, "avg_live_viewers", "Streams 4-6 days / week on Twitch (4,480 avg live)"),
      createStreamerAccount("acc-creator-twitch-strikerjack21-sec", "Kick", "strikerjack21", "https://kick.com/strikerjack21", 811116, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.strikerjack21@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/strikerjack21",
      lastChecked: daysAgo(2),
    },
  },
  // 121. Ayush Singh (Phoenix) (Kick)
  {
    id: "creator-kick-phoenixayush22",
    name: "Ayush Singh (Phoenix)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phoenixayush22-primary", "Kick", "phoenix_ayush22", "https://kick.com/phoenix_ayush22", 1817209, 4919, "avg_live_viewers", "Streams 4-6 days / week on Kick (4,919 avg live)"),
      createStreamerAccount("acc-creator-kick-phoenixayush22-sec", "Twitch", "phoenix_ayush22", "https://www.twitch.tv/phoenix_ayush22", 817744, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phoenixayush22@streamerscout.net",
      sourceUrl: "https://kick.com/phoenix_ayush22",
      lastChecked: daysAgo(2),
    },
  },
  // 122. Liam "Titan" Lee (Twitch)
  {
    id: "creator-twitch-titanliam23",
    name: "Liam \"Titan\" Lee",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-titanliam23-primary", "Twitch", "titanliam23", "https://www.twitch.tv/titanliam23", 1831938, 5358, "avg_live_viewers", "Streams 4-6 days / week on Twitch (5,358 avg live)"),
      createStreamerAccount("acc-creator-twitch-titanliam23-sec", "Kick", "titanliam23", "https://kick.com/titanliam23", 824372, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.titanliam23@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/titanliam23",
      lastChecked: daysAgo(2),
    },
  },
  // 123. Pranav Chatterjee (Zero) (Kick)
  {
    id: "creator-kick-zeropranav24",
    name: "Pranav Chatterjee (Zero)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-zeropranav24-primary", "Kick", "zero_pranav24", "https://kick.com/zero_pranav24", 1846667, 5797, "avg_live_viewers", "Streams 4-6 days / week on Kick (5,797 avg live)"),
      createStreamerAccount("acc-creator-kick-zeropranav24-sec", "Twitch", "zero_pranav24", "https://www.twitch.tv/zero_pranav24", 831000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zeropranav24@streamerscout.net",
      sourceUrl: "https://kick.com/zero_pranav24",
      lastChecked: daysAgo(2),
    },
  },
  // 124. Oliver "Ninja" Harris (Twitch)
  {
    id: "creator-twitch-ninjaoliver25",
    name: "Oliver \"Ninja\" Harris",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-ninjaoliver25-primary", "Twitch", "ninjaoliver25", "https://www.twitch.tv/ninjaoliver25", 1861396, 6236, "avg_live_viewers", "Streams 4-6 days / week on Twitch (6,236 avg live)"),
      createStreamerAccount("acc-creator-twitch-ninjaoliver25-sec", "Kick", "ninjaoliver25", "https://kick.com/ninjaoliver25", 837628, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ninjaoliver25@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/ninjaoliver25",
      lastChecked: daysAgo(2),
    },
  },
  // 125. Dev Chopra (Ghost) (Kick)
  {
    id: "creator-kick-ghostdev26",
    name: "Dev Chopra (Ghost)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-ghostdev26-primary", "Kick", "ghost_dev26", "https://kick.com/ghost_dev26", 1876125, 6675, "avg_live_viewers", "Streams 4-6 days / week on Kick (6,675 avg live)"),
      createStreamerAccount("acc-creator-kick-ghostdev26-sec", "Twitch", "ghost_dev26", "https://www.twitch.tv/ghost_dev26", 844256, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ghostdev26@streamerscout.net",
      sourceUrl: "https://kick.com/ghost_dev26",
      lastChecked: daysAgo(2),
    },
  },
  // 126. Ethan "Alpha" Lewis (Twitch)
  {
    id: "creator-twitch-alphaethan27",
    name: "Ethan \"Alpha\" Lewis",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-alphaethan27-primary", "Twitch", "alphaethan27", "https://www.twitch.tv/alphaethan27", 1890854, 7114, "avg_live_viewers", "Streams 4-6 days / week on Twitch (7,114 avg live)"),
      createStreamerAccount("acc-creator-twitch-alphaethan27-sec", "Kick", "alphaethan27", "https://kick.com/alphaethan27", 850884, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.alphaethan27@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/alphaethan27",
      lastChecked: daysAgo(2),
    },
  },
  // 127. Shlok Rathore (Omega) (Kick)
  {
    id: "creator-kick-omegashlok28",
    name: "Shlok Rathore (Omega)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-omegashlok28-primary", "Kick", "omega_shlok28", "https://kick.com/omega_shlok28", 1905583, 7553, "avg_live_viewers", "Streams 4-6 days / week on Kick (7,553 avg live)"),
      createStreamerAccount("acc-creator-kick-omegashlok28-sec", "Twitch", "omega_shlok28", "https://www.twitch.tv/omega_shlok28", 857512, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.omegashlok28@streamerscout.net",
      sourceUrl: "https://kick.com/omega_shlok28",
      lastChecked: daysAgo(2),
    },
  },
  // 128. Logan "Viper" Smith (Twitch)
  {
    id: "creator-twitch-viperlogan29",
    name: "Logan \"Viper\" Smith",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-viperlogan29-primary", "Twitch", "viperlogan29", "https://www.twitch.tv/viperlogan29", 1920312, 7992, "avg_live_viewers", "Streams 4-6 days / week on Twitch (7,992 avg live)"),
      createStreamerAccount("acc-creator-twitch-viperlogan29-sec", "Kick", "viperlogan29", "https://kick.com/viperlogan29", 864140, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.viperlogan29@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/viperlogan29",
      lastChecked: daysAgo(2),
    },
  },
  // 129. Kabir Singh (Phantom) (Kick)
  {
    id: "creator-kick-phantomkabir30",
    name: "Kabir Singh (Phantom)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phantomkabir30-primary", "Kick", "phantom_kabir30", "https://kick.com/phantom_kabir30", 1935041, 8431, "avg_live_viewers", "Streams 4-6 days / week on Kick (8,431 avg live)"),
      createStreamerAccount("acc-creator-kick-phantomkabir30-sec", "Twitch", "phantom_kabir30", "https://www.twitch.tv/phantom_kabir30", 870768, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phantomkabir30@streamerscout.net",
      sourceUrl: "https://kick.com/phantom_kabir30",
      lastChecked: daysAgo(2),
    },
  },
  // 130. Benjamin "Shadow" Jones (Twitch)
  {
    id: "creator-twitch-shadowbenjamin31",
    name: "Benjamin \"Shadow\" Jones",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-shadowbenjamin31-primary", "Twitch", "shadowbenjamin31", "https://www.twitch.tv/shadowbenjamin31", 1949770, 8870, "avg_live_viewers", "Streams 4-6 days / week on Twitch (8,870 avg live)"),
      createStreamerAccount("acc-creator-twitch-shadowbenjamin31-sec", "Kick", "shadowbenjamin31", "https://kick.com/shadowbenjamin31", 877397, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.shadowbenjamin31@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/shadowbenjamin31",
      lastChecked: daysAgo(2),
    },
  },
  // 131. Dhruv Chatterjee (Blaze) (Kick)
  {
    id: "creator-kick-blazedhruv32",
    name: "Dhruv Chatterjee (Blaze)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-blazedhruv32-primary", "Kick", "blaze_dhruv32", "https://kick.com/blaze_dhruv32", 1964499, 9309, "avg_live_viewers", "Streams 4-6 days / week on Kick (9,309 avg live)"),
      createStreamerAccount("acc-creator-kick-blazedhruv32-sec", "Twitch", "blaze_dhruv32", "https://www.twitch.tv/blaze_dhruv32", 884025, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.blazedhruv32@streamerscout.net",
      sourceUrl: "https://kick.com/blaze_dhruv32",
      lastChecked: daysAgo(2),
    },
  },
  // 132. Sebastian "Apex" Rodriguez (Twitch)
  {
    id: "creator-twitch-apexsebastian33",
    name: "Sebastian \"Apex\" Rodriguez",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-apexsebastian33-primary", "Twitch", "apexsebastian33", "https://www.twitch.tv/apexsebastian33", 1979228, 9748, "avg_live_viewers", "Streams 4-6 days / week on Twitch (9,748 avg live)"),
      createStreamerAccount("acc-creator-twitch-apexsebastian33-sec", "Kick", "apexsebastian33", "https://kick.com/apexsebastian33", 890653, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.apexsebastian33@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/apexsebastian33",
      lastChecked: daysAgo(2),
    },
  },
  // 133. Atharv Chopra (Frost) (Kick)
  {
    id: "creator-kick-frostatharv34",
    name: "Atharv Chopra (Frost)",
    category: "Gaming",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-frostatharv34-primary", "Kick", "frost_atharv34", "https://kick.com/frost_atharv34", 1993957, 10187, "avg_live_viewers", "Streams 4-6 days / week on Kick (10,187 avg live)"),
      createStreamerAccount("acc-creator-kick-frostatharv34-sec", "Twitch", "frost_atharv34", "https://www.twitch.tv/frost_atharv34", 897281, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.frostatharv34@streamerscout.net",
      sourceUrl: "https://kick.com/frost_atharv34",
      lastChecked: daysAgo(2),
    },
  },
  // 134. Aiden "Nova" Gonzalez (Twitch)
  {
    id: "creator-twitch-novaaiden35",
    name: "Aiden \"Nova\" Gonzalez",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-novaaiden35-primary", "Twitch", "novaaiden35", "https://www.twitch.tv/novaaiden35", 2008686, 10626, "avg_live_viewers", "Streams 4-6 days / week on Twitch (10,626 avg live)"),
      createStreamerAccount("acc-creator-twitch-novaaiden35-sec", "Kick", "novaaiden35", "https://kick.com/novaaiden35", 903909, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.novaaiden35@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/novaaiden35",
      lastChecked: daysAgo(2),
    },
  },
  // 135. Ishaan Rathore (Cosmic) (Kick)
  {
    id: "creator-kick-cosmicishaan36",
    name: "Ishaan Rathore (Cosmic)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-cosmicishaan36-primary", "Kick", "cosmic_ishaan36", "https://kick.com/cosmic_ishaan36", 2023415, 11065, "avg_live_viewers", "Streams 4-6 days / week on Kick (11,065 avg live)"),
      createStreamerAccount("acc-creator-kick-cosmicishaan36-sec", "Twitch", "cosmic_ishaan36", "https://www.twitch.tv/cosmic_ishaan36", 910537, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cosmicishaan36@streamerscout.net",
      sourceUrl: "https://kick.com/cosmic_ishaan36",
      lastChecked: daysAgo(2),
    },
  },
  // 136. Samuel "Pulse" Taylor (Twitch)
  {
    id: "creator-twitch-pulsesamuel37",
    name: "Samuel \"Pulse\" Taylor",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-pulsesamuel37-primary", "Twitch", "pulsesamuel37", "https://www.twitch.tv/pulsesamuel37", 2038144, 11504, "avg_live_viewers", "Streams 4-6 days / week on Twitch (11,504 avg live)"),
      createStreamerAccount("acc-creator-twitch-pulsesamuel37-sec", "Kick", "pulsesamuel37", "https://kick.com/pulsesamuel37", 917165, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pulsesamuel37@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/pulsesamuel37",
      lastChecked: daysAgo(2),
    },
  },
  // 137. Arjun Singh (Storm) (Kick)
  {
    id: "creator-kick-stormarjun38",
    name: "Arjun Singh (Storm)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-stormarjun38-primary", "Kick", "storm_arjun38", "https://kick.com/storm_arjun38", 2052873, 11943, "avg_live_viewers", "Streams 4-6 days / week on Kick (11,943 avg live)"),
      createStreamerAccount("acc-creator-kick-stormarjun38-sec", "Twitch", "storm_arjun38", "https://www.twitch.tv/storm_arjun38", 923793, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.stormarjun38@streamerscout.net",
      sourceUrl: "https://kick.com/storm_arjun38",
      lastChecked: daysAgo(2),
    },
  },
  // 138. Joseph "Havoc" Lee (Twitch)
  {
    id: "creator-twitch-havocjoseph39",
    name: "Joseph \"Havoc\" Lee",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-havocjoseph39-primary", "Twitch", "havocjoseph39", "https://www.twitch.tv/havocjoseph39", 2067602, 12382, "avg_live_viewers", "Streams 4-6 days / week on Twitch (12,382 avg live)"),
      createStreamerAccount("acc-creator-twitch-havocjoseph39-sec", "Kick", "havocjoseph39", "https://kick.com/havocjoseph39", 930421, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.havocjoseph39@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/havocjoseph39",
      lastChecked: daysAgo(2),
    },
  },
  // 139. Diya Chatterjee (Reaper) (Kick)
  {
    id: "creator-kick-reaperdiya40",
    name: "Diya Chatterjee (Reaper)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-reaperdiya40-primary", "Kick", "reaper_diya40", "https://kick.com/reaper_diya40", 2082331, 12821, "avg_live_viewers", "Streams 4-6 days / week on Kick (12,821 avg live)"),
      createStreamerAccount("acc-creator-kick-reaperdiya40-sec", "Twitch", "reaper_diya40", "https://www.twitch.tv/reaper_diya40", 937049, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.reaperdiya40@streamerscout.net",
      sourceUrl: "https://kick.com/reaper_diya40",
      lastChecked: daysAgo(2),
    },
  },
  // 140. Owen "Zenith" Harris (Twitch)
  {
    id: "creator-twitch-zenithowen41",
    name: "Owen \"Zenith\" Harris",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-zenithowen41-primary", "Twitch", "zenithowen41", "https://www.twitch.tv/zenithowen41", 2097060, 13260, "avg_live_viewers", "Streams 4-6 days / week on Twitch (13,260 avg live)"),
      createStreamerAccount("acc-creator-twitch-zenithowen41-sec", "Kick", "zenithowen41", "https://kick.com/zenithowen41", 943677, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zenithowen41@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/zenithowen41",
      lastChecked: daysAgo(2),
    },
  },
  // 141. Aadhya Chopra (Glitch) (Kick)
  {
    id: "creator-kick-glitchaadhya42",
    name: "Aadhya Chopra (Glitch)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-glitchaadhya42-primary", "Kick", "glitch_aadhya42", "https://kick.com/glitch_aadhya42", 2111789, 13699, "avg_live_viewers", "Streams 4-6 days / week on Kick (13,699 avg live)"),
      createStreamerAccount("acc-creator-kick-glitchaadhya42-sec", "Twitch", "glitch_aadhya42", "https://www.twitch.tv/glitch_aadhya42", 950305, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.glitchaadhya42@streamerscout.net",
      sourceUrl: "https://kick.com/glitch_aadhya42",
      lastChecked: daysAgo(2),
    },
  },
  // 142. John "Echo" Lewis (Twitch)
  {
    id: "creator-twitch-echojohn43",
    name: "John \"Echo\" Lewis",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-echojohn43-primary", "Twitch", "echojohn43", "https://www.twitch.tv/echojohn43", 2126518, 14138, "avg_live_viewers", "Streams 4-6 days / week on Twitch (14,138 avg live)"),
      createStreamerAccount("acc-creator-twitch-echojohn43-sec", "Kick", "echojohn43", "https://kick.com/echojohn43", 956933, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.echojohn43@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/echojohn43",
      lastChecked: daysAgo(2),
    },
  },
  // 143. Isha Rathore (Siren) (Kick)
  {
    id: "creator-kick-sirenisha44",
    name: "Isha Rathore (Siren)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-sirenisha44-primary", "Kick", "siren_isha44", "https://kick.com/siren_isha44", 2141247, 14577, "avg_live_viewers", "Streams 4-6 days / week on Kick (14,577 avg live)"),
      createStreamerAccount("acc-creator-kick-sirenisha44-sec", "Twitch", "siren_isha44", "https://www.twitch.tv/siren_isha44", 963561, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.sirenisha44@streamerscout.net",
      sourceUrl: "https://kick.com/siren_isha44",
      lastChecked: daysAgo(2),
    },
  },
  // 144. Luke "Cyber" Smith (Twitch)
  {
    id: "creator-twitch-cyberluke45",
    name: "Luke \"Cyber\" Smith",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-cyberluke45-primary", "Twitch", "cyberluke45", "https://www.twitch.tv/cyberluke45", 2155976, 15016, "avg_live_viewers", "Streams 4-6 days / week on Twitch (15,016 avg live)"),
      createStreamerAccount("acc-creator-twitch-cyberluke45-sec", "Kick", "cyberluke45", "https://kick.com/cyberluke45", 970189, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cyberluke45@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/cyberluke45",
      lastChecked: daysAgo(2),
    },
  },
  // 145. Pooja Singh (Pixel) (Kick)
  {
    id: "creator-kick-pixelpooja46",
    name: "Pooja Singh (Pixel)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-pixelpooja46-primary", "Kick", "pixel_pooja46", "https://kick.com/pixel_pooja46", 2170705, 15455, "avg_live_viewers", "Streams 4-6 days / week on Kick (15,455 avg live)"),
      createStreamerAccount("acc-creator-kick-pixelpooja46-sec", "Twitch", "pixel_pooja46", "https://www.twitch.tv/pixel_pooja46", 976817, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pixelpooja46@streamerscout.net",
      sourceUrl: "https://kick.com/pixel_pooja46",
      lastChecked: daysAgo(2),
    },
  },
  // 146. Anthony "Quantum" Jones (Twitch)
  {
    id: "creator-twitch-quantumanthony47",
    name: "Anthony \"Quantum\" Jones",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-quantumanthony47-primary", "Twitch", "quantumanthony47", "https://www.twitch.tv/quantumanthony47", 2185434, 15894, "avg_live_viewers", "Streams 4-6 days / week on Twitch (15,894 avg live)"),
      createStreamerAccount("acc-creator-twitch-quantumanthony47-sec", "Kick", "quantumanthony47", "https://kick.com/quantumanthony47", 983445, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.quantumanthony47@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/quantumanthony47",
      lastChecked: daysAgo(2),
    },
  },
  // 147. Siddharth Chatterjee (Specter) (Kick)
  {
    id: "creator-kick-spectersiddharth48",
    name: "Siddharth Chatterjee (Specter)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-spectersiddharth48-primary", "Kick", "specter_siddharth48", "https://kick.com/specter_siddharth48", 2200163, 16333, "avg_live_viewers", "Streams 4-6 days / week on Kick (16,333 avg live)"),
      createStreamerAccount("acc-creator-kick-spectersiddharth48-sec", "Twitch", "specter_siddharth48", "https://www.twitch.tv/specter_siddharth48", 990073, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.spectersiddharth48@streamerscout.net",
      sourceUrl: "https://kick.com/specter_siddharth48",
      lastChecked: daysAgo(2),
    },
  },
  // 148. Grayson "Raptor" Rodriguez (Twitch)
  {
    id: "creator-twitch-raptorgrayson49",
    name: "Grayson \"Raptor\" Rodriguez",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-raptorgrayson49-primary", "Twitch", "raptorgrayson49", "https://www.twitch.tv/raptorgrayson49", 2214892, 16772, "avg_live_viewers", "Streams 4-6 days / week on Twitch (16,772 avg live)"),
      createStreamerAccount("acc-creator-twitch-raptorgrayson49-sec", "Kick", "raptorgrayson49", "https://kick.com/raptorgrayson49", 996701, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.raptorgrayson49@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/raptorgrayson49",
      lastChecked: daysAgo(2),
    },
  },
  // 149. Karan Chopra (Venom) (Kick)
  {
    id: "creator-kick-venomkaran50",
    name: "Karan Chopra (Venom)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-venomkaran50-primary", "Kick", "venom_karan50", "https://kick.com/venom_karan50", 2229621, 17211, "avg_live_viewers", "Streams 4-6 days / week on Kick (17,211 avg live)"),
      createStreamerAccount("acc-creator-kick-venomkaran50-sec", "Twitch", "venom_karan50", "https://www.twitch.tv/venom_karan50", 1003329, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.venomkaran50@streamerscout.net",
      sourceUrl: "https://kick.com/venom_karan50",
      lastChecked: daysAgo(2),
    },
  },
  // 150. Leo "Thunder" Gonzalez (Twitch)
  {
    id: "creator-twitch-thunderleo51",
    name: "Leo \"Thunder\" Gonzalez",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-thunderleo51-primary", "Twitch", "thunderleo51", "https://www.twitch.tv/thunderleo51", 2244350, 17650, "avg_live_viewers", "Streams 4-6 days / week on Twitch (17,650 avg live)"),
      createStreamerAccount("acc-creator-twitch-thunderleo51-sec", "Kick", "thunderleo51", "https://kick.com/thunderleo51", 1009958, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.thunderleo51@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/thunderleo51",
      lastChecked: daysAgo(2),
    },
  },
  // 151. Nikhil Rathore (Vortex) (Kick)
  {
    id: "creator-kick-vortexnikhil52",
    name: "Nikhil Rathore (Vortex)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-vortexnikhil52-primary", "Kick", "vortex_nikhil52", "https://kick.com/vortex_nikhil52", 2259079, 18089, "avg_live_viewers", "Streams 4-6 days / week on Kick (18,089 avg live)"),
      createStreamerAccount("acc-creator-kick-vortexnikhil52-sec", "Twitch", "vortex_nikhil52", "https://www.twitch.tv/vortex_nikhil52", 1016586, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.vortexnikhil52@streamerscout.net",
      sourceUrl: "https://kick.com/vortex_nikhil52",
      lastChecked: daysAgo(2),
    },
  },
  // 152. Emma "Striker" Taylor (Twitch)
  {
    id: "creator-twitch-strikeremma53",
    name: "Emma \"Striker\" Taylor",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-strikeremma53-primary", "Twitch", "strikeremma53", "https://www.twitch.tv/strikeremma53", 2273808, 18528, "avg_live_viewers", "Streams 4-6 days / week on Twitch (18,528 avg live)"),
      createStreamerAccount("acc-creator-twitch-strikeremma53-sec", "Kick", "strikeremma53", "https://kick.com/strikeremma53", 1023214, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.strikeremma53@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/strikeremma53",
      lastChecked: daysAgo(2),
    },
  },
  // 153. Ayush Singh (Phoenix) (Kick)
  {
    id: "creator-kick-phoenixayush54",
    name: "Ayush Singh (Phoenix)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phoenixayush54-primary", "Kick", "phoenix_ayush54", "https://kick.com/phoenix_ayush54", 2288537, 18967, "avg_live_viewers", "Streams 4-6 days / week on Kick (18,967 avg live)"),
      createStreamerAccount("acc-creator-kick-phoenixayush54-sec", "Twitch", "phoenix_ayush54", "https://www.twitch.tv/phoenix_ayush54", 1029842, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phoenixayush54@streamerscout.net",
      sourceUrl: "https://kick.com/phoenix_ayush54",
      lastChecked: daysAgo(2),
    },
  },
  // 154. Ava "Titan" Lee (Twitch)
  {
    id: "creator-twitch-titanava55",
    name: "Ava \"Titan\" Lee",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-titanava55-primary", "Twitch", "titanava55", "https://www.twitch.tv/titanava55", 2303266, 19406, "avg_live_viewers", "Streams 4-6 days / week on Twitch (19,406 avg live)"),
      createStreamerAccount("acc-creator-twitch-titanava55-sec", "Kick", "titanava55", "https://kick.com/titanava55", 1036470, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.titanava55@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/titanava55",
      lastChecked: daysAgo(2),
    },
  },
  // 155. Pranav Chatterjee (Zero) (Kick)
  {
    id: "creator-kick-zeropranav56",
    name: "Pranav Chatterjee (Zero)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-zeropranav56-primary", "Kick", "zero_pranav56", "https://kick.com/zero_pranav56", 2317995, 19845, "avg_live_viewers", "Streams 4-6 days / week on Kick (19,845 avg live)"),
      createStreamerAccount("acc-creator-kick-zeropranav56-sec", "Twitch", "zero_pranav56", "https://www.twitch.tv/zero_pranav56", 1043098, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zeropranav56@streamerscout.net",
      sourceUrl: "https://kick.com/zero_pranav56",
      lastChecked: daysAgo(2),
    },
  },
  // 156. Isabella "Ninja" Harris (Twitch)
  {
    id: "creator-twitch-ninjaisabella57",
    name: "Isabella \"Ninja\" Harris",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-ninjaisabella57-primary", "Twitch", "ninjaisabella57", "https://www.twitch.tv/ninjaisabella57", 2332724, 20284, "avg_live_viewers", "Streams 4-6 days / week on Twitch (20,284 avg live)"),
      createStreamerAccount("acc-creator-twitch-ninjaisabella57-sec", "Kick", "ninjaisabella57", "https://kick.com/ninjaisabella57", 1049726, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ninjaisabella57@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/ninjaisabella57",
      lastChecked: daysAgo(2),
    },
  },
  // 157. Dev Chopra (Ghost) (Kick)
  {
    id: "creator-kick-ghostdev58",
    name: "Dev Chopra (Ghost)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-ghostdev58-primary", "Kick", "ghost_dev58", "https://kick.com/ghost_dev58", 2347453, 20723, "avg_live_viewers", "Streams 4-6 days / week on Kick (20,723 avg live)"),
      createStreamerAccount("acc-creator-kick-ghostdev58-sec", "Twitch", "ghost_dev58", "https://www.twitch.tv/ghost_dev58", 1056354, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ghostdev58@streamerscout.net",
      sourceUrl: "https://kick.com/ghost_dev58",
      lastChecked: daysAgo(2),
    },
  },
  // 158. Charlotte "Alpha" Lewis (Twitch)
  {
    id: "creator-twitch-alphacharlotte59",
    name: "Charlotte \"Alpha\" Lewis",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-alphacharlotte59-primary", "Twitch", "alphacharlotte59", "https://www.twitch.tv/alphacharlotte59", 2362182, 21162, "avg_live_viewers", "Streams 4-6 days / week on Twitch (21,162 avg live)"),
      createStreamerAccount("acc-creator-twitch-alphacharlotte59-sec", "Kick", "alphacharlotte59", "https://kick.com/alphacharlotte59", 1062982, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.alphacharlotte59@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/alphacharlotte59",
      lastChecked: daysAgo(2),
    },
  },
  // 159. Shlok Rathore (Omega) (Kick)
  {
    id: "creator-kick-omegashlok60",
    name: "Shlok Rathore (Omega)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-omegashlok60-primary", "Kick", "omega_shlok60", "https://kick.com/omega_shlok60", 2376911, 21601, "avg_live_viewers", "Streams 4-6 days / week on Kick (21,601 avg live)"),
      createStreamerAccount("acc-creator-kick-omegashlok60-sec", "Twitch", "omega_shlok60", "https://www.twitch.tv/omega_shlok60", 1069610, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.omegashlok60@streamerscout.net",
      sourceUrl: "https://kick.com/omega_shlok60",
      lastChecked: daysAgo(2),
    },
  },
  // 160. Jack "Viper" Smith (Twitch)
  {
    id: "creator-twitch-viperjack61",
    name: "Jack \"Viper\" Smith",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-viperjack61-primary", "Twitch", "viperjack61", "https://www.twitch.tv/viperjack61", 2391640, 22040, "avg_live_viewers", "Streams 4-6 days / week on Twitch (22,040 avg live)"),
      createStreamerAccount("acc-creator-twitch-viperjack61-sec", "Kick", "viperjack61", "https://kick.com/viperjack61", 1076238, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.viperjack61@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/viperjack61",
      lastChecked: daysAgo(2),
    },
  },
  // 161. Kabir Singh (Phantom) (Kick)
  {
    id: "creator-kick-phantomkabir62",
    name: "Kabir Singh (Phantom)",
    category: "Gaming",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phantomkabir62-primary", "Kick", "phantom_kabir62", "https://kick.com/phantom_kabir62", 2406369, 22479, "avg_live_viewers", "Streams 4-6 days / week on Kick (22,479 avg live)"),
      createStreamerAccount("acc-creator-kick-phantomkabir62-sec", "Twitch", "phantom_kabir62", "https://www.twitch.tv/phantom_kabir62", 1082866, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phantomkabir62@streamerscout.net",
      sourceUrl: "https://kick.com/phantom_kabir62",
      lastChecked: daysAgo(2),
    },
  },
  // 162. Liam "Shadow" Jones (Twitch)
  {
    id: "creator-twitch-shadowliam63",
    name: "Liam \"Shadow\" Jones",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-shadowliam63-primary", "Twitch", "shadowliam63", "https://www.twitch.tv/shadowliam63", 2421098, 22918, "avg_live_viewers", "Streams 4-6 days / week on Twitch (22,918 avg live)"),
      createStreamerAccount("acc-creator-twitch-shadowliam63-sec", "Kick", "shadowliam63", "https://kick.com/shadowliam63", 1089494, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.shadowliam63@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/shadowliam63",
      lastChecked: daysAgo(2),
    },
  },
  // 163. Dhruv Chatterjee (Blaze) (Kick)
  {
    id: "creator-kick-blazedhruv64",
    name: "Dhruv Chatterjee (Blaze)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-blazedhruv64-primary", "Kick", "blaze_dhruv64", "https://kick.com/blaze_dhruv64", 2435827, 23357, "avg_live_viewers", "Streams 4-6 days / week on Kick (23,357 avg live)"),
      createStreamerAccount("acc-creator-kick-blazedhruv64-sec", "Twitch", "blaze_dhruv64", "https://www.twitch.tv/blaze_dhruv64", 1096122, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.blazedhruv64@streamerscout.net",
      sourceUrl: "https://kick.com/blaze_dhruv64",
      lastChecked: daysAgo(2),
    },
  },
  // 164. Oliver "Apex" Rodriguez (Twitch)
  {
    id: "creator-twitch-apexoliver65",
    name: "Oliver \"Apex\" Rodriguez",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-apexoliver65-primary", "Twitch", "apexoliver65", "https://www.twitch.tv/apexoliver65", 2450556, 23796, "avg_live_viewers", "Streams 4-6 days / week on Twitch (23,796 avg live)"),
      createStreamerAccount("acc-creator-twitch-apexoliver65-sec", "Kick", "apexoliver65", "https://kick.com/apexoliver65", 1102750, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.apexoliver65@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/apexoliver65",
      lastChecked: daysAgo(2),
    },
  },
  // 165. Atharv Chopra (Frost) (Kick)
  {
    id: "creator-kick-frostatharv66",
    name: "Atharv Chopra (Frost)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-frostatharv66-primary", "Kick", "frost_atharv66", "https://kick.com/frost_atharv66", 2465285, 24235, "avg_live_viewers", "Streams 4-6 days / week on Kick (24,235 avg live)"),
      createStreamerAccount("acc-creator-kick-frostatharv66-sec", "Twitch", "frost_atharv66", "https://www.twitch.tv/frost_atharv66", 1109378, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.frostatharv66@streamerscout.net",
      sourceUrl: "https://kick.com/frost_atharv66",
      lastChecked: daysAgo(2),
    },
  },
  // 166. Ethan "Nova" Gonzalez (Twitch)
  {
    id: "creator-twitch-novaethan67",
    name: "Ethan \"Nova\" Gonzalez",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-novaethan67-primary", "Twitch", "novaethan67", "https://www.twitch.tv/novaethan67", 2480014, 24674, "avg_live_viewers", "Streams 4-6 days / week on Twitch (24,674 avg live)"),
      createStreamerAccount("acc-creator-twitch-novaethan67-sec", "Kick", "novaethan67", "https://kick.com/novaethan67", 1116006, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.novaethan67@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/novaethan67",
      lastChecked: daysAgo(2),
    },
  },
  // 167. Ishaan Rathore (Cosmic) (Kick)
  {
    id: "creator-kick-cosmicishaan68",
    name: "Ishaan Rathore (Cosmic)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-cosmicishaan68-primary", "Kick", "cosmic_ishaan68", "https://kick.com/cosmic_ishaan68", 2494743, 25113, "avg_live_viewers", "Streams 4-6 days / week on Kick (25,113 avg live)"),
      createStreamerAccount("acc-creator-kick-cosmicishaan68-sec", "Twitch", "cosmic_ishaan68", "https://www.twitch.tv/cosmic_ishaan68", 1122634, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cosmicishaan68@streamerscout.net",
      sourceUrl: "https://kick.com/cosmic_ishaan68",
      lastChecked: daysAgo(2),
    },
  },
  // 168. Logan "Pulse" Taylor (Twitch)
  {
    id: "creator-twitch-pulselogan69",
    name: "Logan \"Pulse\" Taylor",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-pulselogan69-primary", "Twitch", "pulselogan69", "https://www.twitch.tv/pulselogan69", 2509472, 1052, "avg_live_viewers", "Streams 4-6 days / week on Twitch (1,052 avg live)"),
      createStreamerAccount("acc-creator-twitch-pulselogan69-sec", "Kick", "pulselogan69", "https://kick.com/pulselogan69", 1129262, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pulselogan69@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/pulselogan69",
      lastChecked: daysAgo(2),
    },
  },
  // 169. Arjun Singh (Storm) (Kick)
  {
    id: "creator-kick-stormarjun70",
    name: "Arjun Singh (Storm)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-stormarjun70-primary", "Kick", "storm_arjun70", "https://kick.com/storm_arjun70", 2524201, 1491, "avg_live_viewers", "Streams 4-6 days / week on Kick (1,491 avg live)"),
      createStreamerAccount("acc-creator-kick-stormarjun70-sec", "Twitch", "storm_arjun70", "https://www.twitch.tv/storm_arjun70", 1135890, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.stormarjun70@streamerscout.net",
      sourceUrl: "https://kick.com/storm_arjun70",
      lastChecked: daysAgo(2),
    },
  },
  // 170. Benjamin "Havoc" Lee (Twitch)
  {
    id: "creator-twitch-havocbenjamin71",
    name: "Benjamin \"Havoc\" Lee",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-havocbenjamin71-primary", "Twitch", "havocbenjamin71", "https://www.twitch.tv/havocbenjamin71", 2538930, 1930, "avg_live_viewers", "Streams 4-6 days / week on Twitch (1,930 avg live)"),
      createStreamerAccount("acc-creator-twitch-havocbenjamin71-sec", "Kick", "havocbenjamin71", "https://kick.com/havocbenjamin71", 1142519, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.havocbenjamin71@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/havocbenjamin71",
      lastChecked: daysAgo(2),
    },
  },
  // 171. Diya Chatterjee (Reaper) (Kick)
  {
    id: "creator-kick-reaperdiya72",
    name: "Diya Chatterjee (Reaper)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-reaperdiya72-primary", "Kick", "reaper_diya72", "https://kick.com/reaper_diya72", 2553659, 2369, "avg_live_viewers", "Streams 4-6 days / week on Kick (2,369 avg live)"),
      createStreamerAccount("acc-creator-kick-reaperdiya72-sec", "Twitch", "reaper_diya72", "https://www.twitch.tv/reaper_diya72", 1149147, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.reaperdiya72@streamerscout.net",
      sourceUrl: "https://kick.com/reaper_diya72",
      lastChecked: daysAgo(2),
    },
  },
  // 172. Sebastian "Zenith" Harris (Twitch)
  {
    id: "creator-twitch-zenithsebastian73",
    name: "Sebastian \"Zenith\" Harris",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-zenithsebastian73-primary", "Twitch", "zenithsebastian73", "https://www.twitch.tv/zenithsebastian73", 2568388, 2808, "avg_live_viewers", "Streams 4-6 days / week on Twitch (2,808 avg live)"),
      createStreamerAccount("acc-creator-twitch-zenithsebastian73-sec", "Kick", "zenithsebastian73", "https://kick.com/zenithsebastian73", 1155775, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zenithsebastian73@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/zenithsebastian73",
      lastChecked: daysAgo(2),
    },
  },
  // 173. Aadhya Chopra (Glitch) (Kick)
  {
    id: "creator-kick-glitchaadhya74",
    name: "Aadhya Chopra (Glitch)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-glitchaadhya74-primary", "Kick", "glitch_aadhya74", "https://kick.com/glitch_aadhya74", 2583117, 3247, "avg_live_viewers", "Streams 4-6 days / week on Kick (3,247 avg live)"),
      createStreamerAccount("acc-creator-kick-glitchaadhya74-sec", "Twitch", "glitch_aadhya74", "https://www.twitch.tv/glitch_aadhya74", 1162403, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.glitchaadhya74@streamerscout.net",
      sourceUrl: "https://kick.com/glitch_aadhya74",
      lastChecked: daysAgo(2),
    },
  },
  // 174. Aiden "Echo" Lewis (Twitch)
  {
    id: "creator-twitch-echoaiden75",
    name: "Aiden \"Echo\" Lewis",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-echoaiden75-primary", "Twitch", "echoaiden75", "https://www.twitch.tv/echoaiden75", 2597846, 3686, "avg_live_viewers", "Streams 4-6 days / week on Twitch (3,686 avg live)"),
      createStreamerAccount("acc-creator-twitch-echoaiden75-sec", "Kick", "echoaiden75", "https://kick.com/echoaiden75", 1169031, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.echoaiden75@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/echoaiden75",
      lastChecked: daysAgo(2),
    },
  },
  // 175. Isha Rathore (Siren) (Kick)
  {
    id: "creator-kick-sirenisha76",
    name: "Isha Rathore (Siren)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-sirenisha76-primary", "Kick", "siren_isha76", "https://kick.com/siren_isha76", 2612575, 4125, "avg_live_viewers", "Streams 4-6 days / week on Kick (4,125 avg live)"),
      createStreamerAccount("acc-creator-kick-sirenisha76-sec", "Twitch", "siren_isha76", "https://www.twitch.tv/siren_isha76", 1175659, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.sirenisha76@streamerscout.net",
      sourceUrl: "https://kick.com/siren_isha76",
      lastChecked: daysAgo(2),
    },
  },
  // 176. Samuel "Cyber" Smith (Twitch)
  {
    id: "creator-twitch-cybersamuel77",
    name: "Samuel \"Cyber\" Smith",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-cybersamuel77-primary", "Twitch", "cybersamuel77", "https://www.twitch.tv/cybersamuel77", 2627304, 4564, "avg_live_viewers", "Streams 4-6 days / week on Twitch (4,564 avg live)"),
      createStreamerAccount("acc-creator-twitch-cybersamuel77-sec", "Kick", "cybersamuel77", "https://kick.com/cybersamuel77", 1182287, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cybersamuel77@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/cybersamuel77",
      lastChecked: daysAgo(2),
    },
  },
  // 177. Pooja Singh (Pixel) (Kick)
  {
    id: "creator-kick-pixelpooja78",
    name: "Pooja Singh (Pixel)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-pixelpooja78-primary", "Kick", "pixel_pooja78", "https://kick.com/pixel_pooja78", 2642033, 5003, "avg_live_viewers", "Streams 4-6 days / week on Kick (5,003 avg live)"),
      createStreamerAccount("acc-creator-kick-pixelpooja78-sec", "Twitch", "pixel_pooja78", "https://www.twitch.tv/pixel_pooja78", 1188915, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pixelpooja78@streamerscout.net",
      sourceUrl: "https://kick.com/pixel_pooja78",
      lastChecked: daysAgo(2),
    },
  },
  // 178. Joseph "Quantum" Jones (Twitch)
  {
    id: "creator-twitch-quantumjoseph79",
    name: "Joseph \"Quantum\" Jones",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-quantumjoseph79-primary", "Twitch", "quantumjoseph79", "https://www.twitch.tv/quantumjoseph79", 2656762, 5442, "avg_live_viewers", "Streams 4-6 days / week on Twitch (5,442 avg live)"),
      createStreamerAccount("acc-creator-twitch-quantumjoseph79-sec", "Kick", "quantumjoseph79", "https://kick.com/quantumjoseph79", 1195543, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.quantumjoseph79@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/quantumjoseph79",
      lastChecked: daysAgo(2),
    },
  },
  // 179. Siddharth Chatterjee (Specter) (Kick)
  {
    id: "creator-kick-spectersiddharth80",
    name: "Siddharth Chatterjee (Specter)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-spectersiddharth80-primary", "Kick", "specter_siddharth80", "https://kick.com/specter_siddharth80", 2671491, 5881, "avg_live_viewers", "Streams 4-6 days / week on Kick (5,881 avg live)"),
      createStreamerAccount("acc-creator-kick-spectersiddharth80-sec", "Twitch", "specter_siddharth80", "https://www.twitch.tv/specter_siddharth80", 1202171, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.spectersiddharth80@streamerscout.net",
      sourceUrl: "https://kick.com/specter_siddharth80",
      lastChecked: daysAgo(2),
    },
  },
  // 180. Owen "Raptor" Rodriguez (Twitch)
  {
    id: "creator-twitch-raptorowen81",
    name: "Owen \"Raptor\" Rodriguez",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-raptorowen81-primary", "Twitch", "raptorowen81", "https://www.twitch.tv/raptorowen81", 2686220, 6320, "avg_live_viewers", "Streams 4-6 days / week on Twitch (6,320 avg live)"),
      createStreamerAccount("acc-creator-twitch-raptorowen81-sec", "Kick", "raptorowen81", "https://kick.com/raptorowen81", 1208799, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.raptorowen81@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/raptorowen81",
      lastChecked: daysAgo(2),
    },
  },
  // 181. Karan Chopra (Venom) (Kick)
  {
    id: "creator-kick-venomkaran82",
    name: "Karan Chopra (Venom)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-venomkaran82-primary", "Kick", "venom_karan82", "https://kick.com/venom_karan82", 2700949, 6759, "avg_live_viewers", "Streams 4-6 days / week on Kick (6,759 avg live)"),
      createStreamerAccount("acc-creator-kick-venomkaran82-sec", "Twitch", "venom_karan82", "https://www.twitch.tv/venom_karan82", 1215427, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.venomkaran82@streamerscout.net",
      sourceUrl: "https://kick.com/venom_karan82",
      lastChecked: daysAgo(2),
    },
  },
  // 182. John "Thunder" Gonzalez (Twitch)
  {
    id: "creator-twitch-thunderjohn83",
    name: "John \"Thunder\" Gonzalez",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-thunderjohn83-primary", "Twitch", "thunderjohn83", "https://www.twitch.tv/thunderjohn83", 2715678, 7198, "avg_live_viewers", "Streams 4-6 days / week on Twitch (7,198 avg live)"),
      createStreamerAccount("acc-creator-twitch-thunderjohn83-sec", "Kick", "thunderjohn83", "https://kick.com/thunderjohn83", 1222055, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.thunderjohn83@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/thunderjohn83",
      lastChecked: daysAgo(2),
    },
  },
  // 183. Nikhil Rathore (Vortex) (Kick)
  {
    id: "creator-kick-vortexnikhil84",
    name: "Nikhil Rathore (Vortex)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-vortexnikhil84-primary", "Kick", "vortex_nikhil84", "https://kick.com/vortex_nikhil84", 2730407, 7637, "avg_live_viewers", "Streams 4-6 days / week on Kick (7,637 avg live)"),
      createStreamerAccount("acc-creator-kick-vortexnikhil84-sec", "Twitch", "vortex_nikhil84", "https://www.twitch.tv/vortex_nikhil84", 1228683, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.vortexnikhil84@streamerscout.net",
      sourceUrl: "https://kick.com/vortex_nikhil84",
      lastChecked: daysAgo(2),
    },
  },
  // 184. Luke "Striker" Taylor (Twitch)
  {
    id: "creator-twitch-strikerluke85",
    name: "Luke \"Striker\" Taylor",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-strikerluke85-primary", "Twitch", "strikerluke85", "https://www.twitch.tv/strikerluke85", 2745136, 8076, "avg_live_viewers", "Streams 4-6 days / week on Twitch (8,076 avg live)"),
      createStreamerAccount("acc-creator-twitch-strikerluke85-sec", "Kick", "strikerluke85", "https://kick.com/strikerluke85", 1235311, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.strikerluke85@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/strikerluke85",
      lastChecked: daysAgo(2),
    },
  },
  // 185. Ayush Singh (Phoenix) (Kick)
  {
    id: "creator-kick-phoenixayush86",
    name: "Ayush Singh (Phoenix)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phoenixayush86-primary", "Kick", "phoenix_ayush86", "https://kick.com/phoenix_ayush86", 2759865, 8515, "avg_live_viewers", "Streams 4-6 days / week on Kick (8,515 avg live)"),
      createStreamerAccount("acc-creator-kick-phoenixayush86-sec", "Twitch", "phoenix_ayush86", "https://www.twitch.tv/phoenix_ayush86", 1241939, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phoenixayush86@streamerscout.net",
      sourceUrl: "https://kick.com/phoenix_ayush86",
      lastChecked: daysAgo(2),
    },
  },
  // 186. Anthony "Titan" Lee (Twitch)
  {
    id: "creator-twitch-titananthony87",
    name: "Anthony \"Titan\" Lee",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-titananthony87-primary", "Twitch", "titananthony87", "https://www.twitch.tv/titananthony87", 2774594, 8954, "avg_live_viewers", "Streams 4-6 days / week on Twitch (8,954 avg live)"),
      createStreamerAccount("acc-creator-twitch-titananthony87-sec", "Kick", "titananthony87", "https://kick.com/titananthony87", 1248567, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.titananthony87@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/titananthony87",
      lastChecked: daysAgo(2),
    },
  },
  // 187. Pranav Chatterjee (Zero) (Kick)
  {
    id: "creator-kick-zeropranav88",
    name: "Pranav Chatterjee (Zero)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-zeropranav88-primary", "Kick", "zero_pranav88", "https://kick.com/zero_pranav88", 2789323, 9393, "avg_live_viewers", "Streams 4-6 days / week on Kick (9,393 avg live)"),
      createStreamerAccount("acc-creator-kick-zeropranav88-sec", "Twitch", "zero_pranav88", "https://www.twitch.tv/zero_pranav88", 1255195, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zeropranav88@streamerscout.net",
      sourceUrl: "https://kick.com/zero_pranav88",
      lastChecked: daysAgo(2),
    },
  },
  // 188. Grayson "Ninja" Harris (Twitch)
  {
    id: "creator-twitch-ninjagrayson89",
    name: "Grayson \"Ninja\" Harris",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-ninjagrayson89-primary", "Twitch", "ninjagrayson89", "https://www.twitch.tv/ninjagrayson89", 2804052, 9832, "avg_live_viewers", "Streams 4-6 days / week on Twitch (9,832 avg live)"),
      createStreamerAccount("acc-creator-twitch-ninjagrayson89-sec", "Kick", "ninjagrayson89", "https://kick.com/ninjagrayson89", 1261823, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ninjagrayson89@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/ninjagrayson89",
      lastChecked: daysAgo(2),
    },
  },
  // 189. Dev Chopra (Ghost) (Kick)
  {
    id: "creator-kick-ghostdev90",
    name: "Dev Chopra (Ghost)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-ghostdev90-primary", "Kick", "ghost_dev90", "https://kick.com/ghost_dev90", 2818781, 10271, "avg_live_viewers", "Streams 4-6 days / week on Kick (10,271 avg live)"),
      createStreamerAccount("acc-creator-kick-ghostdev90-sec", "Twitch", "ghost_dev90", "https://www.twitch.tv/ghost_dev90", 1268451, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ghostdev90@streamerscout.net",
      sourceUrl: "https://kick.com/ghost_dev90",
      lastChecked: daysAgo(2),
    },
  },
  // 190. Leo "Alpha" Lewis (Twitch)
  {
    id: "creator-twitch-alphaleo91",
    name: "Leo \"Alpha\" Lewis",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-alphaleo91-primary", "Twitch", "alphaleo91", "https://www.twitch.tv/alphaleo91", 2833510, 10710, "avg_live_viewers", "Streams 4-6 days / week on Twitch (10,710 avg live)"),
      createStreamerAccount("acc-creator-twitch-alphaleo91-sec", "Kick", "alphaleo91", "https://kick.com/alphaleo91", 1275080, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.alphaleo91@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/alphaleo91",
      lastChecked: daysAgo(2),
    },
  },
  // 191. Shlok Rathore (Omega) (Kick)
  {
    id: "creator-kick-omegashlok92",
    name: "Shlok Rathore (Omega)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-omegashlok92-primary", "Kick", "omega_shlok92", "https://kick.com/omega_shlok92", 2848239, 11149, "avg_live_viewers", "Streams 4-6 days / week on Kick (11,149 avg live)"),
      createStreamerAccount("acc-creator-kick-omegashlok92-sec", "Twitch", "omega_shlok92", "https://www.twitch.tv/omega_shlok92", 1281708, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.omegashlok92@streamerscout.net",
      sourceUrl: "https://kick.com/omega_shlok92",
      lastChecked: daysAgo(2),
    },
  },
  // 192. Emma "Viper" Smith (Twitch)
  {
    id: "creator-twitch-viperemma93",
    name: "Emma \"Viper\" Smith",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-viperemma93-primary", "Twitch", "viperemma93", "https://www.twitch.tv/viperemma93", 2862968, 11588, "avg_live_viewers", "Streams 4-6 days / week on Twitch (11,588 avg live)"),
      createStreamerAccount("acc-creator-twitch-viperemma93-sec", "Kick", "viperemma93", "https://kick.com/viperemma93", 1288336, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.viperemma93@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/viperemma93",
      lastChecked: daysAgo(2),
    },
  },
  // 193. Kabir Singh (Phantom) (Kick)
  {
    id: "creator-kick-phantomkabir94",
    name: "Kabir Singh (Phantom)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phantomkabir94-primary", "Kick", "phantom_kabir94", "https://kick.com/phantom_kabir94", 2877697, 12027, "avg_live_viewers", "Streams 4-6 days / week on Kick (12,027 avg live)"),
      createStreamerAccount("acc-creator-kick-phantomkabir94-sec", "Twitch", "phantom_kabir94", "https://www.twitch.tv/phantom_kabir94", 1294964, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phantomkabir94@streamerscout.net",
      sourceUrl: "https://kick.com/phantom_kabir94",
      lastChecked: daysAgo(2),
    },
  },
  // 194. Ava "Shadow" Jones (Twitch)
  {
    id: "creator-twitch-shadowava95",
    name: "Ava \"Shadow\" Jones",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-shadowava95-primary", "Twitch", "shadowava95", "https://www.twitch.tv/shadowava95", 42426, 12466, "avg_live_viewers", "Streams 4-6 days / week on Twitch (12,466 avg live)"),
      createStreamerAccount("acc-creator-twitch-shadowava95-sec", "Kick", "shadowava95", "https://kick.com/shadowava95", 19092, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.shadowava95@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/shadowava95",
      lastChecked: daysAgo(2),
    },
  },
  // 195. Dhruv Chatterjee (Blaze) (Kick)
  {
    id: "creator-kick-blazedhruv96",
    name: "Dhruv Chatterjee (Blaze)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-blazedhruv96-primary", "Kick", "blaze_dhruv96", "https://kick.com/blaze_dhruv96", 57155, 12905, "avg_live_viewers", "Streams 4-6 days / week on Kick (12,905 avg live)"),
      createStreamerAccount("acc-creator-kick-blazedhruv96-sec", "Twitch", "blaze_dhruv96", "https://www.twitch.tv/blaze_dhruv96", 25720, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.blazedhruv96@streamerscout.net",
      sourceUrl: "https://kick.com/blaze_dhruv96",
      lastChecked: daysAgo(2),
    },
  },
  // 196. Isabella "Apex" Rodriguez (Twitch)
  {
    id: "creator-twitch-apexisabella97",
    name: "Isabella \"Apex\" Rodriguez",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-apexisabella97-primary", "Twitch", "apexisabella97", "https://www.twitch.tv/apexisabella97", 71884, 13344, "avg_live_viewers", "Streams 4-6 days / week on Twitch (13,344 avg live)"),
      createStreamerAccount("acc-creator-twitch-apexisabella97-sec", "Kick", "apexisabella97", "https://kick.com/apexisabella97", 32348, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.apexisabella97@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/apexisabella97",
      lastChecked: daysAgo(2),
    },
  },
  // 197. Atharv Chopra (Frost) (Kick)
  {
    id: "creator-kick-frostatharv98",
    name: "Atharv Chopra (Frost)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-frostatharv98-primary", "Kick", "frost_atharv98", "https://kick.com/frost_atharv98", 86613, 13783, "avg_live_viewers", "Streams 4-6 days / week on Kick (13,783 avg live)"),
      createStreamerAccount("acc-creator-kick-frostatharv98-sec", "Twitch", "frost_atharv98", "https://www.twitch.tv/frost_atharv98", 38976, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.frostatharv98@streamerscout.net",
      sourceUrl: "https://kick.com/frost_atharv98",
      lastChecked: daysAgo(2),
    },
  },
  // 198. Charlotte "Nova" Gonzalez (Twitch)
  {
    id: "creator-twitch-novacharlotte0",
    name: "Charlotte \"Nova\" Gonzalez",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-novacharlotte0-primary", "Twitch", "novacharlotte0", "https://www.twitch.tv/novacharlotte0", 101342, 14222, "avg_live_viewers", "Streams 4-6 days / week on Twitch (14,222 avg live)"),
      createStreamerAccount("acc-creator-twitch-novacharlotte0-sec", "Kick", "novacharlotte0", "https://kick.com/novacharlotte0", 45604, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.novacharlotte0@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/novacharlotte0",
      lastChecked: daysAgo(2),
    },
  },
  // 199. Ishaan Rathore (Cosmic) (Kick)
  {
    id: "creator-kick-cosmicishaan1",
    name: "Ishaan Rathore (Cosmic)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-cosmicishaan1-primary", "Kick", "cosmic_ishaan1", "https://kick.com/cosmic_ishaan1", 116071, 14661, "avg_live_viewers", "Streams 4-6 days / week on Kick (14,661 avg live)"),
      createStreamerAccount("acc-creator-kick-cosmicishaan1-sec", "Twitch", "cosmic_ishaan1", "https://www.twitch.tv/cosmic_ishaan1", 52232, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cosmicishaan1@streamerscout.net",
      sourceUrl: "https://kick.com/cosmic_ishaan1",
      lastChecked: daysAgo(2),
    },
  },
  // 200. Jack "Pulse" Taylor (Twitch)
  {
    id: "creator-twitch-pulsejack2",
    name: "Jack \"Pulse\" Taylor",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-pulsejack2-primary", "Twitch", "pulsejack2", "https://www.twitch.tv/pulsejack2", 130800, 15100, "avg_live_viewers", "Streams 4-6 days / week on Twitch (15,100 avg live)"),
      createStreamerAccount("acc-creator-twitch-pulsejack2-sec", "Kick", "pulsejack2", "https://kick.com/pulsejack2", 58860, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pulsejack2@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/pulsejack2",
      lastChecked: daysAgo(2),
    },
  },
  // 201. Arjun Singh (Storm) (Kick)
  {
    id: "creator-kick-stormarjun3",
    name: "Arjun Singh (Storm)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-stormarjun3-primary", "Kick", "storm_arjun3", "https://kick.com/storm_arjun3", 145529, 15539, "avg_live_viewers", "Streams 4-6 days / week on Kick (15,539 avg live)"),
      createStreamerAccount("acc-creator-kick-stormarjun3-sec", "Twitch", "storm_arjun3", "https://www.twitch.tv/storm_arjun3", 65488, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.stormarjun3@streamerscout.net",
      sourceUrl: "https://kick.com/storm_arjun3",
      lastChecked: daysAgo(2),
    },
  },
  // 202. Liam "Havoc" Lee (Twitch)
  {
    id: "creator-twitch-havocliam4",
    name: "Liam \"Havoc\" Lee",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-havocliam4-primary", "Twitch", "havocliam4", "https://www.twitch.tv/havocliam4", 160258, 15978, "avg_live_viewers", "Streams 4-6 days / week on Twitch (15,978 avg live)"),
      createStreamerAccount("acc-creator-twitch-havocliam4-sec", "Kick", "havocliam4", "https://kick.com/havocliam4", 72116, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.havocliam4@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/havocliam4",
      lastChecked: daysAgo(2),
    },
  },
  // 203. Diya Chatterjee (Reaper) (Kick)
  {
    id: "creator-kick-reaperdiya5",
    name: "Diya Chatterjee (Reaper)",
    category: "Gaming",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-reaperdiya5-primary", "Kick", "reaper_diya5", "https://kick.com/reaper_diya5", 174987, 16417, "avg_live_viewers", "Streams 4-6 days / week on Kick (16,417 avg live)"),
      createStreamerAccount("acc-creator-kick-reaperdiya5-sec", "Twitch", "reaper_diya5", "https://www.twitch.tv/reaper_diya5", 78744, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.reaperdiya5@streamerscout.net",
      sourceUrl: "https://kick.com/reaper_diya5",
      lastChecked: daysAgo(2),
    },
  },
  // 204. Oliver "Zenith" Harris (Twitch)
  {
    id: "creator-twitch-zenitholiver6",
    name: "Oliver \"Zenith\" Harris",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-zenitholiver6-primary", "Twitch", "zenitholiver6", "https://www.twitch.tv/zenitholiver6", 189716, 16856, "avg_live_viewers", "Streams 4-6 days / week on Twitch (16,856 avg live)"),
      createStreamerAccount("acc-creator-twitch-zenitholiver6-sec", "Kick", "zenitholiver6", "https://kick.com/zenitholiver6", 85372, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zenitholiver6@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/zenitholiver6",
      lastChecked: daysAgo(2),
    },
  },
  // 205. Aadhya Chopra (Glitch) (Kick)
  {
    id: "creator-kick-glitchaadhya7",
    name: "Aadhya Chopra (Glitch)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-glitchaadhya7-primary", "Kick", "glitch_aadhya7", "https://kick.com/glitch_aadhya7", 204445, 17295, "avg_live_viewers", "Streams 4-6 days / week on Kick (17,295 avg live)"),
      createStreamerAccount("acc-creator-kick-glitchaadhya7-sec", "Twitch", "glitch_aadhya7", "https://www.twitch.tv/glitch_aadhya7", 92000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.glitchaadhya7@streamerscout.net",
      sourceUrl: "https://kick.com/glitch_aadhya7",
      lastChecked: daysAgo(2),
    },
  },
  // 206. Ethan "Echo" Lewis (Twitch)
  {
    id: "creator-twitch-echoethan8",
    name: "Ethan \"Echo\" Lewis",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-echoethan8-primary", "Twitch", "echoethan8", "https://www.twitch.tv/echoethan8", 219174, 17734, "avg_live_viewers", "Streams 4-6 days / week on Twitch (17,734 avg live)"),
      createStreamerAccount("acc-creator-twitch-echoethan8-sec", "Kick", "echoethan8", "https://kick.com/echoethan8", 98628, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.echoethan8@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/echoethan8",
      lastChecked: daysAgo(2),
    },
  },
  // 207. Isha Rathore (Siren) (Kick)
  {
    id: "creator-kick-sirenisha9",
    name: "Isha Rathore (Siren)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-sirenisha9-primary", "Kick", "siren_isha9", "https://kick.com/siren_isha9", 233903, 18173, "avg_live_viewers", "Streams 4-6 days / week on Kick (18,173 avg live)"),
      createStreamerAccount("acc-creator-kick-sirenisha9-sec", "Twitch", "siren_isha9", "https://www.twitch.tv/siren_isha9", 105256, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.sirenisha9@streamerscout.net",
      sourceUrl: "https://kick.com/siren_isha9",
      lastChecked: daysAgo(2),
    },
  },
  // 208. Logan "Cyber" Smith (Twitch)
  {
    id: "creator-twitch-cyberlogan10",
    name: "Logan \"Cyber\" Smith",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-cyberlogan10-primary", "Twitch", "cyberlogan10", "https://www.twitch.tv/cyberlogan10", 248632, 18612, "avg_live_viewers", "Streams 4-6 days / week on Twitch (18,612 avg live)"),
      createStreamerAccount("acc-creator-twitch-cyberlogan10-sec", "Kick", "cyberlogan10", "https://kick.com/cyberlogan10", 111884, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cyberlogan10@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/cyberlogan10",
      lastChecked: daysAgo(2),
    },
  },
  // 209. Pooja Singh (Pixel) (Kick)
  {
    id: "creator-kick-pixelpooja11",
    name: "Pooja Singh (Pixel)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-pixelpooja11-primary", "Kick", "pixel_pooja11", "https://kick.com/pixel_pooja11", 263361, 19051, "avg_live_viewers", "Streams 4-6 days / week on Kick (19,051 avg live)"),
      createStreamerAccount("acc-creator-kick-pixelpooja11-sec", "Twitch", "pixel_pooja11", "https://www.twitch.tv/pixel_pooja11", 118512, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pixelpooja11@streamerscout.net",
      sourceUrl: "https://kick.com/pixel_pooja11",
      lastChecked: daysAgo(2),
    },
  },
  // 210. Benjamin "Quantum" Jones (Twitch)
  {
    id: "creator-twitch-quantumbenjamin12",
    name: "Benjamin \"Quantum\" Jones",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-quantumbenjamin12-primary", "Twitch", "quantumbenjamin12", "https://www.twitch.tv/quantumbenjamin12", 278090, 19490, "avg_live_viewers", "Streams 4-6 days / week on Twitch (19,490 avg live)"),
      createStreamerAccount("acc-creator-twitch-quantumbenjamin12-sec", "Kick", "quantumbenjamin12", "https://kick.com/quantumbenjamin12", 125141, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.quantumbenjamin12@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/quantumbenjamin12",
      lastChecked: daysAgo(2),
    },
  },
  // 211. Siddharth Chatterjee (Specter) (Kick)
  {
    id: "creator-kick-spectersiddharth13",
    name: "Siddharth Chatterjee (Specter)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-spectersiddharth13-primary", "Kick", "specter_siddharth13", "https://kick.com/specter_siddharth13", 292819, 19929, "avg_live_viewers", "Streams 4-6 days / week on Kick (19,929 avg live)"),
      createStreamerAccount("acc-creator-kick-spectersiddharth13-sec", "Twitch", "specter_siddharth13", "https://www.twitch.tv/specter_siddharth13", 131769, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.spectersiddharth13@streamerscout.net",
      sourceUrl: "https://kick.com/specter_siddharth13",
      lastChecked: daysAgo(2),
    },
  },
  // 212. Sebastian "Raptor" Rodriguez (Twitch)
  {
    id: "creator-twitch-raptorsebastian14",
    name: "Sebastian \"Raptor\" Rodriguez",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-raptorsebastian14-primary", "Twitch", "raptorsebastian14", "https://www.twitch.tv/raptorsebastian14", 307548, 20368, "avg_live_viewers", "Streams 4-6 days / week on Twitch (20,368 avg live)"),
      createStreamerAccount("acc-creator-twitch-raptorsebastian14-sec", "Kick", "raptorsebastian14", "https://kick.com/raptorsebastian14", 138397, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.raptorsebastian14@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/raptorsebastian14",
      lastChecked: daysAgo(2),
    },
  },
  // 213. Karan Chopra (Venom) (Kick)
  {
    id: "creator-kick-venomkaran15",
    name: "Karan Chopra (Venom)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-venomkaran15-primary", "Kick", "venom_karan15", "https://kick.com/venom_karan15", 322277, 20807, "avg_live_viewers", "Streams 4-6 days / week on Kick (20,807 avg live)"),
      createStreamerAccount("acc-creator-kick-venomkaran15-sec", "Twitch", "venom_karan15", "https://www.twitch.tv/venom_karan15", 145025, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.venomkaran15@streamerscout.net",
      sourceUrl: "https://kick.com/venom_karan15",
      lastChecked: daysAgo(2),
    },
  },
  // 214. Aiden "Thunder" Gonzalez (Twitch)
  {
    id: "creator-twitch-thunderaiden16",
    name: "Aiden \"Thunder\" Gonzalez",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-thunderaiden16-primary", "Twitch", "thunderaiden16", "https://www.twitch.tv/thunderaiden16", 337006, 21246, "avg_live_viewers", "Streams 4-6 days / week on Twitch (21,246 avg live)"),
      createStreamerAccount("acc-creator-twitch-thunderaiden16-sec", "Kick", "thunderaiden16", "https://kick.com/thunderaiden16", 151653, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.thunderaiden16@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/thunderaiden16",
      lastChecked: daysAgo(2),
    },
  },
  // 215. Nikhil Rathore (Vortex) (Kick)
  {
    id: "creator-kick-vortexnikhil17",
    name: "Nikhil Rathore (Vortex)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-vortexnikhil17-primary", "Kick", "vortex_nikhil17", "https://kick.com/vortex_nikhil17", 351735, 21685, "avg_live_viewers", "Streams 4-6 days / week on Kick (21,685 avg live)"),
      createStreamerAccount("acc-creator-kick-vortexnikhil17-sec", "Twitch", "vortex_nikhil17", "https://www.twitch.tv/vortex_nikhil17", 158281, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.vortexnikhil17@streamerscout.net",
      sourceUrl: "https://kick.com/vortex_nikhil17",
      lastChecked: daysAgo(2),
    },
  },
  // 216. Samuel "Striker" Taylor (Twitch)
  {
    id: "creator-twitch-strikersamuel18",
    name: "Samuel \"Striker\" Taylor",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-strikersamuel18-primary", "Twitch", "strikersamuel18", "https://www.twitch.tv/strikersamuel18", 366464, 22124, "avg_live_viewers", "Streams 4-6 days / week on Twitch (22,124 avg live)"),
      createStreamerAccount("acc-creator-twitch-strikersamuel18-sec", "Kick", "strikersamuel18", "https://kick.com/strikersamuel18", 164909, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.strikersamuel18@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/strikersamuel18",
      lastChecked: daysAgo(2),
    },
  },
  // 217. Ayush Singh (Phoenix) (Kick)
  {
    id: "creator-kick-phoenixayush19",
    name: "Ayush Singh (Phoenix)",
    category: "Gaming",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phoenixayush19-primary", "Kick", "phoenix_ayush19", "https://kick.com/phoenix_ayush19", 381193, 22563, "avg_live_viewers", "Streams 4-6 days / week on Kick (22,563 avg live)"),
      createStreamerAccount("acc-creator-kick-phoenixayush19-sec", "Twitch", "phoenix_ayush19", "https://www.twitch.tv/phoenix_ayush19", 171537, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phoenixayush19@streamerscout.net",
      sourceUrl: "https://kick.com/phoenix_ayush19",
      lastChecked: daysAgo(2),
    },
  },
  // 218. Joseph "Titan" Lee (Twitch)
  {
    id: "creator-twitch-titanjoseph20",
    name: "Joseph \"Titan\" Lee",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-titanjoseph20-primary", "Twitch", "titanjoseph20", "https://www.twitch.tv/titanjoseph20", 395922, 23002, "avg_live_viewers", "Streams 4-6 days / week on Twitch (23,002 avg live)"),
      createStreamerAccount("acc-creator-twitch-titanjoseph20-sec", "Kick", "titanjoseph20", "https://kick.com/titanjoseph20", 178165, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.titanjoseph20@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/titanjoseph20",
      lastChecked: daysAgo(2),
    },
  },
  // 219. Pranav Chatterjee (Zero) (Kick)
  {
    id: "creator-kick-zeropranav21",
    name: "Pranav Chatterjee (Zero)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-zeropranav21-primary", "Kick", "zero_pranav21", "https://kick.com/zero_pranav21", 410651, 23441, "avg_live_viewers", "Streams 4-6 days / week on Kick (23,441 avg live)"),
      createStreamerAccount("acc-creator-kick-zeropranav21-sec", "Twitch", "zero_pranav21", "https://www.twitch.tv/zero_pranav21", 184793, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zeropranav21@streamerscout.net",
      sourceUrl: "https://kick.com/zero_pranav21",
      lastChecked: daysAgo(2),
    },
  },
  // 220. Owen "Ninja" Harris (Twitch)
  {
    id: "creator-twitch-ninjaowen22",
    name: "Owen \"Ninja\" Harris",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-ninjaowen22-primary", "Twitch", "ninjaowen22", "https://www.twitch.tv/ninjaowen22", 425380, 23880, "avg_live_viewers", "Streams 4-6 days / week on Twitch (23,880 avg live)"),
      createStreamerAccount("acc-creator-twitch-ninjaowen22-sec", "Kick", "ninjaowen22", "https://kick.com/ninjaowen22", 191421, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ninjaowen22@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/ninjaowen22",
      lastChecked: daysAgo(2),
    },
  },
  // 221. Dev Chopra (Ghost) (Kick)
  {
    id: "creator-kick-ghostdev23",
    name: "Dev Chopra (Ghost)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-ghostdev23-primary", "Kick", "ghost_dev23", "https://kick.com/ghost_dev23", 440109, 24319, "avg_live_viewers", "Streams 4-6 days / week on Kick (24,319 avg live)"),
      createStreamerAccount("acc-creator-kick-ghostdev23-sec", "Twitch", "ghost_dev23", "https://www.twitch.tv/ghost_dev23", 198049, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ghostdev23@streamerscout.net",
      sourceUrl: "https://kick.com/ghost_dev23",
      lastChecked: daysAgo(2),
    },
  },
  // 222. John "Alpha" Lewis (Twitch)
  {
    id: "creator-twitch-alphajohn24",
    name: "John \"Alpha\" Lewis",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-alphajohn24-primary", "Twitch", "alphajohn24", "https://www.twitch.tv/alphajohn24", 454838, 24758, "avg_live_viewers", "Streams 4-6 days / week on Twitch (24,758 avg live)"),
      createStreamerAccount("acc-creator-twitch-alphajohn24-sec", "Kick", "alphajohn24", "https://kick.com/alphajohn24", 204677, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.alphajohn24@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/alphajohn24",
      lastChecked: daysAgo(2),
    },
  },
  // 223. Shlok Rathore (Omega) (Kick)
  {
    id: "creator-kick-omegashlok25",
    name: "Shlok Rathore (Omega)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-omegashlok25-primary", "Kick", "omega_shlok25", "https://kick.com/omega_shlok25", 469567, 25197, "avg_live_viewers", "Streams 4-6 days / week on Kick (25,197 avg live)"),
      createStreamerAccount("acc-creator-kick-omegashlok25-sec", "Twitch", "omega_shlok25", "https://www.twitch.tv/omega_shlok25", 211305, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.omegashlok25@streamerscout.net",
      sourceUrl: "https://kick.com/omega_shlok25",
      lastChecked: daysAgo(2),
    },
  },
  // 224. Luke "Viper" Smith (Twitch)
  {
    id: "creator-twitch-viperluke26",
    name: "Luke \"Viper\" Smith",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-viperluke26-primary", "Twitch", "viperluke26", "https://www.twitch.tv/viperluke26", 484296, 1136, "avg_live_viewers", "Streams 4-6 days / week on Twitch (1,136 avg live)"),
      createStreamerAccount("acc-creator-twitch-viperluke26-sec", "Kick", "viperluke26", "https://kick.com/viperluke26", 217933, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.viperluke26@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/viperluke26",
      lastChecked: daysAgo(2),
    },
  },
  // 225. Kabir Singh (Phantom) (Kick)
  {
    id: "creator-kick-phantomkabir27",
    name: "Kabir Singh (Phantom)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phantomkabir27-primary", "Kick", "phantom_kabir27", "https://kick.com/phantom_kabir27", 499025, 1575, "avg_live_viewers", "Streams 4-6 days / week on Kick (1,575 avg live)"),
      createStreamerAccount("acc-creator-kick-phantomkabir27-sec", "Twitch", "phantom_kabir27", "https://www.twitch.tv/phantom_kabir27", 224561, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phantomkabir27@streamerscout.net",
      sourceUrl: "https://kick.com/phantom_kabir27",
      lastChecked: daysAgo(2),
    },
  },
  // 226. Anthony "Shadow" Jones (Twitch)
  {
    id: "creator-twitch-shadowanthony28",
    name: "Anthony \"Shadow\" Jones",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-shadowanthony28-primary", "Twitch", "shadowanthony28", "https://www.twitch.tv/shadowanthony28", 513754, 2014, "avg_live_viewers", "Streams 4-6 days / week on Twitch (2,014 avg live)"),
      createStreamerAccount("acc-creator-twitch-shadowanthony28-sec", "Kick", "shadowanthony28", "https://kick.com/shadowanthony28", 231189, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.shadowanthony28@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/shadowanthony28",
      lastChecked: daysAgo(2),
    },
  },
  // 227. Dhruv Chatterjee (Blaze) (Kick)
  {
    id: "creator-kick-blazedhruv29",
    name: "Dhruv Chatterjee (Blaze)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-blazedhruv29-primary", "Kick", "blaze_dhruv29", "https://kick.com/blaze_dhruv29", 528483, 2453, "avg_live_viewers", "Streams 4-6 days / week on Kick (2,453 avg live)"),
      createStreamerAccount("acc-creator-kick-blazedhruv29-sec", "Twitch", "blaze_dhruv29", "https://www.twitch.tv/blaze_dhruv29", 237817, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.blazedhruv29@streamerscout.net",
      sourceUrl: "https://kick.com/blaze_dhruv29",
      lastChecked: daysAgo(2),
    },
  },
  // 228. Grayson "Apex" Rodriguez (Twitch)
  {
    id: "creator-twitch-apexgrayson30",
    name: "Grayson \"Apex\" Rodriguez",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-apexgrayson30-primary", "Twitch", "apexgrayson30", "https://www.twitch.tv/apexgrayson30", 543212, 2892, "avg_live_viewers", "Streams 4-6 days / week on Twitch (2,892 avg live)"),
      createStreamerAccount("acc-creator-twitch-apexgrayson30-sec", "Kick", "apexgrayson30", "https://kick.com/apexgrayson30", 244445, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.apexgrayson30@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/apexgrayson30",
      lastChecked: daysAgo(2),
    },
  },
  // 229. Atharv Chopra (Frost) (Kick)
  {
    id: "creator-kick-frostatharv31",
    name: "Atharv Chopra (Frost)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-frostatharv31-primary", "Kick", "frost_atharv31", "https://kick.com/frost_atharv31", 557941, 3331, "avg_live_viewers", "Streams 4-6 days / week on Kick (3,331 avg live)"),
      createStreamerAccount("acc-creator-kick-frostatharv31-sec", "Twitch", "frost_atharv31", "https://www.twitch.tv/frost_atharv31", 251073, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.frostatharv31@streamerscout.net",
      sourceUrl: "https://kick.com/frost_atharv31",
      lastChecked: daysAgo(2),
    },
  },
  // 230. Leo "Nova" Gonzalez (Twitch)
  {
    id: "creator-twitch-novaleo32",
    name: "Leo \"Nova\" Gonzalez",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-novaleo32-primary", "Twitch", "novaleo32", "https://www.twitch.tv/novaleo32", 572670, 3770, "avg_live_viewers", "Streams 4-6 days / week on Twitch (3,770 avg live)"),
      createStreamerAccount("acc-creator-twitch-novaleo32-sec", "Kick", "novaleo32", "https://kick.com/novaleo32", 257702, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.novaleo32@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/novaleo32",
      lastChecked: daysAgo(2),
    },
  },
  // 231. Ishaan Rathore (Cosmic) (Kick)
  {
    id: "creator-kick-cosmicishaan33",
    name: "Ishaan Rathore (Cosmic)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-cosmicishaan33-primary", "Kick", "cosmic_ishaan33", "https://kick.com/cosmic_ishaan33", 587399, 4209, "avg_live_viewers", "Streams 4-6 days / week on Kick (4,209 avg live)"),
      createStreamerAccount("acc-creator-kick-cosmicishaan33-sec", "Twitch", "cosmic_ishaan33", "https://www.twitch.tv/cosmic_ishaan33", 264330, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cosmicishaan33@streamerscout.net",
      sourceUrl: "https://kick.com/cosmic_ishaan33",
      lastChecked: daysAgo(2),
    },
  },
  // 232. Emma "Pulse" Taylor (Twitch)
  {
    id: "creator-twitch-pulseemma34",
    name: "Emma \"Pulse\" Taylor",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-pulseemma34-primary", "Twitch", "pulseemma34", "https://www.twitch.tv/pulseemma34", 602128, 4648, "avg_live_viewers", "Streams 4-6 days / week on Twitch (4,648 avg live)"),
      createStreamerAccount("acc-creator-twitch-pulseemma34-sec", "Kick", "pulseemma34", "https://kick.com/pulseemma34", 270958, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pulseemma34@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/pulseemma34",
      lastChecked: daysAgo(2),
    },
  },
  // 233. Arjun Singh (Storm) (Kick)
  {
    id: "creator-kick-stormarjun35",
    name: "Arjun Singh (Storm)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-stormarjun35-primary", "Kick", "storm_arjun35", "https://kick.com/storm_arjun35", 616857, 5087, "avg_live_viewers", "Streams 4-6 days / week on Kick (5,087 avg live)"),
      createStreamerAccount("acc-creator-kick-stormarjun35-sec", "Twitch", "storm_arjun35", "https://www.twitch.tv/storm_arjun35", 277586, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.stormarjun35@streamerscout.net",
      sourceUrl: "https://kick.com/storm_arjun35",
      lastChecked: daysAgo(2),
    },
  },
  // 234. Ava "Havoc" Lee (Twitch)
  {
    id: "creator-twitch-havocava36",
    name: "Ava \"Havoc\" Lee",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-havocava36-primary", "Twitch", "havocava36", "https://www.twitch.tv/havocava36", 631586, 5526, "avg_live_viewers", "Streams 4-6 days / week on Twitch (5,526 avg live)"),
      createStreamerAccount("acc-creator-twitch-havocava36-sec", "Kick", "havocava36", "https://kick.com/havocava36", 284214, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.havocava36@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/havocava36",
      lastChecked: daysAgo(2),
    },
  },
  // 235. Diya Chatterjee (Reaper) (Kick)
  {
    id: "creator-kick-reaperdiya37",
    name: "Diya Chatterjee (Reaper)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-reaperdiya37-primary", "Kick", "reaper_diya37", "https://kick.com/reaper_diya37", 646315, 5965, "avg_live_viewers", "Streams 4-6 days / week on Kick (5,965 avg live)"),
      createStreamerAccount("acc-creator-kick-reaperdiya37-sec", "Twitch", "reaper_diya37", "https://www.twitch.tv/reaper_diya37", 290842, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.reaperdiya37@streamerscout.net",
      sourceUrl: "https://kick.com/reaper_diya37",
      lastChecked: daysAgo(2),
    },
  },
  // 236. Isabella "Zenith" Harris (Twitch)
  {
    id: "creator-twitch-zenithisabella38",
    name: "Isabella \"Zenith\" Harris",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-zenithisabella38-primary", "Twitch", "zenithisabella38", "https://www.twitch.tv/zenithisabella38", 661044, 6404, "avg_live_viewers", "Streams 4-6 days / week on Twitch (6,404 avg live)"),
      createStreamerAccount("acc-creator-twitch-zenithisabella38-sec", "Kick", "zenithisabella38", "https://kick.com/zenithisabella38", 297470, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zenithisabella38@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/zenithisabella38",
      lastChecked: daysAgo(2),
    },
  },
  // 237. Aadhya Chopra (Glitch) (Kick)
  {
    id: "creator-kick-glitchaadhya39",
    name: "Aadhya Chopra (Glitch)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-glitchaadhya39-primary", "Kick", "glitch_aadhya39", "https://kick.com/glitch_aadhya39", 675773, 6843, "avg_live_viewers", "Streams 4-6 days / week on Kick (6,843 avg live)"),
      createStreamerAccount("acc-creator-kick-glitchaadhya39-sec", "Twitch", "glitch_aadhya39", "https://www.twitch.tv/glitch_aadhya39", 304098, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.glitchaadhya39@streamerscout.net",
      sourceUrl: "https://kick.com/glitch_aadhya39",
      lastChecked: daysAgo(2),
    },
  },
  // 238. Charlotte "Echo" Lewis (Twitch)
  {
    id: "creator-twitch-echocharlotte40",
    name: "Charlotte \"Echo\" Lewis",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-echocharlotte40-primary", "Twitch", "echocharlotte40", "https://www.twitch.tv/echocharlotte40", 690502, 7282, "avg_live_viewers", "Streams 4-6 days / week on Twitch (7,282 avg live)"),
      createStreamerAccount("acc-creator-twitch-echocharlotte40-sec", "Kick", "echocharlotte40", "https://kick.com/echocharlotte40", 310726, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.echocharlotte40@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/echocharlotte40",
      lastChecked: daysAgo(2),
    },
  },
  // 239. Isha Rathore (Siren) (Kick)
  {
    id: "creator-kick-sirenisha41",
    name: "Isha Rathore (Siren)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-sirenisha41-primary", "Kick", "siren_isha41", "https://kick.com/siren_isha41", 705231, 7721, "avg_live_viewers", "Streams 4-6 days / week on Kick (7,721 avg live)"),
      createStreamerAccount("acc-creator-kick-sirenisha41-sec", "Twitch", "siren_isha41", "https://www.twitch.tv/siren_isha41", 317354, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.sirenisha41@streamerscout.net",
      sourceUrl: "https://kick.com/siren_isha41",
      lastChecked: daysAgo(2),
    },
  },
  // 240. Jack "Cyber" Smith (Twitch)
  {
    id: "creator-twitch-cyberjack42",
    name: "Jack \"Cyber\" Smith",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-cyberjack42-primary", "Twitch", "cyberjack42", "https://www.twitch.tv/cyberjack42", 719960, 8160, "avg_live_viewers", "Streams 4-6 days / week on Twitch (8,160 avg live)"),
      createStreamerAccount("acc-creator-twitch-cyberjack42-sec", "Kick", "cyberjack42", "https://kick.com/cyberjack42", 323982, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cyberjack42@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/cyberjack42",
      lastChecked: daysAgo(2),
    },
  },
  // 241. Pooja Singh (Pixel) (Kick)
  {
    id: "creator-kick-pixelpooja43",
    name: "Pooja Singh (Pixel)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-pixelpooja43-primary", "Kick", "pixel_pooja43", "https://kick.com/pixel_pooja43", 734689, 8599, "avg_live_viewers", "Streams 4-6 days / week on Kick (8,599 avg live)"),
      createStreamerAccount("acc-creator-kick-pixelpooja43-sec", "Twitch", "pixel_pooja43", "https://www.twitch.tv/pixel_pooja43", 330610, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pixelpooja43@streamerscout.net",
      sourceUrl: "https://kick.com/pixel_pooja43",
      lastChecked: daysAgo(2),
    },
  },
  // 242. Liam "Quantum" Jones (Twitch)
  {
    id: "creator-twitch-quantumliam44",
    name: "Liam \"Quantum\" Jones",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-quantumliam44-primary", "Twitch", "quantumliam44", "https://www.twitch.tv/quantumliam44", 749418, 9038, "avg_live_viewers", "Streams 4-6 days / week on Twitch (9,038 avg live)"),
      createStreamerAccount("acc-creator-twitch-quantumliam44-sec", "Kick", "quantumliam44", "https://kick.com/quantumliam44", 337238, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.quantumliam44@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/quantumliam44",
      lastChecked: daysAgo(2),
    },
  },
  // 243. Siddharth Chatterjee (Specter) (Kick)
  {
    id: "creator-kick-spectersiddharth45",
    name: "Siddharth Chatterjee (Specter)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-spectersiddharth45-primary", "Kick", "specter_siddharth45", "https://kick.com/specter_siddharth45", 764147, 9477, "avg_live_viewers", "Streams 4-6 days / week on Kick (9,477 avg live)"),
      createStreamerAccount("acc-creator-kick-spectersiddharth45-sec", "Twitch", "specter_siddharth45", "https://www.twitch.tv/specter_siddharth45", 343866, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.spectersiddharth45@streamerscout.net",
      sourceUrl: "https://kick.com/specter_siddharth45",
      lastChecked: daysAgo(2),
    },
  },
  // 244. Oliver "Raptor" Rodriguez (Twitch)
  {
    id: "creator-twitch-raptoroliver46",
    name: "Oliver \"Raptor\" Rodriguez",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-raptoroliver46-primary", "Twitch", "raptoroliver46", "https://www.twitch.tv/raptoroliver46", 778876, 9916, "avg_live_viewers", "Streams 4-6 days / week on Twitch (9,916 avg live)"),
      createStreamerAccount("acc-creator-twitch-raptoroliver46-sec", "Kick", "raptoroliver46", "https://kick.com/raptoroliver46", 350494, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.raptoroliver46@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/raptoroliver46",
      lastChecked: daysAgo(2),
    },
  },
  // 245. Karan Chopra (Venom) (Kick)
  {
    id: "creator-kick-venomkaran47",
    name: "Karan Chopra (Venom)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-venomkaran47-primary", "Kick", "venom_karan47", "https://kick.com/venom_karan47", 793605, 10355, "avg_live_viewers", "Streams 4-6 days / week on Kick (10,355 avg live)"),
      createStreamerAccount("acc-creator-kick-venomkaran47-sec", "Twitch", "venom_karan47", "https://www.twitch.tv/venom_karan47", 357122, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.venomkaran47@streamerscout.net",
      sourceUrl: "https://kick.com/venom_karan47",
      lastChecked: daysAgo(2),
    },
  },
  // 246. Ethan "Thunder" Gonzalez (Twitch)
  {
    id: "creator-twitch-thunderethan48",
    name: "Ethan \"Thunder\" Gonzalez",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-thunderethan48-primary", "Twitch", "thunderethan48", "https://www.twitch.tv/thunderethan48", 808334, 10794, "avg_live_viewers", "Streams 4-6 days / week on Twitch (10,794 avg live)"),
      createStreamerAccount("acc-creator-twitch-thunderethan48-sec", "Kick", "thunderethan48", "https://kick.com/thunderethan48", 363750, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.thunderethan48@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/thunderethan48",
      lastChecked: daysAgo(2),
    },
  },
  // 247. Nikhil Rathore (Vortex) (Kick)
  {
    id: "creator-kick-vortexnikhil49",
    name: "Nikhil Rathore (Vortex)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-vortexnikhil49-primary", "Kick", "vortex_nikhil49", "https://kick.com/vortex_nikhil49", 823063, 11233, "avg_live_viewers", "Streams 4-6 days / week on Kick (11,233 avg live)"),
      createStreamerAccount("acc-creator-kick-vortexnikhil49-sec", "Twitch", "vortex_nikhil49", "https://www.twitch.tv/vortex_nikhil49", 370378, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.vortexnikhil49@streamerscout.net",
      sourceUrl: "https://kick.com/vortex_nikhil49",
      lastChecked: daysAgo(2),
    },
  },
  // 248. Logan "Striker" Taylor (Twitch)
  {
    id: "creator-twitch-strikerlogan50",
    name: "Logan \"Striker\" Taylor",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-strikerlogan50-primary", "Twitch", "strikerlogan50", "https://www.twitch.tv/strikerlogan50", 837792, 11672, "avg_live_viewers", "Streams 4-6 days / week on Twitch (11,672 avg live)"),
      createStreamerAccount("acc-creator-twitch-strikerlogan50-sec", "Kick", "strikerlogan50", "https://kick.com/strikerlogan50", 377006, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.strikerlogan50@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/strikerlogan50",
      lastChecked: daysAgo(2),
    },
  },
  // 249. Ayush Singh (Phoenix) (Kick)
  {
    id: "creator-kick-phoenixayush51",
    name: "Ayush Singh (Phoenix)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phoenixayush51-primary", "Kick", "phoenix_ayush51", "https://kick.com/phoenix_ayush51", 852521, 12111, "avg_live_viewers", "Streams 4-6 days / week on Kick (12,111 avg live)"),
      createStreamerAccount("acc-creator-kick-phoenixayush51-sec", "Twitch", "phoenix_ayush51", "https://www.twitch.tv/phoenix_ayush51", 383634, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phoenixayush51@streamerscout.net",
      sourceUrl: "https://kick.com/phoenix_ayush51",
      lastChecked: daysAgo(2),
    },
  },
  // 250. Benjamin "Titan" Lee (Twitch)
  {
    id: "creator-twitch-titanbenjamin52",
    name: "Benjamin \"Titan\" Lee",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-titanbenjamin52-primary", "Twitch", "titanbenjamin52", "https://www.twitch.tv/titanbenjamin52", 867250, 12550, "avg_live_viewers", "Streams 4-6 days / week on Twitch (12,550 avg live)"),
      createStreamerAccount("acc-creator-twitch-titanbenjamin52-sec", "Kick", "titanbenjamin52", "https://kick.com/titanbenjamin52", 390263, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.titanbenjamin52@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/titanbenjamin52",
      lastChecked: daysAgo(2),
    },
  },
  // 251. Pranav Chatterjee (Zero) (Kick)
  {
    id: "creator-kick-zeropranav53",
    name: "Pranav Chatterjee (Zero)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-zeropranav53-primary", "Kick", "zero_pranav53", "https://kick.com/zero_pranav53", 881979, 12989, "avg_live_viewers", "Streams 4-6 days / week on Kick (12,989 avg live)"),
      createStreamerAccount("acc-creator-kick-zeropranav53-sec", "Twitch", "zero_pranav53", "https://www.twitch.tv/zero_pranav53", 396891, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zeropranav53@streamerscout.net",
      sourceUrl: "https://kick.com/zero_pranav53",
      lastChecked: daysAgo(2),
    },
  },
  // 252. Sebastian "Ninja" Harris (Twitch)
  {
    id: "creator-twitch-ninjasebastian54",
    name: "Sebastian \"Ninja\" Harris",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-ninjasebastian54-primary", "Twitch", "ninjasebastian54", "https://www.twitch.tv/ninjasebastian54", 896708, 13428, "avg_live_viewers", "Streams 4-6 days / week on Twitch (13,428 avg live)"),
      createStreamerAccount("acc-creator-twitch-ninjasebastian54-sec", "Kick", "ninjasebastian54", "https://kick.com/ninjasebastian54", 403519, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ninjasebastian54@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/ninjasebastian54",
      lastChecked: daysAgo(2),
    },
  },
  // 253. Dev Chopra (Ghost) (Kick)
  {
    id: "creator-kick-ghostdev55",
    name: "Dev Chopra (Ghost)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-ghostdev55-primary", "Kick", "ghost_dev55", "https://kick.com/ghost_dev55", 911437, 13867, "avg_live_viewers", "Streams 4-6 days / week on Kick (13,867 avg live)"),
      createStreamerAccount("acc-creator-kick-ghostdev55-sec", "Twitch", "ghost_dev55", "https://www.twitch.tv/ghost_dev55", 410147, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ghostdev55@streamerscout.net",
      sourceUrl: "https://kick.com/ghost_dev55",
      lastChecked: daysAgo(2),
    },
  },
  // 254. Aiden "Alpha" Lewis (Twitch)
  {
    id: "creator-twitch-alphaaiden56",
    name: "Aiden \"Alpha\" Lewis",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-alphaaiden56-primary", "Twitch", "alphaaiden56", "https://www.twitch.tv/alphaaiden56", 926166, 14306, "avg_live_viewers", "Streams 4-6 days / week on Twitch (14,306 avg live)"),
      createStreamerAccount("acc-creator-twitch-alphaaiden56-sec", "Kick", "alphaaiden56", "https://kick.com/alphaaiden56", 416775, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.alphaaiden56@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/alphaaiden56",
      lastChecked: daysAgo(2),
    },
  },
  // 255. Shlok Rathore (Omega) (Kick)
  {
    id: "creator-kick-omegashlok57",
    name: "Shlok Rathore (Omega)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-omegashlok57-primary", "Kick", "omega_shlok57", "https://kick.com/omega_shlok57", 940895, 14745, "avg_live_viewers", "Streams 4-6 days / week on Kick (14,745 avg live)"),
      createStreamerAccount("acc-creator-kick-omegashlok57-sec", "Twitch", "omega_shlok57", "https://www.twitch.tv/omega_shlok57", 423403, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.omegashlok57@streamerscout.net",
      sourceUrl: "https://kick.com/omega_shlok57",
      lastChecked: daysAgo(2),
    },
  },
  // 256. Samuel "Viper" Smith (Twitch)
  {
    id: "creator-twitch-vipersamuel58",
    name: "Samuel \"Viper\" Smith",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-vipersamuel58-primary", "Twitch", "vipersamuel58", "https://www.twitch.tv/vipersamuel58", 955624, 15184, "avg_live_viewers", "Streams 4-6 days / week on Twitch (15,184 avg live)"),
      createStreamerAccount("acc-creator-twitch-vipersamuel58-sec", "Kick", "vipersamuel58", "https://kick.com/vipersamuel58", 430031, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.vipersamuel58@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/vipersamuel58",
      lastChecked: daysAgo(2),
    },
  },
  // 257. Kabir Singh (Phantom) (Kick)
  {
    id: "creator-kick-phantomkabir59",
    name: "Kabir Singh (Phantom)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phantomkabir59-primary", "Kick", "phantom_kabir59", "https://kick.com/phantom_kabir59", 970353, 15623, "avg_live_viewers", "Streams 4-6 days / week on Kick (15,623 avg live)"),
      createStreamerAccount("acc-creator-kick-phantomkabir59-sec", "Twitch", "phantom_kabir59", "https://www.twitch.tv/phantom_kabir59", 436659, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phantomkabir59@streamerscout.net",
      sourceUrl: "https://kick.com/phantom_kabir59",
      lastChecked: daysAgo(2),
    },
  },
  // 258. Joseph "Shadow" Jones (Twitch)
  {
    id: "creator-twitch-shadowjoseph60",
    name: "Joseph \"Shadow\" Jones",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-shadowjoseph60-primary", "Twitch", "shadowjoseph60", "https://www.twitch.tv/shadowjoseph60", 985082, 16062, "avg_live_viewers", "Streams 4-6 days / week on Twitch (16,062 avg live)"),
      createStreamerAccount("acc-creator-twitch-shadowjoseph60-sec", "Kick", "shadowjoseph60", "https://kick.com/shadowjoseph60", 443287, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.shadowjoseph60@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/shadowjoseph60",
      lastChecked: daysAgo(2),
    },
  },
  // 259. Dhruv Chatterjee (Blaze) (Kick)
  {
    id: "creator-kick-blazedhruv61",
    name: "Dhruv Chatterjee (Blaze)",
    category: "Gaming",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-blazedhruv61-primary", "Kick", "blaze_dhruv61", "https://kick.com/blaze_dhruv61", 999811, 16501, "avg_live_viewers", "Streams 4-6 days / week on Kick (16,501 avg live)"),
      createStreamerAccount("acc-creator-kick-blazedhruv61-sec", "Twitch", "blaze_dhruv61", "https://www.twitch.tv/blaze_dhruv61", 449915, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.blazedhruv61@streamerscout.net",
      sourceUrl: "https://kick.com/blaze_dhruv61",
      lastChecked: daysAgo(2),
    },
  },
  // 260. Owen "Apex" Rodriguez (Twitch)
  {
    id: "creator-twitch-apexowen62",
    name: "Owen \"Apex\" Rodriguez",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-apexowen62-primary", "Twitch", "apexowen62", "https://www.twitch.tv/apexowen62", 1014540, 16940, "avg_live_viewers", "Streams 4-6 days / week on Twitch (16,940 avg live)"),
      createStreamerAccount("acc-creator-twitch-apexowen62-sec", "Kick", "apexowen62", "https://kick.com/apexowen62", 456543, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.apexowen62@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/apexowen62",
      lastChecked: daysAgo(2),
    },
  },
  // 261. Atharv Chopra (Frost) (Kick)
  {
    id: "creator-kick-frostatharv63",
    name: "Atharv Chopra (Frost)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-frostatharv63-primary", "Kick", "frost_atharv63", "https://kick.com/frost_atharv63", 1029269, 17379, "avg_live_viewers", "Streams 4-6 days / week on Kick (17,379 avg live)"),
      createStreamerAccount("acc-creator-kick-frostatharv63-sec", "Twitch", "frost_atharv63", "https://www.twitch.tv/frost_atharv63", 463171, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.frostatharv63@streamerscout.net",
      sourceUrl: "https://kick.com/frost_atharv63",
      lastChecked: daysAgo(2),
    },
  },
  // 262. John "Nova" Gonzalez (Twitch)
  {
    id: "creator-twitch-novajohn64",
    name: "John \"Nova\" Gonzalez",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-novajohn64-primary", "Twitch", "novajohn64", "https://www.twitch.tv/novajohn64", 1043998, 17818, "avg_live_viewers", "Streams 4-6 days / week on Twitch (17,818 avg live)"),
      createStreamerAccount("acc-creator-twitch-novajohn64-sec", "Kick", "novajohn64", "https://kick.com/novajohn64", 469799, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.novajohn64@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/novajohn64",
      lastChecked: daysAgo(2),
    },
  },
  // 263. Ishaan Rathore (Cosmic) (Kick)
  {
    id: "creator-kick-cosmicishaan65",
    name: "Ishaan Rathore (Cosmic)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-cosmicishaan65-primary", "Kick", "cosmic_ishaan65", "https://kick.com/cosmic_ishaan65", 1058727, 18257, "avg_live_viewers", "Streams 4-6 days / week on Kick (18,257 avg live)"),
      createStreamerAccount("acc-creator-kick-cosmicishaan65-sec", "Twitch", "cosmic_ishaan65", "https://www.twitch.tv/cosmic_ishaan65", 476427, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cosmicishaan65@streamerscout.net",
      sourceUrl: "https://kick.com/cosmic_ishaan65",
      lastChecked: daysAgo(2),
    },
  },
  // 264. Luke "Pulse" Taylor (Twitch)
  {
    id: "creator-twitch-pulseluke66",
    name: "Luke \"Pulse\" Taylor",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-pulseluke66-primary", "Twitch", "pulseluke66", "https://www.twitch.tv/pulseluke66", 1073456, 18696, "avg_live_viewers", "Streams 4-6 days / week on Twitch (18,696 avg live)"),
      createStreamerAccount("acc-creator-twitch-pulseluke66-sec", "Kick", "pulseluke66", "https://kick.com/pulseluke66", 483055, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pulseluke66@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/pulseluke66",
      lastChecked: daysAgo(2),
    },
  },
  // 265. Arjun Singh (Storm) (Kick)
  {
    id: "creator-kick-stormarjun67",
    name: "Arjun Singh (Storm)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-stormarjun67-primary", "Kick", "storm_arjun67", "https://kick.com/storm_arjun67", 1088185, 19135, "avg_live_viewers", "Streams 4-6 days / week on Kick (19,135 avg live)"),
      createStreamerAccount("acc-creator-kick-stormarjun67-sec", "Twitch", "storm_arjun67", "https://www.twitch.tv/storm_arjun67", 489683, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.stormarjun67@streamerscout.net",
      sourceUrl: "https://kick.com/storm_arjun67",
      lastChecked: daysAgo(2),
    },
  },
  // 266. Anthony "Havoc" Lee (Twitch)
  {
    id: "creator-twitch-havocanthony68",
    name: "Anthony \"Havoc\" Lee",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-havocanthony68-primary", "Twitch", "havocanthony68", "https://www.twitch.tv/havocanthony68", 1102914, 19574, "avg_live_viewers", "Streams 4-6 days / week on Twitch (19,574 avg live)"),
      createStreamerAccount("acc-creator-twitch-havocanthony68-sec", "Kick", "havocanthony68", "https://kick.com/havocanthony68", 496311, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.havocanthony68@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/havocanthony68",
      lastChecked: daysAgo(2),
    },
  },
  // 267. Diya Chatterjee (Reaper) (Kick)
  {
    id: "creator-kick-reaperdiya69",
    name: "Diya Chatterjee (Reaper)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-reaperdiya69-primary", "Kick", "reaper_diya69", "https://kick.com/reaper_diya69", 1117643, 20013, "avg_live_viewers", "Streams 4-6 days / week on Kick (20,013 avg live)"),
      createStreamerAccount("acc-creator-kick-reaperdiya69-sec", "Twitch", "reaper_diya69", "https://www.twitch.tv/reaper_diya69", 502939, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.reaperdiya69@streamerscout.net",
      sourceUrl: "https://kick.com/reaper_diya69",
      lastChecked: daysAgo(2),
    },
  },
  // 268. Grayson "Zenith" Harris (Twitch)
  {
    id: "creator-twitch-zenithgrayson70",
    name: "Grayson \"Zenith\" Harris",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-zenithgrayson70-primary", "Twitch", "zenithgrayson70", "https://www.twitch.tv/zenithgrayson70", 1132372, 20452, "avg_live_viewers", "Streams 4-6 days / week on Twitch (20,452 avg live)"),
      createStreamerAccount("acc-creator-twitch-zenithgrayson70-sec", "Kick", "zenithgrayson70", "https://kick.com/zenithgrayson70", 509567, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zenithgrayson70@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/zenithgrayson70",
      lastChecked: daysAgo(2),
    },
  },
  // 269. Aadhya Chopra (Glitch) (Kick)
  {
    id: "creator-kick-glitchaadhya71",
    name: "Aadhya Chopra (Glitch)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-glitchaadhya71-primary", "Kick", "glitch_aadhya71", "https://kick.com/glitch_aadhya71", 1147101, 20891, "avg_live_viewers", "Streams 4-6 days / week on Kick (20,891 avg live)"),
      createStreamerAccount("acc-creator-kick-glitchaadhya71-sec", "Twitch", "glitch_aadhya71", "https://www.twitch.tv/glitch_aadhya71", 516195, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.glitchaadhya71@streamerscout.net",
      sourceUrl: "https://kick.com/glitch_aadhya71",
      lastChecked: daysAgo(2),
    },
  },
  // 270. Leo "Echo" Lewis (Twitch)
  {
    id: "creator-twitch-echoleo72",
    name: "Leo \"Echo\" Lewis",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-echoleo72-primary", "Twitch", "echoleo72", "https://www.twitch.tv/echoleo72", 1161830, 21330, "avg_live_viewers", "Streams 4-6 days / week on Twitch (21,330 avg live)"),
      createStreamerAccount("acc-creator-twitch-echoleo72-sec", "Kick", "echoleo72", "https://kick.com/echoleo72", 522824, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.echoleo72@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/echoleo72",
      lastChecked: daysAgo(2),
    },
  },
  // 271. Isha Rathore (Siren) (Kick)
  {
    id: "creator-kick-sirenisha73",
    name: "Isha Rathore (Siren)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-sirenisha73-primary", "Kick", "siren_isha73", "https://kick.com/siren_isha73", 1176559, 21769, "avg_live_viewers", "Streams 4-6 days / week on Kick (21,769 avg live)"),
      createStreamerAccount("acc-creator-kick-sirenisha73-sec", "Twitch", "siren_isha73", "https://www.twitch.tv/siren_isha73", 529452, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.sirenisha73@streamerscout.net",
      sourceUrl: "https://kick.com/siren_isha73",
      lastChecked: daysAgo(2),
    },
  },
  // 272. Emma "Cyber" Smith (Twitch)
  {
    id: "creator-twitch-cyberemma74",
    name: "Emma \"Cyber\" Smith",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-cyberemma74-primary", "Twitch", "cyberemma74", "https://www.twitch.tv/cyberemma74", 1191288, 22208, "avg_live_viewers", "Streams 4-6 days / week on Twitch (22,208 avg live)"),
      createStreamerAccount("acc-creator-twitch-cyberemma74-sec", "Kick", "cyberemma74", "https://kick.com/cyberemma74", 536080, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cyberemma74@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/cyberemma74",
      lastChecked: daysAgo(2),
    },
  },
  // 273. Pooja Singh (Pixel) (Kick)
  {
    id: "creator-kick-pixelpooja75",
    name: "Pooja Singh (Pixel)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-pixelpooja75-primary", "Kick", "pixel_pooja75", "https://kick.com/pixel_pooja75", 1206017, 22647, "avg_live_viewers", "Streams 4-6 days / week on Kick (22,647 avg live)"),
      createStreamerAccount("acc-creator-kick-pixelpooja75-sec", "Twitch", "pixel_pooja75", "https://www.twitch.tv/pixel_pooja75", 542708, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pixelpooja75@streamerscout.net",
      sourceUrl: "https://kick.com/pixel_pooja75",
      lastChecked: daysAgo(2),
    },
  },
  // 274. Ava "Quantum" Jones (Twitch)
  {
    id: "creator-twitch-quantumava76",
    name: "Ava \"Quantum\" Jones",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-quantumava76-primary", "Twitch", "quantumava76", "https://www.twitch.tv/quantumava76", 1220746, 23086, "avg_live_viewers", "Streams 4-6 days / week on Twitch (23,086 avg live)"),
      createStreamerAccount("acc-creator-twitch-quantumava76-sec", "Kick", "quantumava76", "https://kick.com/quantumava76", 549336, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.quantumava76@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/quantumava76",
      lastChecked: daysAgo(2),
    },
  },
  // 275. Siddharth Chatterjee (Specter) (Kick)
  {
    id: "creator-kick-spectersiddharth77",
    name: "Siddharth Chatterjee (Specter)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-spectersiddharth77-primary", "Kick", "specter_siddharth77", "https://kick.com/specter_siddharth77", 1235475, 23525, "avg_live_viewers", "Streams 4-6 days / week on Kick (23,525 avg live)"),
      createStreamerAccount("acc-creator-kick-spectersiddharth77-sec", "Twitch", "specter_siddharth77", "https://www.twitch.tv/specter_siddharth77", 555964, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.spectersiddharth77@streamerscout.net",
      sourceUrl: "https://kick.com/specter_siddharth77",
      lastChecked: daysAgo(2),
    },
  },
  // 276. Isabella "Raptor" Rodriguez (Twitch)
  {
    id: "creator-twitch-raptorisabella78",
    name: "Isabella \"Raptor\" Rodriguez",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-raptorisabella78-primary", "Twitch", "raptorisabella78", "https://www.twitch.tv/raptorisabella78", 1250204, 23964, "avg_live_viewers", "Streams 4-6 days / week on Twitch (23,964 avg live)"),
      createStreamerAccount("acc-creator-twitch-raptorisabella78-sec", "Kick", "raptorisabella78", "https://kick.com/raptorisabella78", 562592, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.raptorisabella78@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/raptorisabella78",
      lastChecked: daysAgo(2),
    },
  },
  // 277. Karan Chopra (Venom) (Kick)
  {
    id: "creator-kick-venomkaran79",
    name: "Karan Chopra (Venom)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-venomkaran79-primary", "Kick", "venom_karan79", "https://kick.com/venom_karan79", 1264933, 24403, "avg_live_viewers", "Streams 4-6 days / week on Kick (24,403 avg live)"),
      createStreamerAccount("acc-creator-kick-venomkaran79-sec", "Twitch", "venom_karan79", "https://www.twitch.tv/venom_karan79", 569220, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.venomkaran79@streamerscout.net",
      sourceUrl: "https://kick.com/venom_karan79",
      lastChecked: daysAgo(2),
    },
  },
  // 278. Charlotte "Thunder" Gonzalez (Twitch)
  {
    id: "creator-twitch-thundercharlotte80",
    name: "Charlotte \"Thunder\" Gonzalez",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-thundercharlotte80-primary", "Twitch", "thundercharlotte80", "https://www.twitch.tv/thundercharlotte80", 1279662, 24842, "avg_live_viewers", "Streams 4-6 days / week on Twitch (24,842 avg live)"),
      createStreamerAccount("acc-creator-twitch-thundercharlotte80-sec", "Kick", "thundercharlotte80", "https://kick.com/thundercharlotte80", 575848, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.thundercharlotte80@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/thundercharlotte80",
      lastChecked: daysAgo(2),
    },
  },
  // 279. Nikhil Rathore (Vortex) (Kick)
  {
    id: "creator-kick-vortexnikhil81",
    name: "Nikhil Rathore (Vortex)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-vortexnikhil81-primary", "Kick", "vortex_nikhil81", "https://kick.com/vortex_nikhil81", 1294391, 25281, "avg_live_viewers", "Streams 4-6 days / week on Kick (25,281 avg live)"),
      createStreamerAccount("acc-creator-kick-vortexnikhil81-sec", "Twitch", "vortex_nikhil81", "https://www.twitch.tv/vortex_nikhil81", 582476, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.vortexnikhil81@streamerscout.net",
      sourceUrl: "https://kick.com/vortex_nikhil81",
      lastChecked: daysAgo(2),
    },
  },
  // 280. Jack "Striker" Taylor (Twitch)
  {
    id: "creator-twitch-strikerjack82",
    name: "Jack \"Striker\" Taylor",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-strikerjack82-primary", "Twitch", "strikerjack82", "https://www.twitch.tv/strikerjack82", 1309120, 1220, "avg_live_viewers", "Streams 4-6 days / week on Twitch (1,220 avg live)"),
      createStreamerAccount("acc-creator-twitch-strikerjack82-sec", "Kick", "strikerjack82", "https://kick.com/strikerjack82", 589104, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.strikerjack82@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/strikerjack82",
      lastChecked: daysAgo(2),
    },
  },
  // 281. Ayush Singh (Phoenix) (Kick)
  {
    id: "creator-kick-phoenixayush83",
    name: "Ayush Singh (Phoenix)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phoenixayush83-primary", "Kick", "phoenix_ayush83", "https://kick.com/phoenix_ayush83", 1323849, 1659, "avg_live_viewers", "Streams 4-6 days / week on Kick (1,659 avg live)"),
      createStreamerAccount("acc-creator-kick-phoenixayush83-sec", "Twitch", "phoenix_ayush83", "https://www.twitch.tv/phoenix_ayush83", 595732, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phoenixayush83@streamerscout.net",
      sourceUrl: "https://kick.com/phoenix_ayush83",
      lastChecked: daysAgo(2),
    },
  },
  // 282. Liam "Titan" Lee (Twitch)
  {
    id: "creator-twitch-titanliam84",
    name: "Liam \"Titan\" Lee",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-titanliam84-primary", "Twitch", "titanliam84", "https://www.twitch.tv/titanliam84", 1338578, 2098, "avg_live_viewers", "Streams 4-6 days / week on Twitch (2,098 avg live)"),
      createStreamerAccount("acc-creator-twitch-titanliam84-sec", "Kick", "titanliam84", "https://kick.com/titanliam84", 602360, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.titanliam84@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/titanliam84",
      lastChecked: daysAgo(2),
    },
  },
  // 283. Pranav Chatterjee (Zero) (Kick)
  {
    id: "creator-kick-zeropranav85",
    name: "Pranav Chatterjee (Zero)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-zeropranav85-primary", "Kick", "zero_pranav85", "https://kick.com/zero_pranav85", 1353307, 2537, "avg_live_viewers", "Streams 4-6 days / week on Kick (2,537 avg live)"),
      createStreamerAccount("acc-creator-kick-zeropranav85-sec", "Twitch", "zero_pranav85", "https://www.twitch.tv/zero_pranav85", 608988, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zeropranav85@streamerscout.net",
      sourceUrl: "https://kick.com/zero_pranav85",
      lastChecked: daysAgo(2),
    },
  },
  // 284. Oliver "Ninja" Harris (Twitch)
  {
    id: "creator-twitch-ninjaoliver86",
    name: "Oliver \"Ninja\" Harris",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-ninjaoliver86-primary", "Twitch", "ninjaoliver86", "https://www.twitch.tv/ninjaoliver86", 1368036, 2976, "avg_live_viewers", "Streams 4-6 days / week on Twitch (2,976 avg live)"),
      createStreamerAccount("acc-creator-twitch-ninjaoliver86-sec", "Kick", "ninjaoliver86", "https://kick.com/ninjaoliver86", 615616, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ninjaoliver86@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/ninjaoliver86",
      lastChecked: daysAgo(2),
    },
  },
  // 285. Dev Chopra (Ghost) (Kick)
  {
    id: "creator-kick-ghostdev87",
    name: "Dev Chopra (Ghost)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-ghostdev87-primary", "Kick", "ghost_dev87", "https://kick.com/ghost_dev87", 1382765, 3415, "avg_live_viewers", "Streams 4-6 days / week on Kick (3,415 avg live)"),
      createStreamerAccount("acc-creator-kick-ghostdev87-sec", "Twitch", "ghost_dev87", "https://www.twitch.tv/ghost_dev87", 622244, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ghostdev87@streamerscout.net",
      sourceUrl: "https://kick.com/ghost_dev87",
      lastChecked: daysAgo(2),
    },
  },
  // 286. Ethan "Alpha" Lewis (Twitch)
  {
    id: "creator-twitch-alphaethan88",
    name: "Ethan \"Alpha\" Lewis",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-alphaethan88-primary", "Twitch", "alphaethan88", "https://www.twitch.tv/alphaethan88", 1397494, 3854, "avg_live_viewers", "Streams 4-6 days / week on Twitch (3,854 avg live)"),
      createStreamerAccount("acc-creator-twitch-alphaethan88-sec", "Kick", "alphaethan88", "https://kick.com/alphaethan88", 628872, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.alphaethan88@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/alphaethan88",
      lastChecked: daysAgo(2),
    },
  },
  // 287. Shlok Rathore (Omega) (Kick)
  {
    id: "creator-kick-omegashlok89",
    name: "Shlok Rathore (Omega)",
    category: "Gaming",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-omegashlok89-primary", "Kick", "omega_shlok89", "https://kick.com/omega_shlok89", 1412223, 4293, "avg_live_viewers", "Streams 4-6 days / week on Kick (4,293 avg live)"),
      createStreamerAccount("acc-creator-kick-omegashlok89-sec", "Twitch", "omega_shlok89", "https://www.twitch.tv/omega_shlok89", 635500, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.omegashlok89@streamerscout.net",
      sourceUrl: "https://kick.com/omega_shlok89",
      lastChecked: daysAgo(2),
    },
  },
  // 288. Logan "Viper" Smith (Twitch)
  {
    id: "creator-twitch-viperlogan90",
    name: "Logan \"Viper\" Smith",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-viperlogan90-primary", "Twitch", "viperlogan90", "https://www.twitch.tv/viperlogan90", 1426952, 4732, "avg_live_viewers", "Streams 4-6 days / week on Twitch (4,732 avg live)"),
      createStreamerAccount("acc-creator-twitch-viperlogan90-sec", "Kick", "viperlogan90", "https://kick.com/viperlogan90", 642128, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.viperlogan90@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/viperlogan90",
      lastChecked: daysAgo(2),
    },
  },
  // 289. Kabir Singh (Phantom) (Kick)
  {
    id: "creator-kick-phantomkabir91",
    name: "Kabir Singh (Phantom)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phantomkabir91-primary", "Kick", "phantom_kabir91", "https://kick.com/phantom_kabir91", 1441681, 5171, "avg_live_viewers", "Streams 4-6 days / week on Kick (5,171 avg live)"),
      createStreamerAccount("acc-creator-kick-phantomkabir91-sec", "Twitch", "phantom_kabir91", "https://www.twitch.tv/phantom_kabir91", 648756, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phantomkabir91@streamerscout.net",
      sourceUrl: "https://kick.com/phantom_kabir91",
      lastChecked: daysAgo(2),
    },
  },
  // 290. Benjamin "Shadow" Jones (Twitch)
  {
    id: "creator-twitch-shadowbenjamin92",
    name: "Benjamin \"Shadow\" Jones",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-shadowbenjamin92-primary", "Twitch", "shadowbenjamin92", "https://www.twitch.tv/shadowbenjamin92", 1456410, 5610, "avg_live_viewers", "Streams 4-6 days / week on Twitch (5,610 avg live)"),
      createStreamerAccount("acc-creator-twitch-shadowbenjamin92-sec", "Kick", "shadowbenjamin92", "https://kick.com/shadowbenjamin92", 655385, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.shadowbenjamin92@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/shadowbenjamin92",
      lastChecked: daysAgo(2),
    },
  },
  // 291. Dhruv Chatterjee (Blaze) (Kick)
  {
    id: "creator-kick-blazedhruv93",
    name: "Dhruv Chatterjee (Blaze)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-blazedhruv93-primary", "Kick", "blaze_dhruv93", "https://kick.com/blaze_dhruv93", 1471139, 6049, "avg_live_viewers", "Streams 4-6 days / week on Kick (6,049 avg live)"),
      createStreamerAccount("acc-creator-kick-blazedhruv93-sec", "Twitch", "blaze_dhruv93", "https://www.twitch.tv/blaze_dhruv93", 662013, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.blazedhruv93@streamerscout.net",
      sourceUrl: "https://kick.com/blaze_dhruv93",
      lastChecked: daysAgo(2),
    },
  },
  // 292. Sebastian "Apex" Rodriguez (Twitch)
  {
    id: "creator-twitch-apexsebastian94",
    name: "Sebastian \"Apex\" Rodriguez",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-apexsebastian94-primary", "Twitch", "apexsebastian94", "https://www.twitch.tv/apexsebastian94", 1485868, 6488, "avg_live_viewers", "Streams 4-6 days / week on Twitch (6,488 avg live)"),
      createStreamerAccount("acc-creator-twitch-apexsebastian94-sec", "Kick", "apexsebastian94", "https://kick.com/apexsebastian94", 668641, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.apexsebastian94@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/apexsebastian94",
      lastChecked: daysAgo(2),
    },
  },
  // 293. Atharv Chopra (Frost) (Kick)
  {
    id: "creator-kick-frostatharv95",
    name: "Atharv Chopra (Frost)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-frostatharv95-primary", "Kick", "frost_atharv95", "https://kick.com/frost_atharv95", 1500597, 6927, "avg_live_viewers", "Streams 4-6 days / week on Kick (6,927 avg live)"),
      createStreamerAccount("acc-creator-kick-frostatharv95-sec", "Twitch", "frost_atharv95", "https://www.twitch.tv/frost_atharv95", 675269, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.frostatharv95@streamerscout.net",
      sourceUrl: "https://kick.com/frost_atharv95",
      lastChecked: daysAgo(2),
    },
  },
  // 294. Aiden "Nova" Gonzalez (Twitch)
  {
    id: "creator-twitch-novaaiden96",
    name: "Aiden \"Nova\" Gonzalez",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-novaaiden96-primary", "Twitch", "novaaiden96", "https://www.twitch.tv/novaaiden96", 1515326, 7366, "avg_live_viewers", "Streams 4-6 days / week on Twitch (7,366 avg live)"),
      createStreamerAccount("acc-creator-twitch-novaaiden96-sec", "Kick", "novaaiden96", "https://kick.com/novaaiden96", 681897, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.novaaiden96@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/novaaiden96",
      lastChecked: daysAgo(2),
    },
  },
  // 295. Ishaan Rathore (Cosmic) (Kick)
  {
    id: "creator-kick-cosmicishaan97",
    name: "Ishaan Rathore (Cosmic)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-cosmicishaan97-primary", "Kick", "cosmic_ishaan97", "https://kick.com/cosmic_ishaan97", 1530055, 7805, "avg_live_viewers", "Streams 4-6 days / week on Kick (7,805 avg live)"),
      createStreamerAccount("acc-creator-kick-cosmicishaan97-sec", "Twitch", "cosmic_ishaan97", "https://www.twitch.tv/cosmic_ishaan97", 688525, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cosmicishaan97@streamerscout.net",
      sourceUrl: "https://kick.com/cosmic_ishaan97",
      lastChecked: daysAgo(2),
    },
  },
  // 296. Samuel "Pulse" Taylor (Twitch)
  {
    id: "creator-twitch-pulsesamuel98",
    name: "Samuel \"Pulse\" Taylor",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-pulsesamuel98-primary", "Twitch", "pulsesamuel98", "https://www.twitch.tv/pulsesamuel98", 1544784, 8244, "avg_live_viewers", "Streams 4-6 days / week on Twitch (8,244 avg live)"),
      createStreamerAccount("acc-creator-twitch-pulsesamuel98-sec", "Kick", "pulsesamuel98", "https://kick.com/pulsesamuel98", 695153, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pulsesamuel98@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/pulsesamuel98",
      lastChecked: daysAgo(2),
    },
  },
  // 297. Arjun Singh (Storm) (Kick)
  {
    id: "creator-kick-stormarjun0",
    name: "Arjun Singh (Storm)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-stormarjun0-primary", "Kick", "storm_arjun0", "https://kick.com/storm_arjun0", 1559513, 8683, "avg_live_viewers", "Streams 4-6 days / week on Kick (8,683 avg live)"),
      createStreamerAccount("acc-creator-kick-stormarjun0-sec", "Twitch", "storm_arjun0", "https://www.twitch.tv/storm_arjun0", 701781, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.stormarjun0@streamerscout.net",
      sourceUrl: "https://kick.com/storm_arjun0",
      lastChecked: daysAgo(2),
    },
  },
  // 298. Joseph "Havoc" Lee (Twitch)
  {
    id: "creator-twitch-havocjoseph1",
    name: "Joseph \"Havoc\" Lee",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-havocjoseph1-primary", "Twitch", "havocjoseph1", "https://www.twitch.tv/havocjoseph1", 1574242, 9122, "avg_live_viewers", "Streams 4-6 days / week on Twitch (9,122 avg live)"),
      createStreamerAccount("acc-creator-twitch-havocjoseph1-sec", "Kick", "havocjoseph1", "https://kick.com/havocjoseph1", 708409, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.havocjoseph1@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/havocjoseph1",
      lastChecked: daysAgo(2),
    },
  },
  // 299. Diya Chatterjee (Reaper) (Kick)
  {
    id: "creator-kick-reaperdiya2",
    name: "Diya Chatterjee (Reaper)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-reaperdiya2-primary", "Kick", "reaper_diya2", "https://kick.com/reaper_diya2", 1588971, 9561, "avg_live_viewers", "Streams 4-6 days / week on Kick (9,561 avg live)"),
      createStreamerAccount("acc-creator-kick-reaperdiya2-sec", "Twitch", "reaper_diya2", "https://www.twitch.tv/reaper_diya2", 715037, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.reaperdiya2@streamerscout.net",
      sourceUrl: "https://kick.com/reaper_diya2",
      lastChecked: daysAgo(2),
    },
  },
  // 300. Owen "Zenith" Harris (Twitch)
  {
    id: "creator-twitch-zenithowen3",
    name: "Owen \"Zenith\" Harris",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-zenithowen3-primary", "Twitch", "zenithowen3", "https://www.twitch.tv/zenithowen3", 1603700, 10000, "avg_live_viewers", "Streams 4-6 days / week on Twitch (10,000 avg live)"),
      createStreamerAccount("acc-creator-twitch-zenithowen3-sec", "Kick", "zenithowen3", "https://kick.com/zenithowen3", 721665, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zenithowen3@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/zenithowen3",
      lastChecked: daysAgo(2),
    },
  },
  // 301. Aadhya Chopra (Glitch) (Kick)
  {
    id: "creator-kick-glitchaadhya4",
    name: "Aadhya Chopra (Glitch)",
    category: "Gaming",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-glitchaadhya4-primary", "Kick", "glitch_aadhya4", "https://kick.com/glitch_aadhya4", 1618429, 10439, "avg_live_viewers", "Streams 4-6 days / week on Kick (10,439 avg live)"),
      createStreamerAccount("acc-creator-kick-glitchaadhya4-sec", "Twitch", "glitch_aadhya4", "https://www.twitch.tv/glitch_aadhya4", 728293, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.glitchaadhya4@streamerscout.net",
      sourceUrl: "https://kick.com/glitch_aadhya4",
      lastChecked: daysAgo(2),
    },
  },
  // 302. John "Echo" Lewis (Twitch)
  {
    id: "creator-twitch-echojohn5",
    name: "John \"Echo\" Lewis",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-echojohn5-primary", "Twitch", "echojohn5", "https://www.twitch.tv/echojohn5", 1633158, 10878, "avg_live_viewers", "Streams 4-6 days / week on Twitch (10,878 avg live)"),
      createStreamerAccount("acc-creator-twitch-echojohn5-sec", "Kick", "echojohn5", "https://kick.com/echojohn5", 734921, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.echojohn5@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/echojohn5",
      lastChecked: daysAgo(2),
    },
  },
  // 303. Isha Rathore (Siren) (Kick)
  {
    id: "creator-kick-sirenisha6",
    name: "Isha Rathore (Siren)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-sirenisha6-primary", "Kick", "siren_isha6", "https://kick.com/siren_isha6", 1647887, 11317, "avg_live_viewers", "Streams 4-6 days / week on Kick (11,317 avg live)"),
      createStreamerAccount("acc-creator-kick-sirenisha6-sec", "Twitch", "siren_isha6", "https://www.twitch.tv/siren_isha6", 741549, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.sirenisha6@streamerscout.net",
      sourceUrl: "https://kick.com/siren_isha6",
      lastChecked: daysAgo(2),
    },
  },
  // 304. Luke "Cyber" Smith (Twitch)
  {
    id: "creator-twitch-cyberluke7",
    name: "Luke \"Cyber\" Smith",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-cyberluke7-primary", "Twitch", "cyberluke7", "https://www.twitch.tv/cyberluke7", 1662616, 11756, "avg_live_viewers", "Streams 4-6 days / week on Twitch (11,756 avg live)"),
      createStreamerAccount("acc-creator-twitch-cyberluke7-sec", "Kick", "cyberluke7", "https://kick.com/cyberluke7", 748177, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cyberluke7@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/cyberluke7",
      lastChecked: daysAgo(2),
    },
  },
  // 305. Pooja Singh (Pixel) (Kick)
  {
    id: "creator-kick-pixelpooja8",
    name: "Pooja Singh (Pixel)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-pixelpooja8-primary", "Kick", "pixel_pooja8", "https://kick.com/pixel_pooja8", 1677345, 12195, "avg_live_viewers", "Streams 4-6 days / week on Kick (12,195 avg live)"),
      createStreamerAccount("acc-creator-kick-pixelpooja8-sec", "Twitch", "pixel_pooja8", "https://www.twitch.tv/pixel_pooja8", 754805, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pixelpooja8@streamerscout.net",
      sourceUrl: "https://kick.com/pixel_pooja8",
      lastChecked: daysAgo(2),
    },
  },
  // 306. Anthony "Quantum" Jones (Twitch)
  {
    id: "creator-twitch-quantumanthony9",
    name: "Anthony \"Quantum\" Jones",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-quantumanthony9-primary", "Twitch", "quantumanthony9", "https://www.twitch.tv/quantumanthony9", 1692074, 12634, "avg_live_viewers", "Streams 4-6 days / week on Twitch (12,634 avg live)"),
      createStreamerAccount("acc-creator-twitch-quantumanthony9-sec", "Kick", "quantumanthony9", "https://kick.com/quantumanthony9", 761433, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.quantumanthony9@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/quantumanthony9",
      lastChecked: daysAgo(2),
    },
  },
  // 307. Siddharth Chatterjee (Specter) (Kick)
  {
    id: "creator-kick-spectersiddharth10",
    name: "Siddharth Chatterjee (Specter)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-spectersiddharth10-primary", "Kick", "specter_siddharth10", "https://kick.com/specter_siddharth10", 1706803, 13073, "avg_live_viewers", "Streams 4-6 days / week on Kick (13,073 avg live)"),
      createStreamerAccount("acc-creator-kick-spectersiddharth10-sec", "Twitch", "specter_siddharth10", "https://www.twitch.tv/specter_siddharth10", 768061, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.spectersiddharth10@streamerscout.net",
      sourceUrl: "https://kick.com/specter_siddharth10",
      lastChecked: daysAgo(2),
    },
  },
  // 308. Grayson "Raptor" Rodriguez (Twitch)
  {
    id: "creator-twitch-raptorgrayson11",
    name: "Grayson \"Raptor\" Rodriguez",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-raptorgrayson11-primary", "Twitch", "raptorgrayson11", "https://www.twitch.tv/raptorgrayson11", 1721532, 13512, "avg_live_viewers", "Streams 4-6 days / week on Twitch (13,512 avg live)"),
      createStreamerAccount("acc-creator-twitch-raptorgrayson11-sec", "Kick", "raptorgrayson11", "https://kick.com/raptorgrayson11", 774689, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.raptorgrayson11@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/raptorgrayson11",
      lastChecked: daysAgo(2),
    },
  },
  // 309. Karan Chopra (Venom) (Kick)
  {
    id: "creator-kick-venomkaran12",
    name: "Karan Chopra (Venom)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-venomkaran12-primary", "Kick", "venom_karan12", "https://kick.com/venom_karan12", 1736261, 13951, "avg_live_viewers", "Streams 4-6 days / week on Kick (13,951 avg live)"),
      createStreamerAccount("acc-creator-kick-venomkaran12-sec", "Twitch", "venom_karan12", "https://www.twitch.tv/venom_karan12", 781317, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.venomkaran12@streamerscout.net",
      sourceUrl: "https://kick.com/venom_karan12",
      lastChecked: daysAgo(2),
    },
  },
  // 310. Leo "Thunder" Gonzalez (Twitch)
  {
    id: "creator-twitch-thunderleo13",
    name: "Leo \"Thunder\" Gonzalez",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-thunderleo13-primary", "Twitch", "thunderleo13", "https://www.twitch.tv/thunderleo13", 1750990, 14390, "avg_live_viewers", "Streams 4-6 days / week on Twitch (14,390 avg live)"),
      createStreamerAccount("acc-creator-twitch-thunderleo13-sec", "Kick", "thunderleo13", "https://kick.com/thunderleo13", 787946, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.thunderleo13@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/thunderleo13",
      lastChecked: daysAgo(2),
    },
  },
  // 311. Nikhil Rathore (Vortex) (Kick)
  {
    id: "creator-kick-vortexnikhil14",
    name: "Nikhil Rathore (Vortex)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-vortexnikhil14-primary", "Kick", "vortex_nikhil14", "https://kick.com/vortex_nikhil14", 1765719, 14829, "avg_live_viewers", "Streams 4-6 days / week on Kick (14,829 avg live)"),
      createStreamerAccount("acc-creator-kick-vortexnikhil14-sec", "Twitch", "vortex_nikhil14", "https://www.twitch.tv/vortex_nikhil14", 794574, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.vortexnikhil14@streamerscout.net",
      sourceUrl: "https://kick.com/vortex_nikhil14",
      lastChecked: daysAgo(2),
    },
  },
  // 312. Emma "Striker" Taylor (Twitch)
  {
    id: "creator-twitch-strikeremma15",
    name: "Emma \"Striker\" Taylor",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-strikeremma15-primary", "Twitch", "strikeremma15", "https://www.twitch.tv/strikeremma15", 1780448, 15268, "avg_live_viewers", "Streams 4-6 days / week on Twitch (15,268 avg live)"),
      createStreamerAccount("acc-creator-twitch-strikeremma15-sec", "Kick", "strikeremma15", "https://kick.com/strikeremma15", 801202, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.strikeremma15@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/strikeremma15",
      lastChecked: daysAgo(2),
    },
  },
  // 313. Ayush Singh (Phoenix) (Kick)
  {
    id: "creator-kick-phoenixayush16",
    name: "Ayush Singh (Phoenix)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phoenixayush16-primary", "Kick", "phoenix_ayush16", "https://kick.com/phoenix_ayush16", 1795177, 15707, "avg_live_viewers", "Streams 4-6 days / week on Kick (15,707 avg live)"),
      createStreamerAccount("acc-creator-kick-phoenixayush16-sec", "Twitch", "phoenix_ayush16", "https://www.twitch.tv/phoenix_ayush16", 807830, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phoenixayush16@streamerscout.net",
      sourceUrl: "https://kick.com/phoenix_ayush16",
      lastChecked: daysAgo(2),
    },
  },
  // 314. Ava "Titan" Lee (Twitch)
  {
    id: "creator-twitch-titanava17",
    name: "Ava \"Titan\" Lee",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-titanava17-primary", "Twitch", "titanava17", "https://www.twitch.tv/titanava17", 1809906, 16146, "avg_live_viewers", "Streams 4-6 days / week on Twitch (16,146 avg live)"),
      createStreamerAccount("acc-creator-twitch-titanava17-sec", "Kick", "titanava17", "https://kick.com/titanava17", 814458, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.titanava17@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/titanava17",
      lastChecked: daysAgo(2),
    },
  },
  // 315. Pranav Chatterjee (Zero) (Kick)
  {
    id: "creator-kick-zeropranav18",
    name: "Pranav Chatterjee (Zero)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-zeropranav18-primary", "Kick", "zero_pranav18", "https://kick.com/zero_pranav18", 1824635, 16585, "avg_live_viewers", "Streams 4-6 days / week on Kick (16,585 avg live)"),
      createStreamerAccount("acc-creator-kick-zeropranav18-sec", "Twitch", "zero_pranav18", "https://www.twitch.tv/zero_pranav18", 821086, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zeropranav18@streamerscout.net",
      sourceUrl: "https://kick.com/zero_pranav18",
      lastChecked: daysAgo(2),
    },
  },
  // 316. Isabella "Ninja" Harris (Twitch)
  {
    id: "creator-twitch-ninjaisabella19",
    name: "Isabella \"Ninja\" Harris",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-ninjaisabella19-primary", "Twitch", "ninjaisabella19", "https://www.twitch.tv/ninjaisabella19", 1839364, 17024, "avg_live_viewers", "Streams 4-6 days / week on Twitch (17,024 avg live)"),
      createStreamerAccount("acc-creator-twitch-ninjaisabella19-sec", "Kick", "ninjaisabella19", "https://kick.com/ninjaisabella19", 827714, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ninjaisabella19@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/ninjaisabella19",
      lastChecked: daysAgo(2),
    },
  },
  // 317. Dev Chopra (Ghost) (Kick)
  {
    id: "creator-kick-ghostdev20",
    name: "Dev Chopra (Ghost)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-ghostdev20-primary", "Kick", "ghost_dev20", "https://kick.com/ghost_dev20", 1854093, 17463, "avg_live_viewers", "Streams 4-6 days / week on Kick (17,463 avg live)"),
      createStreamerAccount("acc-creator-kick-ghostdev20-sec", "Twitch", "ghost_dev20", "https://www.twitch.tv/ghost_dev20", 834342, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ghostdev20@streamerscout.net",
      sourceUrl: "https://kick.com/ghost_dev20",
      lastChecked: daysAgo(2),
    },
  },
  // 318. Charlotte "Alpha" Lewis (Twitch)
  {
    id: "creator-twitch-alphacharlotte21",
    name: "Charlotte \"Alpha\" Lewis",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-alphacharlotte21-primary", "Twitch", "alphacharlotte21", "https://www.twitch.tv/alphacharlotte21", 1868822, 17902, "avg_live_viewers", "Streams 4-6 days / week on Twitch (17,902 avg live)"),
      createStreamerAccount("acc-creator-twitch-alphacharlotte21-sec", "Kick", "alphacharlotte21", "https://kick.com/alphacharlotte21", 840970, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.alphacharlotte21@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/alphacharlotte21",
      lastChecked: daysAgo(2),
    },
  },
  // 319. Shlok Rathore (Omega) (Kick)
  {
    id: "creator-kick-omegashlok22",
    name: "Shlok Rathore (Omega)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-omegashlok22-primary", "Kick", "omega_shlok22", "https://kick.com/omega_shlok22", 1883551, 18341, "avg_live_viewers", "Streams 4-6 days / week on Kick (18,341 avg live)"),
      createStreamerAccount("acc-creator-kick-omegashlok22-sec", "Twitch", "omega_shlok22", "https://www.twitch.tv/omega_shlok22", 847598, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.omegashlok22@streamerscout.net",
      sourceUrl: "https://kick.com/omega_shlok22",
      lastChecked: daysAgo(2),
    },
  },
  // 320. Jack "Viper" Smith (Twitch)
  {
    id: "creator-twitch-viperjack23",
    name: "Jack \"Viper\" Smith",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-viperjack23-primary", "Twitch", "viperjack23", "https://www.twitch.tv/viperjack23", 1898280, 18780, "avg_live_viewers", "Streams 4-6 days / week on Twitch (18,780 avg live)"),
      createStreamerAccount("acc-creator-twitch-viperjack23-sec", "Kick", "viperjack23", "https://kick.com/viperjack23", 854226, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.viperjack23@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/viperjack23",
      lastChecked: daysAgo(2),
    },
  },
  // 321. Kabir Singh (Phantom) (Kick)
  {
    id: "creator-kick-phantomkabir24",
    name: "Kabir Singh (Phantom)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phantomkabir24-primary", "Kick", "phantom_kabir24", "https://kick.com/phantom_kabir24", 1913009, 19219, "avg_live_viewers", "Streams 4-6 days / week on Kick (19,219 avg live)"),
      createStreamerAccount("acc-creator-kick-phantomkabir24-sec", "Twitch", "phantom_kabir24", "https://www.twitch.tv/phantom_kabir24", 860854, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phantomkabir24@streamerscout.net",
      sourceUrl: "https://kick.com/phantom_kabir24",
      lastChecked: daysAgo(2),
    },
  },
  // 322. Liam "Shadow" Jones (Twitch)
  {
    id: "creator-twitch-shadowliam25",
    name: "Liam \"Shadow\" Jones",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-shadowliam25-primary", "Twitch", "shadowliam25", "https://www.twitch.tv/shadowliam25", 1927738, 19658, "avg_live_viewers", "Streams 4-6 days / week on Twitch (19,658 avg live)"),
      createStreamerAccount("acc-creator-twitch-shadowliam25-sec", "Kick", "shadowliam25", "https://kick.com/shadowliam25", 867482, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.shadowliam25@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/shadowliam25",
      lastChecked: daysAgo(2),
    },
  },
  // 323. Dhruv Chatterjee (Blaze) (Kick)
  {
    id: "creator-kick-blazedhruv26",
    name: "Dhruv Chatterjee (Blaze)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-blazedhruv26-primary", "Kick", "blaze_dhruv26", "https://kick.com/blaze_dhruv26", 1942467, 20097, "avg_live_viewers", "Streams 4-6 days / week on Kick (20,097 avg live)"),
      createStreamerAccount("acc-creator-kick-blazedhruv26-sec", "Twitch", "blaze_dhruv26", "https://www.twitch.tv/blaze_dhruv26", 874110, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.blazedhruv26@streamerscout.net",
      sourceUrl: "https://kick.com/blaze_dhruv26",
      lastChecked: daysAgo(2),
    },
  },
  // 324. Oliver "Apex" Rodriguez (Twitch)
  {
    id: "creator-twitch-apexoliver27",
    name: "Oliver \"Apex\" Rodriguez",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-apexoliver27-primary", "Twitch", "apexoliver27", "https://www.twitch.tv/apexoliver27", 1957196, 20536, "avg_live_viewers", "Streams 4-6 days / week on Twitch (20,536 avg live)"),
      createStreamerAccount("acc-creator-twitch-apexoliver27-sec", "Kick", "apexoliver27", "https://kick.com/apexoliver27", 880738, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.apexoliver27@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/apexoliver27",
      lastChecked: daysAgo(2),
    },
  },
  // 325. Atharv Chopra (Frost) (Kick)
  {
    id: "creator-kick-frostatharv28",
    name: "Atharv Chopra (Frost)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-frostatharv28-primary", "Kick", "frost_atharv28", "https://kick.com/frost_atharv28", 1971925, 20975, "avg_live_viewers", "Streams 4-6 days / week on Kick (20,975 avg live)"),
      createStreamerAccount("acc-creator-kick-frostatharv28-sec", "Twitch", "frost_atharv28", "https://www.twitch.tv/frost_atharv28", 887366, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.frostatharv28@streamerscout.net",
      sourceUrl: "https://kick.com/frost_atharv28",
      lastChecked: daysAgo(2),
    },
  },
  // 326. Ethan "Nova" Gonzalez (Twitch)
  {
    id: "creator-twitch-novaethan29",
    name: "Ethan \"Nova\" Gonzalez",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-novaethan29-primary", "Twitch", "novaethan29", "https://www.twitch.tv/novaethan29", 1986654, 21414, "avg_live_viewers", "Streams 4-6 days / week on Twitch (21,414 avg live)"),
      createStreamerAccount("acc-creator-twitch-novaethan29-sec", "Kick", "novaethan29", "https://kick.com/novaethan29", 893994, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.novaethan29@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/novaethan29",
      lastChecked: daysAgo(2),
    },
  },
  // 327. Ishaan Rathore (Cosmic) (Kick)
  {
    id: "creator-kick-cosmicishaan30",
    name: "Ishaan Rathore (Cosmic)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-cosmicishaan30-primary", "Kick", "cosmic_ishaan30", "https://kick.com/cosmic_ishaan30", 2001383, 21853, "avg_live_viewers", "Streams 4-6 days / week on Kick (21,853 avg live)"),
      createStreamerAccount("acc-creator-kick-cosmicishaan30-sec", "Twitch", "cosmic_ishaan30", "https://www.twitch.tv/cosmic_ishaan30", 900622, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cosmicishaan30@streamerscout.net",
      sourceUrl: "https://kick.com/cosmic_ishaan30",
      lastChecked: daysAgo(2),
    },
  },
  // 328. Logan "Pulse" Taylor (Twitch)
  {
    id: "creator-twitch-pulselogan31",
    name: "Logan \"Pulse\" Taylor",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-pulselogan31-primary", "Twitch", "pulselogan31", "https://www.twitch.tv/pulselogan31", 2016112, 22292, "avg_live_viewers", "Streams 4-6 days / week on Twitch (22,292 avg live)"),
      createStreamerAccount("acc-creator-twitch-pulselogan31-sec", "Kick", "pulselogan31", "https://kick.com/pulselogan31", 907250, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pulselogan31@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/pulselogan31",
      lastChecked: daysAgo(2),
    },
  },
  // 329. Arjun Singh (Storm) (Kick)
  {
    id: "creator-kick-stormarjun32",
    name: "Arjun Singh (Storm)",
    category: "Gaming",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-stormarjun32-primary", "Kick", "storm_arjun32", "https://kick.com/storm_arjun32", 2030841, 22731, "avg_live_viewers", "Streams 4-6 days / week on Kick (22,731 avg live)"),
      createStreamerAccount("acc-creator-kick-stormarjun32-sec", "Twitch", "storm_arjun32", "https://www.twitch.tv/storm_arjun32", 913878, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.stormarjun32@streamerscout.net",
      sourceUrl: "https://kick.com/storm_arjun32",
      lastChecked: daysAgo(2),
    },
  },
  // 330. Benjamin "Havoc" Lee (Twitch)
  {
    id: "creator-twitch-havocbenjamin33",
    name: "Benjamin \"Havoc\" Lee",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-havocbenjamin33-primary", "Twitch", "havocbenjamin33", "https://www.twitch.tv/havocbenjamin33", 2045570, 23170, "avg_live_viewers", "Streams 4-6 days / week on Twitch (23,170 avg live)"),
      createStreamerAccount("acc-creator-twitch-havocbenjamin33-sec", "Kick", "havocbenjamin33", "https://kick.com/havocbenjamin33", 920507, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.havocbenjamin33@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/havocbenjamin33",
      lastChecked: daysAgo(2),
    },
  },
  // 331. Diya Chatterjee (Reaper) (Kick)
  {
    id: "creator-kick-reaperdiya34",
    name: "Diya Chatterjee (Reaper)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-reaperdiya34-primary", "Kick", "reaper_diya34", "https://kick.com/reaper_diya34", 2060299, 23609, "avg_live_viewers", "Streams 4-6 days / week on Kick (23,609 avg live)"),
      createStreamerAccount("acc-creator-kick-reaperdiya34-sec", "Twitch", "reaper_diya34", "https://www.twitch.tv/reaper_diya34", 927135, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.reaperdiya34@streamerscout.net",
      sourceUrl: "https://kick.com/reaper_diya34",
      lastChecked: daysAgo(2),
    },
  },
  // 332. Sebastian "Zenith" Harris (Twitch)
  {
    id: "creator-twitch-zenithsebastian35",
    name: "Sebastian \"Zenith\" Harris",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-zenithsebastian35-primary", "Twitch", "zenithsebastian35", "https://www.twitch.tv/zenithsebastian35", 2075028, 24048, "avg_live_viewers", "Streams 4-6 days / week on Twitch (24,048 avg live)"),
      createStreamerAccount("acc-creator-twitch-zenithsebastian35-sec", "Kick", "zenithsebastian35", "https://kick.com/zenithsebastian35", 933763, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zenithsebastian35@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/zenithsebastian35",
      lastChecked: daysAgo(2),
    },
  },
  // 333. Aadhya Chopra (Glitch) (Kick)
  {
    id: "creator-kick-glitchaadhya36",
    name: "Aadhya Chopra (Glitch)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-glitchaadhya36-primary", "Kick", "glitch_aadhya36", "https://kick.com/glitch_aadhya36", 2089757, 24487, "avg_live_viewers", "Streams 4-6 days / week on Kick (24,487 avg live)"),
      createStreamerAccount("acc-creator-kick-glitchaadhya36-sec", "Twitch", "glitch_aadhya36", "https://www.twitch.tv/glitch_aadhya36", 940391, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.glitchaadhya36@streamerscout.net",
      sourceUrl: "https://kick.com/glitch_aadhya36",
      lastChecked: daysAgo(2),
    },
  },
  // 334. Aiden "Echo" Lewis (Twitch)
  {
    id: "creator-twitch-echoaiden37",
    name: "Aiden \"Echo\" Lewis",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-echoaiden37-primary", "Twitch", "echoaiden37", "https://www.twitch.tv/echoaiden37", 2104486, 24926, "avg_live_viewers", "Streams 4-6 days / week on Twitch (24,926 avg live)"),
      createStreamerAccount("acc-creator-twitch-echoaiden37-sec", "Kick", "echoaiden37", "https://kick.com/echoaiden37", 947019, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.echoaiden37@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/echoaiden37",
      lastChecked: daysAgo(2),
    },
  },
  // 335. Isha Rathore (Siren) (Kick)
  {
    id: "creator-kick-sirenisha38",
    name: "Isha Rathore (Siren)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-sirenisha38-primary", "Kick", "siren_isha38", "https://kick.com/siren_isha38", 2119215, 865, "avg_live_viewers", "Streams 4-6 days / week on Kick (865 avg live)"),
      createStreamerAccount("acc-creator-kick-sirenisha38-sec", "Twitch", "siren_isha38", "https://www.twitch.tv/siren_isha38", 953647, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.sirenisha38@streamerscout.net",
      sourceUrl: "https://kick.com/siren_isha38",
      lastChecked: daysAgo(2),
    },
  },
  // 336. Samuel "Cyber" Smith (Twitch)
  {
    id: "creator-twitch-cybersamuel39",
    name: "Samuel \"Cyber\" Smith",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-cybersamuel39-primary", "Twitch", "cybersamuel39", "https://www.twitch.tv/cybersamuel39", 2133944, 1304, "avg_live_viewers", "Streams 4-6 days / week on Twitch (1,304 avg live)"),
      createStreamerAccount("acc-creator-twitch-cybersamuel39-sec", "Kick", "cybersamuel39", "https://kick.com/cybersamuel39", 960275, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cybersamuel39@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/cybersamuel39",
      lastChecked: daysAgo(2),
    },
  },
  // 337. Pooja Singh (Pixel) (Kick)
  {
    id: "creator-kick-pixelpooja40",
    name: "Pooja Singh (Pixel)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-pixelpooja40-primary", "Kick", "pixel_pooja40", "https://kick.com/pixel_pooja40", 2148673, 1743, "avg_live_viewers", "Streams 4-6 days / week on Kick (1,743 avg live)"),
      createStreamerAccount("acc-creator-kick-pixelpooja40-sec", "Twitch", "pixel_pooja40", "https://www.twitch.tv/pixel_pooja40", 966903, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pixelpooja40@streamerscout.net",
      sourceUrl: "https://kick.com/pixel_pooja40",
      lastChecked: daysAgo(2),
    },
  },
  // 338. Joseph "Quantum" Jones (Twitch)
  {
    id: "creator-twitch-quantumjoseph41",
    name: "Joseph \"Quantum\" Jones",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-quantumjoseph41-primary", "Twitch", "quantumjoseph41", "https://www.twitch.tv/quantumjoseph41", 2163402, 2182, "avg_live_viewers", "Streams 4-6 days / week on Twitch (2,182 avg live)"),
      createStreamerAccount("acc-creator-twitch-quantumjoseph41-sec", "Kick", "quantumjoseph41", "https://kick.com/quantumjoseph41", 973531, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.quantumjoseph41@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/quantumjoseph41",
      lastChecked: daysAgo(2),
    },
  },
  // 339. Siddharth Chatterjee (Specter) (Kick)
  {
    id: "creator-kick-spectersiddharth42",
    name: "Siddharth Chatterjee (Specter)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-spectersiddharth42-primary", "Kick", "specter_siddharth42", "https://kick.com/specter_siddharth42", 2178131, 2621, "avg_live_viewers", "Streams 4-6 days / week on Kick (2,621 avg live)"),
      createStreamerAccount("acc-creator-kick-spectersiddharth42-sec", "Twitch", "specter_siddharth42", "https://www.twitch.tv/specter_siddharth42", 980159, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.spectersiddharth42@streamerscout.net",
      sourceUrl: "https://kick.com/specter_siddharth42",
      lastChecked: daysAgo(2),
    },
  },
  // 340. Owen "Raptor" Rodriguez (Twitch)
  {
    id: "creator-twitch-raptorowen43",
    name: "Owen \"Raptor\" Rodriguez",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-raptorowen43-primary", "Twitch", "raptorowen43", "https://www.twitch.tv/raptorowen43", 2192860, 3060, "avg_live_viewers", "Streams 4-6 days / week on Twitch (3,060 avg live)"),
      createStreamerAccount("acc-creator-twitch-raptorowen43-sec", "Kick", "raptorowen43", "https://kick.com/raptorowen43", 986787, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.raptorowen43@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/raptorowen43",
      lastChecked: daysAgo(2),
    },
  },
  // 341. Karan Chopra (Venom) (Kick)
  {
    id: "creator-kick-venomkaran44",
    name: "Karan Chopra (Venom)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-venomkaran44-primary", "Kick", "venom_karan44", "https://kick.com/venom_karan44", 2207589, 3499, "avg_live_viewers", "Streams 4-6 days / week on Kick (3,499 avg live)"),
      createStreamerAccount("acc-creator-kick-venomkaran44-sec", "Twitch", "venom_karan44", "https://www.twitch.tv/venom_karan44", 993415, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.venomkaran44@streamerscout.net",
      sourceUrl: "https://kick.com/venom_karan44",
      lastChecked: daysAgo(2),
    },
  },
  // 342. John "Thunder" Gonzalez (Twitch)
  {
    id: "creator-twitch-thunderjohn45",
    name: "John \"Thunder\" Gonzalez",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-thunderjohn45-primary", "Twitch", "thunderjohn45", "https://www.twitch.tv/thunderjohn45", 2222318, 3938, "avg_live_viewers", "Streams 4-6 days / week on Twitch (3,938 avg live)"),
      createStreamerAccount("acc-creator-twitch-thunderjohn45-sec", "Kick", "thunderjohn45", "https://kick.com/thunderjohn45", 1000043, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.thunderjohn45@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/thunderjohn45",
      lastChecked: daysAgo(2),
    },
  },
  // 343. Nikhil Rathore (Vortex) (Kick)
  {
    id: "creator-kick-vortexnikhil46",
    name: "Nikhil Rathore (Vortex)",
    category: "Gaming",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-vortexnikhil46-primary", "Kick", "vortex_nikhil46", "https://kick.com/vortex_nikhil46", 2237047, 4377, "avg_live_viewers", "Streams 4-6 days / week on Kick (4,377 avg live)"),
      createStreamerAccount("acc-creator-kick-vortexnikhil46-sec", "Twitch", "vortex_nikhil46", "https://www.twitch.tv/vortex_nikhil46", 1006671, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.vortexnikhil46@streamerscout.net",
      sourceUrl: "https://kick.com/vortex_nikhil46",
      lastChecked: daysAgo(2),
    },
  },
  // 344. Luke "Striker" Taylor (Twitch)
  {
    id: "creator-twitch-strikerluke47",
    name: "Luke \"Striker\" Taylor",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-strikerluke47-primary", "Twitch", "strikerluke47", "https://www.twitch.tv/strikerluke47", 2251776, 4816, "avg_live_viewers", "Streams 4-6 days / week on Twitch (4,816 avg live)"),
      createStreamerAccount("acc-creator-twitch-strikerluke47-sec", "Kick", "strikerluke47", "https://kick.com/strikerluke47", 1013299, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.strikerluke47@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/strikerluke47",
      lastChecked: daysAgo(2),
    },
  },
  // 345. Ayush Singh (Phoenix) (Kick)
  {
    id: "creator-kick-phoenixayush48",
    name: "Ayush Singh (Phoenix)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phoenixayush48-primary", "Kick", "phoenix_ayush48", "https://kick.com/phoenix_ayush48", 2266505, 5255, "avg_live_viewers", "Streams 4-6 days / week on Kick (5,255 avg live)"),
      createStreamerAccount("acc-creator-kick-phoenixayush48-sec", "Twitch", "phoenix_ayush48", "https://www.twitch.tv/phoenix_ayush48", 1019927, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phoenixayush48@streamerscout.net",
      sourceUrl: "https://kick.com/phoenix_ayush48",
      lastChecked: daysAgo(2),
    },
  },
  // 346. Anthony "Titan" Lee (Twitch)
  {
    id: "creator-twitch-titananthony49",
    name: "Anthony \"Titan\" Lee",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-titananthony49-primary", "Twitch", "titananthony49", "https://www.twitch.tv/titananthony49", 2281234, 5694, "avg_live_viewers", "Streams 4-6 days / week on Twitch (5,694 avg live)"),
      createStreamerAccount("acc-creator-twitch-titananthony49-sec", "Kick", "titananthony49", "https://kick.com/titananthony49", 1026555, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.titananthony49@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/titananthony49",
      lastChecked: daysAgo(2),
    },
  },
  // 347. Pranav Chatterjee (Zero) (Kick)
  {
    id: "creator-kick-zeropranav50",
    name: "Pranav Chatterjee (Zero)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-zeropranav50-primary", "Kick", "zero_pranav50", "https://kick.com/zero_pranav50", 2295963, 6133, "avg_live_viewers", "Streams 4-6 days / week on Kick (6,133 avg live)"),
      createStreamerAccount("acc-creator-kick-zeropranav50-sec", "Twitch", "zero_pranav50", "https://www.twitch.tv/zero_pranav50", 1033183, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zeropranav50@streamerscout.net",
      sourceUrl: "https://kick.com/zero_pranav50",
      lastChecked: daysAgo(2),
    },
  },
  // 348. Grayson "Ninja" Harris (Twitch)
  {
    id: "creator-twitch-ninjagrayson51",
    name: "Grayson \"Ninja\" Harris",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-ninjagrayson51-primary", "Twitch", "ninjagrayson51", "https://www.twitch.tv/ninjagrayson51", 2310692, 6572, "avg_live_viewers", "Streams 4-6 days / week on Twitch (6,572 avg live)"),
      createStreamerAccount("acc-creator-twitch-ninjagrayson51-sec", "Kick", "ninjagrayson51", "https://kick.com/ninjagrayson51", 1039811, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ninjagrayson51@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/ninjagrayson51",
      lastChecked: daysAgo(2),
    },
  },
  // 349. Dev Chopra (Ghost) (Kick)
  {
    id: "creator-kick-ghostdev52",
    name: "Dev Chopra (Ghost)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-ghostdev52-primary", "Kick", "ghost_dev52", "https://kick.com/ghost_dev52", 2325421, 7011, "avg_live_viewers", "Streams 4-6 days / week on Kick (7,011 avg live)"),
      createStreamerAccount("acc-creator-kick-ghostdev52-sec", "Twitch", "ghost_dev52", "https://www.twitch.tv/ghost_dev52", 1046439, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ghostdev52@streamerscout.net",
      sourceUrl: "https://kick.com/ghost_dev52",
      lastChecked: daysAgo(2),
    },
  },
  // 350. Leo "Alpha" Lewis (Twitch)
  {
    id: "creator-twitch-alphaleo53",
    name: "Leo \"Alpha\" Lewis",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-alphaleo53-primary", "Twitch", "alphaleo53", "https://www.twitch.tv/alphaleo53", 2340150, 7450, "avg_live_viewers", "Streams 4-6 days / week on Twitch (7,450 avg live)"),
      createStreamerAccount("acc-creator-twitch-alphaleo53-sec", "Kick", "alphaleo53", "https://kick.com/alphaleo53", 1053068, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.alphaleo53@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/alphaleo53",
      lastChecked: daysAgo(2),
    },
  },
  // 351. Shlok Rathore (Omega) (Kick)
  {
    id: "creator-kick-omegashlok54",
    name: "Shlok Rathore (Omega)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-omegashlok54-primary", "Kick", "omega_shlok54", "https://kick.com/omega_shlok54", 2354879, 7889, "avg_live_viewers", "Streams 4-6 days / week on Kick (7,889 avg live)"),
      createStreamerAccount("acc-creator-kick-omegashlok54-sec", "Twitch", "omega_shlok54", "https://www.twitch.tv/omega_shlok54", 1059696, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.omegashlok54@streamerscout.net",
      sourceUrl: "https://kick.com/omega_shlok54",
      lastChecked: daysAgo(2),
    },
  },
  // 352. Emma "Viper" Smith (Twitch)
  {
    id: "creator-twitch-viperemma55",
    name: "Emma \"Viper\" Smith",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-viperemma55-primary", "Twitch", "viperemma55", "https://www.twitch.tv/viperemma55", 2369608, 8328, "avg_live_viewers", "Streams 4-6 days / week on Twitch (8,328 avg live)"),
      createStreamerAccount("acc-creator-twitch-viperemma55-sec", "Kick", "viperemma55", "https://kick.com/viperemma55", 1066324, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.viperemma55@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/viperemma55",
      lastChecked: daysAgo(2),
    },
  },
  // 353. Kabir Singh (Phantom) (Kick)
  {
    id: "creator-kick-phantomkabir56",
    name: "Kabir Singh (Phantom)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phantomkabir56-primary", "Kick", "phantom_kabir56", "https://kick.com/phantom_kabir56", 2384337, 8767, "avg_live_viewers", "Streams 4-6 days / week on Kick (8,767 avg live)"),
      createStreamerAccount("acc-creator-kick-phantomkabir56-sec", "Twitch", "phantom_kabir56", "https://www.twitch.tv/phantom_kabir56", 1072952, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phantomkabir56@streamerscout.net",
      sourceUrl: "https://kick.com/phantom_kabir56",
      lastChecked: daysAgo(2),
    },
  },
  // 354. Ava "Shadow" Jones (Twitch)
  {
    id: "creator-twitch-shadowava57",
    name: "Ava \"Shadow\" Jones",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-shadowava57-primary", "Twitch", "shadowava57", "https://www.twitch.tv/shadowava57", 2399066, 9206, "avg_live_viewers", "Streams 4-6 days / week on Twitch (9,206 avg live)"),
      createStreamerAccount("acc-creator-twitch-shadowava57-sec", "Kick", "shadowava57", "https://kick.com/shadowava57", 1079580, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.shadowava57@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/shadowava57",
      lastChecked: daysAgo(2),
    },
  },
  // 355. Dhruv Chatterjee (Blaze) (Kick)
  {
    id: "creator-kick-blazedhruv58",
    name: "Dhruv Chatterjee (Blaze)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-blazedhruv58-primary", "Kick", "blaze_dhruv58", "https://kick.com/blaze_dhruv58", 2413795, 9645, "avg_live_viewers", "Streams 4-6 days / week on Kick (9,645 avg live)"),
      createStreamerAccount("acc-creator-kick-blazedhruv58-sec", "Twitch", "blaze_dhruv58", "https://www.twitch.tv/blaze_dhruv58", 1086208, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.blazedhruv58@streamerscout.net",
      sourceUrl: "https://kick.com/blaze_dhruv58",
      lastChecked: daysAgo(2),
    },
  },
  // 356. Isabella "Apex" Rodriguez (Twitch)
  {
    id: "creator-twitch-apexisabella59",
    name: "Isabella \"Apex\" Rodriguez",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-apexisabella59-primary", "Twitch", "apexisabella59", "https://www.twitch.tv/apexisabella59", 2428524, 10084, "avg_live_viewers", "Streams 4-6 days / week on Twitch (10,084 avg live)"),
      createStreamerAccount("acc-creator-twitch-apexisabella59-sec", "Kick", "apexisabella59", "https://kick.com/apexisabella59", 1092836, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.apexisabella59@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/apexisabella59",
      lastChecked: daysAgo(2),
    },
  },
  // 357. Atharv Chopra (Frost) (Kick)
  {
    id: "creator-kick-frostatharv60",
    name: "Atharv Chopra (Frost)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-frostatharv60-primary", "Kick", "frost_atharv60", "https://kick.com/frost_atharv60", 2443253, 10523, "avg_live_viewers", "Streams 4-6 days / week on Kick (10,523 avg live)"),
      createStreamerAccount("acc-creator-kick-frostatharv60-sec", "Twitch", "frost_atharv60", "https://www.twitch.tv/frost_atharv60", 1099464, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.frostatharv60@streamerscout.net",
      sourceUrl: "https://kick.com/frost_atharv60",
      lastChecked: daysAgo(2),
    },
  },
  // 358. Charlotte "Nova" Gonzalez (Twitch)
  {
    id: "creator-twitch-novacharlotte61",
    name: "Charlotte \"Nova\" Gonzalez",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-novacharlotte61-primary", "Twitch", "novacharlotte61", "https://www.twitch.tv/novacharlotte61", 2457982, 10962, "avg_live_viewers", "Streams 4-6 days / week on Twitch (10,962 avg live)"),
      createStreamerAccount("acc-creator-twitch-novacharlotte61-sec", "Kick", "novacharlotte61", "https://kick.com/novacharlotte61", 1106092, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.novacharlotte61@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/novacharlotte61",
      lastChecked: daysAgo(2),
    },
  },
  // 359. Ishaan Rathore (Cosmic) (Kick)
  {
    id: "creator-kick-cosmicishaan62",
    name: "Ishaan Rathore (Cosmic)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-cosmicishaan62-primary", "Kick", "cosmic_ishaan62", "https://kick.com/cosmic_ishaan62", 2472711, 11401, "avg_live_viewers", "Streams 4-6 days / week on Kick (11,401 avg live)"),
      createStreamerAccount("acc-creator-kick-cosmicishaan62-sec", "Twitch", "cosmic_ishaan62", "https://www.twitch.tv/cosmic_ishaan62", 1112720, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cosmicishaan62@streamerscout.net",
      sourceUrl: "https://kick.com/cosmic_ishaan62",
      lastChecked: daysAgo(2),
    },
  },
  // 360. Jack "Pulse" Taylor (Twitch)
  {
    id: "creator-twitch-pulsejack63",
    name: "Jack \"Pulse\" Taylor",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-pulsejack63-primary", "Twitch", "pulsejack63", "https://www.twitch.tv/pulsejack63", 2487440, 11840, "avg_live_viewers", "Streams 4-6 days / week on Twitch (11,840 avg live)"),
      createStreamerAccount("acc-creator-twitch-pulsejack63-sec", "Kick", "pulsejack63", "https://kick.com/pulsejack63", 1119348, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pulsejack63@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/pulsejack63",
      lastChecked: daysAgo(2),
    },
  },
  // 361. Arjun Singh (Storm) (Kick)
  {
    id: "creator-kick-stormarjun64",
    name: "Arjun Singh (Storm)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-stormarjun64-primary", "Kick", "storm_arjun64", "https://kick.com/storm_arjun64", 2502169, 12279, "avg_live_viewers", "Streams 4-6 days / week on Kick (12,279 avg live)"),
      createStreamerAccount("acc-creator-kick-stormarjun64-sec", "Twitch", "storm_arjun64", "https://www.twitch.tv/storm_arjun64", 1125976, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.stormarjun64@streamerscout.net",
      sourceUrl: "https://kick.com/storm_arjun64",
      lastChecked: daysAgo(2),
    },
  },
  // 362. Liam "Havoc" Lee (Twitch)
  {
    id: "creator-twitch-havocliam65",
    name: "Liam \"Havoc\" Lee",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-havocliam65-primary", "Twitch", "havocliam65", "https://www.twitch.tv/havocliam65", 2516898, 12718, "avg_live_viewers", "Streams 4-6 days / week on Twitch (12,718 avg live)"),
      createStreamerAccount("acc-creator-twitch-havocliam65-sec", "Kick", "havocliam65", "https://kick.com/havocliam65", 1132604, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.havocliam65@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/havocliam65",
      lastChecked: daysAgo(2),
    },
  },
  // 363. Diya Chatterjee (Reaper) (Kick)
  {
    id: "creator-kick-reaperdiya66",
    name: "Diya Chatterjee (Reaper)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-reaperdiya66-primary", "Kick", "reaper_diya66", "https://kick.com/reaper_diya66", 2531627, 13157, "avg_live_viewers", "Streams 4-6 days / week on Kick (13,157 avg live)"),
      createStreamerAccount("acc-creator-kick-reaperdiya66-sec", "Twitch", "reaper_diya66", "https://www.twitch.tv/reaper_diya66", 1139232, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.reaperdiya66@streamerscout.net",
      sourceUrl: "https://kick.com/reaper_diya66",
      lastChecked: daysAgo(2),
    },
  },
  // 364. Oliver "Zenith" Harris (Twitch)
  {
    id: "creator-twitch-zenitholiver67",
    name: "Oliver \"Zenith\" Harris",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-zenitholiver67-primary", "Twitch", "zenitholiver67", "https://www.twitch.tv/zenitholiver67", 2546356, 13596, "avg_live_viewers", "Streams 4-6 days / week on Twitch (13,596 avg live)"),
      createStreamerAccount("acc-creator-twitch-zenitholiver67-sec", "Kick", "zenitholiver67", "https://kick.com/zenitholiver67", 1145860, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zenitholiver67@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/zenitholiver67",
      lastChecked: daysAgo(2),
    },
  },
  // 365. Aadhya Chopra (Glitch) (Kick)
  {
    id: "creator-kick-glitchaadhya68",
    name: "Aadhya Chopra (Glitch)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-glitchaadhya68-primary", "Kick", "glitch_aadhya68", "https://kick.com/glitch_aadhya68", 2561085, 14035, "avg_live_viewers", "Streams 4-6 days / week on Kick (14,035 avg live)"),
      createStreamerAccount("acc-creator-kick-glitchaadhya68-sec", "Twitch", "glitch_aadhya68", "https://www.twitch.tv/glitch_aadhya68", 1152488, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.glitchaadhya68@streamerscout.net",
      sourceUrl: "https://kick.com/glitch_aadhya68",
      lastChecked: daysAgo(2),
    },
  },
  // 366. Ethan "Echo" Lewis (Twitch)
  {
    id: "creator-twitch-echoethan69",
    name: "Ethan \"Echo\" Lewis",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-echoethan69-primary", "Twitch", "echoethan69", "https://www.twitch.tv/echoethan69", 2575814, 14474, "avg_live_viewers", "Streams 4-6 days / week on Twitch (14,474 avg live)"),
      createStreamerAccount("acc-creator-twitch-echoethan69-sec", "Kick", "echoethan69", "https://kick.com/echoethan69", 1159116, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.echoethan69@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/echoethan69",
      lastChecked: daysAgo(2),
    },
  },
  // 367. Isha Rathore (Siren) (Kick)
  {
    id: "creator-kick-sirenisha70",
    name: "Isha Rathore (Siren)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-sirenisha70-primary", "Kick", "siren_isha70", "https://kick.com/siren_isha70", 2590543, 14913, "avg_live_viewers", "Streams 4-6 days / week on Kick (14,913 avg live)"),
      createStreamerAccount("acc-creator-kick-sirenisha70-sec", "Twitch", "siren_isha70", "https://www.twitch.tv/siren_isha70", 1165744, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.sirenisha70@streamerscout.net",
      sourceUrl: "https://kick.com/siren_isha70",
      lastChecked: daysAgo(2),
    },
  },
  // 368. Logan "Cyber" Smith (Twitch)
  {
    id: "creator-twitch-cyberlogan71",
    name: "Logan \"Cyber\" Smith",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-cyberlogan71-primary", "Twitch", "cyberlogan71", "https://www.twitch.tv/cyberlogan71", 2605272, 15352, "avg_live_viewers", "Streams 4-6 days / week on Twitch (15,352 avg live)"),
      createStreamerAccount("acc-creator-twitch-cyberlogan71-sec", "Kick", "cyberlogan71", "https://kick.com/cyberlogan71", 1172372, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cyberlogan71@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/cyberlogan71",
      lastChecked: daysAgo(2),
    },
  },
  // 369. Pooja Singh (Pixel) (Kick)
  {
    id: "creator-kick-pixelpooja72",
    name: "Pooja Singh (Pixel)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-pixelpooja72-primary", "Kick", "pixel_pooja72", "https://kick.com/pixel_pooja72", 2620001, 15791, "avg_live_viewers", "Streams 4-6 days / week on Kick (15,791 avg live)"),
      createStreamerAccount("acc-creator-kick-pixelpooja72-sec", "Twitch", "pixel_pooja72", "https://www.twitch.tv/pixel_pooja72", 1179000, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pixelpooja72@streamerscout.net",
      sourceUrl: "https://kick.com/pixel_pooja72",
      lastChecked: daysAgo(2),
    },
  },
  // 370. Benjamin "Quantum" Jones (Twitch)
  {
    id: "creator-twitch-quantumbenjamin73",
    name: "Benjamin \"Quantum\" Jones",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-quantumbenjamin73-primary", "Twitch", "quantumbenjamin73", "https://www.twitch.tv/quantumbenjamin73", 2634730, 16230, "avg_live_viewers", "Streams 4-6 days / week on Twitch (16,230 avg live)"),
      createStreamerAccount("acc-creator-twitch-quantumbenjamin73-sec", "Kick", "quantumbenjamin73", "https://kick.com/quantumbenjamin73", 1185629, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.quantumbenjamin73@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/quantumbenjamin73",
      lastChecked: daysAgo(2),
    },
  },
  // 371. Siddharth Chatterjee (Specter) (Kick)
  {
    id: "creator-kick-spectersiddharth74",
    name: "Siddharth Chatterjee (Specter)",
    category: "Gaming",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-spectersiddharth74-primary", "Kick", "specter_siddharth74", "https://kick.com/specter_siddharth74", 2649459, 16669, "avg_live_viewers", "Streams 4-6 days / week on Kick (16,669 avg live)"),
      createStreamerAccount("acc-creator-kick-spectersiddharth74-sec", "Twitch", "specter_siddharth74", "https://www.twitch.tv/specter_siddharth74", 1192257, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.spectersiddharth74@streamerscout.net",
      sourceUrl: "https://kick.com/specter_siddharth74",
      lastChecked: daysAgo(2),
    },
  },
  // 372. Sebastian "Raptor" Rodriguez (Twitch)
  {
    id: "creator-twitch-raptorsebastian75",
    name: "Sebastian \"Raptor\" Rodriguez",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-raptorsebastian75-primary", "Twitch", "raptorsebastian75", "https://www.twitch.tv/raptorsebastian75", 2664188, 17108, "avg_live_viewers", "Streams 4-6 days / week on Twitch (17,108 avg live)"),
      createStreamerAccount("acc-creator-twitch-raptorsebastian75-sec", "Kick", "raptorsebastian75", "https://kick.com/raptorsebastian75", 1198885, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.raptorsebastian75@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/raptorsebastian75",
      lastChecked: daysAgo(2),
    },
  },
  // 373. Karan Chopra (Venom) (Kick)
  {
    id: "creator-kick-venomkaran76",
    name: "Karan Chopra (Venom)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-venomkaran76-primary", "Kick", "venom_karan76", "https://kick.com/venom_karan76", 2678917, 17547, "avg_live_viewers", "Streams 4-6 days / week on Kick (17,547 avg live)"),
      createStreamerAccount("acc-creator-kick-venomkaran76-sec", "Twitch", "venom_karan76", "https://www.twitch.tv/venom_karan76", 1205513, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.venomkaran76@streamerscout.net",
      sourceUrl: "https://kick.com/venom_karan76",
      lastChecked: daysAgo(2),
    },
  },
  // 374. Aiden "Thunder" Gonzalez (Twitch)
  {
    id: "creator-twitch-thunderaiden77",
    name: "Aiden \"Thunder\" Gonzalez",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-thunderaiden77-primary", "Twitch", "thunderaiden77", "https://www.twitch.tv/thunderaiden77", 2693646, 17986, "avg_live_viewers", "Streams 4-6 days / week on Twitch (17,986 avg live)"),
      createStreamerAccount("acc-creator-twitch-thunderaiden77-sec", "Kick", "thunderaiden77", "https://kick.com/thunderaiden77", 1212141, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.thunderaiden77@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/thunderaiden77",
      lastChecked: daysAgo(2),
    },
  },
  // 375. Nikhil Rathore (Vortex) (Kick)
  {
    id: "creator-kick-vortexnikhil78",
    name: "Nikhil Rathore (Vortex)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-vortexnikhil78-primary", "Kick", "vortex_nikhil78", "https://kick.com/vortex_nikhil78", 2708375, 18425, "avg_live_viewers", "Streams 4-6 days / week on Kick (18,425 avg live)"),
      createStreamerAccount("acc-creator-kick-vortexnikhil78-sec", "Twitch", "vortex_nikhil78", "https://www.twitch.tv/vortex_nikhil78", 1218769, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.vortexnikhil78@streamerscout.net",
      sourceUrl: "https://kick.com/vortex_nikhil78",
      lastChecked: daysAgo(2),
    },
  },
  // 376. Samuel "Striker" Taylor (Twitch)
  {
    id: "creator-twitch-strikersamuel79",
    name: "Samuel \"Striker\" Taylor",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-strikersamuel79-primary", "Twitch", "strikersamuel79", "https://www.twitch.tv/strikersamuel79", 2723104, 18864, "avg_live_viewers", "Streams 4-6 days / week on Twitch (18,864 avg live)"),
      createStreamerAccount("acc-creator-twitch-strikersamuel79-sec", "Kick", "strikersamuel79", "https://kick.com/strikersamuel79", 1225397, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.strikersamuel79@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/strikersamuel79",
      lastChecked: daysAgo(2),
    },
  },
  // 377. Ayush Singh (Phoenix) (Kick)
  {
    id: "creator-kick-phoenixayush80",
    name: "Ayush Singh (Phoenix)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phoenixayush80-primary", "Kick", "phoenix_ayush80", "https://kick.com/phoenix_ayush80", 2737833, 19303, "avg_live_viewers", "Streams 4-6 days / week on Kick (19,303 avg live)"),
      createStreamerAccount("acc-creator-kick-phoenixayush80-sec", "Twitch", "phoenix_ayush80", "https://www.twitch.tv/phoenix_ayush80", 1232025, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phoenixayush80@streamerscout.net",
      sourceUrl: "https://kick.com/phoenix_ayush80",
      lastChecked: daysAgo(2),
    },
  },
  // 378. Joseph "Titan" Lee (Twitch)
  {
    id: "creator-twitch-titanjoseph81",
    name: "Joseph \"Titan\" Lee",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-titanjoseph81-primary", "Twitch", "titanjoseph81", "https://www.twitch.tv/titanjoseph81", 2752562, 19742, "avg_live_viewers", "Streams 4-6 days / week on Twitch (19,742 avg live)"),
      createStreamerAccount("acc-creator-twitch-titanjoseph81-sec", "Kick", "titanjoseph81", "https://kick.com/titanjoseph81", 1238653, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.titanjoseph81@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/titanjoseph81",
      lastChecked: daysAgo(2),
    },
  },
  // 379. Pranav Chatterjee (Zero) (Kick)
  {
    id: "creator-kick-zeropranav82",
    name: "Pranav Chatterjee (Zero)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-zeropranav82-primary", "Kick", "zero_pranav82", "https://kick.com/zero_pranav82", 2767291, 20181, "avg_live_viewers", "Streams 4-6 days / week on Kick (20,181 avg live)"),
      createStreamerAccount("acc-creator-kick-zeropranav82-sec", "Twitch", "zero_pranav82", "https://www.twitch.tv/zero_pranav82", 1245281, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zeropranav82@streamerscout.net",
      sourceUrl: "https://kick.com/zero_pranav82",
      lastChecked: daysAgo(2),
    },
  },
  // 380. Owen "Ninja" Harris (Twitch)
  {
    id: "creator-twitch-ninjaowen83",
    name: "Owen \"Ninja\" Harris",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-ninjaowen83-primary", "Twitch", "ninjaowen83", "https://www.twitch.tv/ninjaowen83", 2782020, 20620, "avg_live_viewers", "Streams 4-6 days / week on Twitch (20,620 avg live)"),
      createStreamerAccount("acc-creator-twitch-ninjaowen83-sec", "Kick", "ninjaowen83", "https://kick.com/ninjaowen83", 1251909, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ninjaowen83@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/ninjaowen83",
      lastChecked: daysAgo(2),
    },
  },
  // 381. Dev Chopra (Ghost) (Kick)
  {
    id: "creator-kick-ghostdev84",
    name: "Dev Chopra (Ghost)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-ghostdev84-primary", "Kick", "ghost_dev84", "https://kick.com/ghost_dev84", 2796749, 21059, "avg_live_viewers", "Streams 4-6 days / week on Kick (21,059 avg live)"),
      createStreamerAccount("acc-creator-kick-ghostdev84-sec", "Twitch", "ghost_dev84", "https://www.twitch.tv/ghost_dev84", 1258537, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ghostdev84@streamerscout.net",
      sourceUrl: "https://kick.com/ghost_dev84",
      lastChecked: daysAgo(2),
    },
  },
  // 382. John "Alpha" Lewis (Twitch)
  {
    id: "creator-twitch-alphajohn85",
    name: "John \"Alpha\" Lewis",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-alphajohn85-primary", "Twitch", "alphajohn85", "https://www.twitch.tv/alphajohn85", 2811478, 21498, "avg_live_viewers", "Streams 4-6 days / week on Twitch (21,498 avg live)"),
      createStreamerAccount("acc-creator-twitch-alphajohn85-sec", "Kick", "alphajohn85", "https://kick.com/alphajohn85", 1265165, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.alphajohn85@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/alphajohn85",
      lastChecked: daysAgo(2),
    },
  },
  // 383. Shlok Rathore (Omega) (Kick)
  {
    id: "creator-kick-omegashlok86",
    name: "Shlok Rathore (Omega)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-omegashlok86-primary", "Kick", "omega_shlok86", "https://kick.com/omega_shlok86", 2826207, 21937, "avg_live_viewers", "Streams 4-6 days / week on Kick (21,937 avg live)"),
      createStreamerAccount("acc-creator-kick-omegashlok86-sec", "Twitch", "omega_shlok86", "https://www.twitch.tv/omega_shlok86", 1271793, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.omegashlok86@streamerscout.net",
      sourceUrl: "https://kick.com/omega_shlok86",
      lastChecked: daysAgo(2),
    },
  },
  // 384. Luke "Viper" Smith (Twitch)
  {
    id: "creator-twitch-viperluke87",
    name: "Luke \"Viper\" Smith",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-viperluke87-primary", "Twitch", "viperluke87", "https://www.twitch.tv/viperluke87", 2840936, 22376, "avg_live_viewers", "Streams 4-6 days / week on Twitch (22,376 avg live)"),
      createStreamerAccount("acc-creator-twitch-viperluke87-sec", "Kick", "viperluke87", "https://kick.com/viperluke87", 1278421, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.viperluke87@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/viperluke87",
      lastChecked: daysAgo(2),
    },
  },
  // 385. Kabir Singh (Phantom) (Kick)
  {
    id: "creator-kick-phantomkabir88",
    name: "Kabir Singh (Phantom)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phantomkabir88-primary", "Kick", "phantom_kabir88", "https://kick.com/phantom_kabir88", 2855665, 22815, "avg_live_viewers", "Streams 4-6 days / week on Kick (22,815 avg live)"),
      createStreamerAccount("acc-creator-kick-phantomkabir88-sec", "Twitch", "phantom_kabir88", "https://www.twitch.tv/phantom_kabir88", 1285049, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phantomkabir88@streamerscout.net",
      sourceUrl: "https://kick.com/phantom_kabir88",
      lastChecked: daysAgo(2),
    },
  },
  // 386. Anthony "Shadow" Jones (Twitch)
  {
    id: "creator-twitch-shadowanthony89",
    name: "Anthony \"Shadow\" Jones",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-shadowanthony89-primary", "Twitch", "shadowanthony89", "https://www.twitch.tv/shadowanthony89", 2870394, 23254, "avg_live_viewers", "Streams 4-6 days / week on Twitch (23,254 avg live)"),
      createStreamerAccount("acc-creator-twitch-shadowanthony89-sec", "Kick", "shadowanthony89", "https://kick.com/shadowanthony89", 1291677, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.shadowanthony89@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/shadowanthony89",
      lastChecked: daysAgo(2),
    },
  },
  // 387. Dhruv Chatterjee (Blaze) (Kick)
  {
    id: "creator-kick-blazedhruv90",
    name: "Dhruv Chatterjee (Blaze)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-blazedhruv90-primary", "Kick", "blaze_dhruv90", "https://kick.com/blaze_dhruv90", 35123, 23693, "avg_live_viewers", "Streams 4-6 days / week on Kick (23,693 avg live)"),
      createStreamerAccount("acc-creator-kick-blazedhruv90-sec", "Twitch", "blaze_dhruv90", "https://www.twitch.tv/blaze_dhruv90", 15805, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.blazedhruv90@streamerscout.net",
      sourceUrl: "https://kick.com/blaze_dhruv90",
      lastChecked: daysAgo(2),
    },
  },
  // 388. Grayson "Apex" Rodriguez (Twitch)
  {
    id: "creator-twitch-apexgrayson91",
    name: "Grayson \"Apex\" Rodriguez",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-apexgrayson91-primary", "Twitch", "apexgrayson91", "https://www.twitch.tv/apexgrayson91", 49852, 24132, "avg_live_viewers", "Streams 4-6 days / week on Twitch (24,132 avg live)"),
      createStreamerAccount("acc-creator-twitch-apexgrayson91-sec", "Kick", "apexgrayson91", "https://kick.com/apexgrayson91", 22433, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.apexgrayson91@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/apexgrayson91",
      lastChecked: daysAgo(2),
    },
  },
  // 389. Atharv Chopra (Frost) (Kick)
  {
    id: "creator-kick-frostatharv92",
    name: "Atharv Chopra (Frost)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-frostatharv92-primary", "Kick", "frost_atharv92", "https://kick.com/frost_atharv92", 64581, 24571, "avg_live_viewers", "Streams 4-6 days / week on Kick (24,571 avg live)"),
      createStreamerAccount("acc-creator-kick-frostatharv92-sec", "Twitch", "frost_atharv92", "https://www.twitch.tv/frost_atharv92", 29061, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.frostatharv92@streamerscout.net",
      sourceUrl: "https://kick.com/frost_atharv92",
      lastChecked: daysAgo(2),
    },
  },
  // 390. Leo "Nova" Gonzalez (Twitch)
  {
    id: "creator-twitch-novaleo93",
    name: "Leo \"Nova\" Gonzalez",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-novaleo93-primary", "Twitch", "novaleo93", "https://www.twitch.tv/novaleo93", 79310, 25010, "avg_live_viewers", "Streams 4-6 days / week on Twitch (25,010 avg live)"),
      createStreamerAccount("acc-creator-twitch-novaleo93-sec", "Kick", "novaleo93", "https://kick.com/novaleo93", 35690, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.novaleo93@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/novaleo93",
      lastChecked: daysAgo(2),
    },
  },
  // 391. Ishaan Rathore (Cosmic) (Kick)
  {
    id: "creator-kick-cosmicishaan94",
    name: "Ishaan Rathore (Cosmic)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-cosmicishaan94-primary", "Kick", "cosmic_ishaan94", "https://kick.com/cosmic_ishaan94", 94039, 949, "avg_live_viewers", "Streams 4-6 days / week on Kick (949 avg live)"),
      createStreamerAccount("acc-creator-kick-cosmicishaan94-sec", "Twitch", "cosmic_ishaan94", "https://www.twitch.tv/cosmic_ishaan94", 42318, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cosmicishaan94@streamerscout.net",
      sourceUrl: "https://kick.com/cosmic_ishaan94",
      lastChecked: daysAgo(2),
    },
  },
  // 392. Emma "Pulse" Taylor (Twitch)
  {
    id: "creator-twitch-pulseemma95",
    name: "Emma \"Pulse\" Taylor",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-pulseemma95-primary", "Twitch", "pulseemma95", "https://www.twitch.tv/pulseemma95", 108768, 1388, "avg_live_viewers", "Streams 4-6 days / week on Twitch (1,388 avg live)"),
      createStreamerAccount("acc-creator-twitch-pulseemma95-sec", "Kick", "pulseemma95", "https://kick.com/pulseemma95", 48946, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pulseemma95@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/pulseemma95",
      lastChecked: daysAgo(2),
    },
  },
  // 393. Arjun Singh (Storm) (Kick)
  {
    id: "creator-kick-stormarjun96",
    name: "Arjun Singh (Storm)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-stormarjun96-primary", "Kick", "storm_arjun96", "https://kick.com/storm_arjun96", 123497, 1827, "avg_live_viewers", "Streams 4-6 days / week on Kick (1,827 avg live)"),
      createStreamerAccount("acc-creator-kick-stormarjun96-sec", "Twitch", "storm_arjun96", "https://www.twitch.tv/storm_arjun96", 55574, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.stormarjun96@streamerscout.net",
      sourceUrl: "https://kick.com/storm_arjun96",
      lastChecked: daysAgo(2),
    },
  },
  // 394. Ava "Havoc" Lee (Twitch)
  {
    id: "creator-twitch-havocava97",
    name: "Ava \"Havoc\" Lee",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-havocava97-primary", "Twitch", "havocava97", "https://www.twitch.tv/havocava97", 138226, 2266, "avg_live_viewers", "Streams 4-6 days / week on Twitch (2,266 avg live)"),
      createStreamerAccount("acc-creator-twitch-havocava97-sec", "Kick", "havocava97", "https://kick.com/havocava97", 62202, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.havocava97@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/havocava97",
      lastChecked: daysAgo(2),
    },
  },
  // 395. Diya Chatterjee (Reaper) (Kick)
  {
    id: "creator-kick-reaperdiya98",
    name: "Diya Chatterjee (Reaper)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-reaperdiya98-primary", "Kick", "reaper_diya98", "https://kick.com/reaper_diya98", 152955, 2705, "avg_live_viewers", "Streams 4-6 days / week on Kick (2,705 avg live)"),
      createStreamerAccount("acc-creator-kick-reaperdiya98-sec", "Twitch", "reaper_diya98", "https://www.twitch.tv/reaper_diya98", 68830, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.reaperdiya98@streamerscout.net",
      sourceUrl: "https://kick.com/reaper_diya98",
      lastChecked: daysAgo(2),
    },
  },
  // 396. Isabella "Zenith" Harris (Twitch)
  {
    id: "creator-twitch-zenithisabella0",
    name: "Isabella \"Zenith\" Harris",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-zenithisabella0-primary", "Twitch", "zenithisabella0", "https://www.twitch.tv/zenithisabella0", 167684, 3144, "avg_live_viewers", "Streams 4-6 days / week on Twitch (3,144 avg live)"),
      createStreamerAccount("acc-creator-twitch-zenithisabella0-sec", "Kick", "zenithisabella0", "https://kick.com/zenithisabella0", 75458, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zenithisabella0@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/zenithisabella0",
      lastChecked: daysAgo(2),
    },
  },
  // 397. Aadhya Chopra (Glitch) (Kick)
  {
    id: "creator-kick-glitchaadhya1",
    name: "Aadhya Chopra (Glitch)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-glitchaadhya1-primary", "Kick", "glitch_aadhya1", "https://kick.com/glitch_aadhya1", 182413, 3583, "avg_live_viewers", "Streams 4-6 days / week on Kick (3,583 avg live)"),
      createStreamerAccount("acc-creator-kick-glitchaadhya1-sec", "Twitch", "glitch_aadhya1", "https://www.twitch.tv/glitch_aadhya1", 82086, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.glitchaadhya1@streamerscout.net",
      sourceUrl: "https://kick.com/glitch_aadhya1",
      lastChecked: daysAgo(2),
    },
  },
  // 398. Charlotte "Echo" Lewis (Twitch)
  {
    id: "creator-twitch-echocharlotte2",
    name: "Charlotte \"Echo\" Lewis",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-echocharlotte2-primary", "Twitch", "echocharlotte2", "https://www.twitch.tv/echocharlotte2", 197142, 4022, "avg_live_viewers", "Streams 4-6 days / week on Twitch (4,022 avg live)"),
      createStreamerAccount("acc-creator-twitch-echocharlotte2-sec", "Kick", "echocharlotte2", "https://kick.com/echocharlotte2", 88714, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.echocharlotte2@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/echocharlotte2",
      lastChecked: daysAgo(2),
    },
  },
  // 399. Isha Rathore (Siren) (Kick)
  {
    id: "creator-kick-sirenisha3",
    name: "Isha Rathore (Siren)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-sirenisha3-primary", "Kick", "siren_isha3", "https://kick.com/siren_isha3", 211871, 4461, "avg_live_viewers", "Streams 4-6 days / week on Kick (4,461 avg live)"),
      createStreamerAccount("acc-creator-kick-sirenisha3-sec", "Twitch", "siren_isha3", "https://www.twitch.tv/siren_isha3", 95342, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.sirenisha3@streamerscout.net",
      sourceUrl: "https://kick.com/siren_isha3",
      lastChecked: daysAgo(2),
    },
  },
  // 400. Jack "Cyber" Smith (Twitch)
  {
    id: "creator-twitch-cyberjack4",
    name: "Jack \"Cyber\" Smith",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-cyberjack4-primary", "Twitch", "cyberjack4", "https://www.twitch.tv/cyberjack4", 226600, 4900, "avg_live_viewers", "Streams 4-6 days / week on Twitch (4,900 avg live)"),
      createStreamerAccount("acc-creator-twitch-cyberjack4-sec", "Kick", "cyberjack4", "https://kick.com/cyberjack4", 101970, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cyberjack4@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/cyberjack4",
      lastChecked: daysAgo(2),
    },
  },
  // 401. Pooja Singh (Pixel) (Kick)
  {
    id: "creator-kick-pixelpooja5",
    name: "Pooja Singh (Pixel)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-pixelpooja5-primary", "Kick", "pixel_pooja5", "https://kick.com/pixel_pooja5", 241329, 5339, "avg_live_viewers", "Streams 4-6 days / week on Kick (5,339 avg live)"),
      createStreamerAccount("acc-creator-kick-pixelpooja5-sec", "Twitch", "pixel_pooja5", "https://www.twitch.tv/pixel_pooja5", 108598, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pixelpooja5@streamerscout.net",
      sourceUrl: "https://kick.com/pixel_pooja5",
      lastChecked: daysAgo(2),
    },
  },
  // 402. Liam "Quantum" Jones (Twitch)
  {
    id: "creator-twitch-quantumliam6",
    name: "Liam \"Quantum\" Jones",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-quantumliam6-primary", "Twitch", "quantumliam6", "https://www.twitch.tv/quantumliam6", 256058, 5778, "avg_live_viewers", "Streams 4-6 days / week on Twitch (5,778 avg live)"),
      createStreamerAccount("acc-creator-twitch-quantumliam6-sec", "Kick", "quantumliam6", "https://kick.com/quantumliam6", 115226, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.quantumliam6@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/quantumliam6",
      lastChecked: daysAgo(2),
    },
  },
  // 403. Siddharth Chatterjee (Specter) (Kick)
  {
    id: "creator-kick-spectersiddharth7",
    name: "Siddharth Chatterjee (Specter)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-spectersiddharth7-primary", "Kick", "specter_siddharth7", "https://kick.com/specter_siddharth7", 270787, 6217, "avg_live_viewers", "Streams 4-6 days / week on Kick (6,217 avg live)"),
      createStreamerAccount("acc-creator-kick-spectersiddharth7-sec", "Twitch", "specter_siddharth7", "https://www.twitch.tv/specter_siddharth7", 121854, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.spectersiddharth7@streamerscout.net",
      sourceUrl: "https://kick.com/specter_siddharth7",
      lastChecked: daysAgo(2),
    },
  },
  // 404. Oliver "Raptor" Rodriguez (Twitch)
  {
    id: "creator-twitch-raptoroliver8",
    name: "Oliver \"Raptor\" Rodriguez",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-raptoroliver8-primary", "Twitch", "raptoroliver8", "https://www.twitch.tv/raptoroliver8", 285516, 6656, "avg_live_viewers", "Streams 4-6 days / week on Twitch (6,656 avg live)"),
      createStreamerAccount("acc-creator-twitch-raptoroliver8-sec", "Kick", "raptoroliver8", "https://kick.com/raptoroliver8", 128482, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.raptoroliver8@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/raptoroliver8",
      lastChecked: daysAgo(2),
    },
  },
  // 405. Karan Chopra (Venom) (Kick)
  {
    id: "creator-kick-venomkaran9",
    name: "Karan Chopra (Venom)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-venomkaran9-primary", "Kick", "venom_karan9", "https://kick.com/venom_karan9", 300245, 7095, "avg_live_viewers", "Streams 4-6 days / week on Kick (7,095 avg live)"),
      createStreamerAccount("acc-creator-kick-venomkaran9-sec", "Twitch", "venom_karan9", "https://www.twitch.tv/venom_karan9", 135110, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.venomkaran9@streamerscout.net",
      sourceUrl: "https://kick.com/venom_karan9",
      lastChecked: daysAgo(2),
    },
  },
  // 406. Ethan "Thunder" Gonzalez (Twitch)
  {
    id: "creator-twitch-thunderethan10",
    name: "Ethan \"Thunder\" Gonzalez",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-thunderethan10-primary", "Twitch", "thunderethan10", "https://www.twitch.tv/thunderethan10", 314974, 7534, "avg_live_viewers", "Streams 4-6 days / week on Twitch (7,534 avg live)"),
      createStreamerAccount("acc-creator-twitch-thunderethan10-sec", "Kick", "thunderethan10", "https://kick.com/thunderethan10", 141738, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.thunderethan10@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/thunderethan10",
      lastChecked: daysAgo(2),
    },
  },
  // 407. Nikhil Rathore (Vortex) (Kick)
  {
    id: "creator-kick-vortexnikhil11",
    name: "Nikhil Rathore (Vortex)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-vortexnikhil11-primary", "Kick", "vortex_nikhil11", "https://kick.com/vortex_nikhil11", 329703, 7973, "avg_live_viewers", "Streams 4-6 days / week on Kick (7,973 avg live)"),
      createStreamerAccount("acc-creator-kick-vortexnikhil11-sec", "Twitch", "vortex_nikhil11", "https://www.twitch.tv/vortex_nikhil11", 148366, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.vortexnikhil11@streamerscout.net",
      sourceUrl: "https://kick.com/vortex_nikhil11",
      lastChecked: daysAgo(2),
    },
  },
  // 408. Logan "Striker" Taylor (Twitch)
  {
    id: "creator-twitch-strikerlogan12",
    name: "Logan \"Striker\" Taylor",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-strikerlogan12-primary", "Twitch", "strikerlogan12", "https://www.twitch.tv/strikerlogan12", 344432, 8412, "avg_live_viewers", "Streams 4-6 days / week on Twitch (8,412 avg live)"),
      createStreamerAccount("acc-creator-twitch-strikerlogan12-sec", "Kick", "strikerlogan12", "https://kick.com/strikerlogan12", 154994, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.strikerlogan12@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/strikerlogan12",
      lastChecked: daysAgo(2),
    },
  },
  // 409. Ayush Singh (Phoenix) (Kick)
  {
    id: "creator-kick-phoenixayush13",
    name: "Ayush Singh (Phoenix)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phoenixayush13-primary", "Kick", "phoenix_ayush13", "https://kick.com/phoenix_ayush13", 359161, 8851, "avg_live_viewers", "Streams 4-6 days / week on Kick (8,851 avg live)"),
      createStreamerAccount("acc-creator-kick-phoenixayush13-sec", "Twitch", "phoenix_ayush13", "https://www.twitch.tv/phoenix_ayush13", 161622, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phoenixayush13@streamerscout.net",
      sourceUrl: "https://kick.com/phoenix_ayush13",
      lastChecked: daysAgo(2),
    },
  },
  // 410. Benjamin "Titan" Lee (Twitch)
  {
    id: "creator-twitch-titanbenjamin14",
    name: "Benjamin \"Titan\" Lee",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-titanbenjamin14-primary", "Twitch", "titanbenjamin14", "https://www.twitch.tv/titanbenjamin14", 373890, 9290, "avg_live_viewers", "Streams 4-6 days / week on Twitch (9,290 avg live)"),
      createStreamerAccount("acc-creator-twitch-titanbenjamin14-sec", "Kick", "titanbenjamin14", "https://kick.com/titanbenjamin14", 168251, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.titanbenjamin14@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/titanbenjamin14",
      lastChecked: daysAgo(2),
    },
  },
  // 411. Pranav Chatterjee (Zero) (Kick)
  {
    id: "creator-kick-zeropranav15",
    name: "Pranav Chatterjee (Zero)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-zeropranav15-primary", "Kick", "zero_pranav15", "https://kick.com/zero_pranav15", 388619, 9729, "avg_live_viewers", "Streams 4-6 days / week on Kick (9,729 avg live)"),
      createStreamerAccount("acc-creator-kick-zeropranav15-sec", "Twitch", "zero_pranav15", "https://www.twitch.tv/zero_pranav15", 174879, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zeropranav15@streamerscout.net",
      sourceUrl: "https://kick.com/zero_pranav15",
      lastChecked: daysAgo(2),
    },
  },
  // 412. Sebastian "Ninja" Harris (Twitch)
  {
    id: "creator-twitch-ninjasebastian16",
    name: "Sebastian \"Ninja\" Harris",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-ninjasebastian16-primary", "Twitch", "ninjasebastian16", "https://www.twitch.tv/ninjasebastian16", 403348, 10168, "avg_live_viewers", "Streams 4-6 days / week on Twitch (10,168 avg live)"),
      createStreamerAccount("acc-creator-twitch-ninjasebastian16-sec", "Kick", "ninjasebastian16", "https://kick.com/ninjasebastian16", 181507, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ninjasebastian16@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/ninjasebastian16",
      lastChecked: daysAgo(2),
    },
  },
  // 413. Dev Chopra (Ghost) (Kick)
  {
    id: "creator-kick-ghostdev17",
    name: "Dev Chopra (Ghost)",
    category: "Gaming",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-ghostdev17-primary", "Kick", "ghost_dev17", "https://kick.com/ghost_dev17", 418077, 10607, "avg_live_viewers", "Streams 4-6 days / week on Kick (10,607 avg live)"),
      createStreamerAccount("acc-creator-kick-ghostdev17-sec", "Twitch", "ghost_dev17", "https://www.twitch.tv/ghost_dev17", 188135, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ghostdev17@streamerscout.net",
      sourceUrl: "https://kick.com/ghost_dev17",
      lastChecked: daysAgo(2),
    },
  },
  // 414. Aiden "Alpha" Lewis (Twitch)
  {
    id: "creator-twitch-alphaaiden18",
    name: "Aiden \"Alpha\" Lewis",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-alphaaiden18-primary", "Twitch", "alphaaiden18", "https://www.twitch.tv/alphaaiden18", 432806, 11046, "avg_live_viewers", "Streams 4-6 days / week on Twitch (11,046 avg live)"),
      createStreamerAccount("acc-creator-twitch-alphaaiden18-sec", "Kick", "alphaaiden18", "https://kick.com/alphaaiden18", 194763, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.alphaaiden18@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/alphaaiden18",
      lastChecked: daysAgo(2),
    },
  },
  // 415. Shlok Rathore (Omega) (Kick)
  {
    id: "creator-kick-omegashlok19",
    name: "Shlok Rathore (Omega)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-omegashlok19-primary", "Kick", "omega_shlok19", "https://kick.com/omega_shlok19", 447535, 11485, "avg_live_viewers", "Streams 4-6 days / week on Kick (11,485 avg live)"),
      createStreamerAccount("acc-creator-kick-omegashlok19-sec", "Twitch", "omega_shlok19", "https://www.twitch.tv/omega_shlok19", 201391, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.omegashlok19@streamerscout.net",
      sourceUrl: "https://kick.com/omega_shlok19",
      lastChecked: daysAgo(2),
    },
  },
  // 416. Samuel "Viper" Smith (Twitch)
  {
    id: "creator-twitch-vipersamuel20",
    name: "Samuel \"Viper\" Smith",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-vipersamuel20-primary", "Twitch", "vipersamuel20", "https://www.twitch.tv/vipersamuel20", 462264, 11924, "avg_live_viewers", "Streams 4-6 days / week on Twitch (11,924 avg live)"),
      createStreamerAccount("acc-creator-twitch-vipersamuel20-sec", "Kick", "vipersamuel20", "https://kick.com/vipersamuel20", 208019, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.vipersamuel20@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/vipersamuel20",
      lastChecked: daysAgo(2),
    },
  },
  // 417. Kabir Singh (Phantom) (Kick)
  {
    id: "creator-kick-phantomkabir21",
    name: "Kabir Singh (Phantom)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phantomkabir21-primary", "Kick", "phantom_kabir21", "https://kick.com/phantom_kabir21", 476993, 12363, "avg_live_viewers", "Streams 4-6 days / week on Kick (12,363 avg live)"),
      createStreamerAccount("acc-creator-kick-phantomkabir21-sec", "Twitch", "phantom_kabir21", "https://www.twitch.tv/phantom_kabir21", 214647, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phantomkabir21@streamerscout.net",
      sourceUrl: "https://kick.com/phantom_kabir21",
      lastChecked: daysAgo(2),
    },
  },
  // 418. Joseph "Shadow" Jones (Twitch)
  {
    id: "creator-twitch-shadowjoseph22",
    name: "Joseph \"Shadow\" Jones",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-shadowjoseph22-primary", "Twitch", "shadowjoseph22", "https://www.twitch.tv/shadowjoseph22", 491722, 12802, "avg_live_viewers", "Streams 4-6 days / week on Twitch (12,802 avg live)"),
      createStreamerAccount("acc-creator-twitch-shadowjoseph22-sec", "Kick", "shadowjoseph22", "https://kick.com/shadowjoseph22", 221275, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.shadowjoseph22@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/shadowjoseph22",
      lastChecked: daysAgo(2),
    },
  },
  // 419. Dhruv Chatterjee (Blaze) (Kick)
  {
    id: "creator-kick-blazedhruv23",
    name: "Dhruv Chatterjee (Blaze)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-blazedhruv23-primary", "Kick", "blaze_dhruv23", "https://kick.com/blaze_dhruv23", 506451, 13241, "avg_live_viewers", "Streams 4-6 days / week on Kick (13,241 avg live)"),
      createStreamerAccount("acc-creator-kick-blazedhruv23-sec", "Twitch", "blaze_dhruv23", "https://www.twitch.tv/blaze_dhruv23", 227903, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.blazedhruv23@streamerscout.net",
      sourceUrl: "https://kick.com/blaze_dhruv23",
      lastChecked: daysAgo(2),
    },
  },
  // 420. Owen "Apex" Rodriguez (Twitch)
  {
    id: "creator-twitch-apexowen24",
    name: "Owen \"Apex\" Rodriguez",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-apexowen24-primary", "Twitch", "apexowen24", "https://www.twitch.tv/apexowen24", 521180, 13680, "avg_live_viewers", "Streams 4-6 days / week on Twitch (13,680 avg live)"),
      createStreamerAccount("acc-creator-twitch-apexowen24-sec", "Kick", "apexowen24", "https://kick.com/apexowen24", 234531, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.apexowen24@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/apexowen24",
      lastChecked: daysAgo(2),
    },
  },
  // 421. Atharv Chopra (Frost) (Kick)
  {
    id: "creator-kick-frostatharv25",
    name: "Atharv Chopra (Frost)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-frostatharv25-primary", "Kick", "frost_atharv25", "https://kick.com/frost_atharv25", 535909, 14119, "avg_live_viewers", "Streams 4-6 days / week on Kick (14,119 avg live)"),
      createStreamerAccount("acc-creator-kick-frostatharv25-sec", "Twitch", "frost_atharv25", "https://www.twitch.tv/frost_atharv25", 241159, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.frostatharv25@streamerscout.net",
      sourceUrl: "https://kick.com/frost_atharv25",
      lastChecked: daysAgo(2),
    },
  },
  // 422. John "Nova" Gonzalez (Twitch)
  {
    id: "creator-twitch-novajohn26",
    name: "John \"Nova\" Gonzalez",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-novajohn26-primary", "Twitch", "novajohn26", "https://www.twitch.tv/novajohn26", 550638, 14558, "avg_live_viewers", "Streams 4-6 days / week on Twitch (14,558 avg live)"),
      createStreamerAccount("acc-creator-twitch-novajohn26-sec", "Kick", "novajohn26", "https://kick.com/novajohn26", 247787, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.novajohn26@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/novajohn26",
      lastChecked: daysAgo(2),
    },
  },
  // 423. Ishaan Rathore (Cosmic) (Kick)
  {
    id: "creator-kick-cosmicishaan27",
    name: "Ishaan Rathore (Cosmic)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-cosmicishaan27-primary", "Kick", "cosmic_ishaan27", "https://kick.com/cosmic_ishaan27", 565367, 14997, "avg_live_viewers", "Streams 4-6 days / week on Kick (14,997 avg live)"),
      createStreamerAccount("acc-creator-kick-cosmicishaan27-sec", "Twitch", "cosmic_ishaan27", "https://www.twitch.tv/cosmic_ishaan27", 254415, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cosmicishaan27@streamerscout.net",
      sourceUrl: "https://kick.com/cosmic_ishaan27",
      lastChecked: daysAgo(2),
    },
  },
  // 424. Luke "Pulse" Taylor (Twitch)
  {
    id: "creator-twitch-pulseluke28",
    name: "Luke \"Pulse\" Taylor",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-pulseluke28-primary", "Twitch", "pulseluke28", "https://www.twitch.tv/pulseluke28", 580096, 15436, "avg_live_viewers", "Streams 4-6 days / week on Twitch (15,436 avg live)"),
      createStreamerAccount("acc-creator-twitch-pulseluke28-sec", "Kick", "pulseluke28", "https://kick.com/pulseluke28", 261043, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pulseluke28@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/pulseluke28",
      lastChecked: daysAgo(2),
    },
  },
  // 425. Arjun Singh (Storm) (Kick)
  {
    id: "creator-kick-stormarjun29",
    name: "Arjun Singh (Storm)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-stormarjun29-primary", "Kick", "storm_arjun29", "https://kick.com/storm_arjun29", 594825, 15875, "avg_live_viewers", "Streams 4-6 days / week on Kick (15,875 avg live)"),
      createStreamerAccount("acc-creator-kick-stormarjun29-sec", "Twitch", "storm_arjun29", "https://www.twitch.tv/storm_arjun29", 267671, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.stormarjun29@streamerscout.net",
      sourceUrl: "https://kick.com/storm_arjun29",
      lastChecked: daysAgo(2),
    },
  },
  // 426. Anthony "Havoc" Lee (Twitch)
  {
    id: "creator-twitch-havocanthony30",
    name: "Anthony \"Havoc\" Lee",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-havocanthony30-primary", "Twitch", "havocanthony30", "https://www.twitch.tv/havocanthony30", 609554, 16314, "avg_live_viewers", "Streams 4-6 days / week on Twitch (16,314 avg live)"),
      createStreamerAccount("acc-creator-twitch-havocanthony30-sec", "Kick", "havocanthony30", "https://kick.com/havocanthony30", 274299, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.havocanthony30@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/havocanthony30",
      lastChecked: daysAgo(2),
    },
  },
  // 427. Diya Chatterjee (Reaper) (Kick)
  {
    id: "creator-kick-reaperdiya31",
    name: "Diya Chatterjee (Reaper)",
    category: "Gaming",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-reaperdiya31-primary", "Kick", "reaper_diya31", "https://kick.com/reaper_diya31", 624283, 16753, "avg_live_viewers", "Streams 4-6 days / week on Kick (16,753 avg live)"),
      createStreamerAccount("acc-creator-kick-reaperdiya31-sec", "Twitch", "reaper_diya31", "https://www.twitch.tv/reaper_diya31", 280927, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.reaperdiya31@streamerscout.net",
      sourceUrl: "https://kick.com/reaper_diya31",
      lastChecked: daysAgo(2),
    },
  },
  // 428. Grayson "Zenith" Harris (Twitch)
  {
    id: "creator-twitch-zenithgrayson32",
    name: "Grayson \"Zenith\" Harris",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-zenithgrayson32-primary", "Twitch", "zenithgrayson32", "https://www.twitch.tv/zenithgrayson32", 639012, 17192, "avg_live_viewers", "Streams 4-6 days / week on Twitch (17,192 avg live)"),
      createStreamerAccount("acc-creator-twitch-zenithgrayson32-sec", "Kick", "zenithgrayson32", "https://kick.com/zenithgrayson32", 287555, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zenithgrayson32@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/zenithgrayson32",
      lastChecked: daysAgo(2),
    },
  },
  // 429. Aadhya Chopra (Glitch) (Kick)
  {
    id: "creator-kick-glitchaadhya33",
    name: "Aadhya Chopra (Glitch)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-glitchaadhya33-primary", "Kick", "glitch_aadhya33", "https://kick.com/glitch_aadhya33", 653741, 17631, "avg_live_viewers", "Streams 4-6 days / week on Kick (17,631 avg live)"),
      createStreamerAccount("acc-creator-kick-glitchaadhya33-sec", "Twitch", "glitch_aadhya33", "https://www.twitch.tv/glitch_aadhya33", 294183, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.glitchaadhya33@streamerscout.net",
      sourceUrl: "https://kick.com/glitch_aadhya33",
      lastChecked: daysAgo(2),
    },
  },
  // 430. Leo "Echo" Lewis (Twitch)
  {
    id: "creator-twitch-echoleo34",
    name: "Leo \"Echo\" Lewis",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-echoleo34-primary", "Twitch", "echoleo34", "https://www.twitch.tv/echoleo34", 668470, 18070, "avg_live_viewers", "Streams 4-6 days / week on Twitch (18,070 avg live)"),
      createStreamerAccount("acc-creator-twitch-echoleo34-sec", "Kick", "echoleo34", "https://kick.com/echoleo34", 300812, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.echoleo34@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/echoleo34",
      lastChecked: daysAgo(2),
    },
  },
  // 431. Isha Rathore (Siren) (Kick)
  {
    id: "creator-kick-sirenisha35",
    name: "Isha Rathore (Siren)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-sirenisha35-primary", "Kick", "siren_isha35", "https://kick.com/siren_isha35", 683199, 18509, "avg_live_viewers", "Streams 4-6 days / week on Kick (18,509 avg live)"),
      createStreamerAccount("acc-creator-kick-sirenisha35-sec", "Twitch", "siren_isha35", "https://www.twitch.tv/siren_isha35", 307440, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.sirenisha35@streamerscout.net",
      sourceUrl: "https://kick.com/siren_isha35",
      lastChecked: daysAgo(2),
    },
  },
  // 432. Emma "Cyber" Smith (Twitch)
  {
    id: "creator-twitch-cyberemma36",
    name: "Emma \"Cyber\" Smith",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-cyberemma36-primary", "Twitch", "cyberemma36", "https://www.twitch.tv/cyberemma36", 697928, 18948, "avg_live_viewers", "Streams 4-6 days / week on Twitch (18,948 avg live)"),
      createStreamerAccount("acc-creator-twitch-cyberemma36-sec", "Kick", "cyberemma36", "https://kick.com/cyberemma36", 314068, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cyberemma36@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/cyberemma36",
      lastChecked: daysAgo(2),
    },
  },
  // 433. Pooja Singh (Pixel) (Kick)
  {
    id: "creator-kick-pixelpooja37",
    name: "Pooja Singh (Pixel)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-pixelpooja37-primary", "Kick", "pixel_pooja37", "https://kick.com/pixel_pooja37", 712657, 19387, "avg_live_viewers", "Streams 4-6 days / week on Kick (19,387 avg live)"),
      createStreamerAccount("acc-creator-kick-pixelpooja37-sec", "Twitch", "pixel_pooja37", "https://www.twitch.tv/pixel_pooja37", 320696, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pixelpooja37@streamerscout.net",
      sourceUrl: "https://kick.com/pixel_pooja37",
      lastChecked: daysAgo(2),
    },
  },
  // 434. Ava "Quantum" Jones (Twitch)
  {
    id: "creator-twitch-quantumava38",
    name: "Ava \"Quantum\" Jones",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-quantumava38-primary", "Twitch", "quantumava38", "https://www.twitch.tv/quantumava38", 727386, 19826, "avg_live_viewers", "Streams 4-6 days / week on Twitch (19,826 avg live)"),
      createStreamerAccount("acc-creator-twitch-quantumava38-sec", "Kick", "quantumava38", "https://kick.com/quantumava38", 327324, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.quantumava38@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/quantumava38",
      lastChecked: daysAgo(2),
    },
  },
  // 435. Siddharth Chatterjee (Specter) (Kick)
  {
    id: "creator-kick-spectersiddharth39",
    name: "Siddharth Chatterjee (Specter)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-spectersiddharth39-primary", "Kick", "specter_siddharth39", "https://kick.com/specter_siddharth39", 742115, 20265, "avg_live_viewers", "Streams 4-6 days / week on Kick (20,265 avg live)"),
      createStreamerAccount("acc-creator-kick-spectersiddharth39-sec", "Twitch", "specter_siddharth39", "https://www.twitch.tv/specter_siddharth39", 333952, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.spectersiddharth39@streamerscout.net",
      sourceUrl: "https://kick.com/specter_siddharth39",
      lastChecked: daysAgo(2),
    },
  },
  // 436. Isabella "Raptor" Rodriguez (Twitch)
  {
    id: "creator-twitch-raptorisabella40",
    name: "Isabella \"Raptor\" Rodriguez",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-raptorisabella40-primary", "Twitch", "raptorisabella40", "https://www.twitch.tv/raptorisabella40", 756844, 20704, "avg_live_viewers", "Streams 4-6 days / week on Twitch (20,704 avg live)"),
      createStreamerAccount("acc-creator-twitch-raptorisabella40-sec", "Kick", "raptorisabella40", "https://kick.com/raptorisabella40", 340580, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.raptorisabella40@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/raptorisabella40",
      lastChecked: daysAgo(2),
    },
  },
  // 437. Karan Chopra (Venom) (Kick)
  {
    id: "creator-kick-venomkaran41",
    name: "Karan Chopra (Venom)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-venomkaran41-primary", "Kick", "venom_karan41", "https://kick.com/venom_karan41", 771573, 21143, "avg_live_viewers", "Streams 4-6 days / week on Kick (21,143 avg live)"),
      createStreamerAccount("acc-creator-kick-venomkaran41-sec", "Twitch", "venom_karan41", "https://www.twitch.tv/venom_karan41", 347208, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.venomkaran41@streamerscout.net",
      sourceUrl: "https://kick.com/venom_karan41",
      lastChecked: daysAgo(2),
    },
  },
  // 438. Charlotte "Thunder" Gonzalez (Twitch)
  {
    id: "creator-twitch-thundercharlotte42",
    name: "Charlotte \"Thunder\" Gonzalez",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-thundercharlotte42-primary", "Twitch", "thundercharlotte42", "https://www.twitch.tv/thundercharlotte42", 786302, 21582, "avg_live_viewers", "Streams 4-6 days / week on Twitch (21,582 avg live)"),
      createStreamerAccount("acc-creator-twitch-thundercharlotte42-sec", "Kick", "thundercharlotte42", "https://kick.com/thundercharlotte42", 353836, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.thundercharlotte42@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/thundercharlotte42",
      lastChecked: daysAgo(2),
    },
  },
  // 439. Nikhil Rathore (Vortex) (Kick)
  {
    id: "creator-kick-vortexnikhil43",
    name: "Nikhil Rathore (Vortex)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-vortexnikhil43-primary", "Kick", "vortex_nikhil43", "https://kick.com/vortex_nikhil43", 801031, 22021, "avg_live_viewers", "Streams 4-6 days / week on Kick (22,021 avg live)"),
      createStreamerAccount("acc-creator-kick-vortexnikhil43-sec", "Twitch", "vortex_nikhil43", "https://www.twitch.tv/vortex_nikhil43", 360464, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.vortexnikhil43@streamerscout.net",
      sourceUrl: "https://kick.com/vortex_nikhil43",
      lastChecked: daysAgo(2),
    },
  },
  // 440. Jack "Striker" Taylor (Twitch)
  {
    id: "creator-twitch-strikerjack44",
    name: "Jack \"Striker\" Taylor",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-strikerjack44-primary", "Twitch", "strikerjack44", "https://www.twitch.tv/strikerjack44", 815760, 22460, "avg_live_viewers", "Streams 4-6 days / week on Twitch (22,460 avg live)"),
      createStreamerAccount("acc-creator-twitch-strikerjack44-sec", "Kick", "strikerjack44", "https://kick.com/strikerjack44", 367092, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.strikerjack44@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/strikerjack44",
      lastChecked: daysAgo(2),
    },
  },
  // 441. Ayush Singh (Phoenix) (Kick)
  {
    id: "creator-kick-phoenixayush45",
    name: "Ayush Singh (Phoenix)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phoenixayush45-primary", "Kick", "phoenix_ayush45", "https://kick.com/phoenix_ayush45", 830489, 22899, "avg_live_viewers", "Streams 4-6 days / week on Kick (22,899 avg live)"),
      createStreamerAccount("acc-creator-kick-phoenixayush45-sec", "Twitch", "phoenix_ayush45", "https://www.twitch.tv/phoenix_ayush45", 373720, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phoenixayush45@streamerscout.net",
      sourceUrl: "https://kick.com/phoenix_ayush45",
      lastChecked: daysAgo(2),
    },
  },
  // 442. Liam "Titan" Lee (Twitch)
  {
    id: "creator-twitch-titanliam46",
    name: "Liam \"Titan\" Lee",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-titanliam46-primary", "Twitch", "titanliam46", "https://www.twitch.tv/titanliam46", 845218, 23338, "avg_live_viewers", "Streams 4-6 days / week on Twitch (23,338 avg live)"),
      createStreamerAccount("acc-creator-twitch-titanliam46-sec", "Kick", "titanliam46", "https://kick.com/titanliam46", 380348, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.titanliam46@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/titanliam46",
      lastChecked: daysAgo(2),
    },
  },
  // 443. Pranav Chatterjee (Zero) (Kick)
  {
    id: "creator-kick-zeropranav47",
    name: "Pranav Chatterjee (Zero)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-zeropranav47-primary", "Kick", "zero_pranav47", "https://kick.com/zero_pranav47", 859947, 23777, "avg_live_viewers", "Streams 4-6 days / week on Kick (23,777 avg live)"),
      createStreamerAccount("acc-creator-kick-zeropranav47-sec", "Twitch", "zero_pranav47", "https://www.twitch.tv/zero_pranav47", 386976, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zeropranav47@streamerscout.net",
      sourceUrl: "https://kick.com/zero_pranav47",
      lastChecked: daysAgo(2),
    },
  },
  // 444. Oliver "Ninja" Harris (Twitch)
  {
    id: "creator-twitch-ninjaoliver48",
    name: "Oliver \"Ninja\" Harris",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-ninjaoliver48-primary", "Twitch", "ninjaoliver48", "https://www.twitch.tv/ninjaoliver48", 874676, 24216, "avg_live_viewers", "Streams 4-6 days / week on Twitch (24,216 avg live)"),
      createStreamerAccount("acc-creator-twitch-ninjaoliver48-sec", "Kick", "ninjaoliver48", "https://kick.com/ninjaoliver48", 393604, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ninjaoliver48@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/ninjaoliver48",
      lastChecked: daysAgo(2),
    },
  },
  // 445. Dev Chopra (Ghost) (Kick)
  {
    id: "creator-kick-ghostdev49",
    name: "Dev Chopra (Ghost)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-ghostdev49-primary", "Kick", "ghost_dev49", "https://kick.com/ghost_dev49", 889405, 24655, "avg_live_viewers", "Streams 4-6 days / week on Kick (24,655 avg live)"),
      createStreamerAccount("acc-creator-kick-ghostdev49-sec", "Twitch", "ghost_dev49", "https://www.twitch.tv/ghost_dev49", 400232, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ghostdev49@streamerscout.net",
      sourceUrl: "https://kick.com/ghost_dev49",
      lastChecked: daysAgo(2),
    },
  },
  // 446. Ethan "Alpha" Lewis (Twitch)
  {
    id: "creator-twitch-alphaethan50",
    name: "Ethan \"Alpha\" Lewis",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-alphaethan50-primary", "Twitch", "alphaethan50", "https://www.twitch.tv/alphaethan50", 904134, 25094, "avg_live_viewers", "Streams 4-6 days / week on Twitch (25,094 avg live)"),
      createStreamerAccount("acc-creator-twitch-alphaethan50-sec", "Kick", "alphaethan50", "https://kick.com/alphaethan50", 406860, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.alphaethan50@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/alphaethan50",
      lastChecked: daysAgo(2),
    },
  },
  // 447. Shlok Rathore (Omega) (Kick)
  {
    id: "creator-kick-omegashlok51",
    name: "Shlok Rathore (Omega)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-omegashlok51-primary", "Kick", "omega_shlok51", "https://kick.com/omega_shlok51", 918863, 1033, "avg_live_viewers", "Streams 4-6 days / week on Kick (1,033 avg live)"),
      createStreamerAccount("acc-creator-kick-omegashlok51-sec", "Twitch", "omega_shlok51", "https://www.twitch.tv/omega_shlok51", 413488, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.omegashlok51@streamerscout.net",
      sourceUrl: "https://kick.com/omega_shlok51",
      lastChecked: daysAgo(2),
    },
  },
  // 448. Logan "Viper" Smith (Twitch)
  {
    id: "creator-twitch-viperlogan52",
    name: "Logan \"Viper\" Smith",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-viperlogan52-primary", "Twitch", "viperlogan52", "https://www.twitch.tv/viperlogan52", 933592, 1472, "avg_live_viewers", "Streams 4-6 days / week on Twitch (1,472 avg live)"),
      createStreamerAccount("acc-creator-twitch-viperlogan52-sec", "Kick", "viperlogan52", "https://kick.com/viperlogan52", 420116, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.viperlogan52@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/viperlogan52",
      lastChecked: daysAgo(2),
    },
  },
  // 449. Kabir Singh (Phantom) (Kick)
  {
    id: "creator-kick-phantomkabir53",
    name: "Kabir Singh (Phantom)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phantomkabir53-primary", "Kick", "phantom_kabir53", "https://kick.com/phantom_kabir53", 948321, 1911, "avg_live_viewers", "Streams 4-6 days / week on Kick (1,911 avg live)"),
      createStreamerAccount("acc-creator-kick-phantomkabir53-sec", "Twitch", "phantom_kabir53", "https://www.twitch.tv/phantom_kabir53", 426744, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phantomkabir53@streamerscout.net",
      sourceUrl: "https://kick.com/phantom_kabir53",
      lastChecked: daysAgo(2),
    },
  },
  // 450. Benjamin "Shadow" Jones (Twitch)
  {
    id: "creator-twitch-shadowbenjamin54",
    name: "Benjamin \"Shadow\" Jones",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-shadowbenjamin54-primary", "Twitch", "shadowbenjamin54", "https://www.twitch.tv/shadowbenjamin54", 963050, 2350, "avg_live_viewers", "Streams 4-6 days / week on Twitch (2,350 avg live)"),
      createStreamerAccount("acc-creator-twitch-shadowbenjamin54-sec", "Kick", "shadowbenjamin54", "https://kick.com/shadowbenjamin54", 433373, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.shadowbenjamin54@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/shadowbenjamin54",
      lastChecked: daysAgo(2),
    },
  },
  // 451. Dhruv Chatterjee (Blaze) (Kick)
  {
    id: "creator-kick-blazedhruv55",
    name: "Dhruv Chatterjee (Blaze)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-blazedhruv55-primary", "Kick", "blaze_dhruv55", "https://kick.com/blaze_dhruv55", 977779, 2789, "avg_live_viewers", "Streams 4-6 days / week on Kick (2,789 avg live)"),
      createStreamerAccount("acc-creator-kick-blazedhruv55-sec", "Twitch", "blaze_dhruv55", "https://www.twitch.tv/blaze_dhruv55", 440001, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.blazedhruv55@streamerscout.net",
      sourceUrl: "https://kick.com/blaze_dhruv55",
      lastChecked: daysAgo(2),
    },
  },
  // 452. Sebastian "Apex" Rodriguez (Twitch)
  {
    id: "creator-twitch-apexsebastian56",
    name: "Sebastian \"Apex\" Rodriguez",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-apexsebastian56-primary", "Twitch", "apexsebastian56", "https://www.twitch.tv/apexsebastian56", 992508, 3228, "avg_live_viewers", "Streams 4-6 days / week on Twitch (3,228 avg live)"),
      createStreamerAccount("acc-creator-twitch-apexsebastian56-sec", "Kick", "apexsebastian56", "https://kick.com/apexsebastian56", 446629, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.apexsebastian56@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/apexsebastian56",
      lastChecked: daysAgo(2),
    },
  },
  // 453. Atharv Chopra (Frost) (Kick)
  {
    id: "creator-kick-frostatharv57",
    name: "Atharv Chopra (Frost)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-frostatharv57-primary", "Kick", "frost_atharv57", "https://kick.com/frost_atharv57", 1007237, 3667, "avg_live_viewers", "Streams 4-6 days / week on Kick (3,667 avg live)"),
      createStreamerAccount("acc-creator-kick-frostatharv57-sec", "Twitch", "frost_atharv57", "https://www.twitch.tv/frost_atharv57", 453257, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.frostatharv57@streamerscout.net",
      sourceUrl: "https://kick.com/frost_atharv57",
      lastChecked: daysAgo(2),
    },
  },
  // 454. Aiden "Nova" Gonzalez (Twitch)
  {
    id: "creator-twitch-novaaiden58",
    name: "Aiden \"Nova\" Gonzalez",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-novaaiden58-primary", "Twitch", "novaaiden58", "https://www.twitch.tv/novaaiden58", 1021966, 4106, "avg_live_viewers", "Streams 4-6 days / week on Twitch (4,106 avg live)"),
      createStreamerAccount("acc-creator-twitch-novaaiden58-sec", "Kick", "novaaiden58", "https://kick.com/novaaiden58", 459885, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.novaaiden58@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/novaaiden58",
      lastChecked: daysAgo(2),
    },
  },
  // 455. Ishaan Rathore (Cosmic) (Kick)
  {
    id: "creator-kick-cosmicishaan59",
    name: "Ishaan Rathore (Cosmic)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-cosmicishaan59-primary", "Kick", "cosmic_ishaan59", "https://kick.com/cosmic_ishaan59", 1036695, 4545, "avg_live_viewers", "Streams 4-6 days / week on Kick (4,545 avg live)"),
      createStreamerAccount("acc-creator-kick-cosmicishaan59-sec", "Twitch", "cosmic_ishaan59", "https://www.twitch.tv/cosmic_ishaan59", 466513, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cosmicishaan59@streamerscout.net",
      sourceUrl: "https://kick.com/cosmic_ishaan59",
      lastChecked: daysAgo(2),
    },
  },
  // 456. Samuel "Pulse" Taylor (Twitch)
  {
    id: "creator-twitch-pulsesamuel60",
    name: "Samuel \"Pulse\" Taylor",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-pulsesamuel60-primary", "Twitch", "pulsesamuel60", "https://www.twitch.tv/pulsesamuel60", 1051424, 4984, "avg_live_viewers", "Streams 4-6 days / week on Twitch (4,984 avg live)"),
      createStreamerAccount("acc-creator-twitch-pulsesamuel60-sec", "Kick", "pulsesamuel60", "https://kick.com/pulsesamuel60", 473141, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pulsesamuel60@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/pulsesamuel60",
      lastChecked: daysAgo(2),
    },
  },
  // 457. Arjun Singh (Storm) (Kick)
  {
    id: "creator-kick-stormarjun61",
    name: "Arjun Singh (Storm)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-stormarjun61-primary", "Kick", "storm_arjun61", "https://kick.com/storm_arjun61", 1066153, 5423, "avg_live_viewers", "Streams 4-6 days / week on Kick (5,423 avg live)"),
      createStreamerAccount("acc-creator-kick-stormarjun61-sec", "Twitch", "storm_arjun61", "https://www.twitch.tv/storm_arjun61", 479769, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.stormarjun61@streamerscout.net",
      sourceUrl: "https://kick.com/storm_arjun61",
      lastChecked: daysAgo(2),
    },
  },
  // 458. Joseph "Havoc" Lee (Twitch)
  {
    id: "creator-twitch-havocjoseph62",
    name: "Joseph \"Havoc\" Lee",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-havocjoseph62-primary", "Twitch", "havocjoseph62", "https://www.twitch.tv/havocjoseph62", 1080882, 5862, "avg_live_viewers", "Streams 4-6 days / week on Twitch (5,862 avg live)"),
      createStreamerAccount("acc-creator-twitch-havocjoseph62-sec", "Kick", "havocjoseph62", "https://kick.com/havocjoseph62", 486397, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.havocjoseph62@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/havocjoseph62",
      lastChecked: daysAgo(2),
    },
  },
  // 459. Diya Chatterjee (Reaper) (Kick)
  {
    id: "creator-kick-reaperdiya63",
    name: "Diya Chatterjee (Reaper)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-reaperdiya63-primary", "Kick", "reaper_diya63", "https://kick.com/reaper_diya63", 1095611, 6301, "avg_live_viewers", "Streams 4-6 days / week on Kick (6,301 avg live)"),
      createStreamerAccount("acc-creator-kick-reaperdiya63-sec", "Twitch", "reaper_diya63", "https://www.twitch.tv/reaper_diya63", 493025, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.reaperdiya63@streamerscout.net",
      sourceUrl: "https://kick.com/reaper_diya63",
      lastChecked: daysAgo(2),
    },
  },
  // 460. Owen "Zenith" Harris (Twitch)
  {
    id: "creator-twitch-zenithowen64",
    name: "Owen \"Zenith\" Harris",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-zenithowen64-primary", "Twitch", "zenithowen64", "https://www.twitch.tv/zenithowen64", 1110340, 6740, "avg_live_viewers", "Streams 4-6 days / week on Twitch (6,740 avg live)"),
      createStreamerAccount("acc-creator-twitch-zenithowen64-sec", "Kick", "zenithowen64", "https://kick.com/zenithowen64", 499653, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zenithowen64@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/zenithowen64",
      lastChecked: daysAgo(2),
    },
  },
  // 461. Aadhya Chopra (Glitch) (Kick)
  {
    id: "creator-kick-glitchaadhya65",
    name: "Aadhya Chopra (Glitch)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-glitchaadhya65-primary", "Kick", "glitch_aadhya65", "https://kick.com/glitch_aadhya65", 1125069, 7179, "avg_live_viewers", "Streams 4-6 days / week on Kick (7,179 avg live)"),
      createStreamerAccount("acc-creator-kick-glitchaadhya65-sec", "Twitch", "glitch_aadhya65", "https://www.twitch.tv/glitch_aadhya65", 506281, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.glitchaadhya65@streamerscout.net",
      sourceUrl: "https://kick.com/glitch_aadhya65",
      lastChecked: daysAgo(2),
    },
  },
  // 462. John "Echo" Lewis (Twitch)
  {
    id: "creator-twitch-echojohn66",
    name: "John \"Echo\" Lewis",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-echojohn66-primary", "Twitch", "echojohn66", "https://www.twitch.tv/echojohn66", 1139798, 7618, "avg_live_viewers", "Streams 4-6 days / week on Twitch (7,618 avg live)"),
      createStreamerAccount("acc-creator-twitch-echojohn66-sec", "Kick", "echojohn66", "https://kick.com/echojohn66", 512909, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.echojohn66@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/echojohn66",
      lastChecked: daysAgo(2),
    },
  },
  // 463. Isha Rathore (Siren) (Kick)
  {
    id: "creator-kick-sirenisha67",
    name: "Isha Rathore (Siren)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-sirenisha67-primary", "Kick", "siren_isha67", "https://kick.com/siren_isha67", 1154527, 8057, "avg_live_viewers", "Streams 4-6 days / week on Kick (8,057 avg live)"),
      createStreamerAccount("acc-creator-kick-sirenisha67-sec", "Twitch", "siren_isha67", "https://www.twitch.tv/siren_isha67", 519537, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.sirenisha67@streamerscout.net",
      sourceUrl: "https://kick.com/siren_isha67",
      lastChecked: daysAgo(2),
    },
  },
  // 464. Luke "Cyber" Smith (Twitch)
  {
    id: "creator-twitch-cyberluke68",
    name: "Luke \"Cyber\" Smith",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-cyberluke68-primary", "Twitch", "cyberluke68", "https://www.twitch.tv/cyberluke68", 1169256, 8496, "avg_live_viewers", "Streams 4-6 days / week on Twitch (8,496 avg live)"),
      createStreamerAccount("acc-creator-twitch-cyberluke68-sec", "Kick", "cyberluke68", "https://kick.com/cyberluke68", 526165, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cyberluke68@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/cyberluke68",
      lastChecked: daysAgo(2),
    },
  },
  // 465. Pooja Singh (Pixel) (Kick)
  {
    id: "creator-kick-pixelpooja69",
    name: "Pooja Singh (Pixel)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-pixelpooja69-primary", "Kick", "pixel_pooja69", "https://kick.com/pixel_pooja69", 1183985, 8935, "avg_live_viewers", "Streams 4-6 days / week on Kick (8,935 avg live)"),
      createStreamerAccount("acc-creator-kick-pixelpooja69-sec", "Twitch", "pixel_pooja69", "https://www.twitch.tv/pixel_pooja69", 532793, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pixelpooja69@streamerscout.net",
      sourceUrl: "https://kick.com/pixel_pooja69",
      lastChecked: daysAgo(2),
    },
  },
  // 466. Anthony "Quantum" Jones (Twitch)
  {
    id: "creator-twitch-quantumanthony70",
    name: "Anthony \"Quantum\" Jones",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-quantumanthony70-primary", "Twitch", "quantumanthony70", "https://www.twitch.tv/quantumanthony70", 1198714, 9374, "avg_live_viewers", "Streams 4-6 days / week on Twitch (9,374 avg live)"),
      createStreamerAccount("acc-creator-twitch-quantumanthony70-sec", "Kick", "quantumanthony70", "https://kick.com/quantumanthony70", 539421, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.quantumanthony70@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/quantumanthony70",
      lastChecked: daysAgo(2),
    },
  },
  // 467. Siddharth Chatterjee (Specter) (Kick)
  {
    id: "creator-kick-spectersiddharth71",
    name: "Siddharth Chatterjee (Specter)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-spectersiddharth71-primary", "Kick", "specter_siddharth71", "https://kick.com/specter_siddharth71", 1213443, 9813, "avg_live_viewers", "Streams 4-6 days / week on Kick (9,813 avg live)"),
      createStreamerAccount("acc-creator-kick-spectersiddharth71-sec", "Twitch", "specter_siddharth71", "https://www.twitch.tv/specter_siddharth71", 546049, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.spectersiddharth71@streamerscout.net",
      sourceUrl: "https://kick.com/specter_siddharth71",
      lastChecked: daysAgo(2),
    },
  },
  // 468. Grayson "Raptor" Rodriguez (Twitch)
  {
    id: "creator-twitch-raptorgrayson72",
    name: "Grayson \"Raptor\" Rodriguez",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-raptorgrayson72-primary", "Twitch", "raptorgrayson72", "https://www.twitch.tv/raptorgrayson72", 1228172, 10252, "avg_live_viewers", "Streams 4-6 days / week on Twitch (10,252 avg live)"),
      createStreamerAccount("acc-creator-twitch-raptorgrayson72-sec", "Kick", "raptorgrayson72", "https://kick.com/raptorgrayson72", 552677, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.raptorgrayson72@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/raptorgrayson72",
      lastChecked: daysAgo(2),
    },
  },
  // 469. Karan Chopra (Venom) (Kick)
  {
    id: "creator-kick-venomkaran73",
    name: "Karan Chopra (Venom)",
    category: "Gaming",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-venomkaran73-primary", "Kick", "venom_karan73", "https://kick.com/venom_karan73", 1242901, 10691, "avg_live_viewers", "Streams 4-6 days / week on Kick (10,691 avg live)"),
      createStreamerAccount("acc-creator-kick-venomkaran73-sec", "Twitch", "venom_karan73", "https://www.twitch.tv/venom_karan73", 559305, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.venomkaran73@streamerscout.net",
      sourceUrl: "https://kick.com/venom_karan73",
      lastChecked: daysAgo(2),
    },
  },
  // 470. Leo "Thunder" Gonzalez (Twitch)
  {
    id: "creator-twitch-thunderleo74",
    name: "Leo \"Thunder\" Gonzalez",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-thunderleo74-primary", "Twitch", "thunderleo74", "https://www.twitch.tv/thunderleo74", 1257630, 11130, "avg_live_viewers", "Streams 4-6 days / week on Twitch (11,130 avg live)"),
      createStreamerAccount("acc-creator-twitch-thunderleo74-sec", "Kick", "thunderleo74", "https://kick.com/thunderleo74", 565934, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.thunderleo74@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/thunderleo74",
      lastChecked: daysAgo(2),
    },
  },
  // 471. Nikhil Rathore (Vortex) (Kick)
  {
    id: "creator-kick-vortexnikhil75",
    name: "Nikhil Rathore (Vortex)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-vortexnikhil75-primary", "Kick", "vortex_nikhil75", "https://kick.com/vortex_nikhil75", 1272359, 11569, "avg_live_viewers", "Streams 4-6 days / week on Kick (11,569 avg live)"),
      createStreamerAccount("acc-creator-kick-vortexnikhil75-sec", "Twitch", "vortex_nikhil75", "https://www.twitch.tv/vortex_nikhil75", 572562, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.vortexnikhil75@streamerscout.net",
      sourceUrl: "https://kick.com/vortex_nikhil75",
      lastChecked: daysAgo(2),
    },
  },
  // 472. Emma "Striker" Taylor (Twitch)
  {
    id: "creator-twitch-strikeremma76",
    name: "Emma \"Striker\" Taylor",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-strikeremma76-primary", "Twitch", "strikeremma76", "https://www.twitch.tv/strikeremma76", 1287088, 12008, "avg_live_viewers", "Streams 4-6 days / week on Twitch (12,008 avg live)"),
      createStreamerAccount("acc-creator-twitch-strikeremma76-sec", "Kick", "strikeremma76", "https://kick.com/strikeremma76", 579190, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.strikeremma76@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/strikeremma76",
      lastChecked: daysAgo(2),
    },
  },
  // 473. Ayush Singh (Phoenix) (Kick)
  {
    id: "creator-kick-phoenixayush77",
    name: "Ayush Singh (Phoenix)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phoenixayush77-primary", "Kick", "phoenix_ayush77", "https://kick.com/phoenix_ayush77", 1301817, 12447, "avg_live_viewers", "Streams 4-6 days / week on Kick (12,447 avg live)"),
      createStreamerAccount("acc-creator-kick-phoenixayush77-sec", "Twitch", "phoenix_ayush77", "https://www.twitch.tv/phoenix_ayush77", 585818, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phoenixayush77@streamerscout.net",
      sourceUrl: "https://kick.com/phoenix_ayush77",
      lastChecked: daysAgo(2),
    },
  },
  // 474. Ava "Titan" Lee (Twitch)
  {
    id: "creator-twitch-titanava78",
    name: "Ava \"Titan\" Lee",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-titanava78-primary", "Twitch", "titanava78", "https://www.twitch.tv/titanava78", 1316546, 12886, "avg_live_viewers", "Streams 4-6 days / week on Twitch (12,886 avg live)"),
      createStreamerAccount("acc-creator-twitch-titanava78-sec", "Kick", "titanava78", "https://kick.com/titanava78", 592446, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.titanava78@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/titanava78",
      lastChecked: daysAgo(2),
    },
  },
  // 475. Pranav Chatterjee (Zero) (Kick)
  {
    id: "creator-kick-zeropranav79",
    name: "Pranav Chatterjee (Zero)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-zeropranav79-primary", "Kick", "zero_pranav79", "https://kick.com/zero_pranav79", 1331275, 13325, "avg_live_viewers", "Streams 4-6 days / week on Kick (13,325 avg live)"),
      createStreamerAccount("acc-creator-kick-zeropranav79-sec", "Twitch", "zero_pranav79", "https://www.twitch.tv/zero_pranav79", 599074, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zeropranav79@streamerscout.net",
      sourceUrl: "https://kick.com/zero_pranav79",
      lastChecked: daysAgo(2),
    },
  },
  // 476. Isabella "Ninja" Harris (Twitch)
  {
    id: "creator-twitch-ninjaisabella80",
    name: "Isabella \"Ninja\" Harris",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-ninjaisabella80-primary", "Twitch", "ninjaisabella80", "https://www.twitch.tv/ninjaisabella80", 1346004, 13764, "avg_live_viewers", "Streams 4-6 days / week on Twitch (13,764 avg live)"),
      createStreamerAccount("acc-creator-twitch-ninjaisabella80-sec", "Kick", "ninjaisabella80", "https://kick.com/ninjaisabella80", 605702, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ninjaisabella80@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/ninjaisabella80",
      lastChecked: daysAgo(2),
    },
  },
  // 477. Dev Chopra (Ghost) (Kick)
  {
    id: "creator-kick-ghostdev81",
    name: "Dev Chopra (Ghost)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-ghostdev81-primary", "Kick", "ghost_dev81", "https://kick.com/ghost_dev81", 1360733, 14203, "avg_live_viewers", "Streams 4-6 days / week on Kick (14,203 avg live)"),
      createStreamerAccount("acc-creator-kick-ghostdev81-sec", "Twitch", "ghost_dev81", "https://www.twitch.tv/ghost_dev81", 612330, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.ghostdev81@streamerscout.net",
      sourceUrl: "https://kick.com/ghost_dev81",
      lastChecked: daysAgo(2),
    },
  },
  // 478. Charlotte "Alpha" Lewis (Twitch)
  {
    id: "creator-twitch-alphacharlotte82",
    name: "Charlotte \"Alpha\" Lewis",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-alphacharlotte82-primary", "Twitch", "alphacharlotte82", "https://www.twitch.tv/alphacharlotte82", 1375462, 14642, "avg_live_viewers", "Streams 4-6 days / week on Twitch (14,642 avg live)"),
      createStreamerAccount("acc-creator-twitch-alphacharlotte82-sec", "Kick", "alphacharlotte82", "https://kick.com/alphacharlotte82", 618958, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.alphacharlotte82@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/alphacharlotte82",
      lastChecked: daysAgo(2),
    },
  },
  // 479. Shlok Rathore (Omega) (Kick)
  {
    id: "creator-kick-omegashlok83",
    name: "Shlok Rathore (Omega)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-omegashlok83-primary", "Kick", "omega_shlok83", "https://kick.com/omega_shlok83", 1390191, 15081, "avg_live_viewers", "Streams 4-6 days / week on Kick (15,081 avg live)"),
      createStreamerAccount("acc-creator-kick-omegashlok83-sec", "Twitch", "omega_shlok83", "https://www.twitch.tv/omega_shlok83", 625586, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.omegashlok83@streamerscout.net",
      sourceUrl: "https://kick.com/omega_shlok83",
      lastChecked: daysAgo(2),
    },
  },
  // 480. Jack "Viper" Smith (Twitch)
  {
    id: "creator-twitch-viperjack84",
    name: "Jack \"Viper\" Smith",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-viperjack84-primary", "Twitch", "viperjack84", "https://www.twitch.tv/viperjack84", 1404920, 15520, "avg_live_viewers", "Streams 4-6 days / week on Twitch (15,520 avg live)"),
      createStreamerAccount("acc-creator-twitch-viperjack84-sec", "Kick", "viperjack84", "https://kick.com/viperjack84", 632214, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.viperjack84@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/viperjack84",
      lastChecked: daysAgo(2),
    },
  },
  // 481. Kabir Singh (Phantom) (Kick)
  {
    id: "creator-kick-phantomkabir85",
    name: "Kabir Singh (Phantom)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-phantomkabir85-primary", "Kick", "phantom_kabir85", "https://kick.com/phantom_kabir85", 1419649, 15959, "avg_live_viewers", "Streams 4-6 days / week on Kick (15,959 avg live)"),
      createStreamerAccount("acc-creator-kick-phantomkabir85-sec", "Twitch", "phantom_kabir85", "https://www.twitch.tv/phantom_kabir85", 638842, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.phantomkabir85@streamerscout.net",
      sourceUrl: "https://kick.com/phantom_kabir85",
      lastChecked: daysAgo(2),
    },
  },
  // 482. Liam "Shadow" Jones (Twitch)
  {
    id: "creator-twitch-shadowliam86",
    name: "Liam \"Shadow\" Jones",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-shadowliam86-primary", "Twitch", "shadowliam86", "https://www.twitch.tv/shadowliam86", 1434378, 16398, "avg_live_viewers", "Streams 4-6 days / week on Twitch (16,398 avg live)"),
      createStreamerAccount("acc-creator-twitch-shadowliam86-sec", "Kick", "shadowliam86", "https://kick.com/shadowliam86", 645470, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.shadowliam86@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/shadowliam86",
      lastChecked: daysAgo(2),
    },
  },
  // 483. Dhruv Chatterjee (Blaze) (Kick)
  {
    id: "creator-kick-blazedhruv87",
    name: "Dhruv Chatterjee (Blaze)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-blazedhruv87-primary", "Kick", "blaze_dhruv87", "https://kick.com/blaze_dhruv87", 1449107, 16837, "avg_live_viewers", "Streams 4-6 days / week on Kick (16,837 avg live)"),
      createStreamerAccount("acc-creator-kick-blazedhruv87-sec", "Twitch", "blaze_dhruv87", "https://www.twitch.tv/blaze_dhruv87", 652098, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.blazedhruv87@streamerscout.net",
      sourceUrl: "https://kick.com/blaze_dhruv87",
      lastChecked: daysAgo(2),
    },
  },
  // 484. Oliver "Apex" Rodriguez (Twitch)
  {
    id: "creator-twitch-apexoliver88",
    name: "Oliver \"Apex\" Rodriguez",
    category: "Entertainment",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-apexoliver88-primary", "Twitch", "apexoliver88", "https://www.twitch.tv/apexoliver88", 1463836, 17276, "avg_live_viewers", "Streams 4-6 days / week on Twitch (17,276 avg live)"),
      createStreamerAccount("acc-creator-twitch-apexoliver88-sec", "Kick", "apexoliver88", "https://kick.com/apexoliver88", 658726, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.apexoliver88@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/apexoliver88",
      lastChecked: daysAgo(2),
    },
  },
  // 485. Atharv Chopra (Frost) (Kick)
  {
    id: "creator-kick-frostatharv89",
    name: "Atharv Chopra (Frost)",
    category: "Esports",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-frostatharv89-primary", "Kick", "frost_atharv89", "https://kick.com/frost_atharv89", 1478565, 17715, "avg_live_viewers", "Streams 4-6 days / week on Kick (17,715 avg live)"),
      createStreamerAccount("acc-creator-kick-frostatharv89-sec", "Twitch", "frost_atharv89", "https://www.twitch.tv/frost_atharv89", 665354, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.frostatharv89@streamerscout.net",
      sourceUrl: "https://kick.com/frost_atharv89",
      lastChecked: daysAgo(2),
    },
  },
  // 486. Ethan "Nova" Gonzalez (Twitch)
  {
    id: "creator-twitch-novaethan90",
    name: "Ethan \"Nova\" Gonzalez",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-novaethan90-primary", "Twitch", "novaethan90", "https://www.twitch.tv/novaethan90", 1493294, 18154, "avg_live_viewers", "Streams 4-6 days / week on Twitch (18,154 avg live)"),
      createStreamerAccount("acc-creator-twitch-novaethan90-sec", "Kick", "novaethan90", "https://kick.com/novaethan90", 671982, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.novaethan90@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/novaethan90",
      lastChecked: daysAgo(2),
    },
  },
  // 487. Ishaan Rathore (Cosmic) (Kick)
  {
    id: "creator-kick-cosmicishaan91",
    name: "Ishaan Rathore (Cosmic)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-cosmicishaan91-primary", "Kick", "cosmic_ishaan91", "https://kick.com/cosmic_ishaan91", 1508023, 18593, "avg_live_viewers", "Streams 4-6 days / week on Kick (18,593 avg live)"),
      createStreamerAccount("acc-creator-kick-cosmicishaan91-sec", "Twitch", "cosmic_ishaan91", "https://www.twitch.tv/cosmic_ishaan91", 678610, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cosmicishaan91@streamerscout.net",
      sourceUrl: "https://kick.com/cosmic_ishaan91",
      lastChecked: daysAgo(2),
    },
  },
  // 488. Logan "Pulse" Taylor (Twitch)
  {
    id: "creator-twitch-pulselogan92",
    name: "Logan \"Pulse\" Taylor",
    category: "Entertainment",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-pulselogan92-primary", "Twitch", "pulselogan92", "https://www.twitch.tv/pulselogan92", 1522752, 19032, "avg_live_viewers", "Streams 4-6 days / week on Twitch (19,032 avg live)"),
      createStreamerAccount("acc-creator-twitch-pulselogan92-sec", "Kick", "pulselogan92", "https://kick.com/pulselogan92", 685238, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pulselogan92@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/pulselogan92",
      lastChecked: daysAgo(2),
    },
  },
  // 489. Arjun Singh (Storm) (Kick)
  {
    id: "creator-kick-stormarjun93",
    name: "Arjun Singh (Storm)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Ahmedabad-based competitive Dota 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-stormarjun93-primary", "Kick", "storm_arjun93", "https://kick.com/storm_arjun93", 1537481, 19471, "avg_live_viewers", "Streams 4-6 days / week on Kick (19,471 avg live)"),
      createStreamerAccount("acc-creator-kick-stormarjun93-sec", "Twitch", "storm_arjun93", "https://www.twitch.tv/storm_arjun93", 691866, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.stormarjun93@streamerscout.net",
      sourceUrl: "https://kick.com/storm_arjun93",
      lastChecked: daysAgo(2),
    },
  },
  // 490. Benjamin "Havoc" Lee (Twitch)
  {
    id: "creator-twitch-havocbenjamin94",
    name: "Benjamin \"Havoc\" Lee",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier Tekken 8 gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-havocbenjamin94-primary", "Twitch", "havocbenjamin94", "https://www.twitch.tv/havocbenjamin94", 1552210, 19910, "avg_live_viewers", "Streams 4-6 days / week on Twitch (19,910 avg live)"),
      createStreamerAccount("acc-creator-twitch-havocbenjamin94-sec", "Kick", "havocbenjamin94", "https://kick.com/havocbenjamin94", 698495, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.havocbenjamin94@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/havocbenjamin94",
      lastChecked: daysAgo(2),
    },
  },
  // 491. Diya Chatterjee (Reaper) (Kick)
  {
    id: "creator-kick-reaperdiya95",
    name: "Diya Chatterjee (Reaper)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kochi-based competitive Elden Ring streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-reaperdiya95-primary", "Kick", "reaper_diya95", "https://kick.com/reaper_diya95", 1566939, 20349, "avg_live_viewers", "Streams 4-6 days / week on Kick (20,349 avg live)"),
      createStreamerAccount("acc-creator-kick-reaperdiya95-sec", "Twitch", "reaper_diya95", "https://www.twitch.tv/reaper_diya95", 705123, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.reaperdiya95@streamerscout.net",
      sourceUrl: "https://kick.com/reaper_diya95",
      lastChecked: daysAgo(2),
    },
  },
  // 492. Sebastian "Zenith" Harris (Twitch)
  {
    id: "creator-twitch-zenithsebastian96",
    name: "Sebastian \"Zenith\" Harris",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Canada-based Twitch partner streaming high-tier Valorant gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-zenithsebastian96-primary", "Twitch", "zenithsebastian96", "https://www.twitch.tv/zenithsebastian96", 1581668, 20788, "avg_live_viewers", "Streams 4-6 days / week on Twitch (20,788 avg live)"),
      createStreamerAccount("acc-creator-twitch-zenithsebastian96-sec", "Kick", "zenithsebastian96", "https://kick.com/zenithsebastian96", 711751, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.zenithsebastian96@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/zenithsebastian96",
      lastChecked: daysAgo(2),
    },
  },
  // 493. Aadhya Chopra (Glitch) (Kick)
  {
    id: "creator-kick-glitchaadhya97",
    name: "Aadhya Chopra (Glitch)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Bengaluru-based competitive GTA V RP streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-glitchaadhya97-primary", "Kick", "glitch_aadhya97", "https://kick.com/glitch_aadhya97", 1596397, 21227, "avg_live_viewers", "Streams 4-6 days / week on Kick (21,227 avg live)"),
      createStreamerAccount("acc-creator-kick-glitchaadhya97-sec", "Twitch", "glitch_aadhya97", "https://www.twitch.tv/glitch_aadhya97", 718379, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.glitchaadhya97@streamerscout.net",
      sourceUrl: "https://kick.com/glitch_aadhya97",
      lastChecked: daysAgo(2),
    },
  },
  // 494. Aiden "Echo" Lewis (Twitch)
  {
    id: "creator-twitch-echoaiden98",
    name: "Aiden \"Echo\" Lewis",
    category: "Gaming",
    language: "German",
    creatorCountry: "Germany",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Germany-based Twitch partner streaming high-tier Battlegrounds Mobile gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-echoaiden98-primary", "Twitch", "echoaiden98", "https://www.twitch.tv/echoaiden98", 1611126, 21666, "avg_live_viewers", "Streams 4-6 days / week on Twitch (21,666 avg live)"),
      createStreamerAccount("acc-creator-twitch-echoaiden98-sec", "Kick", "echoaiden98", "https://kick.com/echoaiden98", 725007, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.echoaiden98@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/echoaiden98",
      lastChecked: daysAgo(2),
    },
  },
  // 495. Isha Rathore (Siren) (Kick)
  {
    id: "creator-kick-sirenisha0",
    name: "Isha Rathore (Siren)",
    category: "Esports",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Pune-based competitive Counter-Strike 2 streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-sirenisha0-primary", "Kick", "siren_isha0", "https://kick.com/siren_isha0", 1625855, 22105, "avg_live_viewers", "Streams 4-6 days / week on Kick (22,105 avg live)"),
      createStreamerAccount("acc-creator-kick-sirenisha0-sec", "Twitch", "siren_isha0", "https://www.twitch.tv/siren_isha0", 731635, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.sirenisha0@streamerscout.net",
      sourceUrl: "https://kick.com/siren_isha0",
      lastChecked: daysAgo(2),
    },
  },
  // 496. Samuel "Cyber" Smith (Twitch)
  {
    id: "creator-twitch-cybersamuel1",
    name: "Samuel \"Cyber\" Smith",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Spain-based Twitch partner streaming high-tier Minecraft gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-cybersamuel1-primary", "Twitch", "cybersamuel1", "https://www.twitch.tv/cybersamuel1", 1640584, 22544, "avg_live_viewers", "Streams 4-6 days / week on Twitch (22,544 avg live)"),
      createStreamerAccount("acc-creator-twitch-cybersamuel1-sec", "Kick", "cybersamuel1", "https://kick.com/cybersamuel1", 738263, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.cybersamuel1@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/cybersamuel1",
      lastChecked: daysAgo(2),
    },
  },
  // 497. Pooja Singh (Pixel) (Kick)
  {
    id: "creator-kick-pixelpooja2",
    name: "Pooja Singh (Pixel)",
    category: "Gaming",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Kolkata-based competitive Apex Legends streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-pixelpooja2-primary", "Kick", "pixel_pooja2", "https://kick.com/pixel_pooja2", 1655313, 22983, "avg_live_viewers", "Streams 4-6 days / week on Kick (22,983 avg live)"),
      createStreamerAccount("acc-creator-kick-pixelpooja2-sec", "Twitch", "pixel_pooja2", "https://www.twitch.tv/pixel_pooja2", 744891, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.pixelpooja2@streamerscout.net",
      sourceUrl: "https://kick.com/pixel_pooja2",
      lastChecked: daysAgo(2),
    },
  },
  // 498. Joseph "Quantum" Jones (Twitch)
  {
    id: "creator-twitch-quantumjoseph3",
    name: "Joseph \"Quantum\" Jones",
    category: "Gaming",
    language: "Japanese",
    creatorCountry: "Japan",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Japan-based Twitch partner streaming high-tier Fortnite gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-quantumjoseph3-primary", "Twitch", "quantumjoseph3", "https://www.twitch.tv/quantumjoseph3", 1670042, 23422, "avg_live_viewers", "Streams 4-6 days / week on Twitch (23,422 avg live)"),
      createStreamerAccount("acc-creator-twitch-quantumjoseph3-sec", "Kick", "quantumjoseph3", "https://kick.com/quantumjoseph3", 751519, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.quantumjoseph3@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/quantumjoseph3",
      lastChecked: daysAgo(2),
    },
  },
  // 499. Siddharth Chatterjee (Specter) (Kick)
  {
    id: "creator-kick-spectersiddharth4",
    name: "Siddharth Chatterjee (Specter)",
    category: "Gaming",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "Jaipur-based competitive Call of Duty: Warzone streamer and content creator broadcasting tactical ranked matches, community customs, and esports watch parties.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-kick-spectersiddharth4-primary", "Kick", "specter_siddharth4", "https://kick.com/specter_siddharth4", 1684771, 23861, "avg_live_viewers", "Streams 4-6 days / week on Kick (23,861 avg live)"),
      createStreamerAccount("acc-creator-kick-spectersiddharth4-sec", "Twitch", "specter_siddharth4", "https://www.twitch.tv/specter_siddharth4", 758147, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Kick Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.spectersiddharth4@streamerscout.net",
      sourceUrl: "https://kick.com/specter_siddharth4",
      lastChecked: daysAgo(2),
    },
  },
  // 500. Owen "Raptor" Rodriguez (Twitch)
  {
    id: "creator-twitch-raptorowen5",
    name: "Owen \"Raptor\" Rodriguez",
    category: "Esports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform Verified Partner Registry",
    bio: "United States-based Twitch partner streaming high-tier League of Legends gameplay, variety challenges, and lively interactive community sessions.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createStreamerAccount("acc-creator-twitch-raptorowen5-primary", "Twitch", "raptorowen5", "https://www.twitch.tv/raptorowen5", 1699500, 24300, "avg_live_viewers", "Streams 4-6 days / week on Twitch (24,300 avg live)"),
      createStreamerAccount("acc-creator-twitch-raptorowen5-sec", "Kick", "raptorowen5", "https://kick.com/raptorowen5", 764775, null, null, "Active co-streamer"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(3), source: "Twitch Verified Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "mgmt.raptorowen5@streamerscout.net",
      sourceUrl: "https://www.twitch.tv/raptorowen5",
      lastChecked: daysAgo(2),
    },
  },
];
