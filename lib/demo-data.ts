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

function snapshot(
  accountId: string,
  metricName: string,
  value: number | null,
  unit: MetricSnapshot["unit"],
  days: number,
  periodLabel: string | null = null,
  sampleSize: number | null = null,
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
    source: "Synthetic demo record",
    status: "estimated",
  };
}

function account(
  id: string,
  platform: Platform,
  handle: string,
  followers: number | null,
  reach: number | null,
  reachMetric: ReachMetricName | null,
  activity: string | null,
): PlatformAccount {
  const unit: MetricSnapshot["unit"] = reachMetric === "avg_live_viewers" ? "count" : "views";
  const phase = [...id].reduce((total, character) => total + character.charCodeAt(0), 0) % 31;
  const followerHistory = Array.from({ length: 15 }, (_, days) =>
    snapshot(id, "followers", dailyValue(followers, days, 0.0014, phase), "count", days),
  );
  const reachHistory = reachMetric
    ? Array.from({ length: 15 }, (_, days) =>
        snapshot(
          id,
          reachMetric,
          dailyValue(reach, days, 0.0025, phase),
          unit,
          days,
          "Recent 30 days",
          reachMetric === "avg_live_viewers" ? 24 : 8,
        ),
      )
    : [];
  const snapshots = [
    ...followerHistory,
    snapshot(id, "followers", followers === null ? null : Math.round(followers * 0.96), "count", 30),
    ...reachHistory,
    ...(reachMetric
      ? [snapshot(
          id,
          reachMetric,
          reach === null ? null : Math.round(reach * 0.93),
          unit,
          30,
          "Recent 30 days",
          reachMetric === "avg_live_viewers" ? 24 : 8,
        )]
      : []),
  ];
  return {
    id,
    platform,
    handle,
    profileUrl: `https://${platform.toLowerCase()}.example/${handle}`,
    activity,
    snapshots,
  };
}

function dailyValue(value: number | null, days: number, dailyGrowth: number, phase: number) {
  if (value === null) return null;
  const drift = 1 / (1 + dailyGrowth * days);
  const variation = days === 0 ? 1 : 1 + Math.sin((days + phase) * 0.8) * 0.004;
  return Math.max(0, Math.round(value * drift * variation));
}

