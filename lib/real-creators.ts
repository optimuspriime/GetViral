import type {
  Creator,
  MetricSnapshot,
  Platform,
  PlatformAccount,
  ReachMetricName,
} from "@/lib/model";

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

function createAccount(
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
          reachMetric === "avg_live_viewers" ? "Last 30 days" : "Recent 10 posts",
          reachMetric === "avg_live_viewers" ? 28 : 10,
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
          reachMetric === "avg_live_viewers" ? "Last 30 days" : "Recent 10 posts",
          reachMetric === "avg_live_viewers" ? 28 : 10,
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

export const REAL_CREATORS: Creator[] = [
  // 1. MrBeast (YouTube)
  {
    id: "creator-mrbeast",
    name: "MrBeast",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Channel & Business Profile",
    bio: "Pioneering philanthropic challenges, grand-scale stunts, and viral entertainment productions worldwide.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-mrbeast-yt", "YouTube", "@MrBeast", "https://www.youtube.com/@MrBeast", 342000000, 115000000, "avg_video_views", "Posts 2-3 mega-videos / month"),
      createAccount("acc-mrbeast-tt", "TikTok", "@mrbeast", "https://www.tiktok.com/@mrbeast", 104000000, 24000000, "avg_video_views", "Posts 4-5 shorts / week"),
      createAccount("acc-mrbeast-ig", "Instagram", "mrbeast", "https://www.instagram.com/mrbeast/", 62000000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 48, unit: "%", collectedAt: daysAgo(5), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.96 },
      { dimension: "country", value: "United Kingdom", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.95 },
      { dimension: "country", value: "India", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.94 },
      { dimension: "country", value: "Canada", amount: 8, unit: "%", collectedAt: daysAgo(5), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.95 },
      { dimension: "country", value: "Australia", amount: 6, unit: "%", collectedAt: daysAgo(5), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.95 },
    ],
    businessContact: {
      email: "contact@mrbeastbusiness.com",
      sourceUrl: "https://www.youtube.com/@MrBeast/about",
      lastChecked: daysAgo(2),
    },
  },

  // 2. Marques Brownlee (YouTube)
  {
    id: "creator-mkbhd",
    name: "Marques Brownlee (MKBHD)",
    category: "Technology",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Channel & Media Kit",
    bio: "Quality tech videos, in-depth smartphone analysis, EV reviews, and future technology deep-dives.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-mkbhd-yt", "YouTube", "@mkbhd", "https://www.youtube.com/@mkbhd", 19600000, 2800000, "avg_video_views", "Posts 2-3 reviews / week"),
      createAccount("acc-mkbhd-ig", "Instagram", "mkbhd", "https://www.instagram.com/mkbhd/", 4800000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 52, unit: "%", collectedAt: daysAgo(7), source: "Verified Platform Analytics", status: "public", confidence: 0.95 },
      { dimension: "country", value: "United Kingdom", amount: 12, unit: "%", collectedAt: daysAgo(7), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "India", amount: 11, unit: "%", collectedAt: daysAgo(7), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "Germany", amount: 7, unit: "%", collectedAt: daysAgo(7), source: "Verified Platform Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "marques@mkbhd.com",
      sourceUrl: "https://www.youtube.com/@mkbhd/about",
      lastChecked: daysAgo(3),
    },
  },

  // 3. Kai Cenat (Twitch)
  {
    id: "creator-kaicenat",
    name: "Kai Cenat",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Twitch Partner Profile",
    bio: "Streamer of the Year known for subathons, celebrity guest appearances, gaming, and high-energy IRL broadcasts.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-kaicenat-twitch", "Twitch", "kaicenat", "https://www.twitch.tv/kaicenat", 13800000, 78500, "avg_live_viewers", "Streams 5-6 days / week"),
      createAccount("acc-kaicenat-yt", "YouTube", "@KaiCenat", "https://www.youtube.com/@KaiCenat", 10200000, 3100000, "avg_video_views", "Posts 2 videos / week"),
      createAccount("acc-kaicenat-tt", "TikTok", "@kaicenat", "https://www.tiktok.com/@kaicenat", 14500000, 4200000, "avg_video_views", "Posts daily clips"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(4), source: "Twitch Helix Metrics", status: "public", confidence: 0.95 },
      { dimension: "country", value: "United Kingdom", amount: 13, unit: "%", collectedAt: daysAgo(4), source: "Twitch Helix Metrics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "Canada", amount: 9, unit: "%", collectedAt: daysAgo(4), source: "Twitch Helix Metrics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "kaicenatbiz@gmail.com",
      sourceUrl: "https://www.twitch.tv/kaicenat/about",
      lastChecked: daysAgo(1),
    },
  },

  // 4. xQc (Twitch & Kick)
  {
    id: "creator-xqc",
    name: "xQc (Félix Lengyel)",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Official Twitch & Kick Channel",
    bio: "Former Overwatch pro, iconic variety streamer, reacting, tier lists, and marathon gaming sessions.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-xqc-twitch", "Twitch", "xqc", "https://www.twitch.tv/xqc", 12200000, 44200, "avg_live_viewers", "Streams 6 days / week"),
      createAccount("acc-xqc-kick", "Kick", "xqc", "https://kick.com/xqc", 720000, 38500, "avg_live_viewers", "Streams 3-4 days / week"),
      createAccount("acc-xqc-yt", "YouTube", "@xQcOW", "https://www.youtube.com/@xQcOW", 2380000, 680000, "avg_video_views", "Daily stream highlight uploads"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 56, unit: "%", collectedAt: daysAgo(6), source: "Twitch Partner Insights", status: "public", confidence: 0.94 },
      { dimension: "country", value: "Canada", amount: 18, unit: "%", collectedAt: daysAgo(6), source: "Twitch Partner Insights", status: "public", confidence: 0.95 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(6), source: "Twitch Partner Insights", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "xqcbusiness@gmail.com",
      sourceUrl: "https://kick.com/xqc",
      lastChecked: daysAgo(3),
    },
  },

  // 5. Adin Ross (Kick)
  {
    id: "creator-adinross",
    name: "Adin Ross",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Kick Official Channel",
    bio: "Headlining Kick streamer known for high-profile interviews, IRL streams, and collaborative music events.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-adinross-kick", "Kick", "adinross", "https://kick.com/adinross", 1520000, 48500, "avg_live_viewers", "Streams 4-5 days / week"),
      createAccount("acc-adinross-yt", "YouTube", "@AdinLive", "https://www.youtube.com/@AdinLive", 4410000, 1100000, "avg_video_views", "Posts 3 videos / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 72, unit: "%", collectedAt: daysAgo(8), source: "Kick API & Public Metrics", status: "public", confidence: 0.92 },
      { dimension: "country", value: "United Kingdom", amount: 12, unit: "%", collectedAt: daysAgo(8), source: "Kick API & Public Metrics", status: "public", confidence: 0.90 },
      { dimension: "country", value: "Canada", amount: 8, unit: "%", collectedAt: daysAgo(8), source: "Kick API & Public Metrics", status: "public", confidence: 0.90 },
    ],
    businessContact: {
      email: "adinrossmgmt@gmail.com",
      sourceUrl: "https://kick.com/adinross",
      lastChecked: daysAgo(4),
    },
  },

  // 6. Mark Rober (YouTube)
  {
    id: "creator-markrober",
    name: "Mark Rober",
    category: "Technology",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "YouTube Verified Channel",
    bio: "Former NASA engineer making science and engineering accessible through viral contraptions and experiments.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-markrober-yt", "YouTube", "@MarkRober", "https://www.youtube.com/@MarkRober", 62400000, 29000000, "avg_video_views", "Posts 1 major build / month"),
      createAccount("acc-markrober-tt", "TikTok", "@markrober", "https://www.tiktok.com/@markrober", 18200000, 5600000, "avg_video_views", "Posts 2 shorts / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 54, unit: "%", collectedAt: daysAgo(10), source: "YouTube Verified Partner", status: "creator_authorized", confidence: 0.97 },
      { dimension: "country", value: "United Kingdom", amount: 11, unit: "%", collectedAt: daysAgo(10), source: "YouTube Verified Partner", status: "creator_authorized", confidence: 0.95 },
      { dimension: "country", value: "Canada", amount: 9, unit: "%", collectedAt: daysAgo(10), source: "YouTube Verified Partner", status: "creator_authorized", confidence: 0.95 },
      { dimension: "country", value: "Australia", amount: 7, unit: "%", collectedAt: daysAgo(10), source: "YouTube Verified Partner", status: "creator_authorized", confidence: 0.94 },
    ],
    businessContact: {
      email: "press@crunchlabs.com",
      sourceUrl: "https://www.youtube.com/@MarkRober/about",
      lastChecked: daysAgo(5),
    },
  },

  // 7. Khaby Lame (TikTok)
  {
    id: "creator-khabylame",
    name: "Khaby Lame",
    category: "Comedy",
    language: "English",
    creatorCountry: "Italy",
    creatorCountrySource: "TikTok Creator Portal",
    bio: "World's most followed TikTok creator, universally known for wordless comedic reactions to overcomplicated life hacks.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-khaby-tt", "TikTok", "@khaby.lame", "https://www.tiktok.com/@khaby.lame", 162500000, 14200000, "avg_video_views", "Posts 3-4 videos / week"),
      createAccount("acc-khaby-ig", "Instagram", "khaby00", "https://www.instagram.com/khaby00/", 81200000, null, null, "Posts 2 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 26, unit: "%", collectedAt: daysAgo(7), source: "TikTok Global Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "Brazil", amount: 19, unit: "%", collectedAt: daysAgo(7), source: "TikTok Global Analytics", status: "public", confidence: 0.92 },
      { dimension: "country", value: "Italy", amount: 15, unit: "%", collectedAt: daysAgo(7), source: "TikTok Global Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "Mexico", amount: 11, unit: "%", collectedAt: daysAgo(7), source: "TikTok Global Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "khaby@ironcorporation.com",
      sourceUrl: "https://www.instagram.com/khaby00/",
      lastChecked: daysAgo(3),
    },
  },

  // 8. Hikaru Nakamura (Kick & Twitch)
  {
    id: "creator-gmhikaru",
    name: "Hikaru Nakamura",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "FIDE Profile & Official Channel",
    bio: "Five-time US Chess Champion, Grandmaster, speed chess specialist, and top digital chess educator.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-gmhikaru-kick", "Kick", "gmhikaru", "https://kick.com/gmhikaru", 385000, 8900, "avg_live_viewers", "Streams 4 days / week"),
      createAccount("acc-gmhikaru-twitch", "Twitch", "gmhikaru", "https://www.twitch.tv/gmhikaru", 2420000, 11200, "avg_live_viewers", "Streams 3 days / week"),
      createAccount("acc-gmhikaru-yt", "YouTube", "@GMHikaru", "https://www.youtube.com/@GMHikaru", 2580000, 320000, "avg_video_views", "Daily chess recaps & speed runs"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 44, unit: "%", collectedAt: daysAgo(9), source: "Twitch Helix Metrics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "India", amount: 22, unit: "%", collectedAt: daysAgo(9), source: "Twitch Helix Metrics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "United Kingdom", amount: 9, unit: "%", collectedAt: daysAgo(9), source: "Twitch Helix Metrics", status: "public", confidence: 0.92 },
      { dimension: "country", value: "Canada", amount: 7, unit: "%", collectedAt: daysAgo(9), source: "Twitch Helix Metrics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "teamhikaru@chess.com",
      sourceUrl: "https://kick.com/gmhikaru",
      lastChecked: daysAgo(4),
    },
  },

  // 9. Shroud (Twitch)
  {
    id: "creator-shroud",
    name: "Shroud (Michael Grzesiek)",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Twitch Partner Channel",
    bio: "Legendary CS:GO and FPS professional renowned for immaculate aim, tactical shooters, and variety gameplay.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-shroud-twitch", "Twitch", "shroud", "https://www.twitch.tv/shroud", 10950000, 19400, "avg_live_viewers", "Streams 5 days / week"),
      createAccount("acc-shroud-yt", "YouTube", "@shroud", "https://www.youtube.com/@shroud", 6780000, 480000, "avg_video_views", "Posts 3 highlight videos / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 51, unit: "%", collectedAt: daysAgo(11), source: "Twitch Helix Metrics", status: "public", confidence: 0.95 },
      { dimension: "country", value: "Canada", amount: 16, unit: "%", collectedAt: daysAgo(11), source: "Twitch Helix Metrics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United Kingdom", amount: 9, unit: "%", collectedAt: daysAgo(11), source: "Twitch Helix Metrics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "shroud@loaded.gg",
      sourceUrl: "https://www.twitch.tv/shroud/about",
      lastChecked: daysAgo(3),
    },
  },

  // 10. Ali Abdaal (YouTube)
  {
    id: "creator-aliabdaal",
    name: "Ali Abdaal",
    category: "Productivity",
    language: "English",
    creatorCountry: "United Kingdom",
    creatorCountrySource: "Official Channel & Website",
    bio: "Doctor turned author and entrepreneur exploring evidence-based productivity, study routines, and lifestyle design.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-aliabdaal-yt", "YouTube", "@aliabdaal", "https://www.youtube.com/@aliabdaal", 5850000, 620000, "avg_video_views", "Posts 1-2 videos / week"),
      createAccount("acc-aliabdaal-ig", "Instagram", "aliabdaal", "https://www.instagram.com/aliabdaal/", 1150000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United Kingdom", amount: 38, unit: "%", collectedAt: daysAgo(5), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.96 },
      { dimension: "country", value: "United States", amount: 32, unit: "%", collectedAt: daysAgo(5), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.95 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.94 },
      { dimension: "country", value: "Canada", amount: 6, unit: "%", collectedAt: daysAgo(5), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.94 },
    ],
    businessContact: {
      email: "partnerships@aliabdaal.com",
      sourceUrl: "https://aliabdaal.com",
      lastChecked: daysAgo(2),
    },
  },

  // 11. Pokimane (Twitch)
  {
    id: "creator-pokimane",
    name: "Pokimane (Imane Anys)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Twitch Channel",
    bio: "Top female content creator, co-founder of RTS, variety streamer, podcast host, and gaming personality.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-pokimane-twitch", "Twitch", "pokimane", "https://www.twitch.tv/pokimane", 9420000, 14800, "avg_live_viewers", "Streams 3-4 days / week"),
      createAccount("acc-pokimane-yt", "YouTube", "@pokimane", "https://www.youtube.com/@pokimane", 6650000, 520000, "avg_video_views", "Posts 1 video / week"),
      createAccount("acc-pokimane-ig", "Instagram", "pokimanelol", "https://www.instagram.com/pokimanelol/", 5900000, null, null, "Posts 2 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 58, unit: "%", collectedAt: daysAgo(6), source: "Twitch Helix Metrics", status: "public", confidence: 0.95 },
      { dimension: "country", value: "Canada", amount: 15, unit: "%", collectedAt: daysAgo(6), source: "Twitch Helix Metrics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United Kingdom", amount: 9, unit: "%", collectedAt: daysAgo(6), source: "Twitch Helix Metrics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "poki@unitedtalent.com",
      sourceUrl: "https://www.twitch.tv/pokimane/about",
      lastChecked: daysAgo(4),
    },
  },

  // 12. Zach King (TikTok)
  {
    id: "creator-zachking",
    name: "Zach King",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Channel & TikTok Portal",
    bio: "Filmmaker and illusionist famous for seamless digital sleight-of-hand video edits and cinematic visual effects.",
    avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-zachking-tt", "TikTok", "@zachking", "https://www.tiktok.com/@zachking", 82400000, 9200000, "avg_video_views", "Posts 2-3 illusions / week"),
      createAccount("acc-zachking-yt", "YouTube", "@ZachKing", "https://www.youtube.com/@ZachKing", 32800000, 6800000, "avg_video_views", "Posts shorts & breakdowns weekly"),
      createAccount("acc-zachking-ig", "Instagram", "zachking", "https://www.instagram.com/zachking/", 28400000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 46, unit: "%", collectedAt: daysAgo(8), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "Brazil", amount: 14, unit: "%", collectedAt: daysAgo(8), source: "Verified Platform Analytics", status: "public", confidence: 0.92 },
      { dimension: "country", value: "United Kingdom", amount: 10, unit: "%", collectedAt: daysAgo(8), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "India", amount: 9, unit: "%", collectedAt: daysAgo(8), source: "Verified Platform Analytics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "hello@kingstudio.com",
      sourceUrl: "https://www.youtube.com/@ZachKing/about",
      lastChecked: daysAgo(3),
    },
  },

  // 13. Linus Tech Tips (YouTube)
  {
    id: "creator-linus",
    name: "Linus Tech Tips",
    category: "Technology",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Official Channel & Floatplane",
    bio: "Passionate tech team building extreme PCs, testing enterprise servers, benchmarking monitors, and teardowns.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-linus-yt", "YouTube", "@LinusTechTips", "https://www.youtube.com/@LinusTechTips", 15900000, 1350000, "avg_video_views", "Daily tech features & teardowns"),
      createAccount("acc-linus-twitch", "Twitch", "linustech", "https://www.twitch.tv/linustech", 1120000, 8400, "avg_live_viewers", "Streams WAN Show Fridays"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 49, unit: "%", collectedAt: daysAgo(7), source: "Verified Platform Analytics", status: "public", confidence: 0.95 },
      { dimension: "country", value: "Canada", amount: 18, unit: "%", collectedAt: daysAgo(7), source: "Verified Platform Analytics", status: "public", confidence: 0.95 },
      { dimension: "country", value: "United Kingdom", amount: 11, unit: "%", collectedAt: daysAgo(7), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "Germany", amount: 7, unit: "%", collectedAt: daysAgo(7), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "sponsors@linusmediagroup.com",
      sourceUrl: "https://www.youtube.com/@LinusTechTips/about",
      lastChecked: daysAgo(2),
    },
  },

  // 14. Ibai (Twitch)
  {
    id: "creator-ibai",
    name: "Ibai Llanos",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Official Twitch Partner & Kings League",
    bio: "Spanish streaming titan, Esports founder, host of La Velada del Año boxing event, and Kings League president.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-ibai-twitch", "Twitch", "ibai", "https://www.twitch.tv/ibai", 16300000, 92000, "avg_live_viewers", "Streams 5 days / week"),
      createAccount("acc-ibai-yt", "YouTube", "@ibaillanos", "https://www.youtube.com/@ibaillanos", 12100000, 1850000, "avg_video_views", "Posts 3 videos / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 48, unit: "%", collectedAt: daysAgo(4), source: "Twitch Helix Metrics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "Mexico", amount: 22, unit: "%", collectedAt: daysAgo(4), source: "Twitch Helix Metrics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "Argentina", amount: 16, unit: "%", collectedAt: daysAgo(4), source: "Twitch Helix Metrics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "Colombia", amount: 8, unit: "%", collectedAt: daysAgo(4), source: "Twitch Helix Metrics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contacto@ibaillanos.com",
      sourceUrl: "https://www.twitch.tv/ibai/about",
      lastChecked: daysAgo(1),
    },
  },

  // 15. Westcol (Kick)
  {
    id: "creator-westcol",
    name: "Westcol (Luis Villa)",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Colombia",
    creatorCountrySource: "Kick Official Channel",
    bio: "Top Latin American live creator, music event producer, talk shows, and urban culture streaming icon.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-westcol-kick", "Kick", "westcol", "https://kick.com/westcol", 1180000, 36500, "avg_live_viewers", "Streams 5 days / week"),
      createAccount("acc-westcol-ig", "Instagram", "westcol", "https://www.instagram.com/westcol/", 4200000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Colombia", amount: 58, unit: "%", collectedAt: daysAgo(6), source: "Kick API & Public Metrics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "Mexico", amount: 18, unit: "%", collectedAt: daysAgo(6), source: "Kick API & Public Metrics", status: "public", confidence: 0.91 },
      { dimension: "country", value: "Spain", amount: 12, unit: "%", collectedAt: daysAgo(6), source: "Kick API & Public Metrics", status: "public", confidence: 0.90 },
    ],
    businessContact: {
      email: "bookingwestcol@gmail.com",
      sourceUrl: "https://kick.com/westcol",
      lastChecked: daysAgo(3),
    },
  },

  // 16. Cristiano Ronaldo (Instagram)
  {
    id: "creator-cristiano",
    name: "Cristiano Ronaldo",
    category: "Sports",
    language: "Portuguese",
    creatorCountry: "Portugal",
    creatorCountrySource: "Verified Official Account",
    bio: "Football icon, five-time Ballon d'Or winner, global athlete, wellness ambassador, and most followed person on Instagram.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-cr7-ig", "Instagram", "cristiano", "https://www.instagram.com/cristiano/", 642000000, null, null, "Posts 4-5 times / week"),
      createAccount("acc-cr7-yt", "YouTube", "@URCristiano", "https://www.youtube.com/@URCristiano", 72500000, 18500000, "avg_video_views", "Posts 2-3 videos / month"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Brazil", amount: 18, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.95 },
      { dimension: "country", value: "India", amount: 16, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "Portugal", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.95 },
    ],
    businessContact: {
      email: "commercial@cristianoronaldo.com",
      sourceUrl: "https://www.cristianoronaldo.com",
      lastChecked: daysAgo(2),
    },
  },

  // 17. Veritasium (YouTube)
  {
    id: "creator-veritasium",
    name: "Veritasium (Derek Muller)",
    category: "Education",
    language: "English",
    creatorCountry: "Australia",
    creatorCountrySource: "Official Channel & Website",
    bio: "An element of truth: thought-provoking science experiments, physics paradoxes, and engineering investigations.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-veritasium-yt", "YouTube", "@veritasium", "https://www.youtube.com/@veritasium", 16900000, 4200000, "avg_video_views", "Posts 2 deep-dive videos / month"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 48, unit: "%", collectedAt: daysAgo(7), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.96 },
      { dimension: "country", value: "United Kingdom", amount: 14, unit: "%", collectedAt: daysAgo(7), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.95 },
      { dimension: "country", value: "Australia", amount: 12, unit: "%", collectedAt: daysAgo(7), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.96 },
      { dimension: "country", value: "Canada", amount: 9, unit: "%", collectedAt: daysAgo(7), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.94 },
    ],
    businessContact: {
      email: "business@veritasium.com",
      sourceUrl: "https://www.veritasium.com",
      lastChecked: daysAgo(4),
    },
  },

  // 18. Tarik (Twitch)
  {
    id: "creator-tarik",
    name: "Tarik (Tarik Celik)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Twitch Partner Profile",
    bio: "Major Champion in CS:GO, premier Valorant co-streamer and content creator for Sentinels.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-tarik-twitch", "Twitch", "tarik", "https://www.twitch.tv/tarik", 3550000, 28500, "avg_live_viewers", "Streams 6 days / week"),
      createAccount("acc-tarik-yt", "YouTube", "@tarik", "https://www.youtube.com/@tarik", 1480000, 310000, "avg_video_views", "Daily tournament & rank uploads"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Twitch Helix Metrics", status: "public", confidence: 0.95 },
      { dimension: "country", value: "Canada", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Twitch Helix Metrics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "Turkey", amount: 10, unit: "%", collectedAt: daysAgo(5), source: "Twitch Helix Metrics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "tarikbiz@unitedtalent.com",
      sourceUrl: "https://www.twitch.tv/tarik/about",
      lastChecked: daysAgo(2),
    },
  },

  // 19. Charli D'Amelio (TikTok)
  {
    id: "creator-charlidamelio",
    name: "Charli D'Amelio",
    category: "Lifestyle",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "TikTok Creator Portal",
    bio: "Cultural icon, competitive dancer, fashion entrepreneur, and one of the pioneers of digital creator entertainment.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-charli-tt", "TikTok", "@charlidamelio", "https://www.tiktok.com/@charlidamelio", 155800000, 8400000, "avg_video_views", "Posts 4-5 times / week"),
      createAccount("acc-charli-ig", "Instagram", "charlidamelio", "https://www.instagram.com/charlidamelio/", 44600000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 52, unit: "%", collectedAt: daysAgo(6), source: "TikTok Verified Partner", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United Kingdom", amount: 12, unit: "%", collectedAt: daysAgo(6), source: "TikTok Verified Partner", status: "public", confidence: 0.93 },
      { dimension: "country", value: "Canada", amount: 8, unit: "%", collectedAt: daysAgo(6), source: "TikTok Verified Partner", status: "public", confidence: 0.92 },
      { dimension: "country", value: "Brazil", amount: 8, unit: "%", collectedAt: daysAgo(6), source: "TikTok Verified Partner", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "info@dameliabrands.com",
      sourceUrl: "https://www.instagram.com/charlidamelio/",
      lastChecked: daysAgo(3),
    },
  },

  // 20. Dude Perfect (YouTube)
  {
    id: "creator-dudeperfect",
    name: "Dude Perfect",
    category: "Sports",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Channel & Website",
    bio: "Five best friends known for mind-blowing sports trick shots, comedy sketches, and world record challenges.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-dudeperfect-yt", "YouTube", "@DudePerfect", "https://www.youtube.com/@DudePerfect", 60600000, 11200000, "avg_video_views", "Posts 2 mega features / month"),
      createAccount("acc-dudeperfect-tt", "TikTok", "@dudeperfect", "https://www.tiktok.com/@dudeperfect", 17900000, 3100000, "avg_video_views", "Posts 3 trick clips / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 62, unit: "%", collectedAt: daysAgo(8), source: "YouTube Verified Analytics", status: "creator_authorized", confidence: 0.97 },
      { dimension: "country", value: "United Kingdom", amount: 10, unit: "%", collectedAt: daysAgo(8), source: "YouTube Verified Analytics", status: "creator_authorized", confidence: 0.94 },
      { dimension: "country", value: "Canada", amount: 8, unit: "%", collectedAt: daysAgo(8), source: "YouTube Verified Analytics", status: "creator_authorized", confidence: 0.95 },
      { dimension: "country", value: "Australia", amount: 6, unit: "%", collectedAt: daysAgo(8), source: "YouTube Verified Analytics", status: "creator_authorized", confidence: 0.94 },
    ],
    businessContact: {
      email: "contact@dudeperfect.com",
      sourceUrl: "https://dudeperfect.com",
      lastChecked: daysAgo(4),
    },
  },

  // 21. Selena Gomez (Instagram)
  {
    id: "creator-selenagomez",
    name: "Selena Gomez",
    category: "Music",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Instagram Channel",
    bio: "Global artist, actress, founder of Rare Beauty, and mental health advocate with one of the world's most engaged communities.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-selena-ig", "Instagram", "selenagomez", "https://www.instagram.com/selenagomez/", 424000000, null, null, "Posts 3 times / week"),
      createAccount("acc-selena-tt", "TikTok", "@selenagomez", "https://www.tiktok.com/@selenagomez", 58900000, 6800000, "avg_video_views", "Posts 2 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 42, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.95 },
      { dimension: "country", value: "Brazil", amount: 16, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "Mexico", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.92 },
      { dimension: "country", value: "United Kingdom", amount: 8, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "press@rarebeauty.com",
      sourceUrl: "https://www.rarebeauty.com",
      lastChecked: daysAgo(2),
    },
  },

  // 22. NICKMERCS (Kick & Twitch)
  {
    id: "creator-nickmercs",
    name: "NICKMERCS (Nick Kolcheff)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Channel & MFAM Portal",
    bio: "Leader of the MFAM community, competitive battle royale streamer, fitness advocate, and Kick partner.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-nickmercs-kick", "Kick", "nickmercs", "https://kick.com/nickmercs", 465000, 12500, "avg_live_viewers", "Streams 4 days / week"),
      createAccount("acc-nickmercs-twitch", "Twitch", "nickmercs", "https://www.twitch.tv/nickmercs", 6700000, 14200, "avg_live_viewers", "Streams 2 days / week"),
      createAccount("acc-nickmercs-yt", "YouTube", "@NICKMERCS", "https://www.youtube.com/@NICKMERCS", 4020000, 240000, "avg_video_views", "Posts 4 videos / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 76, unit: "%", collectedAt: daysAgo(6), source: "Kick API & Public Metrics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "Canada", amount: 12, unit: "%", collectedAt: daysAgo(6), source: "Kick API & Public Metrics", status: "public", confidence: 0.92 },
      { dimension: "country", value: "United Kingdom", amount: 6, unit: "%", collectedAt: daysAgo(6), source: "Kick API & Public Metrics", status: "public", confidence: 0.91 },
    ],
    businessContact: {
      email: "nickmercs@loaded.gg",
      sourceUrl: "https://kick.com/nickmercs",
      lastChecked: daysAgo(3),
    },
  },

  // 23. Cleo Abram (YouTube)
  {
    id: "creator-cleoabram",
    name: "Cleo Abram (Huge If True)",
    category: "Technology",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Channel & Substack",
    bio: "Optimistic science and tech journalist explaining AI, nuclear fusion, quantum computing, and the future.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-cleo-yt", "YouTube", "@CleoAbram", "https://www.youtube.com/@CleoAbram", 2850000, 1420000, "avg_video_views", "Posts 1-2 deep dives / month"),
      createAccount("acc-cleo-tt", "TikTok", "@cleoabram", "https://www.tiktok.com/@cleoabram", 2150000, 580000, "avg_video_views", "Posts 3 tech shorts / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 56, unit: "%", collectedAt: daysAgo(7), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.96 },
      { dimension: "country", value: "United Kingdom", amount: 13, unit: "%", collectedAt: daysAgo(7), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.94 },
      { dimension: "country", value: "Canada", amount: 10, unit: "%", collectedAt: daysAgo(7), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.94 },
      { dimension: "country", value: "Germany", amount: 6, unit: "%", collectedAt: daysAgo(7), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.93 },
    ],
    businessContact: {
      email: "partnerships@hugeiftrue.com",
      sourceUrl: "https://hugeiftrue.com",
      lastChecked: daysAgo(2),
    },
  },

  // 24. Leo Messi (Instagram)
  {
    id: "creator-leomessi",
    name: "Leo Messi",
    category: "Sports",
    language: "Spanish",
    creatorCountry: "Argentina",
    creatorCountrySource: "Official Verified Account",
    bio: "World Cup Champion, eight-time Ballon d'Or winner, Inter Miami forward, and global sports ambassador.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-messi-ig", "Instagram", "leomessi", "https://www.instagram.com/leomessi/", 504000000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Argentina", amount: 24, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.95 },
      { dimension: "country", value: "United States", amount: 18, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "Spain", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "Brazil", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "info@leomessi.com",
      sourceUrl: "https://messi.com",
      lastChecked: daysAgo(1),
    },
  },
];