const seeds: Array<{
  name: string;
  category: string;
  language: string;
  country: string;
  bio: string;
  avatar: string;
  account: Parameters<typeof account>;
}> = [
  {
    name: "NovaPlays",
    category: "Gaming",
    language: "English",
    country: "United States",
    bio: "Variety streamer focused on co-op adventures and community nights.",
    avatar: "NP",
    account: ["creator-01-account-01", "Twitch", "novaplays", 284000, 4820, "avg_live_viewers", "Streams 4 days / week"],
  },
  {
    name: "MiraMakes",
    category: "Art & Design",
    language: "English",
    country: "Canada",
    bio: "Illustrator sharing process videos, studio routines, and live drawing.",
    avatar: "MM",
    account: ["creator-02-account-01", "YouTube", "miramakes", 162000, 38700, "avg_video_views", "Posts 2 videos / week"],
  },
  {
    name: "KairoLive",
    category: "Gaming",
    language: "Spanish",
    country: "Mexico",
    bio: "Competitive and variety gaming with a welcoming LATAM community.",
    avatar: "KL",
    account: ["creator-03-account-01", "Kick", "kairolive", 93600, 2360, "avg_live_viewers", "Streams 5 days / week"],
  },
  {
    name: "SageInTheKitchen",
    category: "Food",
    language: "English",
    country: "United Kingdom",
    bio: "Practical recipes, ingredient deep-dives, and relaxed live cook-alongs.",
    avatar: "SK",
    account: ["creator-04-account-01", "TikTok", "sageinthekitchen", 512000, 87400, "avg_video_views", "Posts 5 videos / week"],
  },
  {
    name: "StudioJun",
    category: "Fashion",
    language: "Korean",
    country: "South Korea",
    bio: "Independent stylist exploring thoughtful wardrobes and emerging labels.",
    avatar: "SJ",
    account: ["creator-05-account-01", "Instagram", "studiojun", 74800, null, null, "Posts 3 times / week"],
  },
  {
    name: "PixelAndPine",
    category: "Gaming",
    language: "English",
    country: "Australia",
    bio: "Cozy games, creative builds, and long-form community streams.",
    avatar: "PP",
    account: ["creator-06-account-01", "Twitch", "pixelandpine", 118000, 1640, "avg_live_viewers", "Streams 3 days / week"],
  },
  {
    name: "DailyWithAna",
    category: "Lifestyle",
    language: "Portuguese",
    country: "Brazil",
    bio: "Small-space living, mindful routines, and accessible home projects.",
    avatar: "DA",
    account: ["creator-07-account-01", "YouTube", "dailywithana", 347000, 28900, "avg_video_views", "Posts 1 video / week"],
  },
  {
    name: "CoachRae",
    category: "Wellness",
    language: "English",
    country: "United States",
    bio: "Evidence-aware movement sessions and realistic recovery conversations.",
    avatar: "CR",
    account: ["creator-08-account-01", "Kick", "coachrae", 48200, 790, "avg_live_viewers", "Streams 2 days / week"],
  },
  {
    name: "NoahBuilds",
    category: "Technology",
    language: "English",
    country: "Germany",
    bio: "Maker projects, product teardowns, and explainers for curious builders.",
    avatar: "NB",
    account: ["creator-09-account-01", "TikTok", "noahbuilds", 203000, 41600, "avg_video_views", "Posts 4 videos / week"],
  },
  {
    name: "LunaReads",
    category: "Books",
    language: "French",
    country: "France",
    bio: "Genre fiction recommendations, thoughtful reviews, and reading sprints.",
    avatar: "LR",
    account: ["creator-10-account-01", "Instagram", "lunareads", null, null, null, null],
  },
  {
    name: "VantaVibe",
    category: "Gaming",
    language: "Hindi",
    country: "India",
    bio: "Competitive co-op sessions, new game discoveries, and community challenges.",
    avatar: "VV",
    account: ["creator-11-account-01", "Twitch", "vantavibe", 176000, 2480, "avg_live_viewers", "Streams 4 days / week"],
  },
  {
    name: "OraSketch",
    category: "Art & Design",
    language: "Japanese",
    country: "Japan",
    bio: "Digital illustration tutorials, character studies, and quiet studio streams.",
    avatar: "OS",
    account: ["creator-12-account-01", "YouTube", "orasketch", 221000, 18600, "avg_video_views", "Posts 2 videos / week"],
  },
  {
    name: "BeatByMila",
    category: "Music",
    language: "Spanish",
    country: "Spain",
    bio: "Songwriting diaries, live loop sessions, and independent music discoveries.",
    avatar: "BM",
    account: ["creator-13-account-01", "TikTok", "beatbymila", 389000, 52100, "avg_video_views", "Posts 4 videos / week"],
  },
  {
    name: "TheGreenRoomLab",
    category: "Food",
    language: "English",
    country: "United States",
    bio: "Seasonal recipes, kitchen experiments, and low-waste cooking ideas.",
    avatar: "GR",
    account: ["creator-14-account-01", "YouTube", "greenroomlab", 482000, 62100, "avg_video_views", "Posts 2 videos / week"],
  },
  {
    name: "QuietMiles",
    category: "Travel",
    language: "German",
    country: "Germany",
    bio: "Slow travel guides, accessible itineraries, and thoughtful city walks.",
    avatar: "QM",
    account: ["creator-15-account-01", "Instagram", "quietmiles", 93700, null, null, "Posts 3 times / week"],
  },
  {
    name: "RiverRunsCozy",
    category: "Gaming",
    language: "English",
    country: "Ireland",
    bio: "Cozy game nights, relaxed live chats, and community-made worlds.",
    avatar: "RC",
    account: ["creator-16-account-01", "Kick", "riverrunscozy", 87000, 1150, "avg_live_viewers", "Streams 3 days / week"],
  },
  {
    name: "ZeeReadsAloud",
    category: "Books",
    language: "Hindi",
    country: "India",
    bio: "Book reviews, reading lists, and conversations with emerging authors.",
    avatar: "ZR",
    account: ["creator-17-account-01", "YouTube", "zeereadsaloud", 132000, 14800, "avg_video_views", "Posts 1 video / week"],
  },
  {
    name: "MotionWithMaya",
    category: "Wellness",
    language: "Portuguese",
    country: "Brazil",
    bio: "Accessible movement routines, recovery tips, and joyful daily practice.",
    avatar: "MM",
    account: ["creator-18-account-01", "TikTok", "motionwithmaya", 611000, 84500, "avg_video_views", "Posts 5 videos / week"],
  },
  {
    name: "DesignByNico",
    category: "Fashion",
    language: "French",
    country: "France",
    bio: "Independent fashion finds, styling notes, and behind-the-scenes design work.",
    avatar: "DN",
    account: ["creator-19-account-01", "Instagram", "designbynico", 204000, null, null, "Posts 3 times / week"],
  },
  {
    name: "CircuitScout",
    category: "Technology",
    language: "English",
    country: "Canada",
    bio: "Friendly hardware explainers, maker builds, and practical tech experiments.",
    avatar: "CS",
    account: ["creator-20-account-01", "Twitch", "circuitscout", 63000, 460, "avg_live_viewers", "Streams 2 days / week"],
  },
  {
    name: "KaiFieldNotes",
    category: "Travel",
    language: "Japanese",
    country: "Japan",
    bio: "Field guides to local neighborhoods, nature trails, and small museums.",
    avatar: "KF",
    account: ["creator-21-account-01", "YouTube", "kaifieldnotes", 305000, 27600, "avg_video_views", "Posts 2 videos / week"],
  },
  {
    name: "StudioLumi",
    category: "Art & Design",
    language: "Spanish",
    country: "Mexico",
    bio: "Color studies, illustration process, and creative prompts for beginners.",
    avatar: "SL",
    account: ["creator-22-account-01", "Instagram", "studiolumi", 142000, null, null, "Posts 4 times / week"],
  },
  {
    name: "CoachElio",
    category: "Wellness",
    language: "Italian",
    country: "Italy",
    bio: "Mindful strength sessions and practical ways to build lasting habits.",
    avatar: "CE",
    account: ["creator-23-account-01", "Kick", "coachelio", 51700, 690, "avg_live_viewers", "Streams 3 days / week"],
  },
  {
    name: "TinyTableTales",
    category: "Food",
    language: "English",
    country: "Australia",
    bio: "Small-batch baking, weeknight meals, and stories behind family recipes.",
    avatar: "TT",
    account: ["creator-24-account-01", "TikTok", "tinytabletales", 741000, 115000, "avg_video_views", "Posts 5 videos / week"],
  },
  {
    name: "AfterHoursArcade",
    category: "Gaming",
    language: "English",
    country: "United Kingdom",
    bio: "Indie game spotlights, late-night streams, and friendly multiplayer runs.",
    avatar: "AA",
    account: ["creator-25-account-01", "Twitch", "afterhoursarcade", 208000, 3310, "avg_live_viewers", "Streams 5 days / week"],
  },
  {
    name: "GreenPixelHome",
    category: "Lifestyle",
    language: "Spanish",
    country: "Mexico",
    bio: "Plant-filled spaces, practical home projects, and sustainable living ideas.",
    avatar: "GP",
    account: ["creator-26-account-01", "YouTube", "greenpixelhome", 184000, 16200, "avg_video_views", "Posts 1 video / week"],
  },
  {
    name: "NovaNotes",
    category: "Education",
    language: "Korean",
    country: "South Korea",
    bio: "Study techniques, bite-sized science explainers, and curiosity-led lessons.",
    avatar: "NN",
    account: ["creator-27-account-01", "TikTok", "novanotes", 420000, 54800, "avg_video_views", "Posts 4 videos / week"],
  },
  {
    name: "MikoMakesStuff",
    category: "Technology",
    language: "English",
    country: "Singapore",
    bio: "Creative coding, practical electronics, and accessible maker projects.",
    avatar: "MS",
    account: ["creator-28-account-01", "YouTube", "mikomakesstuff", 278000, 31100, "avg_video_views", "Posts 2 videos / week"],
  },
  {
    name: "SundayStrings",
    category: "Music",
    language: "Portuguese",
    country: "Portugal",
    bio: "Acoustic covers, instrument practice, and new music from local artists.",
    avatar: "SS",
    account: ["creator-29-account-01", "Instagram", "sundaystrings", 110000, null, null, "Posts 3 times / week"],
  },
  {
    name: "CrewFourCorners",
    category: "Lifestyle",
    language: "English",
    country: "New Zealand",
    bio: "Outdoor community streams, low-key adventures, and everyday stories.",
    avatar: "CC",
    account: ["creator-30-account-01", "Kick", "crewfourcorners", 68500, 830, "avg_live_viewers", "Streams 3 days / week"],
  },
];

export const DEMO_CREATORS: Creator[] = seeds.map((seed, index) => {
  const [id, platform, handle, followers, reach, reachMetric, activity] = seed.account;
  const accounts = [account(id, platform, handle, followers, reach, reachMetric, activity)];
  if (index === 0) {
    accounts.push(
      account("creator-01-account-02", "YouTube", "novaplays", 98000, 14300, "avg_video_views", "Posts 1 video / week"),
    );
  }
  return {
    id: `creator-${String(index + 1).padStart(2, "0")}`,
    name: seed.name,
    category: seed.category,
    language: seed.language,
    creatorCountry: seed.country,
    creatorCountrySource: "Synthetic demo record",
    bio: seed.bio,
    avatar: seed.avatar,
    accounts,
    audienceInsights: [],
    businessContact:
      index === 1
        ? {
            email: "partnerships@example.test",
            sourceUrl: "https://example.test/contact",
            lastChecked: daysAgo(5),
          }
        : null,
  };
});

export const DEMO_UPDATED_AT = daysAgo(1);
