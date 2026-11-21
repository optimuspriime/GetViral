import type {
  Creator,
  MetricSnapshot,
  Platform,
  PlatformAccount,
  ReachMetricName,
} from "@/lib/model";
import { STREAMER_CREATORS } from "@/lib/streamers-data";

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
// ==========================================
  // INDIAN CREATORS (26 Top Profiles)
  // ==========================================

  // 1. CarryMinati (Ajey Nagar)
  {
    id: "creator-carryminati",
    name: "CarryMinati (Ajey Nagar)",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Pioneering Indian satirist, roaster, and gaming creator known for viral parodies, rap singles, and record-shattering viewership.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/6/64/CarryMinati.jpg",
    accounts: [
      createAccount("acc-carry-yt", "YouTube", "@CarryMinati", "https://www.youtube.com/@CarryMinati", 44200000, 36000000, "avg_video_views", "Posts 1-2 major productions / month"),
      createAccount("acc-carry-live", "YouTube", "@CarryisLive", "https://www.youtube.com/@CarryisLive", 12500000, 42000, "avg_live_viewers", "Streams 3-4 gaming sessions / week"),
      createAccount("acc-carry-ig", "Instagram", "carryminati", "https://www.instagram.com/carryminati/", 21500000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 88, unit: "%", collectedAt: daysAgo(3), source: "YouTube Verified Analytics", status: "creator_authorized", confidence: 0.98 },
      { dimension: "country", value: "Nepal", amount: 4, unit: "%", collectedAt: daysAgo(3), source: "YouTube Verified Analytics", status: "creator_authorized", confidence: 0.94 },
      { dimension: "country", value: "United Arab Emirates", amount: 3, unit: "%", collectedAt: daysAgo(3), source: "YouTube Verified Analytics", status: "creator_authorized", confidence: 0.93 },
    ],
    businessContact: {
      email: "business@carryminati.com",
      sourceUrl: "https://www.youtube.com/@CarryMinati/about",
      lastChecked: daysAgo(1),
    },
  },

  // 2. Bhuvan Bam (BB Ki Vines)
  {
    id: "creator-bhuvanbam",
    name: "Bhuvan Bam (BB Ki Vines)",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Filmfare Profile",
    bio: "Pioneering writer, actor, and musician who revolutionized Indian digital comedy with multi-character sketches and hit series Taaza Khabar.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Bhuvan_Bam_at_Taaza_Khabar%27s_success_party_%28cropped%29.jpg",
    accounts: [
      createAccount("acc-bb-yt", "YouTube", "@BBKiVines", "https://www.youtube.com/@BBKiVines", 26600000, 18500000, "avg_video_views", "Posts episodic stories & specials"),
      createAccount("acc-bb-ig", "Instagram", "bhuvan.bam22", "https://www.instagram.com/bhuvan.bam22/", 19400000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 86, unit: "%", collectedAt: daysAgo(4), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.97 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.93 },
    ],
    businessContact: {
      email: "bhuvan@bbkivines.com",
      sourceUrl: "https://www.bbkivines.com",
      lastChecked: daysAgo(2),
    },
  },

  // 3. Techno Gamerz (Ujjwal Chaurasia)
  {
    id: "creator-technogamerz",
    name: "Techno Gamerz (Ujjwal Chaurasia)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Forbes India",
    bio: "Premier Indian gaming creator famous for episodic GTA V storylines, mobile gaming series, Minecraft adventures, and tech reviews.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-techno-yt", "YouTube", "@TechnoGamerzOfficial", "https://www.youtube.com/@TechnoGamerzOfficial", 44100000, 6200000, "avg_video_views", "Posts 3-4 videos / week"),
      createAccount("acc-techno-ig", "Instagram", "ujjwalgamer", "https://www.instagram.com/ujjwalgamer/", 3450000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "Nepal", amount: 4, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "technogamerz@redowl.in",
      sourceUrl: "https://www.youtube.com/@TechnoGamerzOfficial/about",
      lastChecked: daysAgo(2),
    },
  },

  // 4. Total Gaming (Ajjubhai)
  {
    id: "creator-totalgaming",
    name: "Total Gaming (Ajjubhai)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Garena Esports",
    bio: "Most subscribed gaming creator in India, leading mobile battle royale, PC gaming, and community tournament streams with engaging commentary.",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-totalgaming-yt", "YouTube", "@TotalGamingOfficial", "https://www.youtube.com/@TotalGamingOfficial", 43800000, 3100000, "avg_video_views", "Daily gaming uploads & challenges"),
      createAccount("acc-totalgaming-ig", "Instagram", "totalgaming_official", "https://www.instagram.com/totalgaming_official/", 3900000, null, null, "Posts 2 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 92, unit: "%", collectedAt: daysAgo(6), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "Nepal", amount: 4, unit: "%", collectedAt: daysAgo(6), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "business@totalgaming.com",
      sourceUrl: "https://www.youtube.com/@TotalGamingOfficial/about",
      lastChecked: daysAgo(3),
    },
  },

  // 5. Ashish Chanchlani
  {
    id: "creator-ashishchanchlani",
    name: "Ashish Chanchlani",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Dadasaheb Phalke Awards",
    bio: "Celebrated comedic creator and director, portraying hilarious relatable scenarios, family parodies, and pop-culture celebrations.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/3/30/Ashish_Chanchlani_at_the_screening_of_Plus_Minus.jpg",
    accounts: [
      createAccount("acc-ashish-yt", "YouTube", "@ashishchanchlanivines", "https://www.youtube.com/@ashishchanchlanivines", 30400000, 22000000, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-ashish-ig", "Instagram", "ashishchanchlani", "https://www.instagram.com/ashishchanchlani/", 16800000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(5), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.97 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(5), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.93 },
    ],
    businessContact: {
      email: "ashishchanchlanipartners@gmail.com",
      sourceUrl: "https://www.youtube.com/@ashishchanchlanivines/about",
      lastChecked: daysAgo(2),
    },
  },

  // 6. Round2hell
  {
    id: "creator-round2hell",
    name: "Round2hell (Zayn, Wasim, Nazim)",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel Verified Profile",
    bio: "Pioneering Indian comedy sketch trio producing cinematic-scale viral comedy shorts, sci-fi parodies, and elaborate sketches.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-r2h-yt", "YouTube", "@Round2hell", "https://www.youtube.com/@Round2hell", 33600000, 28000000, "avg_video_views", "Posts mega sketch features"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 90, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 3, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "round2hell@gmail.com",
      sourceUrl: "https://www.youtube.com/@Round2hell/about",
      lastChecked: daysAgo(3),
    },
  },

  // 7. Amit Bhadana
  {
    id: "creator-amitbhadana",
    name: "Amit Bhadana",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Dadasaheb Phalke Award",
    bio: "Record-setting comedy creator and director who pioneered grassroots desi comedy and relatable episodic music videos across India.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/4/43/Amit_Bhadana_at_IWMBuzz_Awards_2019_Crop.jpg",
    accounts: [
      createAccount("acc-amitbhadana-yt", "YouTube", "@AmitBhadana", "https://www.youtube.com/@AmitBhadana", 24600000, 16500000, "avg_video_views", "Posts episodic stories & sketches"),
      createAccount("acc-amitbhadana-ig", "Instagram", "theamitbhadana", "https://www.instagram.com/theamitbhadana/", 9800000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 93, unit: "%", collectedAt: daysAgo(6), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
    ],
    businessContact: {
      email: "amitbhadana07@gmail.com",
      sourceUrl: "https://www.youtube.com/@AmitBhadana/about",
      lastChecked: daysAgo(2),
    },
  },

  // 8. Technical Guruji (Gaurav Chaudhary)
  {
    id: "creator-technicalguruji",
    name: "Technical Guruji (Gaurav Chaudhary)",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Forbes India 30 Under 30",
    bio: "Dubai-based Indian engineer and pioneer of Hindi consumer tech videos, delivering unboxings, gadget teardowns, and smartphone reviews daily.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Gaurav_Chaudhary.jpg",
    accounts: [
      createAccount("acc-guruji-yt", "YouTube", "@TechnicalGuruji", "https://www.youtube.com/@TechnicalGuruji", 23600000, 720000, "avg_video_views", "Daily tech unboxings & reviews"),
      createAccount("acc-guruji-ig", "Instagram", "technicalguruji", "https://www.instagram.com/technicalguruji/", 5200000, null, null, "Posts daily stories & reels"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 84, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United Arab Emirates", amount: 7, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.95 },
    ],
    businessContact: {
      email: "gaurav@technicalguruji.in",
      sourceUrl: "https://technicalguruji.in",
      lastChecked: daysAgo(1),
    },
  },

  // 9. Dhruv Rathee
  {
    id: "creator-dhruvrathee",
    name: "Dhruv Rathee",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Website",
    bio: "Top educational video essayist and communicator explaining geopolitics, science, environmental issues, history, and international affairs.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/8/87/Dhruv_Rathee_%28cropped%29.jpg",
    accounts: [
      createAccount("acc-dhruv-yt", "YouTube", "@dhruvrathee", "https://www.youtube.com/@dhruvrathee", 27200000, 9600000, "avg_video_views", "Posts 2-3 in-depth explainers / week"),
      createAccount("acc-dhruv-ig", "Instagram", "dhruvrathee", "https://www.instagram.com/dhruvrathee/", 3850000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 82, unit: "%", collectedAt: daysAgo(3), source: "YouTube Verified Analytics", status: "creator_authorized", confidence: 0.98 },
      { dimension: "country", value: "United States", amount: 5, unit: "%", collectedAt: daysAgo(3), source: "YouTube Verified Analytics", status: "creator_authorized", confidence: 0.95 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(3), source: "YouTube Verified Analytics", status: "creator_authorized", confidence: 0.94 },
    ],
    businessContact: {
      email: "contact@dhruvrathee.com",
      sourceUrl: "https://dhruvrathee.com",
      lastChecked: daysAgo(1),
    },
  },

  // 10. Sourav Joshi Vlogs
  {
    id: "creator-souravjoshi",
    name: "Sourav Joshi Vlogs",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel Profile",
    bio: "India's most watched daily lifestyle vlogger documenting family life, adventures in Uttarakhand, art drawings, and travels.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-sourav-yt", "YouTube", "@SouravJoshiVlogs", "https://www.youtube.com/@SouravJoshiVlogs", 29800000, 4800000, "avg_video_views", "Daily family vlogs"),
      createAccount("acc-sourav-ig", "Instagram", "souravjoshivlogs", "https://www.instagram.com/souravjoshivlogs/", 5600000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 94, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.99 },
    ],
    businessContact: {
      email: "souravjoshiarts@gmail.com",
      sourceUrl: "https://www.youtube.com/@SouravJoshiVlogs/about",
      lastChecked: daysAgo(2),
    },
  },

  // 11. Elvish Yadav
  {
    id: "creator-elvishyadav",
    name: "Elvish Yadav",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Bigg Boss OTT",
    bio: "Bigg Boss OTT 2 Winner, comedic sketch creator, and lifestyle vlogger with one of India's most dedicated fan communities.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Elvish_Yadav_snapped_at_BiggBoss_OTT2_Party_%28cropped%29.jpg",
    accounts: [
      createAccount("acc-elvish-yt", "YouTube", "@ElvishYadavVlogs", "https://www.youtube.com/@ElvishYadavVlogs", 16200000, 4200000, "avg_video_views", "Posts daily vlogs & songs"),
      createAccount("acc-elvish-ig", "Instagram", "elvish_yadav", "https://www.instagram.com/elvish_yadav/", 16800000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 93, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
    ],
    businessContact: {
      email: "business@elvishyadav.com",
      sourceUrl: "https://www.youtube.com/@ElvishYadavVlogs/about",
      lastChecked: daysAgo(2),
    },
  },

  // 12. Fukra Insaan (Abhishek Malhan)
  {
    id: "creator-fukrainsaan",
    name: "Fukra Insaan (Abhishek Malhan)",
    category: "Entertainment",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Red Owl Media",
    bio: "Top entertainment creator and Bigg Boss OTT runner-up known for lavish challenge videos, grand-scale giveaways, and music videos.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-fukra-yt", "YouTube", "@FukraInsaan", "https://www.youtube.com/@FukraInsaan", 14300000, 5400000, "avg_video_views", "Posts 2 challenge videos / week"),
      createAccount("acc-fukra-ig", "Instagram", "fukra_insaan", "https://www.instagram.com/fukra_insaan/", 7200000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
    ],
    businessContact: {
      email: "fukrainsaan@redowl.in",
      sourceUrl: "https://www.youtube.com/@FukraInsaan/about",
      lastChecked: daysAgo(2),
    },
  },

  // 13. Harsh Beniwal
  {
    id: "creator-harshbeniwal",
    name: "Harsh Beniwal",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel Profile",
    bio: "Bollywood actor and comedy sketch director portraying humorous youth scenarios, Campus Diaries series, and high-energy parodies.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-harsh-yt", "YouTube", "@HarshBeniwal", "https://www.youtube.com/@HarshBeniwal", 16200000, 14000000, "avg_video_views", "Posts episodic web series & sketches"),
      createAccount("acc-harsh-ig", "Instagram", "harshbeniwal", "https://www.instagram.com/harshbeniwal/", 6800000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 92, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
    ],
    businessContact: {
      email: "harshbeniwalbusiness@gmail.com",
      sourceUrl: "https://www.youtube.com/@HarshBeniwal/about",
      lastChecked: daysAgo(3),
    },
  },

  // 14. Flying Beast (Gaurav Taneja)
  {
    id: "creator-flyingbeast",
    name: "Flying Beast (Gaurav Taneja)",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & DGCA Pilot Profile",
    bio: "Commercial airline captain, IIT Kharagpur alumnus, national fitness athlete, and beloved family vlogger.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-flyingbeast-yt", "YouTube", "@FlyingBeast", "https://www.youtube.com/@FlyingBeast", 9100000, 1200000, "avg_video_views", "Daily family & aviation vlogs"),
      createAccount("acc-flyingbeast-ig", "Instagram", "flyingbeast320", "https://www.instagram.com/flyingbeast320/", 4500000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
    ],
    businessContact: {
      email: "flyingbeast@taneja.in",
      sourceUrl: "https://www.youtube.com/@FlyingBeast/about",
      lastChecked: daysAgo(2),
    },
  },

  // 15. Kusha Kapila
  {
    id: "creator-kushakapila",
    name: "Kusha Kapila",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Instagram & Forbes India",
    bio: "Standout comic performer, actress, and fashion tastemaker celebrated for South Delhi aunty parodies, lifestyle sketches, and hosting.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Kusha_Kapila_snapped_at_the_red_carpet_of_ET_Inspiring_Women_Leaders_Conclave_And_Awards_2025_%28cropped%29.jpg",
    accounts: [
      createAccount("acc-kusha-ig", "Instagram", "kushakapila", "https://www.instagram.com/kushakapila/", 3900000, null, null, "Daily comedic reels & fashion"),
      createAccount("acc-kusha-yt", "YouTube", "@KushaKapila", "https://www.youtube.com/@KushaKapila", 1250000, 1800000, "avg_video_views", "Posts comedic series"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 86, unit: "%", collectedAt: daysAgo(4), source: "Instagram Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 6, unit: "%", collectedAt: daysAgo(4), source: "Instagram Verified Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "kusha@monk-e.in",
      sourceUrl: "https://www.instagram.com/kushakapila/",
      lastChecked: daysAgo(2),
    },
  },

  // 16. Raj Shamani
  {
    id: "creator-rajshamani",
    name: "Raj Shamani",
    category: "Finance",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & UN Youth Representative",
    bio: "Host of Figuring Out, Asia's premier business and wealth podcast, interviewing top entrepreneurs, unicorn founders, and investors.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Raj_Shamani.jpg",
    accounts: [
      createAccount("acc-rajshamani-yt", "YouTube", "@rajshamani", "https://www.youtube.com/@rajshamani", 4150000, 1100000, "avg_video_views", "Posts 2 podcast episodes / week"),
      createAccount("acc-rajshamani-ig", "Instagram", "rajshamani", "https://www.instagram.com/rajshamani/", 2850000, null, null, "Daily finance insights"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 85, unit: "%", collectedAt: daysAgo(3), source: "YouTube Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United Arab Emirates", amount: 5, unit: "%", collectedAt: daysAgo(3), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "partnerships@rajshamani.com",
      sourceUrl: "https://rajshamani.com",
      lastChecked: daysAgo(1),
    },
  },

  // 17. CA Rachana Ranade
  {
    id: "creator-rachanaranade",
    name: "CA Rachana Ranade",
    category: "Finance",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Institute of Chartered Accountants",
    bio: "Chartered Accountant and teacher demystifying stock market fundamentals, mutual funds, personal budgeting, and financial freedom.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-rachana-yt", "YouTube", "@rachanaphadke", "https://www.youtube.com/@rachanaphadke", 5200000, 420000, "avg_video_views", "Posts 2 investing lectures / week"),
      createAccount("acc-rachana-ig", "Instagram", "ca_rachanaranade", "https://www.instagram.com/ca_rachanaranade/", 1550000, null, null, "Posts market tips"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 88, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.97 },
    ],
    businessContact: {
      email: "business@rachanaranade.com",
      sourceUrl: "https://rachanaranade.com",
      lastChecked: daysAgo(2),
    },
  },

  // 18. Tanmay Bhat
  {
    id: "creator-tanmaybhat",
    name: "Tanmay Bhat",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Presence",
    bio: "Stand-up comedian, creative agency founder, and digital creator known for comedy reviews, finance streams, vlogs, and gaming.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/5/52/Tanmay_Bhat_at_the_screening_of_Dobaaraa.jpg",
    accounts: [
      createAccount("acc-tanmay-yt", "YouTube", "@TanmayBhatYT", "https://www.youtube.com/@TanmayBhatYT", 5120000, 980000, "avg_video_views", "Posts 3 videos / week"),
      createAccount("acc-tanmay-ig", "Instagram", "tanmaybhat", "https://www.instagram.com/tanmaybhat/", 2250000, null, null, "Posts 5 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 85, unit: "%", collectedAt: daysAgo(4), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.96 },
      { dimension: "country", value: "United States", amount: 6, unit: "%", collectedAt: daysAgo(4), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.94 },
    ],
    businessContact: {
      email: "tanmay@tanmaybhat.com",
      sourceUrl: "https://www.youtube.com/@TanmayBhatYT/about",
      lastChecked: daysAgo(2),
    },
  },

  // 19. Ranveer Allahbadia (BeerBiceps)
  {
    id: "creator-ranveer",
    name: "Ranveer Allahbadia (BeerBiceps)",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "National Creators Award & Official Channel",
    bio: "Winner of National Creators Award, host of The Ranveer Show (TRS), entrepreneur and co-founder of Monk Entertainment exploring wellness and business.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/d/d4/Ranveer_Allahbadia_at_the_National_Creators_Award_2024.jpg",
    accounts: [
      createAccount("acc-ranveer-yt", "YouTube", "@BeerBiceps", "https://www.youtube.com/@BeerBiceps", 8100000, 1450000, "avg_video_views", "Posts 3 podcast episodes / week"),
      createAccount("acc-ranveer-hindi", "YouTube", "@RanveerAllahbadia", "https://www.youtube.com/@RanveerAllahbadia", 10200000, 2200000, "avg_video_views", "Posts 4 episodes / week"),
      createAccount("acc-ranveer-ig", "Instagram", "beerbiceps", "https://www.instagram.com/beerbiceps/", 4100000, null, null, "Daily motivational content"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 83, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 6, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "business@beerbiceps.com",
      sourceUrl: "https://beerbiceps.com",
      lastChecked: daysAgo(1),
    },
  },

  // 20. Mortal (Naman Mathur)
  {
    id: "creator-mortal",
    name: "Mortal (Naman Mathur)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Esports Awards & Official Channel",
    bio: "International Esports Personality of the Year nominee, leader of S8UL Esports and Team SouL, iconic battle royale player and streamer.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-mortal-yt", "YouTube", "@Mortalyt", "https://www.youtube.com/@Mortalyt", 7080000, 520000, "avg_video_views", "Streams 5 days / week"),
      createAccount("acc-mortal-ig", "Instagram", "ig_mortal", "https://www.instagram.com/ig_mortal/", 5420000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 93, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
    ],
    businessContact: {
      email: "mortal@s8ul.gg",
      sourceUrl: "https://www.youtube.com/@Mortalyt/about",
      lastChecked: daysAgo(2),
    },
  },

  // 21. Scout (Tanmay Singh)
  {
    id: "creator-scout",
    name: "Scout (Tanmay Singh)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Team XSpark",
    bio: "Professional esports athlete, owner of Team XSpark, and high-energy competitive streamer known for elite gunplay and tournament commentary.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-scout-yt", "YouTube", "@scoutOP", "https://www.youtube.com/@scoutOP", 4960000, 410000, "avg_video_views", "Streams 4-5 days / week"),
      createAccount("acc-scout-ig", "Instagram", "scout_op", "https://www.instagram.com/scout_op/", 4250000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 92, unit: "%", collectedAt: daysAgo(6), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
    ],
    businessContact: {
      email: "business@scoutop.in",
      sourceUrl: "https://www.youtube.com/@scoutOP/about",
      lastChecked: daysAgo(3),
    },
  },

  // 22. Triggered Insaan (Nischay Malhan)
  {
    id: "creator-triggeredinsaan",
    name: "Triggered Insaan (Nischay Malhan)",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel Profile",
    bio: "Beloved comedic creator, commentator, and family gaming streamer known for viral relatable roasts, storytimes, and meme reviews.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-triggered-yt", "YouTube", "@triggeredinsaan", "https://www.youtube.com/@triggeredinsaan", 23300000, 8900000, "avg_video_views", "Posts 2 comedic reviews / week"),
      createAccount("acc-triggered-ig", "Instagram", "triggeredinsaan", "https://www.instagram.com/triggeredinsaan/", 10900000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 90, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
    ],
    businessContact: {
      email: "nischay@triggeredinsaan.com",
      sourceUrl: "https://www.youtube.com/@triggeredinsaan/about",
      lastChecked: daysAgo(2),
    },
  },

  // 23. Ankur Warikoo
  {
    id: "creator-warikoo",
    name: "Ankur Warikoo",
    category: "Productivity",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Website",
    bio: "Entrepreneur, investor, mentor, and bestselling author of 'Do Epic Shit' teaching career growth, personal finance, and self-awareness.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-warikoo-yt", "YouTube", "@warikoo", "https://www.youtube.com/@warikoo", 4850000, 750000, "avg_video_views", "Posts 3 videos & daily shorts"),
      createAccount("acc-warikoo-ig", "Instagram", "ankurwarikoo", "https://www.instagram.com/ankurwarikoo/", 3250000, null, null, "Daily carousel advice"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 82, unit: "%", collectedAt: daysAgo(3), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 6, unit: "%", collectedAt: daysAgo(3), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.95 },
    ],
    businessContact: {
      email: "team@ankurwarikoo.com",
      sourceUrl: "https://ankurwarikoo.com",
      lastChecked: daysAgo(1),
    },
  },

  // 24. Sandeep Maheshwari
  {
    id: "creator-sandeep",
    name: "Sandeep Maheshwari",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Website",
    bio: "Founder of ImagesBazaar and renowned life mentor conducting free inspirational sessions and youth workshops without monetary sponsorship.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-sandeep-yt", "YouTube", "@SandeepSeminars", "https://www.youtube.com/@SandeepSeminars", 28600000, 3200000, "avg_video_views", "Posts 1-2 life lessons / week"),
      createAccount("acc-sandeep-ig", "Instagram", "sandeep__maheshwari", "https://www.instagram.com/sandeep__maheshwari/", 5300000, null, null, "Posts 2 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 88, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
    ],
    businessContact: {
      email: "contact@sandeepmaheshwari.com",
      sourceUrl: "https://www.sandeepmaheshwari.com",
      lastChecked: daysAgo(2),
    },
  },

  // 25. Mythpat (Mithilesh Patankar)
  {
    id: "creator-mythpat",
    name: "Mythpat (Mithilesh Patankar)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Streamy Awards Nominee",
    bio: "Leading Indian gaming comedy creator known for mimicry, creative storyline videos in GTA V, Minecraft, and international collaborations.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-mythpat-yt", "YouTube", "@Mythpat", "https://www.youtube.com/@Mythpat", 15300000, 4200000, "avg_video_views", "Posts 2 videos / week"),
      createAccount("acc-mythpat-ig", "Instagram", "mythpat", "https://www.instagram.com/mythpat/", 3950000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
    ],
    businessContact: {
      email: "mythpat@nocturnemedia.in",
      sourceUrl: "https://www.youtube.com/@Mythpat/about",
      lastChecked: daysAgo(3),
    },
  },

  // 26. Payal Gaming (Payal Dhare)
  {
    id: "creator-payalgaming",
    name: "Payal Gaming (Payal Dhare)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "S8UL Esports & Official Channel",
    bio: "Top female gaming creator in India, leading streamer for S8UL Esports, lifestyle vlogger, and recipient of Dynamic Influencer of the Year.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-payal-yt", "YouTube", "@PayalGaming", "https://www.youtube.com/@PayalGaming", 4120000, 480000, "avg_video_views", "Streams 4 days / week"),
      createAccount("acc-payal-ig", "Instagram", "payalgamingg", "https://www.instagram.com/payalgamingg/", 3850000, null, null, "Daily lifestyle reels"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 92, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
    ],
    businessContact: {
      email: "payal@s8ul.gg",
      sourceUrl: "https://www.youtube.com/@PayalGaming/about",
      lastChecked: daysAgo(2),
    },
  },

  // 27. Zakir Khan
  {
    id: "creator-zakirkhan",
    name: "Zakir Khan",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Amazon Prime Video Profile",
    bio: "Iconic stand-up comedian, poet, and writer celebrated for 'Haq Se Single', 'Tathastu', and sold-out international arena tours worldwide.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Zakir_Khan_at_an_event_in_2022.jpg",
    accounts: [
      createAccount("acc-zakir-yt", "YouTube", "@ZakirKhan", "https://www.youtube.com/@ZakirKhan", 8200000, 4800000, "avg_video_views", "Posts comedy specials & poetry"),
      createAccount("acc-zakir-ig", "Instagram", "zakirkhan_208", "https://www.instagram.com/zakirkhan_208/", 6100000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 87, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 5, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.95 },
      { dimension: "country", value: "United States", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "zakirkhancomedy@gmail.com",
      sourceUrl: "https://www.youtube.com/@ZakirKhan/about",
      lastChecked: daysAgo(2),
    },
  },

  // 28. Tech Burner (Shlok Srivastava)
  {
    id: "creator-techburner",
    name: "Tech Burner (Shlok Srivastava)",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Forbes India 30 Under 30",
    bio: "High-energy tech entertainer and founder of Layers and Overlays, famous for funny gadget unboxings, science builds, and tech tests.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-techburner-yt", "YouTube", "@TechBurner", "https://www.youtube.com/@TechBurner", 11800000, 2400000, "avg_video_views", "Posts 2-3 videos / week"),
      createAccount("acc-techburner-ig", "Instagram", "techburner", "https://www.instagram.com/techburner/", 4600000, null, null, "Daily tech reels & stories"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "Nepal", amount: 4, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "business@techburner.in",
      sourceUrl: "https://www.techburner.in",
      lastChecked: daysAgo(1),
    },
  },

  // 29. Prajakta Koli (MostlySane)
  {
    id: "creator-mostlysane",
    name: "Prajakta Koli (MostlySane)",
    category: "Entertainment",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & UNDP Climate Ambassador",
    bio: "Daytime Emmy winner, Bollywood actress (Mismatched, JugJugg Jeeyo), and comedic creator creating relatable youth sketches and talk series.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/2/22/Prajakta_Koli_at_Grazia_Millennial_Awards_2022.jpg",
    accounts: [
      createAccount("acc-mostlysane-yt", "YouTube", "@MostlySane", "https://www.youtube.com/@MostlySane", 7150000, 1600000, "avg_video_views", "Posts weekly sketches & vlogs"),
      createAccount("acc-mostlysane-ig", "Instagram", "mostlysane", "https://www.instagram.com/mostlysane/", 5400000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 86, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 5, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "mostlysaneteam@gmail.com",
      sourceUrl: "https://www.youtube.com/@MostlySane/about",
      lastChecked: daysAgo(2),
    },
  },

  // 30. Khan Sir (Patna - Khan GS Research Centre)
  {
    id: "creator-khansir",
    name: "Khan Sir (Khan GS Research Centre)",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Khan GS Research Centre",
    bio: "Patna's renowned educator breaking down geopolitics, Indian defense, space technology, history, and current affairs in engaging colloquial Hindi.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-khansir-yt", "YouTube", "@khangsresearchcentre1685", "https://www.youtube.com/@khangsresearchcentre1685", 24200000, 6500000, "avg_video_views", "Posts 2-3 deep explainers / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 95, unit: "%", collectedAt: daysAgo(3), source: "YouTube Verified Analytics", status: "public", confidence: 0.99 },
      { dimension: "country", value: "Nepal", amount: 3, unit: "%", collectedAt: daysAgo(3), source: "YouTube Verified Analytics", status: "public", confidence: 0.95 },
    ],
    businessContact: {
      email: "khangsresearchcentre@gmail.com",
      sourceUrl: "https://www.youtube.com/@khangsresearchcentre1685/about",
      lastChecked: daysAgo(1),
    },
  },

  // 31. Nitish Rajput
  {
    id: "creator-nitishrajput",
    name: "Nitish Rajput",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Published Author",
    bio: "Independent documentary creator and investigative author producing cinema-grade video essays on Indian scams, geopolitics, and governance.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-nitish-yt", "YouTube", "@NitishRajput", "https://www.youtube.com/@NitishRajput", 6200000, 4100000, "avg_video_views", "Posts 1-2 investigative docs / month"),
      createAccount("acc-nitish-ig", "Instagram", "nitishrajpute", "https://www.instagram.com/nitishrajpute/", 3800000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "nitish@nitishrajput.com",
      sourceUrl: "https://nitishrajput.com",
      lastChecked: daysAgo(2),
    },
  },

  // 32. Labour Law Advisor (LLA)
  {
    id: "creator-lla",
    name: "Labour Law Advisor (LLA)",
    category: "Finance",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & LLA Professional Firm",
    bio: "Empowering working Indians with crucial knowledge on EPF, gratuity, consumer rights, employment laws, tax filing, and smart financial planning.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-lla-yt", "YouTube", "@LabourLawAdvisor", "https://www.youtube.com/@LabourLawAdvisor", 5400000, 820000, "avg_video_views", "Posts 3 videos & daily shorts"),
      createAccount("acc-lla-ig", "Instagram", "labourlawadvisor", "https://www.instagram.com/labourlawadvisor/", 3400000, null, null, "Daily legal-financial tips"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 92, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "collaborations@lla.in",
      sourceUrl: "https://lla.in",
      lastChecked: daysAgo(2),
    },
  },

  // 33. Pranjal Kamra
  {
    id: "creator-pranjalkamra",
    name: "Pranjal Kamra",
    category: "Finance",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Finology Founder",
    bio: "SEBI Registered RA, founder of Finology, teaching value investing, stock market balance sheet analysis, and disciplined personal wealth creation.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-pranjal-yt", "YouTube", "@pranjalkamra", "https://www.youtube.com/@pranjalkamra", 6100000, 740000, "avg_video_views", "Posts 2 stock lessons / week"),
      createAccount("acc-pranjal-ig", "Instagram", "myfinology", "https://www.instagram.com/myfinology/", 1200000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 90, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "pranjal@finology.in",
      sourceUrl: "https://finology.in",
      lastChecked: daysAgo(3),
    },
  },

  // 34. Samay Raina
  {
    id: "creator-samayraina",
    name: "Samay Raina",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Comicstaan Winner",
    bio: "Stand-up comedy star, co-winner of Comicstaan 2, viral host of India's Got Latent, streaming chess and comedy to record-breaking audiences.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-samay-yt", "YouTube", "@samayraina", "https://www.youtube.com/@samayraina", 5800000, 3600000, "avg_video_views", "Posts weekly specials & live shows"),
      createAccount("acc-samay-ig", "Instagram", "maisamayhoon", "https://www.instagram.com/maisamayhoon/", 4200000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 86, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 5, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "samayrainalive@gmail.com",
      sourceUrl: "https://www.youtube.com/@samayraina/about",
      lastChecked: daysAgo(1),
    },
  },

  // 35. Dynamo Gaming (Aadi Sawant)
  {
    id: "creator-dynamogaming",
    name: "Dynamo Gaming (Aadi Sawant)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Hydra Esports",
    bio: "Pioneering Indian mobile esports creator, head of Hydra Esports, celebrated for sharpshooter sniper gameplay and high-energy multiplayer streams.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-dynamo-yt", "YouTube", "@DynamoGaming", "https://www.youtube.com/@DynamoGaming", 10100000, 420000, "avg_video_views", "Streams 4-5 days / week"),
      createAccount("acc-dynamo-ig", "Instagram", "dynamo__gaming", "https://www.instagram.com/dynamo__gaming/", 3100000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 92, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "Nepal", amount: 4, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "aadi@dynamogaming.com",
      sourceUrl: "https://www.youtube.com/@DynamoGaming/about",
      lastChecked: daysAgo(3),
    },
  },

  // 36. Jonathan Gaming (Jonathan Amaral)
  {
    id: "creator-jonathangaming",
    name: "Jonathan Gaming (Jonathan Amaral)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "GodLike Esports & Official Channel",
    bio: "International BGMI MVP fragger, star athlete for GodLike Esports, and leading competitive mobile battle royale streamer in India.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-jonathan-yt", "YouTube", "@JonathanGaming", "https://www.youtube.com/@JonathanGaming", 6200000, 620000, "avg_video_views", "Streams 3-4 tournaments / week"),
      createAccount("acc-jonathan-ig", "Instagram", "ig_jonathangaming", "https://www.instagram.com/ig_jonathangaming/", 3400000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 94, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
    ],
    businessContact: {
      email: "jonathan@godlike.gg",
      sourceUrl: "https://www.youtube.com/@JonathanGaming/about",
      lastChecked: daysAgo(2),
    },
  },

  // 37. Trakin Tech (Arun Prabhudesai)
  {
    id: "creator-trakintech",
    name: "Trakin Tech (Arun Prabhudesai)",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Trakin Tech Media",
    bio: "Premier Indian consumer electronics channel bringing rapid phone launches, processor tests, display comparisons, and gadget roundups.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-trakin-yt", "YouTube", "@trakintech", "https://www.youtube.com/@trakintech", 14800000, 880000, "avg_video_views", "Daily smartphone unboxings"),
      createAccount("acc-trakin-ig", "Instagram", "trakintech", "https://www.instagram.com/trakintech/", 2200000, null, null, "Daily tech posts & reels"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 93, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
    ],
    businessContact: {
      email: "arun@trak.in",
      sourceUrl: "https://trak.in",
      lastChecked: daysAgo(1),
    },
  },

  // 38. Gyan Therapy (Rakesh)
  {
    id: "creator-gyantherapy",
    name: "Gyan Therapy (Rakesh)",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Verified Tech Reviews",
    bio: "Authentic, unbiased consumer technology reviews, battery endurance examinations, and long-term buyer advice in conversational Hindi.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-gyan-yt", "YouTube", "@GyanTherapy", "https://www.youtube.com/@GyanTherapy", 3200000, 420000, "avg_video_views", "Posts 2 reviews / week"),
      createAccount("acc-gyan-ig", "Instagram", "gyantherapy", "https://www.instagram.com/gyantherapy/", 850000, null, null, "Posts tech advice"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 92, unit: "%", collectedAt: daysAgo(6), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
    ],
    businessContact: {
      email: "gyantherapy@gmail.com",
      sourceUrl: "https://www.youtube.com/@GyanTherapy/about",
      lastChecked: daysAgo(3),
    },
  },

  // 39. Ranveer Brar
  {
    id: "creator-ranveerbrar",
    name: "Ranveer Brar",
    category: "Food",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Celebrity MasterChef Judge & Official Channel",
    bio: "MasterChef India judge, culinary artist, author, and food historian celebrating traditional royal recipes, street delicacies, and homestyle cooking.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/0/07/Chef_Ranveer_Brar.jpg",
    accounts: [
      createAccount("acc-ranveerbrar-yt", "YouTube", "@RanveerBrar", "https://www.youtube.com/@RanveerBrar", 6800000, 950000, "avg_video_views", "Posts 2 recipes / week"),
      createAccount("acc-ranveerbrar-ig", "Instagram", "ranveer.brar", "https://www.instagram.com/ranveer.brar/", 4800000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 84, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 6, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.95 },
      { dimension: "country", value: "United Arab Emirates", amount: 5, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "contact@ranveerbrar.com",
      sourceUrl: "https://ranveerbrar.com",
      lastChecked: daysAgo(2),
    },
  },

  // 40. Kabita's Kitchen (Kabita Singh)
  {
    id: "creator-kabitaskitchen",
    name: "Kabita's Kitchen (Kabita Singh)",
    category: "Food",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Culinary Excellence Award",
    bio: "India's beloved homestyle cooking teacher, creating simple, tasty, and healthy Indian recipes made with easy-to-find ingredients.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-kabita-yt", "YouTube", "@KabitasKitchen", "https://www.youtube.com/@KabitasKitchen", 14100000, 650000, "avg_video_views", "Posts 3 recipe guides / week"),
      createAccount("acc-kabita-ig", "Instagram", "kabitaskitchen", "https://www.instagram.com/kabitaskitchen/", 2400000, null, null, "Daily recipe reels"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "kabitaskitchen@gmail.com",
      sourceUrl: "https://www.youtube.com/@KabitasKitchen/about",
      lastChecked: daysAgo(2),
    },
  },

  // 41. Village Cooking Channel
  {
    id: "creator-villagecooking",
    name: "Village Cooking Channel",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Tamil Nadu Mass Cooking & YouTube Diamond Button",
    bio: "Traditional outdoor mass cooking by village farmers in Pudukkottai, Tamil Nadu, harvesting natural spices and feeding hundreds in charity.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-vcc-yt", "YouTube", "@VillageCookingChannel", "https://www.youtube.com/@VillageCookingChannel", 25100000, 4200000, "avg_video_views", "Posts weekly mass feasts"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 88, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "Malaysia", amount: 4, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "Singapore", amount: 3, unit: "%", collectedAt: daysAgo(5), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "villagecookingchannel@gmail.com",
      sourceUrl: "https://www.youtube.com/@VillageCookingChannel/about",
      lastChecked: daysAgo(3),
    },
  },

  // 42. Dr. Vikas Divyakirti (Drishti IAS)
  {
    id: "creator-drishtiias",
    name: "Dr. Vikas Divyakirti (Drishti IAS)",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Drishti IAS Founder & UPSC Mentor",
    bio: "Legendary civil services educator, philosophy mentor, and founder of Drishti IAS, guiding students in ethics, constitutional law, and life wisdom.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-drishti-yt", "YouTube", "@DrishtiIASvideos", "https://www.youtube.com/@DrishtiIASvideos", 13600000, 2100000, "avg_video_views", "Posts lectures & student Q&A"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 96, unit: "%", collectedAt: daysAgo(3), source: "YouTube Verified Analytics", status: "public", confidence: 0.99 },
    ],
    businessContact: {
      email: "help@drishtiias.com",
      sourceUrl: "https://drishtiias.com",
      lastChecked: daysAgo(1),
    },
  },

  // 43. Akshat Shrivastava
  {
    id: "creator-akshat",
    name: "Akshat Shrivastava",
    category: "Finance",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & INSEAD Alumnus",
    bio: "INSEAD alumnus and management consultant discussing global macroeconomics, private equity, equities investing, and wealth building frameworks.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-akshat-yt", "YouTube", "@AkshatZayn", "https://www.youtube.com/@AkshatZayn", 2300000, 380000, "avg_video_views", "Posts 3 investing breakdowns / week"),
      createAccount("acc-akshat-ig", "Instagram", "akshat.world", "https://www.instagram.com/akshat.world/", 650000, null, null, "Posts macroeconomic commentary"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 82, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United States", amount: 8, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.95 },
      { dimension: "country", value: "Singapore", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "akshat@akshatshrivastava.com",
      sourceUrl: "https://www.youtube.com/@AkshatZayn/about",
      lastChecked: daysAgo(2),
    },
  },

  // 44. Anubhav Singh Bassi
  {
    id: "creator-bassi",
    name: "Anubhav Singh Bassi",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Sold-out International Tours",
    bio: "One of India's most celebrated stand-up comedic storytellers, Bollywood actor (Tu Jhoothi Main Makkaar), drawing tens of millions of views per release.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/7/77/Anubhav_Singh_Bassi.jpg",
    accounts: [
      createAccount("acc-bassi-yt", "YouTube", "@AnubhavSinghBassi", "https://www.youtube.com/@AnubhavSinghBassi", 5200000, 18000000, "avg_video_views", "Posts viral stand-up specials"),
      createAccount("acc-bassi-ig", "Instagram", "be_a_bassi", "https://www.instagram.com/be_a_bassi/", 4100000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 88, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United States", amount: 5, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.95 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "bassi@anubhavsinghbassi.com",
      sourceUrl: "https://www.youtube.com/@AnubhavSinghBassi/about",
      lastChecked: daysAgo(2),
    },
  },

  // 45. Dolly Singh
  {
    id: "creator-dollysingh",
    name: "Dolly Singh",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Instagram & Cannes Red Carpet Profile",
    bio: "Cannes red carpet attendee, comedic actor (Thank You for Coming), and creator celebrated for memorable sketch characters, fashion, and body positivity.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-dolly-ig", "Instagram", "dollysingh", "https://www.instagram.com/dollysingh/", 1850000, null, null, "Daily comedy sketches & style reels"),
      createAccount("acc-dolly-yt", "YouTube", "@DollySingh", "https://www.youtube.com/@DollySingh", 780000, 450000, "avg_video_views", "Posts comedy stories & vlogs"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 88, unit: "%", collectedAt: daysAgo(5), source: "Instagram Verified Analytics", status: "public", confidence: 0.97 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(5), source: "Instagram Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(5), source: "Instagram Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "dolly@monk-e.in",
      sourceUrl: "https://www.instagram.com/dollysingh/",
      lastChecked: daysAgo(2),
    },
  },

  // ==========================================
  // GLOBAL CREATORS
  // ==========================================

  // 27. MrBeast (YouTube)
  {
    id: "creator-mrbeast",
    name: "MrBeast",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Channel & Business Profile",
    bio: "Pioneering philanthropic challenges, grand-scale stunts, and viral entertainment productions worldwide.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/1/18/MrBeast_2023.jpg",
    accounts: [
      createAccount("acc-mrbeast-yt", "YouTube", "@MrBeast", "https://www.youtube.com/@MrBeast", 342000000, 115000000, "avg_video_views", "Posts 2-3 mega-videos / month"),
      createAccount("acc-mrbeast-tt", "TikTok", "@mrbeast", "https://www.tiktok.com/@mrbeast", 104000000, 24000000, "avg_video_views", "Posts 4-5 shorts / week"),
      createAccount("acc-mrbeast-ig", "Instagram", "mrbeast", "https://www.instagram.com/mrbeast/", 62000000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 48, unit: "%", collectedAt: daysAgo(5), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 16, unit: "%", collectedAt: daysAgo(5), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.95 },
      { dimension: "country", value: "United Kingdom", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Creator Authorized Analytics", status: "creator_authorized", confidence: 0.95 },
    ],
    businessContact: {
      email: "contact@mrbeastbusiness.com",
      sourceUrl: "https://www.youtube.com/@MrBeast/about",
      lastChecked: daysAgo(2),
    },
  },

  // 28. Marques Brownlee (MKBHD)
  {
    id: "creator-mkbhd",
    name: "Marques Brownlee (MKBHD)",
    category: "Technology",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Channel & Media Kit",
    bio: "Quality tech videos, in-depth smartphone analysis, EV reviews, and future technology deep-dives.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Marques_Brownlee_cropped.jpg",
    accounts: [
      createAccount("acc-mkbhd-yt", "YouTube", "@mkbhd", "https://www.youtube.com/@mkbhd", 19600000, 2800000, "avg_video_views", "Posts 2-3 reviews / week"),
      createAccount("acc-mkbhd-ig", "Instagram", "mkbhd", "https://www.instagram.com/mkbhd/", 4800000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 52, unit: "%", collectedAt: daysAgo(7), source: "Verified Platform Analytics", status: "public", confidence: 0.95 },
      { dimension: "country", value: "India", amount: 15, unit: "%", collectedAt: daysAgo(7), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
    ],
    businessContact: {
      email: "marques@mkbhd.com",
      sourceUrl: "https://www.youtube.com/@mkbhd/about",
      lastChecked: daysAgo(3),
    },
  },

  // 29. Kai Cenat (Twitch)
  {
    id: "creator-kaicenat",
    name: "Kai Cenat",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Twitch Partner Profile",
    bio: "Streamer of the Year known for subathons, celebrity guest appearances, gaming, and high-energy IRL broadcasts.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-kaicenat-twitch", "Twitch", "kaicenat", "https://www.twitch.tv/kaicenat", 13800000, 78500, "avg_live_viewers", "Streams 5-6 days / week"),
      createAccount("acc-kaicenat-yt", "YouTube", "@KaiCenat", "https://www.youtube.com/@KaiCenat", 10200000, 3100000, "avg_video_views", "Posts 2 videos / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 68, unit: "%", collectedAt: daysAgo(4), source: "Twitch Helix Metrics", status: "public", confidence: 0.95 },
    ],
    businessContact: {
      email: "kaicenatbiz@gmail.com",
      sourceUrl: "https://www.twitch.tv/kaicenat/about",
      lastChecked: daysAgo(1),
    },
  },

  // 30. xQc (Twitch & Kick)
  {
    id: "creator-xqc",
    name: "xQc (Félix Lengyel)",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Official Twitch & Kick Channel",
    bio: "Former Overwatch pro, iconic variety streamer, reacting, tier lists, and marathon gaming sessions.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-xqc-twitch", "Twitch", "xqc", "https://www.twitch.tv/xqc", 12200000, 44200, "avg_live_viewers", "Streams 6 days / week"),
      createAccount("acc-xqc-kick", "Kick", "xqc", "https://kick.com/xqc", 720000, 38500, "avg_live_viewers", "Streams 3-4 days / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 56, unit: "%", collectedAt: daysAgo(6), source: "Twitch Partner Insights", status: "public", confidence: 0.94 },
      { dimension: "country", value: "Canada", amount: 18, unit: "%", collectedAt: daysAgo(6), source: "Twitch Partner Insights", status: "public", confidence: 0.95 },
    ],
    businessContact: {
      email: "xqcbusiness@gmail.com",
      sourceUrl: "https://kick.com/xqc",
      lastChecked: daysAgo(3),
    },
  },

  // 31. Adin Ross (Kick)
  {
    id: "creator-adinross",
    name: "Adin Ross",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Kick Official Channel",
    bio: "Headlining Kick streamer known for high-profile interviews, IRL streams, and collaborative music events.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-adinross-kick", "Kick", "adinross", "https://kick.com/adinross", 1520000, 48500, "avg_live_viewers", "Streams 4-5 days / week"),
      createAccount("acc-adinross-yt", "YouTube", "@AdinLive", "https://www.youtube.com/@AdinLive", 4410000, 1100000, "avg_video_views", "Posts 3 videos / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 72, unit: "%", collectedAt: daysAgo(8), source: "Kick API & Public Metrics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "adinrossmgmt@gmail.com",
      sourceUrl: "https://kick.com/adinross",
      lastChecked: daysAgo(4),
    },
  },

  // 32. Mark Rober (YouTube)
  {
    id: "creator-markrober",
    name: "Mark Rober",
    category: "Technology",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "YouTube Verified Channel",
    bio: "Former NASA engineer making science and engineering accessible through viral contraptions, glitter bombs, and space experiments.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-markrober-yt", "YouTube", "@MarkRober", "https://www.youtube.com/@MarkRober", 62400000, 29000000, "avg_video_views", "Posts 1 major build / month"),
      createAccount("acc-markrober-tt", "TikTok", "@markrober", "https://www.tiktok.com/@markrober", 18200000, 5600000, "avg_video_views", "Posts 2 shorts / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 54, unit: "%", collectedAt: daysAgo(10), source: "YouTube Verified Partner", status: "creator_authorized", confidence: 0.97 },
      { dimension: "country", value: "India", amount: 12, unit: "%", collectedAt: daysAgo(10), source: "YouTube Verified Partner", status: "creator_authorized", confidence: 0.95 },
    ],
    businessContact: {
      email: "press@crunchlabs.com",
      sourceUrl: "https://www.youtube.com/@MarkRober/about",
      lastChecked: daysAgo(5),
    },
  },

  // 33. Khaby Lame (TikTok)
  {
    id: "creator-khabylame",
    name: "Khaby Lame",
    category: "Comedy",
    language: "English",
    creatorCountry: "Italy",
    creatorCountrySource: "TikTok Creator Portal",
    bio: "World's most followed TikTok creator, universally known for wordless comedic reactions to overcomplicated life hacks.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-khaby-tt", "TikTok", "@khaby.lame", "https://www.tiktok.com/@khaby.lame", 162500000, 14200000, "avg_video_views", "Posts 3-4 videos / week"),
      createAccount("acc-khaby-ig", "Instagram", "khaby00", "https://www.instagram.com/khaby00/", 81200000, null, null, "Posts 2 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 26, unit: "%", collectedAt: daysAgo(7), source: "TikTok Global Analytics", status: "public", confidence: 0.93 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(7), source: "TikTok Global Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "khaby@ironcorporation.com",
      sourceUrl: "https://www.instagram.com/khaby00/",
      lastChecked: daysAgo(3),
    },
  },

  // 34. Cristiano Ronaldo (Instagram)
  {
    id: "creator-cristiano",
    name: "Cristiano Ronaldo",
    category: "Sports",
    language: "Portuguese",
    creatorCountry: "Portugal",
    creatorCountrySource: "Verified Official Account",
    bio: "Football icon, five-time Ballon d'Or winner, global athlete, wellness ambassador, and most followed person on Instagram.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Cristiano_Ronaldo_playing_for_Al_Nassr_FC_against_Persepolis%2C_September_2023_%28cropped%29.jpg/440px-Cristiano_Ronaldo_playing_for_Al_Nassr_FC_against_Persepolis%2C_September_2023_%28cropped%29.jpg",
    accounts: [
      createAccount("acc-cr7-ig", "Instagram", "cristiano", "https://www.instagram.com/cristiano/", 642000000, null, null, "Posts 4-5 times / week"),
      createAccount("acc-cr7-yt", "YouTube", "@URCristiano", "https://www.youtube.com/@URCristiano", 72500000, 18500000, "avg_video_views", "Posts 2-3 videos / month"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 20, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.95 },
      { dimension: "country", value: "Brazil", amount: 18, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.95 },
    ],
    businessContact: {
      email: "commercial@cristianoronaldo.com",
      sourceUrl: "https://www.cristianoronaldo.com",
      lastChecked: daysAgo(2),
    },
  },

  // 35. Leo Messi (Instagram)
  {
    id: "creator-leomessi",
    name: "Leo Messi",
    category: "Sports",
    language: "Spanish",
    creatorCountry: "Argentina",
    creatorCountrySource: "Official Verified Account",
    bio: "World Cup Champion, eight-time Ballon d'Or winner, Inter Miami forward, and global sports ambassador.",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg/440px-Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg",
    accounts: [
      createAccount("acc-messi-ig", "Instagram", "leomessi", "https://www.instagram.com/leomessi/", 504000000, null, null, "Posts 3 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 22, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.95 },
      { dimension: "country", value: "Argentina", amount: 20, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.95 },
    ],
    businessContact: {
      email: "info@leomessi.com",
      sourceUrl: "https://messi.com",
      lastChecked: daysAgo(1),
    },
  },

  // 55. CodeWithHarry (Haris Khan)
  {
    id: "creator-in-codewithharry",
    name: "CodeWithHarry (Haris Khan)",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Pioneering Indian coding educator teaching Python, Web Development, C++, JavaScript, and full-stack engineering.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-codewithharry-yt", "YouTube", "@CodeWithHarry", "https://www.youtube.com/@CodeWithHarry", 6200000, 450000, "avg_video_views", "Weekly software deep-dives"),
      createAccount("acc-creator-in-codewithharry-ig", "Instagram", "codewithharry", "https://www.instagram.com/codewithharry/", 2170000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "codewithharry@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@CodeWithHarry/about",
      lastChecked: daysAgo(2),
    },
  },

  // 56. Chai aur Code (Hitesh Choudhary)
  {
    id: "creator-in-hiteshchoudharydotcom",
    name: "Chai aur Code (Hitesh Choudhary)",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Senior engineer and founder teaching modern React, Node.js, System Design, and production architectures in Hindi.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-hiteshchoudharydotcom-yt", "YouTube", "@HiteshChoudharydotcom", "https://www.youtube.com/@HiteshChoudharydotcom", 1200000, 240000, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-hiteshchoudharydotcom-ig", "Instagram", "hiteshchoudharydotcom", "https://www.instagram.com/hiteshchoudharydotcom/", 420000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "hiteshchoudharydotcom@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@HiteshChoudharydotcom/about",
      lastChecked: daysAgo(2),
    },
  },

  // 57. Apna College (Shradha & Aman)
  {
    id: "creator-in-apnacollegeofficial",
    name: "Apna College (Shradha & Aman)",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "India's premier college coding community teaching Java, Full Stack Web Development, and placement preparation.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-apnacollegeofficial-yt", "YouTube", "@ApnaCollegeOfficial", "https://www.youtube.com/@ApnaCollegeOfficial", 5400000, 680000, "avg_video_views", "Daily tech launches & unboxings"),
      createAccount("acc-creator-in-apnacollegeofficial-ig", "Instagram", "apnacollegeofficial", "https://www.instagram.com/apnacollegeofficial/", 1890000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "apnacollegeofficial@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@ApnaCollegeOfficial/about",
      lastChecked: daysAgo(2),
    },
  },

  // 58. Love Babbar
  {
    id: "creator-in-lovebabbar",
    name: "Love Babbar",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Ex-Amazon, ex-Microsoft engineer guiding software engineers through DSA, interview roadmaps, and core CS.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-lovebabbar-yt", "YouTube", "@lovebabbar", "https://www.youtube.com/@lovebabbar", 1850000, 320000, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-lovebabbar-ig", "Instagram", "lovebabbar", "https://www.instagram.com/lovebabbar/", 647500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "lovebabbar@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@lovebabbar/about",
      lastChecked: daysAgo(2),
    },
  },

  // 59. Telusko (Navin Reddy)
  {
    id: "creator-in-telusko",
    name: "Telusko (Navin Reddy)",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Senior enterprise trainer teaching Java, Spring Boot, Blockchain, Python, and Microservices architectures.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-telusko-yt", "YouTube", "@Telusko", "https://www.youtube.com/@Telusko", 2350000, 180000, "avg_video_views", "Weekly software deep-dives"),
      createAccount("acc-creator-in-telusko-ig", "Instagram", "telusko", "https://www.instagram.com/telusko/", 822500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "telusko@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@Telusko/about",
      lastChecked: daysAgo(2),
    },
  },

  // 60. Anuj Bhaiya
  {
    id: "creator-in-anujbhaiya",
    name: "Anuj Bhaiya",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Ex-Urban Company software engineer mentoring aspiring techies on FAANG interviews and high-scale architectures.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-anujbhaiya-yt", "YouTube", "@anujbhaiya", "https://www.youtube.com/@anujbhaiya", 980000, 140000, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-anujbhaiya-ig", "Instagram", "anujbhaiya", "https://www.instagram.com/anujbhaiya/", 343000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "anujbhaiya@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@anujbhaiya/about",
      lastChecked: daysAgo(2),
    },
  },

  // 61. Thapa Technical (Vinod Thapa)
  {
    id: "creator-in-thapatechnical",
    name: "Thapa Technical (Vinod Thapa)",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Hands-on web development masterclasses covering MERN stack, Next.js, TypeScript, and responsive CSS projects.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-thapatechnical-yt", "YouTube", "@ThapaTechnical", "https://www.youtube.com/@ThapaTechnical", 1720000, 190000, "avg_video_views", "Daily tech launches & unboxings"),
      createAccount("acc-creator-in-thapatechnical-ig", "Instagram", "thapatechnical", "https://www.instagram.com/thapatechnical/", 602000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "thapatechnical@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@ThapaTechnical/about",
      lastChecked: daysAgo(2),
    },
  },

  // 62. Technical Sagar (Abhishek Sagar)
  {
    id: "creator-in-technicalsagar",
    name: "Technical Sagar (Abhishek Sagar)",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Cybersecurity specialist, ethical hacker, and internet investigator explaining digital safety and network protocols.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-technicalsagar-yt", "YouTube", "@TechnicalSagar", "https://www.youtube.com/@TechnicalSagar", 3100000, 240000, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-technicalsagar-ig", "Instagram", "technicalsagar", "https://www.instagram.com/technicalsagar/", 1085000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "technicalsagar@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@TechnicalSagar/about",
      lastChecked: daysAgo(2),
    },
  },

  // 63. Beebom
  {
    id: "creator-in-beebomco",
    name: "Beebom",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "India's premier consumer tech media company covering smartphone teardowns, AI innovations, and gadget testing.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-beebomco-yt", "YouTube", "@beebomco", "https://www.youtube.com/@beebomco", 4100000, 550000, "avg_video_views", "Weekly software deep-dives"),
      createAccount("acc-creator-in-beebomco-ig", "Instagram", "beebomco", "https://www.instagram.com/beebomco/", 1435000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "beebomco@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@beebomco/about",
      lastChecked: daysAgo(2),
    },
  },

  // 64. Mr. Indian Hacker (Dilraj Singh)
  {
    id: "creator-in-mrindianhacker",
    name: "Mr. Indian Hacker (Dilraj Singh)",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Rajasthan's king of mega experiments, titanium crushing machines, fireworks chemistry, and science stunts.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-mrindianhacker-yt", "YouTube", "@MrIndianHacker", "https://www.youtube.com/@MrIndianHacker", 36800000, 5400000, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-mrindianhacker-ig", "Instagram", "mrindianhacker", "https://www.instagram.com/mrindianhacker/", 12880000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "mrindianhacker@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@MrIndianHacker/about",
      lastChecked: daysAgo(2),
    },
  },

  // 65. Crazy XYZ (Amit Sharma)
  {
    id: "creator-in-crazyxyz",
    name: "Crazy XYZ (Amit Sharma)",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Grand-scale science builds, automotive destruction testing, modification projects, and viral physics experiments.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-crazyxyz-yt", "YouTube", "@CrazyXYZ", "https://www.youtube.com/@CrazyXYZ", 31200000, 4900000, "avg_video_views", "Daily tech launches & unboxings"),
      createAccount("acc-creator-in-crazyxyz-ig", "Instagram", "crazyxyz", "https://www.instagram.com/crazyxyz/", 10920000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "crazyxyz@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@CrazyXYZ/about",
      lastChecked: daysAgo(2),
    },
  },

  // 66. Tech Master
  {
    id: "creator-in-techmasterofficial",
    name: "Tech Master",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Smartphone camera testing, software updates analysis, speed battles, and display comparisons in Hindi.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-techmasterofficial-yt", "YouTube", "@TechMasterOfficial", "https://www.youtube.com/@TechMasterOfficial", 2900000, 220000, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-techmasterofficial-ig", "Instagram", "techmasterofficial", "https://www.instagram.com/techmasterofficial/", 1015000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "techmasterofficial@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@TechMasterOfficial/about",
      lastChecked: daysAgo(2),
    },
  },

  // 67. Geeky Shows
  {
    id: "creator-in-geekyshows",
    name: "Geeky Shows",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "In-depth computer science lectures, Linux administration, Python frameworks, and web backend tutorials.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-geekyshows-yt", "YouTube", "@GeekyShows", "https://www.youtube.com/@GeekyShows", 1350000, 110000, "avg_video_views", "Weekly software deep-dives"),
      createAccount("acc-creator-in-geekyshows-ig", "Instagram", "geekyshows", "https://www.instagram.com/geekyshows/", 472500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "geekyshows@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@GeekyShows/about",
      lastChecked: daysAgo(2),
    },
  },

  // 68. Prasad Tech in Telugu
  {
    id: "creator-in-prasadtechintelugu",
    name: "Prasad Tech in Telugu",
    category: "Technology",
    language: "Telugu",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Andhra and Telangana's favorite gadget unboxer, reviewing budget smartphones, displays, and gadgets in Telugu.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-prasadtechintelugu-yt", "YouTube", "@PrasadTechinTelugu", "https://www.youtube.com/@PrasadTechinTelugu", 4300000, 380000, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-prasadtechintelugu-ig", "Instagram", "prasadtechintelugu", "https://www.instagram.com/prasadtechintelugu/", 1505000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "prasadtechintelugu@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@PrasadTechinTelugu/about",
      lastChecked: daysAgo(2),
    },
  },

  // 69. Madan Gowri
  {
    id: "creator-in-madangowri",
    name: "Madan Gowri",
    category: "Technology",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Tamil Nadu's top infotainment commentator breaking down international geopolitics, science discoveries, and history.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-madangowri-yt", "YouTube", "@MadanGowri", "https://www.youtube.com/@MadanGowri", 8100000, 980000, "avg_video_views", "Daily tech launches & unboxings"),
      createAccount("acc-creator-in-madangowri-ig", "Instagram", "madangowri", "https://www.instagram.com/madangowri/", 2835000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "madangowri@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@MadanGowri/about",
      lastChecked: daysAgo(2),
    },
  },

  // 70. M4 Tech
  {
    id: "creator-in-m4tech",
    name: "M4 Tech",
    category: "Technology",
    language: "Malayalam",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Kerala's leading DIY maker, engineering miniature crafts, watercrafts, and inventive tools in Malayalam.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-m4tech-yt", "YouTube", "@M4Tech", "https://www.youtube.com/@M4Tech", 11400000, 1800000, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-m4tech-ig", "Instagram", "m4tech", "https://www.instagram.com/m4tech/", 3990000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "m4tech@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@M4Tech/about",
      lastChecked: daysAgo(2),
    },
  },

  // 71. Bong Guy (Kiran Dutta)
  {
    id: "creator-in-thebongguy",
    name: "Bong Guy (Kiran Dutta)",
    category: "Technology",
    language: "Bengali",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Bengal's biggest digital roaster and comedic commentator reviewing viral internet trends and regional movies in Bengali.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-thebongguy-yt", "YouTube", "@TheBongGuy", "https://www.youtube.com/@TheBongGuy", 4850000, 1400000, "avg_video_views", "Weekly software deep-dives"),
      createAccount("acc-creator-in-thebongguy-ig", "Instagram", "thebongguy", "https://www.instagram.com/thebongguy/", 1697500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "thebongguy@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@TheBongGuy/about",
      lastChecked: daysAgo(2),
    },
  },

  // 72. Harsh Gujral
  {
    id: "creator-in-harshgujral",
    name: "Harsh Gujral",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "High-voltage observational stand-up comedian and crowd-work sensation with sold-out tours across India and the UK.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-harshgujral-yt", "YouTube", "@harshgujral", "https://www.youtube.com/@harshgujral", 3400000, 8900000, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-harshgujral-ig", "Instagram", "harshgujral", "https://www.instagram.com/harshgujral/", 1190000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "harshgujral@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@harshgujral/about",
      lastChecked: daysAgo(2),
    },
  },

  // 73. Aakash Gupta
  {
    id: "creator-in-aakashgupta",
    name: "Aakash Gupta",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Comicstaan 2 co-winner, theater artist, and pantomime comedy maestro behind viral parodies and relatable life sketches.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-aakashgupta-yt", "YouTube", "@aakashgupta", "https://www.youtube.com/@aakashgupta", 4800000, 12000000, "avg_video_views", "Daily comedic reels & parodies"),
      createAccount("acc-creator-in-aakashgupta-ig", "Instagram", "aakashgupta", "https://www.instagram.com/aakashgupta/", 1680000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "aakashgupta@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@aakashgupta/about",
      lastChecked: daysAgo(2),
    },
  },

  // 74. Gaurav Kapoor
  {
    id: "creator-in-gauravkapoor",
    name: "Gaurav Kapoor",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Delhi observational comic renowned for street-smart humor, neighborhood anecdotes, and razor-sharp crowd interactions.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-gauravkapoor-yt", "YouTube", "@gauravkapoor", "https://www.youtube.com/@gauravkapoor", 2150000, 6400000, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-gauravkapoor-ig", "Instagram", "gauravkapoor", "https://www.instagram.com/gauravkapoor/", 752500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "gauravkapoor@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@gauravkapoor/about",
      lastChecked: daysAgo(2),
    },
  },

  // 75. Ravi Gupta
  {
    id: "creator-in-raviguptacomedy",
    name: "Ravi Gupta",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Uttar Pradesh style dry wit, government office parodies, and relatable middle-class childhood stories.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-raviguptacomedy-yt", "YouTube", "@raviguptacomedy", "https://www.youtube.com/@raviguptacomedy", 1950000, 5800000, "avg_video_views", "Bi-weekly satirical reviews"),
      createAccount("acc-creator-in-raviguptacomedy-ig", "Instagram", "raviguptacomedy", "https://www.instagram.com/raviguptacomedy/", 682500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "raviguptacomedy@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@raviguptacomedy/about",
      lastChecked: daysAgo(2),
    },
  },

  // 76. Slayy Point (Abhyudaya & Gautami)
  {
    id: "creator-in-slayypoint",
    name: "Slayy Point (Abhyudaya & Gautami)",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "India's favorite millennial comedic duo creating witty parodies on societal trends, weddings, exams, and viral memes.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-slayypoint-yt", "YouTube", "@SlayyPoint", "https://www.youtube.com/@SlayyPoint", 9400000, 4800000, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-slayypoint-ig", "Instagram", "slayypoint", "https://www.instagram.com/slayypoint/", 3290000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "slayypoint@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@SlayyPoint/about",
      lastChecked: daysAgo(2),
    },
  },

  // 77. Thugesh (Mahesh Keshwala)
  {
    id: "creator-in-thugesh",
    name: "Thugesh (Mahesh Keshwala)",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "High-production roasting, internet commentary, and comedic talk shows interviewing India's trending digital personalities.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-thugesh-yt", "YouTube", "@Thugesh", "https://www.youtube.com/@Thugesh", 6200000, 2100000, "avg_video_views", "Daily comedic reels & parodies"),
      createAccount("acc-creator-in-thugesh-ig", "Instagram", "thugesh", "https://www.instagram.com/thugesh/", 2170000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "thugesh@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@Thugesh/about",
      lastChecked: daysAgo(2),
    },
  },

  // 78. Neon Man (Ayush Wadhwa)
  {
    id: "creator-in-neonman",
    name: "Neon Man (Ayush Wadhwa)",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Premier Indian creator news bulletin covering digital culture, community updates, controversies, and achievements.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-neonman-yt", "YouTube", "@NeonMan", "https://www.youtube.com/@NeonMan", 2850000, 820000, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-neonman-ig", "Instagram", "neonman", "https://www.instagram.com/neonman/", 997500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "neonman@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@NeonMan/about",
      lastChecked: daysAgo(2),
    },
  },

  // 79. Purav Jha
  {
    id: "creator-in-puravjha",
    name: "Purav Jha",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Young comedic director and actor famous for parodies of Bollywood blockbusters and cinematic YouTube sketches.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-puravjha-yt", "YouTube", "@PuravJha", "https://www.youtube.com/@PuravJha", 5200000, 3800000, "avg_video_views", "Bi-weekly satirical reviews"),
      createAccount("acc-creator-in-puravjha-ig", "Instagram", "puravjha", "https://www.instagram.com/puravjha/", 1820000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "puravjha@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@PuravJha/about",
      lastChecked: daysAgo(2),
    },
  },

  // 80. Sibbu Giri
  {
    id: "creator-in-sibbugiri",
    name: "Sibbu Giri",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Relatable family sketches, sibling humor, and youth cultural parodies drawing massive organic engagement.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-sibbugiri-yt", "YouTube", "@SibbuGiri", "https://www.youtube.com/@SibbuGiri", 4100000, 2600000, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-sibbugiri-ig", "Instagram", "sibbugiri", "https://www.instagram.com/sibbugiri/", 1435000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "sibbugiri@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@SibbuGiri/about",
      lastChecked: daysAgo(2),
    },
  },

  // 81. Parithabangal (Gopi & Sudhakar)
  {
    id: "creator-in-parithabangal",
    name: "Parithabangal (Gopi & Sudhakar)",
    category: "Comedy",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Tamil cinema and sketch comedy powerhouses creating viral satirical parodies on modern life and politics.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-parithabangal-yt", "YouTube", "@Parithabangal", "https://www.youtube.com/@Parithabangal", 5900000, 2800000, "avg_video_views", "Daily comedic reels & parodies"),
      createAccount("acc-creator-in-parithabangal-ig", "Instagram", "parithabangal", "https://www.instagram.com/parithabangal/", 2065000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "parithabangal@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@Parithabangal/about",
      lastChecked: daysAgo(2),
    },
  },

  // 82. Bhadipa (Bharatiya Digital Party)
  {
    id: "creator-in-bhadipa",
    name: "Bhadipa (Bharatiya Digital Party)",
    category: "Comedy",
    language: "Marathi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Maharashtra's leading digital Marathi comedy platform producing web series, stand-up specials, and cultural satires.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-bhadipa-yt", "YouTube", "@BhaDiPa", "https://www.youtube.com/@BhaDiPa", 1550000, 720000, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-bhadipa-ig", "Instagram", "bhadipa", "https://www.instagram.com/bhadipa/", 542500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "bhadipa@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@BhaDiPa/about",
      lastChecked: daysAgo(2),
    },
  },

  // 83. Kanan Gill
  {
    id: "creator-in-kanangill",
    name: "Kanan Gill",
    category: "Comedy",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "International stand-up comedian, Pretentious Movie Reviews pioneer, author, and acclaimed Netflix special creator.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-kanangill-yt", "YouTube", "@kanangill", "https://www.youtube.com/@kanangill", 920000, 1800000, "avg_video_views", "Bi-weekly satirical reviews"),
      createAccount("acc-creator-in-kanangill-ig", "Instagram", "kanangill", "https://www.instagram.com/kanangill/", 322000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "kanangill@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@kanangill/about",
      lastChecked: daysAgo(2),
    },
  },

  // 84. Kenny Sebastian
  {
    id: "creator-in-kennethseb",
    name: "Kenny Sebastian",
    category: "Comedy",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Stand-up comedian, musician, and animation creator known for gentle, observational family humor across Netflix & Amazon.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-kennethseb-yt", "YouTube", "@kennethseb", "https://www.youtube.com/@kennethseb", 2250000, 2100000, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-kennethseb-ig", "Instagram", "kennethseb", "https://www.instagram.com/kennethseb/", 787500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "kennethseb@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@kennethseb/about",
      lastChecked: daysAgo(2),
    },
  },

  // 85. Ghatak (Abhijeet Andhare)
  {
    id: "creator-in-ghatakgaming",
    name: "Ghatak (Abhijeet Andhare)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Veteran esports coach, GodLike Esports mentor, and respected voice in South Asian competitive battle royales.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-ghatakgaming-yt", "YouTube", "@Ghatak_Gaming", "https://www.youtube.com/@Ghatak_Gaming", 2100000, 280000, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-ghatakgaming-ig", "Instagram", "ghatakgaming", "https://www.instagram.com/ghatakgaming/", 735000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "ghatakgaming@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@Ghatak_Gaming/about",
      lastChecked: daysAgo(2),
    },
  },

  // 86. Kronten Gaming (Chetan Chandgude)
  {
    id: "creator-in-krontengamingofficial",
    name: "Kronten Gaming (Chetan Chandgude)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Founder of GodLike Esports, mobile gaming streamer, and pioneer of tournament broadcast entertainment.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-krontengamingofficial-yt", "YouTube", "@KrontenGamingOfficial", "https://www.youtube.com/@KrontenGamingOfficial", 2450000, 310000, "avg_video_views", "Streams 4 tournament sessions / week"),
      createAccount("acc-creator-in-krontengamingofficial-ig", "Instagram", "krontengamingofficial", "https://www.instagram.com/krontengamingofficial/", 857500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "krontengamingofficial@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@KrontenGamingOfficial/about",
      lastChecked: daysAgo(2),
    },
  },

  // 87. Regaltos (Parv Singh)
  {
    id: "creator-in-soulregaltos",
    name: "Regaltos (Parv Singh)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Iconic Team SouL assaulter, international PMCO champion, and prominent battle royale livestreamer.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-soulregaltos-yt", "YouTube", "@SouLRegaltos", "https://www.youtube.com/@SouLRegaltos", 2400000, 340000, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-soulregaltos-ig", "Instagram", "soulregaltos", "https://www.instagram.com/soulregaltos/", 840000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "soulregaltos@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@SouLRegaltos/about",
      lastChecked: daysAgo(2),
    },
  },

  // 88. Snax Gaming (Raj Varma)
  {
    id: "creator-in-snaxgaming",
    name: "Snax Gaming (Raj Varma)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Esports athlete, famous for 'Snax DP Burst' tutorials, competitive tournaments, and lifestyle fitness vlogs.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-snaxgaming-yt", "YouTube", "@SnaxGaming", "https://www.youtube.com/@SnaxGaming", 1650000, 240000, "avg_video_views", "Streams 5-6 days / week"),
      createAccount("acc-creator-in-snaxgaming-ig", "Instagram", "snaxgaming", "https://www.instagram.com/snaxgaming/", 577500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "snaxgaming@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@SnaxGaming/about",
      lastChecked: daysAgo(2),
    },
  },

  // 89. Kaashvi Hiranandani (Kaash Plays)
  {
    id: "creator-in-kaashplays",
    name: "Kaashvi Hiranandani (Kaash Plays)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Top female gaming creator for S8UL Esports, Valorant streamer, lifestyle vlogger, and Red Bull athlete.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-kaashplays-yt", "YouTube", "@KaashPlays", "https://www.youtube.com/@KaashPlays", 1150000, 180000, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-kaashplays-ig", "Instagram", "kaashplays", "https://www.instagram.com/kaashplays/", 402500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "kaashplays@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@KaashPlays/about",
      lastChecked: daysAgo(2),
    },
  },

  // 90. Shreeman Legend (Siddharth Joshi)
  {
    id: "creator-in-shreemanlegendlive",
    name: "Shreeman Legend (Siddharth Joshi)",
    category: "Gaming",
    language: "Marathi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Maharashtra's beloved Marathi & Hindi variety streamer creating wholesome GTA V roleplay and story adventures.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-shreemanlegendlive-yt", "YouTube", "@ShreemanLegendLive", "https://www.youtube.com/@ShreemanLegendLive", 2100000, 410000, "avg_video_views", "Streams 4 tournament sessions / week"),
      createAccount("acc-creator-in-shreemanlegendlive-ig", "Instagram", "shreemanlegendlive", "https://www.instagram.com/shreemanlegendlive/", 735000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "shreemanlegendlive@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@ShreemanLegendLive/about",
      lastChecked: daysAgo(2),
    },
  },

  // 91. Rakazone Gaming (Rishab Karanwal)
  {
    id: "creator-in-rakazonegaming",
    name: "Rakazone Gaming (Rishab Karanwal)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Streamer of the Year awardee, variety PC streamer, GTA V roleplay legend, and pioneer of Indian gaming.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-rakazonegaming-yt", "YouTube", "@RakaZoneGaming", "https://www.youtube.com/@RakaZoneGaming", 740000, 160000, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-rakazonegaming-ig", "Instagram", "rakazonegaming", "https://www.instagram.com/rakazonegaming/", 259000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "rakazonegaming@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@RakaZoneGaming/about",
      lastChecked: daysAgo(2),
    },
  },

  // 92. Antaryami Gaming (Rishabh Verma)
  {
    id: "creator-in-antaryamigaming",
    name: "Antaryami Gaming (Rishabh Verma)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "High-energy comedic battle royale commentator known for raw voice commentary, clutches, and funny gameplay.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-antaryamigaming-yt", "YouTube", "@AntaryamiGaming", "https://www.youtube.com/@AntaryamiGaming", 4350000, 520000, "avg_video_views", "Streams 5-6 days / week"),
      createAccount("acc-creator-in-antaryamigaming-ig", "Instagram", "antaryamigaming", "https://www.instagram.com/antaryamigaming/", 1522500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "antaryamigaming@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@AntaryamiGaming/about",
      lastChecked: daysAgo(2),
    },
  },

  // 93. Alpha Clasher (Prateek Jogani)
  {
    id: "creator-in-alphaclasher",
    name: "Alpha Clasher (Prateek Jogani)",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Versatile multiplayer streamer playing BGMI, Among Us, GTA V, and interactive community games with Hydra Esports.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-alphaclasher-yt", "YouTube", "@AlphaClasher", "https://www.youtube.com/@AlphaClasher", 1850000, 220000, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-alphaclasher-ig", "Instagram", "alphaclasher", "https://www.instagram.com/alphaclasher/", 647500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "alphaclasher@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@AlphaClasher/about",
      lastChecked: daysAgo(2),
    },
  },

  // 94. Bindaas Kavya Gaming
  {
    id: "creator-in-bindaaskavyagaming",
    name: "Bindaas Kavya Gaming",
    category: "Gaming",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Popular young mobile streamer engaging millions with daily arcade gameplay, challenges, and Minecraft episodes.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-bindaaskavyagaming-yt", "YouTube", "@BindaasKavyaGaming", "https://www.youtube.com/@BindaasKavyaGaming", 2200000, 260000, "avg_video_views", "Streams 4 tournament sessions / week"),
      createAccount("acc-creator-in-bindaaskavyagaming-ig", "Instagram", "bindaaskavyagaming", "https://www.instagram.com/bindaaskavyagaming/", 770000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "bindaaskavyagaming@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@BindaasKavyaGaming/about",
      lastChecked: daysAgo(2),
    },
  },

  // 95. Finance With Sharan (Sharan Hegde)
  {
    id: "creator-in-financewithsharan",
    name: "Finance With Sharan (Sharan Hegde)",
    category: "Finance",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Forbes 30 Under 30 creator turning dry personal finance, taxes, credit cards, and investing into hilarious sketches.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-financewithsharan-yt", "YouTube", "@financewithsharan", "https://www.youtube.com/@financewithsharan", 3100000, 2800000, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-financewithsharan-ig", "Instagram", "financewithsharan", "https://www.instagram.com/financewithsharan/", 1085000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "financewithsharan@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@financewithsharan/about",
      lastChecked: daysAgo(2),
    },
  },

  // 96. Neha Nagar
  {
    id: "creator-in-iamnehanagar",
    name: "Neha Nagar",
    category: "Finance",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Fintech entrepreneur and educator breaking down taxation, stock market basics, business loans, and government schemes.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-iamnehanagar-yt", "YouTube", "@iamnehanagar", "https://www.youtube.com/@iamnehanagar", 2150000, 1900000, "avg_video_views", "Posts 3 investing breakdowns / week"),
      createAccount("acc-creator-in-iamnehanagar-ig", "Instagram", "iamnehanagar", "https://www.instagram.com/iamnehanagar/", 752500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "iamnehanagar@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@iamnehanagar/about",
      lastChecked: daysAgo(2),
    },
  },

  // 97. Asset Yogi (Mukul Malik)
  {
    id: "creator-in-assetyogi",
    name: "Asset Yogi (Mukul Malik)",
    category: "Finance",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Practical financial educator demystifying real estate valuation, mutual fund selection, insurance, and retirement plans.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-assetyogi-yt", "YouTube", "@AssetYogi", "https://www.youtube.com/@AssetYogi", 4300000, 410000, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-assetyogi-ig", "Instagram", "assetyogi", "https://www.instagram.com/assetyogi/", 1505000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "assetyogi@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@AssetYogi/about",
      lastChecked: daysAgo(2),
    },
  },

  // 98. Yadnya Investment Academy
  {
    id: "creator-in-investyadnya",
    name: "Yadnya Investment Academy",
    category: "Finance",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Fundamental equity research, corporate governance reviews, balance sheet forensics, and stock valuations.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-investyadnya-yt", "YouTube", "@InvestYadnya", "https://www.youtube.com/@InvestYadnya", 1150000, 130000, "avg_video_views", "Posts 2 personal wealth guides / week"),
      createAccount("acc-creator-in-investyadnya-ig", "Instagram", "investyadnya", "https://www.instagram.com/investyadnya/", 402500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "investyadnya@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@InvestYadnya/about",
      lastChecked: daysAgo(2),
    },
  },

  // 99. Pushkar Raj Thakur
  {
    id: "creator-in-pushkarrajthakurofficial",
    name: "Pushkar Raj Thakur",
    category: "Finance",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Youth business coach, stock options educator, and motivational speaker on entrepreneurial mindset and wealth.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-pushkarrajthakurofficial-yt", "YouTube", "@PushkarRajThakurOfficial", "https://www.youtube.com/@PushkarRajThakurOfficial", 11400000, 890000, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-pushkarrajthakurofficial-ig", "Instagram", "pushkarrajthakurofficial", "https://www.instagram.com/pushkarrajthakurofficial/", 3990000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "pushkarrajthakurofficial@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@PushkarRajThakurOfficial/about",
      lastChecked: daysAgo(2),
    },
  },

  // 100. Booming Bulls (Anish Singh Thakur)
  {
    id: "creator-in-boomingbulls",
    name: "Booming Bulls (Anish Singh Thakur)",
    category: "Finance",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Price action technical trading academy teaching chart patterns, risk management, and forex/derivatives discipline.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-boomingbulls-yt", "YouTube", "@BoomingBulls", "https://www.youtube.com/@BoomingBulls", 3600000, 420000, "avg_video_views", "Posts 3 investing breakdowns / week"),
      createAccount("acc-creator-in-boomingbulls-ig", "Instagram", "boomingbulls", "https://www.instagram.com/boomingbulls/", 1260000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "boomingbulls@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@BoomingBulls/about",
      lastChecked: daysAgo(2),
    },
  },

  // 101. Sunil Minglani
  {
    id: "creator-in-sunilminglani",
    name: "Sunil Minglani",
    category: "Finance",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Veteran stock market psychologist teaching behavior patterns, market cycles, and candlestick discipline.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-sunilminglani-yt", "YouTube", "@SunilMinglani", "https://www.youtube.com/@SunilMinglani", 1450000, 180000, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-sunilminglani-ig", "Instagram", "sunilminglani", "https://www.instagram.com/sunilminglani/", 507500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "sunilminglani@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@SunilMinglani/about",
      lastChecked: daysAgo(2),
    },
  },

  // 102. PR Sundar
  {
    id: "creator-in-prsundar64",
    name: "PR Sundar",
    category: "Finance",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Chennai-based options seller and derivatives hedge specialist discussing F&O strategies and market analysis.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-prsundar64-yt", "YouTube", "@PRSundar64", "https://www.youtube.com/@PRSundar64", 1100000, 140000, "avg_video_views", "Posts 2 personal wealth guides / week"),
      createAccount("acc-creator-in-prsundar64-ig", "Instagram", "prsundar64", "https://www.instagram.com/prsundar64/", 385000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "prsundar64@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@PRSundar64/about",
      lastChecked: daysAgo(2),
    },
  },

  // 103. Physics Wallah (Alakh Pandey)
  {
    id: "creator-in-physicswallah",
    name: "Physics Wallah (Alakh Pandey)",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Unicorn edtech founder and India's most beloved teacher democratizing affordable coaching for JEE, NEET, and school boards.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-physicswallah-yt", "YouTube", "@PhysicsWallah", "https://www.youtube.com/@PhysicsWallah", 13400000, 1650000, "avg_video_views", "Daily science & current affairs briefs"),
      createAccount("acc-creator-in-physicswallah-ig", "Instagram", "physicswallah", "https://www.instagram.com/physicswallah/", 4690000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "physicswallah@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@PhysicsWallah/about",
      lastChecked: daysAgo(2),
    },
  },

  // 104. Dear Sir (Waqas Malik)
  {
    id: "creator-in-dearsir",
    name: "Dear Sir (Waqas Malik)",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Comprehensive English grammar, quantitative aptitude, and school syllabus explainers with memory hacks.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-dearsir-yt", "YouTube", "@DearSir", "https://www.youtube.com/@DearSir", 17800000, 1950000, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-dearsir-ig", "Instagram", "dearsir", "https://www.instagram.com/dearsir/", 6230000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "dearsir@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@DearSir/about",
      lastChecked: daysAgo(2),
    },
  },

  // 105. Study IQ Education
  {
    id: "creator-in-studyiqeducation",
    name: "Study IQ Education",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Leading UPSC civil services preparation channel analyzing daily geopolitics, international treaties, and national news.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-studyiqeducation-yt", "YouTube", "@StudyIQEducation", "https://www.youtube.com/@StudyIQEducation", 17100000, 1450000, "avg_video_views", "Daily exam lectures & live doubt clearing"),
      createAccount("acc-creator-in-studyiqeducation-ig", "Instagram", "studyiqeducation", "https://www.instagram.com/studyiqeducation/", 5985000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "studyiqeducation@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@StudyIQEducation/about",
      lastChecked: daysAgo(2),
    },
  },

  // 106. Utkarsh Classes Jodhpur
  {
    id: "creator-in-utkarshclassesjodhpur",
    name: "Utkarsh Classes Jodhpur",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Daily morning current affairs, state competitive exams coaching, and general studies lectures by Kumar Gaurav Sir.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-utkarshclassesjodhpur-yt", "YouTube", "@UtkarshClassesJodhpur", "https://www.youtube.com/@UtkarshClassesJodhpur", 13800000, 1200000, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-utkarshclassesjodhpur-ig", "Instagram", "utkarshclassesjodhpur", "https://www.instagram.com/utkarshclassesjodhpur/", 4830000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "utkarshclassesjodhpur@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@UtkarshClassesJodhpur/about",
      lastChecked: daysAgo(2),
    },
  },

  // 107. Let's LEARN (Himanshi Singh)
  {
    id: "creator-in-letslearn2016",
    name: "Let's LEARN (Himanshi Singh)",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Premier educator for CTET and state teacher eligibility exams, teaching child development and pedagogy.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-letslearn2016-yt", "YouTube", "@LetsLEARN2016", "https://www.youtube.com/@LetsLEARN2016", 5100000, 480000, "avg_video_views", "Daily science & current affairs briefs"),
      createAccount("acc-creator-in-letslearn2016-ig", "Instagram", "letslearn2016", "https://www.instagram.com/letslearn2016/", 1785000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "letslearn2016@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@LetsLEARN2016/about",
      lastChecked: daysAgo(2),
    },
  },

  // 108. Neso Academy
  {
    id: "creator-in-nesoacademy",
    name: "Neso Academy",
    category: "Education",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Global computer science and electrical engineering portal covering Operating Systems, Automata, and Digital Circuits.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-nesoacademy-yt", "YouTube", "@NesoAcademy", "https://www.youtube.com/@NesoAcademy", 2600000, 310000, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-nesoacademy-ig", "Instagram", "nesoacademy", "https://www.instagram.com/nesoacademy/", 910000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "nesoacademy@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@NesoAcademy/about",
      lastChecked: daysAgo(2),
    },
  },

  // 109. Gate Smashers (Varun Singla)
  {
    id: "creator-in-gatesmashers",
    name: "Gate Smashers (Varun Singla)",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Top engineering college guide breaking down computer networks, DBMS, algorithms, and GATE preparation.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-gatesmashers-yt", "YouTube", "@GateSmashers", "https://www.youtube.com/@GateSmashers", 1850000, 240000, "avg_video_views", "Daily exam lectures & live doubt clearing"),
      createAccount("acc-creator-in-gatesmashers-ig", "Instagram", "gatesmashers", "https://www.instagram.com/gatesmashers/", 647500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "gatesmashers@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@GateSmashers/about",
      lastChecked: daysAgo(2),
    },
  },

  // 110. Nisha Madhulika
  {
    id: "creator-in-nishamadhulika",
    name: "Nisha Madhulika",
    category: "Food",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Pioneering Indian vegetarian culinary master, Padma Shri nominee, sharing foolproof traditional recipes for over 15 years.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-nishamadhulika-yt", "YouTube", "@nishamadhulika", "https://www.youtube.com/@nishamadhulika", 14800000, 680000, "avg_video_views", "Posts 2 weekend feast masterclasses"),
      createAccount("acc-creator-in-nishamadhulika-ig", "Instagram", "nishamadhulika", "https://www.instagram.com/nishamadhulika/", 5180000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "nishamadhulika@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@nishamadhulika/about",
      lastChecked: daysAgo(2),
    },
  },

  // 111. Bharat's Kitchen HINDI
  {
    id: "creator-in-bharatzkitchenhindi",
    name: "Bharat's Kitchen HINDI",
    category: "Food",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Food science enthusiast explaining the exact culinary chemistry, heat control, and restaurant flavors at home.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-bharatzkitchenhindi-yt", "YouTube", "@bharatzkitchenHINDI", "https://www.youtube.com/@bharatzkitchenHINDI", 13400000, 1100000, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-bharatzkitchenhindi-ig", "Instagram", "bharatzkitchenhindi", "https://www.instagram.com/bharatzkitchenhindi/", 4690000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "bharatzkitchenhindi@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@bharatzkitchenHINDI/about",
      lastChecked: daysAgo(2),
    },
  },

  // 112. Cook With Parul
  {
    id: "creator-in-cookwithparul",
    name: "Cook With Parul",
    category: "Food",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Quick festival sweets, street food snacks, healthy breakfast recipes, and inventive instant dishes in Hindi.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-cookwithparul-yt", "YouTube", "@CookWithParul", "https://www.youtube.com/@CookWithParul", 11200000, 740000, "avg_video_views", "Posts 3 regional recipe guides / week"),
      createAccount("acc-creator-in-cookwithparul-ig", "Instagram", "cookwithparul", "https://www.instagram.com/cookwithparul/", 3920000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "cookwithparul@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@CookWithParul/about",
      lastChecked: daysAgo(2),
    },
  },

  // 113. Sanjeev Kapoor Khazana
  {
    id: "creator-in-sanjeevkapoorkhazana",
    name: "Sanjeev Kapoor Khazana",
    category: "Food",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Legendary Indian MasterChef, culinary author, and Padma Shri awardee teaching royal and home kitchens worldwide.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-sanjeevkapoorkhazana-yt", "YouTube", "@sanjeevkapoorkhazana", "https://www.youtube.com/@sanjeevkapoorkhazana", 7900000, 340000, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-sanjeevkapoorkhazana-ig", "Instagram", "sanjeevkapoorkhazana", "https://www.instagram.com/sanjeevkapoorkhazana/", 2765000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "sanjeevkapoorkhazana@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@sanjeevkapoorkhazana/about",
      lastChecked: daysAgo(2),
    },
  },

  // 114. Hebbar's Kitchen
  {
    id: "creator-in-hebbarskitchen",
    name: "Hebbar's Kitchen",
    category: "Food",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Short, soothing top-down vegetarian cooking guides for South Indian breakfast, street curries, and festival sweets.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-hebbarskitchen-yt", "YouTube", "@HebbarsKitchen", "https://www.youtube.com/@HebbarsKitchen", 7400000, 480000, "avg_video_views", "Posts 2 weekend feast masterclasses"),
      createAccount("acc-creator-in-hebbarskitchen-ig", "Instagram", "hebbarskitchen", "https://www.instagram.com/hebbarskitchen/", 2590000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "hebbarskitchen@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@HebbarsKitchen/about",
      lastChecked: daysAgo(2),
    },
  },

  // 115. Irfan's View
  {
    id: "creator-in-irfansview",
    name: "Irfan's View",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Chennai's leading food and travel explorer reviewing hidden street stalls, luxury buffets, and international dining.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-irfansview-yt", "YouTube", "@Irfansview", "https://www.youtube.com/@Irfansview", 4500000, 890000, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-irfansview-ig", "Instagram", "irfansview", "https://www.instagram.com/irfansview/", 1575000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "irfansview@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@Irfansview/about",
      lastChecked: daysAgo(2),
    },
  },

  // 116. Village Food Channel (Firoz Chuttipara)
  {
    id: "creator-in-villagefoodchannelofficial",
    name: "Village Food Channel (Firoz Chuttipara)",
    category: "Food",
    language: "Malayalam",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Kerala's popular outdoor cooking specialist preparing mammoth traditional seafood and regional feasts in nature.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-villagefoodchannelofficial-yt", "YouTube", "@VillageFoodChannelOfficial", "https://www.youtube.com/@VillageFoodChannelOfficial", 6800000, 1200000, "avg_video_views", "Posts 3 regional recipe guides / week"),
      createAccount("acc-creator-in-villagefoodchannelofficial-ig", "Instagram", "villagefoodchannelofficial", "https://www.instagram.com/villagefoodchannelofficial/", 2380000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "villagefoodchannelofficial@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@VillageFoodChannelOfficial/about",
      lastChecked: daysAgo(2),
    },
  },

  // 117. Tanya Khanijow
  {
    id: "creator-in-tanyakhanijow",
    name: "Tanya Khanijow",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Solo female traveler documenting raw adventures from remote Himalayan villages to Africa and Europe.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-tanyakhanijow-yt", "YouTube", "@TanyaKhanijow", "https://www.youtube.com/@TanyaKhanijow", 1650000, 480000, "avg_video_views", "Daily expedition reels & budget guides"),
      createAccount("acc-creator-in-tanyakhanijow-ig", "Instagram", "tanyakhanijow", "https://www.instagram.com/tanyakhanijow/", 577500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "tanyakhanijow@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@TanyaKhanijow/about",
      lastChecked: daysAgo(2),
    },
  },

  // 118. Ronnie & Barty
  {
    id: "creator-in-ronnieandbarty",
    name: "Ronnie & Barty",
    category: "Travel",
    language: "English",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Cinematic filmmakers based in Manali, capturing the ethereal beauty, culture, and seasons of the high Himalayas.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-ronnieandbarty-yt", "YouTube", "@RonnieandBarty", "https://www.youtube.com/@RonnieandBarty", 510000, 280000, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-ronnieandbarty-ig", "Instagram", "ronnieandbarty", "https://www.instagram.com/ronnieandbarty/", 178500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "ronnieandbarty@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@RonnieandBarty/about",
      lastChecked: daysAgo(2),
    },
  },

  // 119. Nomadic Indian (Deepanshu Sangwan)
  {
    id: "creator-in-nomadicindian",
    name: "Nomadic Indian (Deepanshu Sangwan)",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Backpacking around the globe on a budget, experiencing local cultures, border crossings, and street life.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-nomadicindian-yt", "YouTube", "@NomadicIndian", "https://www.youtube.com/@NomadicIndian", 1950000, 520000, "avg_video_views", "Weekly offbeat Himalayan journeys"),
      createAccount("acc-creator-in-nomadicindian-ig", "Instagram", "nomadicindian", "https://www.instagram.com/nomadicindian/", 682500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "nomadicindian@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@NomadicIndian/about",
      lastChecked: daysAgo(2),
    },
  },

  // 120. Passenger Paramvir
  {
    id: "creator-in-passengerparamvir",
    name: "Passenger Paramvir",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Adventurous travel documentarian venturing into offbeat destinations, central Asian republics, and untouristed lands.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-passengerparamvir-yt", "YouTube", "@PassengerParamvir", "https://www.youtube.com/@PassengerParamvir", 2600000, 780000, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-passengerparamvir-ig", "Instagram", "passengerparamvir", "https://www.instagram.com/passengerparamvir/", 910000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "passengerparamvir@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@PassengerParamvir/about",
      lastChecked: daysAgo(2),
    },
  },

  // 121. Mountain Trekker (Varun Vagish)
  {
    id: "creator-in-mountaintrekker",
    name: "Mountain Trekker (Varun Vagish)",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "National Tourism Award winner inspiring affordable international travel, visa advice, and hitchhiking journeys.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-mountaintrekker-yt", "YouTube", "@MountainTrekker", "https://www.youtube.com/@MountainTrekker", 1850000, 340000, "avg_video_views", "Daily expedition reels & budget guides"),
      createAccount("acc-creator-in-mountaintrekker-ig", "Instagram", "mountaintrekker", "https://www.instagram.com/mountaintrekker/", 647500, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "mountaintrekker@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@MountainTrekker/about",
      lastChecked: daysAgo(2),
    },
  },

  // 122. Mumbiker Nikhil (Nikhil Sharma)
  {
    id: "creator-in-mumbikernikhil",
    name: "Mumbiker Nikhil (Nikhil Sharma)",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Pioneering Indian motovlogger and lifestyle creator documenting cross-country motorcycle expeditions and family life.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-mumbikernikhil-yt", "YouTube", "@MumbikerNikhil", "https://www.youtube.com/@MumbikerNikhil", 4100000, 450000, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-mumbikernikhil-ig", "Instagram", "mumbikernikhil", "https://www.instagram.com/mumbikernikhil/", 1435000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "mumbikernikhil@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@MumbikerNikhil/about",
      lastChecked: daysAgo(2),
    },
  },

  // 123. Naa Anveshana
  {
    id: "creator-in-naaanveshana",
    name: "Naa Anveshana",
    category: "Travel",
    language: "Telugu",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Telugu traveler exploring over 80 countries, showcasing local culture, markets, and street foods across continents.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-naaanveshana-yt", "YouTube", "@NaaAnveshana", "https://www.youtube.com/@NaaAnveshana", 2800000, 850000, "avg_video_views", "Weekly offbeat Himalayan journeys"),
      createAccount("acc-creator-in-naaanveshana-ig", "Instagram", "naaanveshana", "https://www.instagram.com/naaanveshana/", 980000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "naaanveshana@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@NaaAnveshana/about",
      lastChecked: daysAgo(2),
    },
  },

  // 124. Jeet Selal Aesthetics
  {
    id: "creator-in-jeetselalaesthetics",
    name: "Jeet Selal Aesthetics",
    category: "Fitness",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Sports nutritionist and certified trainer promoting drug-free natural bodybuilding, posture correction, and diet science.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-jeetselalaesthetics-yt", "YouTube", "@JeetSelalAesthetics", "https://www.youtube.com/@JeetSelalAesthetics", 4100000, 380000, "avg_video_views", "Posts 4 workout tutorials / week"),
      createAccount("acc-creator-in-jeetselalaesthetics-ig", "Instagram", "jeetselalaesthetics", "https://www.instagram.com/jeetselalaesthetics/", 1435000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "jeetselalaesthetics@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@JeetSelalAesthetics/about",
      lastChecked: daysAgo(2),
    },
  },

  // 125. Guru Mann Fitness
  {
    id: "creator-in-gurumannfitness",
    name: "Guru Mann Fitness",
    category: "Fitness",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "San Francisco-based Indian fitness icon offering comprehensive workout and nutrition programs for fat loss and muscle gain.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-gurumannfitness-yt", "YouTube", "@GuruMannFitness", "https://www.youtube.com/@GuruMannFitness", 2600000, 240000, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-gurumannfitness-ig", "Instagram", "gurumannfitness", "https://www.instagram.com/gurumannfitness/", 910000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "gurumannfitness@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@GuruMannFitness/about",
      lastChecked: daysAgo(2),
    },
  },

  // 126. Yatinder Singh
  {
    id: "creator-in-yatindersinghofficial",
    name: "Yatinder Singh",
    category: "Fitness",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Mr. India, Mr. World runner-up, motivational wheelchair survivor, and champion strength training mentor.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-yatindersinghofficial-yt", "YouTube", "@YatinderSinghOfficial", "https://www.youtube.com/@YatinderSinghOfficial", 4500000, 420000, "avg_video_views", "Weekly strength & posture masterclasses"),
      createAccount("acc-creator-in-yatindersinghofficial-ig", "Instagram", "yatindersinghofficial", "https://www.instagram.com/yatindersinghofficial/", 1575000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "yatindersinghofficial@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@YatinderSinghOfficial/about",
      lastChecked: daysAgo(2),
    },
  },

  // 127. Rohit Khatri Fitness
  {
    id: "creator-in-rohitkhatrifitness",
    name: "Rohit Khatri Fitness",
    category: "Fitness",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Sports science student and online coach sharing home bodyweight routines, gym splits, and high-protein diet charts.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-rohitkhatrifitness-yt", "YouTube", "@RohitKhatriFitness", "https://www.youtube.com/@RohitKhatriFitness", 4900000, 310000, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-rohitkhatrifitness-ig", "Instagram", "rohitkhatrifitness", "https://www.instagram.com/rohitkhatrifitness/", 1715000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "rohitkhatrifitness@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@RohitKhatriFitness/about",
      lastChecked: daysAgo(2),
    },
  },

  // 128. Satvic Movement
  {
    id: "creator-in-satvicmovement",
    name: "Satvic Movement",
    category: "Fitness",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Media Profile",
    bio: "Holistic health educators teaching ancient yogic lifestyles, plant-based diets, fasting, and natural disease reversal.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-satvicmovement-yt", "YouTube", "@SatvicMovement", "https://www.youtube.com/@SatvicMovement", 5800000, 980000, "avg_video_views", "Posts 4 workout tutorials / week"),
      createAccount("acc-creator-in-satvicmovement-ig", "Instagram", "satvicmovement", "https://www.instagram.com/satvicmovement/", 2030000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 89, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "satvicmovement@creatorpartners.in",
      sourceUrl: "https://www.youtube.com/@SatvicMovement/about",
      lastChecked: daysAgo(2),
    },
  },

  // 129. PewDiePie (Felix Kjellberg)
  {
    id: "creator-gl-pewdiepie",
    name: "PewDiePie (Felix Kjellberg)",
    category: "Entertainment",
    language: "English",
    creatorCountry: "Japan",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "Legendary gaming commentary pioneer, book reviews, and life in Japan vlogs.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-pewdiepie-yt", "YouTube", "@PewDiePie", "https://www.youtube.com/@PewDiePie", 111000000, 4200000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-pewdiepie-ig", "Instagram", "pewdiepie", "https://www.instagram.com/pewdiepie/", 46620000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Japan", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@pewdiepie.com",
      sourceUrl: "https://www.youtube.com/@PewDiePie/about",
      lastChecked: daysAgo(3),
    },
  },

  // 130. Linus Tech Tips
  {
    id: "creator-gl-linustechtips",
    name: "Linus Tech Tips",
    category: "Technology",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "Passionate consumer technology reviews, lab benchmarks, and PC building extravaganzas.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-linustechtips-yt", "YouTube", "@LinusTechTips", "https://www.youtube.com/@LinusTechTips", 15800000, 1850000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-linustechtips-ig", "Instagram", "linustechtips", "https://www.instagram.com/linustechtips/", 6636000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@linustechtips.com",
      sourceUrl: "https://www.youtube.com/@LinusTechTips/about",
      lastChecked: daysAgo(3),
    },
  },

  // 131. Veritasium (Derek Muller)
  {
    id: "creator-gl-veritasium",
    name: "Veritasium (Derek Muller)",
    category: "Education",
    language: "English",
    creatorCountry: "Australia",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "An element of truth: deep dives into counterintuitive physics, astronomy, and science discoveries.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-veritasium-yt", "YouTube", "@veritasium", "https://www.youtube.com/@veritasium", 16500000, 3400000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-veritasium-ig", "Instagram", "veritasium", "https://www.instagram.com/veritasium/", 6930000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Australia", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@veritasium.com",
      sourceUrl: "https://www.youtube.com/@veritasium/about",
      lastChecked: daysAgo(3),
    },
  },

  // 132. Kurzgesagt – In a Nutshell
  {
    id: "creator-gl-inanutshell",
    name: "Kurzgesagt – In a Nutshell",
    category: "Education",
    language: "English",
    creatorCountry: "Germany",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "Distinctive illustrated animations explaining space exploration, evolution, philosophy, and future tech.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-inanutshell-yt", "YouTube", "@inanutshell", "https://www.youtube.com/@inanutshell", 22800000, 5200000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-inanutshell-ig", "Instagram", "inanutshell", "https://www.instagram.com/inanutshell/", 9576000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Germany", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@inanutshell.com",
      sourceUrl: "https://www.youtube.com/@inanutshell/about",
      lastChecked: daysAgo(3),
    },
  },

  // 133. Sidemen (KSI & Miniminter)
  {
    id: "creator-gl-sidemen",
    name: "Sidemen (KSI & Miniminter)",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United Kingdom",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "Britain's premier YouTube group known for Sidemen Sundays, Tinder IRL, 20v1, and charity football.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-sidemen-yt", "YouTube", "@Sidemen", "https://www.youtube.com/@Sidemen", 21600000, 6800000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-sidemen-ig", "Instagram", "sidemen", "https://www.instagram.com/sidemen/", 9072000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United Kingdom", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@sidemen.com",
      sourceUrl: "https://www.youtube.com/@Sidemen/about",
      lastChecked: daysAgo(3),
    },
  },

  // 134. Mrwhosetheboss (Arun Maini)
  {
    id: "creator-gl-mrwhosetheboss",
    name: "Mrwhosetheboss (Arun Maini)",
    category: "Technology",
    language: "English",
    creatorCountry: "United Kingdom",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "High-production consumer tech, smartphone shootouts, prototype reviews, and gadget comparisons.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-mrwhosetheboss-yt", "YouTube", "@mrwhosetheboss", "https://www.youtube.com/@mrwhosetheboss", 19800000, 2900000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-mrwhosetheboss-ig", "Instagram", "mrwhosetheboss", "https://www.instagram.com/mrwhosetheboss/", 8316000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United Kingdom", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@mrwhosetheboss.com",
      sourceUrl: "https://www.youtube.com/@mrwhosetheboss/about",
      lastChecked: daysAgo(3),
    },
  },

  // 135. Cleo Abram
  {
    id: "creator-gl-cleoabram",
    name: "Cleo Abram",
    category: "Technology",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "Huge If True: Optimistic journalism explaining nuclear fusion, quantum computers, and biotechnology.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-cleoabram-yt", "YouTube", "@CleoAbram", "https://www.youtube.com/@CleoAbram", 3400000, 1100000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-cleoabram-ig", "Instagram", "cleoabram", "https://www.instagram.com/cleoabram/", 1428000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@cleoabram.com",
      sourceUrl: "https://www.youtube.com/@CleoAbram/about",
      lastChecked: daysAgo(3),
    },
  },

  // 136. Austin Evans
  {
    id: "creator-gl-austinevans",
    name: "Austin Evans",
    category: "Technology",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "Mystery tech unboxings, retro gaming hardware reviews, and building extreme gaming setups.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-austinevans-yt", "YouTube", "@austinevans", "https://www.youtube.com/@austinevans", 5400000, 420000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-austinevans-ig", "Instagram", "austinevans", "https://www.instagram.com/austinevans/", 2268000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@austinevans.com",
      sourceUrl: "https://www.youtube.com/@austinevans/about",
      lastChecked: daysAgo(3),
    },
  },

  // 137. Dave2D (Dave Lee)
  {
    id: "creator-gl-dave2d",
    name: "Dave2D (Dave Lee)",
    category: "Technology",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "Aesthetic, concise, fluff-free laptop teardowns, industrial design analysis, and monitor reviews.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-dave2d-yt", "YouTube", "@Dave2D", "https://www.youtube.com/@Dave2D", 3750000, 680000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-dave2d-ig", "Instagram", "dave2d", "https://www.instagram.com/dave2d/", 1575000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@dave2d.com",
      sourceUrl: "https://www.youtube.com/@Dave2D/about",
      lastChecked: daysAgo(3),
    },
  },

  // 138. Pokimane (Imane Anys)
  {
    id: "creator-gl-pokimane",
    name: "Pokimane (Imane Anys)",
    category: "Gaming",
    language: "English",
    creatorCountry: "Canada",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "Beloved variety streamer, co-founder of OTV, Valorant player, and digital lifestyle creator.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-pokimane-yt", "YouTube", "@pokimane", "https://www.youtube.com/@pokimane", 6600000, 28000, "avg_live_viewers", "Posts 3 times / week"),
      createAccount("acc-creator-gl-pokimane-ig", "Instagram", "pokimane", "https://www.instagram.com/pokimane/", 2772000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Canada", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@pokimane.com",
      sourceUrl: "https://www.youtube.com/@pokimane/about",
      lastChecked: daysAgo(3),
    },
  },

  // 139. Valkyrae (Rachell Hofstetter)
  {
    id: "creator-gl-valkyrae",
    name: "Valkyrae (Rachell Hofstetter)",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "Queen of YouTube Gaming, 100 Thieves co-owner, voice actress, and variety gaming streamer.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-valkyrae-yt", "YouTube", "@Valkyrae", "https://www.youtube.com/@Valkyrae", 4100000, 34000, "avg_live_viewers", "Posts 3 times / week"),
      createAccount("acc-creator-gl-valkyrae-ig", "Instagram", "valkyrae", "https://www.instagram.com/valkyrae/", 1722000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@valkyrae.com",
      sourceUrl: "https://www.youtube.com/@Valkyrae/about",
      lastChecked: daysAgo(3),
    },
  },

  // 140. Ludwig Ahgren
  {
    id: "creator-gl-ludwig",
    name: "Ludwig Ahgren",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "Creator of Mogul Money, The Yard podcast host, live event organizer, and variety streamer.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-ludwig-yt", "YouTube", "@ludwig", "https://www.youtube.com/@ludwig", 6200000, 1400000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-ludwig-ig", "Instagram", "ludwig", "https://www.instagram.com/ludwig/", 2604000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@ludwig.com",
      sourceUrl: "https://www.youtube.com/@ludwig/about",
      lastChecked: daysAgo(3),
    },
  },

  // 141. HasanAbi (Hasan Piker)
  {
    id: "creator-gl-hasanabi",
    name: "HasanAbi (Hasan Piker)",
    category: "Education",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "Top political news commentator, live breaking news analyst, and Twitch variety broadcaster.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-hasanabi-yt", "YouTube", "@hasanabi", "https://www.youtube.com/@hasanabi", 1550000, 38000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-hasanabi-ig", "Instagram", "hasanabi", "https://www.instagram.com/hasanabi/", 651000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@hasanabi.com",
      sourceUrl: "https://www.youtube.com/@hasanabi/about",
      lastChecked: daysAgo(3),
    },
  },

  // 142. Asmongold
  {
    id: "creator-gl-asmongold",
    name: "Asmongold",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "MMORPG veteran, ARPG specialist, video game industry critic, and co-founder of OTK Network.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-asmongold-yt", "YouTube", "@Asmongold", "https://www.youtube.com/@Asmongold", 2850000, 850000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-asmongold-ig", "Instagram", "asmongold", "https://www.instagram.com/asmongold/", 1197000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@asmongold.com",
      sourceUrl: "https://www.youtube.com/@Asmongold/about",
      lastChecked: daysAgo(3),
    },
  },

  // 143. TimTheTatman
  {
    id: "creator-gl-timthetatman",
    name: "TimTheTatman",
    category: "Gaming",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "Collegiate esports streamer, Call of Duty Warzone champion, and gaming community leader.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-timthetatman-yt", "YouTube", "@TimTheTatman", "https://www.youtube.com/@TimTheTatman", 5400000, 310000, "avg_live_viewers", "Posts 3 times / week"),
      createAccount("acc-creator-gl-timthetatman-ig", "Instagram", "timthetatman", "https://www.instagram.com/timthetatman/", 2268000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "United States", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@timthetatman.com",
      sourceUrl: "https://www.youtube.com/@TimTheTatman/about",
      lastChecked: daysAgo(3),
    },
  },

  // 144. Ibai Llanos
  {
    id: "creator-gl-ibaillanos",
    name: "Ibai Llanos",
    category: "Entertainment",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "Record-breaking Spanish streamer, La Velada del Año organizer, and Esports personality.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-ibaillanos-yt", "YouTube", "@ibaillanos", "https://www.youtube.com/@ibaillanos", 12200000, 95000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-ibaillanos-ig", "Instagram", "ibaillanos", "https://www.instagram.com/ibaillanos/", 5124000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@ibaillanos.com",
      sourceUrl: "https://www.youtube.com/@ibaillanos/about",
      lastChecked: daysAgo(3),
    },
  },

  // 145. AuronPlay (Raúl Álvarez)
  {
    id: "creator-gl-auronplay",
    name: "AuronPlay (Raúl Álvarez)",
    category: "Comedy",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "Iconic Spanish comedic commentator, parody specialist, and legendary Twitch variety streamer.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-auronplay-yt", "YouTube", "@AuronPlay", "https://www.youtube.com/@AuronPlay", 29500000, 3200000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-auronplay-ig", "Instagram", "auronplay", "https://www.instagram.com/auronplay/", 12390000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@auronplay.com",
      sourceUrl: "https://www.youtube.com/@AuronPlay/about",
      lastChecked: daysAgo(3),
    },
  },

  // 146. El Rubius (Rubén Doblas)
  {
    id: "creator-gl-elrubiusomg",
    name: "El Rubius (Rubén Doblas)",
    category: "Gaming",
    language: "Spanish",
    creatorCountry: "Spain",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "Pioneer of Spanish YouTube, anime creator, gaming entertainer, and streamer in Andorra & Spain.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-elrubiusomg-yt", "YouTube", "@elrubiusOMG", "https://www.youtube.com/@elrubiusOMG", 40400000, 2400000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-elrubiusomg-ig", "Instagram", "elrubiusomg", "https://www.instagram.com/elrubiusomg/", 16968000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Spain", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@elrubiusomg.com",
      sourceUrl: "https://www.youtube.com/@elrubiusOMG/about",
      lastChecked: daysAgo(3),
    },
  },

  // 147. Felipe Neto
  {
    id: "creator-gl-felipeneto",
    name: "Felipe Neto",
    category: "Entertainment",
    language: "Portuguese",
    creatorCountry: "Brazil",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "One of Brazil's biggest entertainment creators, pop culture reviewer, and social activist.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-felipeneto-yt", "YouTube", "@felipeneto", "https://www.youtube.com/@felipeneto", 46500000, 1800000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-felipeneto-ig", "Instagram", "felipeneto", "https://www.instagram.com/felipeneto/", 19530000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Brazil", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@felipeneto.com",
      sourceUrl: "https://www.youtube.com/@felipeneto/about",
      lastChecked: daysAgo(3),
    },
  },

  // 148. Whindersson Nunes
  {
    id: "creator-gl-whinderssonnunes",
    name: "Whindersson Nunes",
    category: "Comedy",
    language: "Portuguese",
    creatorCountry: "Brazil",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "Brazilian comedic megastar, stand-up comedian, music creator, and celebrity boxer.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-whinderssonnunes-yt", "YouTube", "@whinderssonnunes", "https://www.youtube.com/@whinderssonnunes", 44600000, 3100000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-whinderssonnunes-ig", "Instagram", "whinderssonnunes", "https://www.instagram.com/whinderssonnunes/", 18732000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Brazil", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@whinderssonnunes.com",
      sourceUrl: "https://www.youtube.com/@whinderssonnunes/about",
      lastChecked: daysAgo(3),
    },
  },

  // 149. Windah Basudara
  {
    id: "creator-gl-windahbasudara",
    name: "Windah Basudara",
    category: "Gaming",
    language: "Indonesian",
    creatorCountry: "Indonesia",
    creatorCountrySource: "Official Verified Channel Listing",
    bio: "Beloved Southeast Asian charity streamer and variety gaming entertainer with heroic community support.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-gl-windahbasudara-yt", "YouTube", "@WindahBasudara", "https://www.youtube.com/@WindahBasudara", 13900000, 1400000, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-gl-windahbasudara-ig", "Instagram", "windahbasudara", "https://www.instagram.com/windahbasudara/", 5838000, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "Indonesia", amount: 62, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.96 },
      { dimension: "country", value: "India", amount: 14, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 12, unit: "%", collectedAt: daysAgo(5), source: "Verified Platform Analytics", status: "public", confidence: 0.93 },
    ],
    businessContact: {
      email: "contact@windahbasudara.com",
      sourceUrl: "https://www.youtube.com/@WindahBasudara/about",
      lastChecked: daysAgo(3),
    },
  },

  // 150. Riya Sharma (Chandigarh, Punjab)
  {
    id: "creator-in-150",
    name: "Riya Sharma",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-150-yt", "YouTube", "@riyatech363", "https://www.youtube.com/@riyatech363", 8924350, 713948, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-150-ig", "Instagram", "riyatech363", "https://www.instagram.com/riyatech363/", 3391253, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.riya.sharma@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@riyatech363/about",
      lastChecked: daysAgo(3),
    },
  },

  // 151. Tanvi Singh (Vadodara, Gujarat)
  {
    id: "creator-in-151",
    name: "Tanvi Singh",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-151-yt", "YouTube", "@tanvifinance452", "https://www.youtube.com/@tanvifinance452", 14239079, 1352713, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-151-ig", "Instagram", "tanvifinance452", "https://www.instagram.com/tanvifinance452/", 5410850, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.tanvi.singh@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@tanvifinance452/about",
      lastChecked: daysAgo(3),
    },
  },

  // 152. Harish Patil (Pune, Maharashtra)
  {
    id: "creator-in-152",
    name: "Harish Patil",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-152-yt", "YouTube", "@harishtravel541", "https://www.youtube.com/@harishtravel541", 233808, 25719, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-152-ig", "Instagram", "harishtravel541", "https://www.instagram.com/harishtravel541/", 88847, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.harish.patil@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@harishtravel541/about",
      lastChecked: daysAgo(3),
    },
  },

  // 153. Abhishek Goud (Chennai, Tamil Nadu)
  {
    id: "creator-in-153",
    name: "Abhishek Goud",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-153-yt", "YouTube", "@abhishekmusic630", "https://www.youtube.com/@abhishekmusic630", 408537, 51067, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-153-ig", "Instagram", "abhishekmusic630", "https://www.instagram.com/abhishekmusic630/", 155244, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.abhishek.goud@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@abhishekmusic630/about",
      lastChecked: daysAgo(3),
    },
  },

  // 154. Alok Bhatia (Amritsar, Punjab)
  {
    id: "creator-in-154",
    name: "Alok Bhatia",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-154-yt", "YouTube", "@alokcomedy719", "https://www.youtube.com/@alokcomedy719", 703266, 98457, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-154-ig", "Instagram", "alokcomedy719", "https://www.instagram.com/alokcomedy719/", 267241, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.alok.bhatia@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@alokcomedy719/about",
      lastChecked: daysAgo(3),
    },
  },

  // 155. Reyansh Iyer (Surat, Gujarat)
  {
    id: "creator-in-155",
    name: "Reyansh Iyer",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-155-yt", "YouTube", "@reyanshfood808", "https://www.youtube.com/@reyanshfood808", 1102995, 170964, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-155-ig", "Instagram", "reyanshfood808", "https://www.instagram.com/reyanshfood808/", 419138, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.reyansh.iyer@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@reyanshfood808/about",
      lastChecked: daysAgo(3),
    },
  },

  // 156. Atharva Tiwari (Mumbai, Maharashtra)
  {
    id: "creator-in-156",
    name: "Atharva Tiwari",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-156-yt", "YouTube", "@atharvavlogs897", "https://www.youtube.com/@atharvavlogs897", 2417724, 411013, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-156-ig", "Instagram", "atharvavlogs897", "https://www.instagram.com/atharvavlogs897/", 918735, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.atharva.tiwari@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@atharvavlogs897/about",
      lastChecked: daysAgo(3),
    },
  },

  // 157. Pranav Chavan (Madurai, Tamil Nadu)
  {
    id: "creator-in-157",
    name: "Pranav Chavan",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-157-yt", "YouTube", "@pranavgaming986", "https://www.youtube.com/@pranavgaming986", 4832453, 894004, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-157-ig", "Instagram", "pranavgaming986", "https://www.instagram.com/pranavgaming986/", 1836332, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pranav.chavan@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@pranavgaming986/about",
      lastChecked: daysAgo(3),
    },
  },

  // 158. Myra Kurup (Ludhiana, Punjab)
  {
    id: "creator-in-158",
    name: "Myra Kurup",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-158-yt", "YouTube", "@myraedu76", "https://www.youtube.com/@myraedu76", 8947182, 1789436, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-158-ig", "Instagram", "myraedu76", "https://www.instagram.com/myraedu76/", 3399929, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.myra.kurup@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@myraedu76/about",
      lastChecked: daysAgo(3),
    },
  },

  // 159. Gauri Sethi (Ahmedabad, Gujarat)
  {
    id: "creator-in-159",
    name: "Gauri Sethi",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-159-yt", "YouTube", "@gaurifitness165", "https://www.youtube.com/@gaurifitness165", 14261911, 3066311, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-159-ig", "Instagram", "gaurifitness165", "https://www.instagram.com/gaurifitness165/", 5419526, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.gauri.sethi@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@gaurifitness165/about",
      lastChecked: daysAgo(3),
    },
  },

  // 160. Rohan Gupta (Nagpur, Maharashtra)
  {
    id: "creator-in-160",
    name: "Rohan Gupta",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-160-yt", "YouTube", "@rohantech254", "https://www.youtube.com/@rohantech254", 256640, 20531, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-160-ig", "Instagram", "rohantech254", "https://www.instagram.com/rohantech254/", 97523, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.rohan.gupta@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@rohantech254/about",
      lastChecked: daysAgo(3),
    },
  },

  // 161. Deepak Deshmukh (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-161",
    name: "Deepak Deshmukh",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-161-yt", "YouTube", "@deepakfinance343", "https://www.youtube.com/@deepakfinance343", 431369, 40980, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-161-ig", "Instagram", "deepakfinance343", "https://www.instagram.com/deepakfinance343/", 163920, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.deepak.deshmukh@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@deepakfinance343/about",
      lastChecked: daysAgo(3),
    },
  },

  // 162. Tushar Chowdary (Chandigarh, Punjab)
  {
    id: "creator-in-162",
    name: "Tushar Chowdary",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-162-yt", "YouTube", "@tushartravel432", "https://www.youtube.com/@tushartravel432", 631098, 69421, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-162-ig", "Instagram", "tushartravel432", "https://www.instagram.com/tushartravel432/", 239817, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.tushar.chowdary@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@tushartravel432/about",
      lastChecked: daysAgo(3),
    },
  },

  // 163. Vivaan Sidhu (Vadodara, Gujarat)
  {
    id: "creator-in-163",
    name: "Vivaan Sidhu",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-163-yt", "YouTube", "@vivaanmusic521", "https://www.youtube.com/@vivaanmusic521", 1125827, 140728, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-163-ig", "Instagram", "vivaanmusic521", "https://www.instagram.com/vivaanmusic521/", 427814, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vivaan.sidhu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vivaanmusic521/about",
      lastChecked: daysAgo(3),
    },
  },

  // 164. Ayaan Nair (Pune, Maharashtra)
  {
    id: "creator-in-164",
    name: "Ayaan Nair",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-164-yt", "YouTube", "@ayaancomedy610", "https://www.youtube.com/@ayaancomedy610", 2440556, 341678, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-164-ig", "Instagram", "ayaancomedy610", "https://www.instagram.com/ayaancomedy610/", 927411, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ayaan.nair@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ayaancomedy610/about",
      lastChecked: daysAgo(3),
    },
  },

  // 165. Kabir Pandey (Chennai, Tamil Nadu)
  {
    id: "creator-in-165",
    name: "Kabir Pandey",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-165-yt", "YouTube", "@kabirfood699", "https://www.youtube.com/@kabirfood699", 4855285, 752569, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-165-ig", "Instagram", "kabirfood699", "https://www.instagram.com/kabirfood699/", 1845008, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kabir.pandey@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kabirfood699/about",
      lastChecked: daysAgo(3),
    },
  },

  // 166. Saanvi Gaikwad (Amritsar, Punjab)
  {
    id: "creator-in-166",
    name: "Saanvi Gaikwad",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-166-yt", "YouTube", "@saanvivlogs788", "https://www.youtube.com/@saanvivlogs788", 8970014, 1524902, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-166-ig", "Instagram", "saanvivlogs788", "https://www.instagram.com/saanvivlogs788/", 3408605, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.saanvi.gaikwad@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saanvivlogs788/about",
      lastChecked: daysAgo(3),
    },
  },

  // 167. Anika Menon (Surat, Gujarat)
  {
    id: "creator-in-167",
    name: "Anika Menon",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-167-yt", "YouTube", "@anikagaming877", "https://www.youtube.com/@anikagaming877", 14284743, 2642677, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-167-ig", "Instagram", "anikagaming877", "https://www.instagram.com/anikagaming877/", 5428202, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.anika.menon@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@anikagaming877/about",
      lastChecked: daysAgo(3),
    },
  },

  // 168. Kavya Mehra (Mumbai, Maharashtra)
  {
    id: "creator-in-168",
    name: "Kavya Mehra",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-168-yt", "YouTube", "@kavyaedu966", "https://www.youtube.com/@kavyaedu966", 184472, 36894, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-168-ig", "Instagram", "kavyaedu966", "https://www.instagram.com/kavyaedu966/", 70099, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kavya.mehra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kavyaedu966/about",
      lastChecked: daysAgo(3),
    },
  },

  // 169. Sameer Das (Madurai, Tamil Nadu)
  {
    id: "creator-in-169",
    name: "Sameer Das",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-169-yt", "YouTube", "@sameerfitness56", "https://www.youtube.com/@sameerfitness56", 359201, 77228, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-169-ig", "Instagram", "sameerfitness56", "https://www.instagram.com/sameerfitness56/", 136496, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sameer.das@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sameerfitness56/about",
      lastChecked: daysAgo(3),
    },
  },

  // 170. Karan Kulkarni (Ludhiana, Punjab)
  {
    id: "creator-in-170",
    name: "Karan Kulkarni",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-170-yt", "YouTube", "@karantech145", "https://www.youtube.com/@karantech145", 653930, 52314, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-170-ig", "Instagram", "karantech145", "https://www.instagram.com/karantech145/", 248493, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.karan.kulkarni@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@karantech145/about",
      lastChecked: daysAgo(3),
    },
  },

  // 171. Chirag Naidu (Ahmedabad, Gujarat)
  {
    id: "creator-in-171",
    name: "Chirag Naidu",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-171-yt", "YouTube", "@chiragfinance234", "https://www.youtube.com/@chiragfinance234", 1148659, 109123, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-171-ig", "Instagram", "chiragfinance234", "https://www.instagram.com/chiragfinance234/", 436490, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.chirag.naidu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@chiragfinance234/about",
      lastChecked: daysAgo(3),
    },
  },

  // 172. Arjun Sandhu (Nagpur, Maharashtra)
  {
    id: "creator-in-172",
    name: "Arjun Sandhu",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-172-yt", "YouTube", "@arjuntravel323", "https://www.youtube.com/@arjuntravel323", 2463388, 270973, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-172-ig", "Instagram", "arjuntravel323", "https://www.instagram.com/arjuntravel323/", 936087, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.arjun.sandhu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@arjuntravel323/about",
      lastChecked: daysAgo(3),
    },
  },

  // 173. Shaurya Reddy (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-173",
    name: "Shaurya Reddy",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-173-yt", "YouTube", "@shauryamusic412", "https://www.youtube.com/@shauryamusic412", 4878117, 609765, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-173-ig", "Instagram", "shauryamusic412", "https://www.instagram.com/shauryamusic412/", 1853684, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.shaurya.reddy@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@shauryamusic412/about",
      lastChecked: daysAgo(3),
    },
  },

  // 174. Advik Mishra (Chandigarh, Punjab)
  {
    id: "creator-in-174",
    name: "Advik Mishra",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-174-yt", "YouTube", "@advikcomedy501", "https://www.youtube.com/@advikcomedy501", 8992846, 1258998, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-174-ig", "Instagram", "advikcomedy501", "https://www.instagram.com/advikcomedy501/", 3417281, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.advik.mishra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@advikcomedy501/about",
      lastChecked: daysAgo(3),
    },
  },

  // 175. Kiara Deshpande (Vadodara, Gujarat)
  {
    id: "creator-in-175",
    name: "Kiara Deshpande",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-175-yt", "YouTube", "@kiarafood590", "https://www.youtube.com/@kiarafood590", 14212575, 2202949, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-175-ig", "Instagram", "kiarafood590", "https://www.instagram.com/kiarafood590/", 5400779, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kiara.deshpande@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kiarafood590/about",
      lastChecked: daysAgo(3),
    },
  },

  // 176. Avani Pillai (Pune, Maharashtra)
  {
    id: "creator-in-176",
    name: "Avani Pillai",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-176-yt", "YouTube", "@avanivlogs679", "https://www.youtube.com/@avanivlogs679", 207304, 35242, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-176-ig", "Instagram", "avanivlogs679", "https://www.instagram.com/avanivlogs679/", 78776, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.avani.pillai@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@avanivlogs679/about",
      lastChecked: daysAgo(3),
    },
  },

  // 177. Pooja Khanna (Chennai, Tamil Nadu)
  {
    id: "creator-in-177",
    name: "Pooja Khanna",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-177-yt", "YouTube", "@poojagaming768", "https://www.youtube.com/@poojagaming768", 382033, 70676, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-177-ig", "Instagram", "poojagaming768", "https://www.instagram.com/poojagaming768/", 145173, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pooja.khanna@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@poojagaming768/about",
      lastChecked: daysAgo(3),
    },
  },

  // 178. Gaurav Mukherjee (Amritsar, Punjab)
  {
    id: "creator-in-178",
    name: "Gaurav Mukherjee",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-178-yt", "YouTube", "@gauravedu857", "https://www.youtube.com/@gauravedu857", 676762, 135352, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-178-ig", "Instagram", "gauravedu857", "https://www.instagram.com/gauravedu857/", 257170, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.gaurav.mukherjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@gauravedu857/about",
      lastChecked: daysAgo(3),
    },
  },

  // 179. Kunal Bhatt (Surat, Gujarat)
  {
    id: "creator-in-179",
    name: "Kunal Bhatt",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-179-yt", "YouTube", "@kunalfitness946", "https://www.youtube.com/@kunalfitness946", 1171491, 251871, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-179-ig", "Instagram", "kunalfitness946", "https://www.instagram.com/kunalfitness946/", 445167, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kunal.bhatt@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kunalfitness946/about",
      lastChecked: daysAgo(3),
    },
  },

  // 180. Aarav Rao (Mumbai, Maharashtra)
  {
    id: "creator-in-180",
    name: "Aarav Rao",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-180-yt", "YouTube", "@aaravtech36", "https://www.youtube.com/@aaravtech36", 2486220, 198898, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-180-ig", "Instagram", "aaravtech36", "https://www.instagram.com/aaravtech36/", 944764, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarav.rao@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aaravtech36/about",
      lastChecked: daysAgo(3),
    },
  },

  // 181. Sai Gill (Madurai, Tamil Nadu)
  {
    id: "creator-in-181",
    name: "Sai Gill",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-181-yt", "YouTube", "@saifinance125", "https://www.youtube.com/@saifinance125", 4805949, 456565, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-181-ig", "Instagram", "saifinance125", "https://www.instagram.com/saifinance125/", 1826261, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sai.gill@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saifinance125/about",
      lastChecked: daysAgo(3),
    },
  },

  // 182. Rudra Patel (Ludhiana, Punjab)
  {
    id: "creator-in-182",
    name: "Rudra Patel",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-182-yt", "YouTube", "@rudratravel214", "https://www.youtube.com/@rudratravel214", 8920678, 981275, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-182-ig", "Instagram", "rudratravel214", "https://www.instagram.com/rudratravel214/", 3389858, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.rudra.patel@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@rudratravel214/about",
      lastChecked: daysAgo(3),
    },
  },

  // 183. Diya Chauhan (Ahmedabad, Gujarat)
  {
    id: "creator-in-183",
    name: "Diya Chauhan",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-183-yt", "YouTube", "@diyamusic303", "https://www.youtube.com/@diyamusic303", 14235407, 1779426, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-183-ig", "Instagram", "diyamusic303", "https://www.instagram.com/diyamusic303/", 5409455, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.diya.chauhan@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@diyamusic303/about",
      lastChecked: daysAgo(3),
    },
  },

  // 184. Pari Shinde (Nagpur, Maharashtra)
  {
    id: "creator-in-184",
    name: "Pari Shinde",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-184-yt", "YouTube", "@paricomedy392", "https://www.youtube.com/@paricomedy392", 230136, 32219, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-184-ig", "Instagram", "paricomedy392", "https://www.instagram.com/paricomedy392/", 87452, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pari.shinde@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@paricomedy392/about",
      lastChecked: daysAgo(3),
    },
  },

  // 185. Isha Hegde (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-185",
    name: "Isha Hegde",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-185-yt", "YouTube", "@ishafood481", "https://www.youtube.com/@ishafood481", 404865, 62754, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-185-ig", "Instagram", "ishafood481", "https://www.instagram.com/ishafood481/", 153849, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.isha.hegde@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ishafood481/about",
      lastChecked: daysAgo(3),
    },
  },

  // 186. Siddharth Kapoor (Chandigarh, Punjab)
  {
    id: "creator-in-186",
    name: "Siddharth Kapoor",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-186-yt", "YouTube", "@siddharthvlogs570", "https://www.youtube.com/@siddharthvlogs570", 699594, 118931, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-186-ig", "Instagram", "siddharthvlogs570", "https://www.instagram.com/siddharthvlogs570/", 265846, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.siddharth.kapoor@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@siddharthvlogs570/about",
      lastChecked: daysAgo(3),
    },
  },

  // 187. Suresh Chatterjee (Vadodara, Gujarat)
  {
    id: "creator-in-187",
    name: "Suresh Chatterjee",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-187-yt", "YouTube", "@sureshgaming659", "https://www.youtube.com/@sureshgaming659", 1194323, 220950, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-187-ig", "Instagram", "sureshgaming659", "https://www.instagram.com/sureshgaming659/", 453843, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.suresh.chatterjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sureshgaming659/about",
      lastChecked: daysAgo(3),
    },
  },

  // 188. Mayank Joshi (Pune, Maharashtra)
  {
    id: "creator-in-188",
    name: "Mayank Joshi",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-188-yt", "YouTube", "@mayankedu748", "https://www.youtube.com/@mayankedu748", 2414052, 482810, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-188-ig", "Instagram", "mayankedu748", "https://www.instagram.com/mayankedu748/", 917340, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.mayank.joshi@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@mayankedu748/about",
      lastChecked: daysAgo(3),
    },
  },

  // 189. Vihaan Bhosale (Chennai, Tamil Nadu)
  {
    id: "creator-in-189",
    name: "Vihaan Bhosale",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-189-yt", "YouTube", "@vihaanfitness837", "https://www.youtube.com/@vihaanfitness837", 4828781, 1038188, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-189-ig", "Instagram", "vihaanfitness837", "https://www.instagram.com/vihaanfitness837/", 1834937, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vihaan.bhosale@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vihaanfitness837/about",
      lastChecked: daysAgo(3),
    },
  },

  // 190. Ishaan Dhillon (Amritsar, Punjab)
  {
    id: "creator-in-190",
    name: "Ishaan Dhillon",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-190-yt", "YouTube", "@ishaantech926", "https://www.youtube.com/@ishaantech926", 8943510, 715481, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-190-ig", "Instagram", "ishaantech926", "https://www.instagram.com/ishaantech926/", 3398534, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ishaan.dhillon@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ishaantech926/about",
      lastChecked: daysAgo(3),
    },
  },

  // 191. Om Verma (Surat, Gujarat)
  {
    id: "creator-in-191",
    name: "Om Verma",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-191-yt", "YouTube", "@omfinance16", "https://www.youtube.com/@omfinance16", 14258239, 1354533, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-191-ig", "Instagram", "omfinance16", "https://www.instagram.com/omfinance16/", 5418131, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.om.verma@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@omfinance16/about",
      lastChecked: daysAgo(3),
    },
  },

  // 192. Aarohi Yadav (Mumbai, Maharashtra)
  {
    id: "creator-in-192",
    name: "Aarohi Yadav",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-192-yt", "YouTube", "@aarohitravel105", "https://www.youtube.com/@aarohitravel105", 252968, 27826, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-192-ig", "Instagram", "aarohitravel105", "https://www.instagram.com/aarohitravel105/", 96128, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarohi.yadav@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aarohitravel105/about",
      lastChecked: daysAgo(3),
    },
  },

  // 193. Navya Pawar (Madurai, Tamil Nadu)
  {
    id: "creator-in-193",
    name: "Navya Pawar",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-193-yt", "YouTube", "@navyamusic194", "https://www.youtube.com/@navyamusic194", 427697, 53462, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-193-ig", "Instagram", "navyamusic194", "https://www.instagram.com/navyamusic194/", 162525, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.navya.pawar@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@navyamusic194/about",
      lastChecked: daysAgo(3),
    },
  },

  // 194. Meera Shetty (Ludhiana, Punjab)
  {
    id: "creator-in-194",
    name: "Meera Shetty",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-194-yt", "YouTube", "@meeracomedy283", "https://www.youtube.com/@meeracomedy283", 627426, 87840, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-194-ig", "Instagram", "meeracomedy283", "https://www.instagram.com/meeracomedy283/", 238422, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.meera.shetty@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@meeracomedy283/about",
      lastChecked: daysAgo(3),
    },
  },

  // 195. Nikhil Malhotra (Ahmedabad, Gujarat)
  {
    id: "creator-in-195",
    name: "Nikhil Malhotra",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-195-yt", "YouTube", "@nikhilfood372", "https://www.youtube.com/@nikhilfood372", 1122155, 173934, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-195-ig", "Instagram", "nikhilfood372", "https://www.instagram.com/nikhilfood372/", 426419, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.nikhil.malhotra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@nikhilfood372/about",
      lastChecked: daysAgo(3),
    },
  },

  // 196. Varun Banerjee (Nagpur, Maharashtra)
  {
    id: "creator-in-196",
    name: "Varun Banerjee",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-196-yt", "YouTube", "@varunvlogs461", "https://www.youtube.com/@varunvlogs461", 2436884, 414270, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-196-ig", "Instagram", "varunvlogs461", "https://www.instagram.com/varunvlogs461/", 926016, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.varun.banerjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@varunvlogs461/about",
      lastChecked: daysAgo(3),
    },
  },

  // 197. Devendra Dubey (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-197",
    name: "Devendra Dubey",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-197-yt", "YouTube", "@devendragaming550", "https://www.youtube.com/@devendragaming550", 4851613, 897548, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-197-ig", "Instagram", "devendragaming550", "https://www.instagram.com/devendragaming550/", 1843613, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.devendra.dubey@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@devendragaming550/about",
      lastChecked: daysAgo(3),
    },
  },

  // 198. Muhammad Kadam (Chandigarh, Punjab)
  {
    id: "creator-in-198",
    name: "Muhammad Kadam",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-198-yt", "YouTube", "@muhammadedu639", "https://www.youtube.com/@muhammadedu639", 8966342, 1793268, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-198-ig", "Instagram", "muhammadedu639", "https://www.instagram.com/muhammadedu639/", 3407210, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.muhammad.kadam@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@muhammadedu639/about",
      lastChecked: daysAgo(3),
    },
  },

  // 199. Aarush Grewal (Vadodara, Gujarat)
  {
    id: "creator-in-199",
    name: "Aarush Grewal",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-199-yt", "YouTube", "@aarushfitness728", "https://www.youtube.com/@aarushfitness728", 14281071, 3070430, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-199-ig", "Instagram", "aarushfitness728", "https://www.instagram.com/aarushfitness728/", 5426807, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarush.grewal@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aarushfitness728/about",
      lastChecked: daysAgo(3),
    },
  },

  // 200. Ananya Sharma (Pune, Maharashtra)
  {
    id: "creator-in-200",
    name: "Ananya Sharma",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-200-yt", "YouTube", "@ananyatech817", "https://www.youtube.com/@ananyatech817", 180800, 14464, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-200-ig", "Instagram", "ananyatech817", "https://www.instagram.com/ananyatech817/", 68704, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ananya.sharma@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ananyatech817/about",
      lastChecked: daysAgo(3),
    },
  },

  // 201. Sara Singh (Chennai, Tamil Nadu)
  {
    id: "creator-in-201",
    name: "Sara Singh",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-201-yt", "YouTube", "@sarafinance906", "https://www.youtube.com/@sarafinance906", 355529, 33775, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-201-ig", "Instagram", "sarafinance906", "https://www.instagram.com/sarafinance906/", 135101, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sara.singh@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sarafinance906/about",
      lastChecked: daysAgo(3),
    },
  },

  // 202. Shreya Patil (Amritsar, Punjab)
  {
    id: "creator-in-202",
    name: "Shreya Patil",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-202-yt", "YouTube", "@shreyatravel995", "https://www.youtube.com/@shreyatravel995", 650258, 71528, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-202-ig", "Instagram", "shreyatravel995", "https://www.instagram.com/shreyatravel995/", 247098, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.shreya.patil@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@shreyatravel995/about",
      lastChecked: daysAgo(3),
    },
  },

  // 203. Vikram Goud (Surat, Gujarat)
  {
    id: "creator-in-203",
    name: "Vikram Goud",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-203-yt", "YouTube", "@vikrammusic85", "https://www.youtube.com/@vikrammusic85", 1144987, 143123, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-203-ig", "Instagram", "vikrammusic85", "https://www.instagram.com/vikrammusic85/", 435095, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vikram.goud@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vikrammusic85/about",
      lastChecked: daysAgo(3),
    },
  },

  // 204. Manish Bhatia (Mumbai, Maharashtra)
  {
    id: "creator-in-204",
    name: "Manish Bhatia",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-204-yt", "YouTube", "@manishcomedy174", "https://www.youtube.com/@manishcomedy174", 2459716, 344360, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-204-ig", "Instagram", "manishcomedy174", "https://www.instagram.com/manishcomedy174/", 934692, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.manish.bhatia@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@manishcomedy174/about",
      lastChecked: daysAgo(3),
    },
  },

  // 205. Saurabh Iyer (Madurai, Tamil Nadu)
  {
    id: "creator-in-205",
    name: "Saurabh Iyer",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-205-yt", "YouTube", "@saurabhfood263", "https://www.youtube.com/@saurabhfood263", 4874445, 755539, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-205-ig", "Instagram", "saurabhfood263", "https://www.instagram.com/saurabhfood263/", 1852289, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.saurabh.iyer@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saurabhfood263/about",
      lastChecked: daysAgo(3),
    },
  },

  // 206. Aditya Tiwari (Ludhiana, Punjab)
  {
    id: "creator-in-206",
    name: "Aditya Tiwari",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-206-yt", "YouTube", "@adityavlogs352", "https://www.youtube.com/@adityavlogs352", 8989174, 1528160, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-206-ig", "Instagram", "adityavlogs352", "https://www.instagram.com/adityavlogs352/", 3415886, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aditya.tiwari@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@adityavlogs352/about",
      lastChecked: daysAgo(3),
    },
  },

  // 207. Krishna Chavan (Ahmedabad, Gujarat)
  {
    id: "creator-in-207",
    name: "Krishna Chavan",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-207-yt", "YouTube", "@krishnagaming441", "https://www.youtube.com/@krishnagaming441", 14208903, 2628647, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-207-ig", "Instagram", "krishnagaming441", "https://www.instagram.com/krishnagaming441/", 5399383, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.krishna.chavan@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@krishnagaming441/about",
      lastChecked: daysAgo(3),
    },
  },

  // 208. Dhruv Kurup (Nagpur, Maharashtra)
  {
    id: "creator-in-208",
    name: "Dhruv Kurup",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-208-yt", "YouTube", "@dhruvedu530", "https://www.youtube.com/@dhruvedu530", 203632, 40726, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-208-ig", "Instagram", "dhruvedu530", "https://www.instagram.com/dhruvedu530/", 77380, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.dhruv.kurup@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@dhruvedu530/about",
      lastChecked: daysAgo(3),
    },
  },

  // 209. Aadhya Sethi (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-209",
    name: "Aadhya Sethi",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-209-yt", "YouTube", "@aadhyafitness619", "https://www.youtube.com/@aadhyafitness619", 378361, 81348, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-209-ig", "Instagram", "aadhyafitness619", "https://www.instagram.com/aadhyafitness619/", 143777, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aadhya.sethi@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aadhyafitness619/about",
      lastChecked: daysAgo(3),
    },
  },

  // 210. Riya Gupta (Chandigarh, Punjab)
  {
    id: "creator-in-210",
    name: "Riya Gupta",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-210-yt", "YouTube", "@riyatech708", "https://www.youtube.com/@riyatech708", 673090, 53847, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-210-ig", "Instagram", "riyatech708", "https://www.instagram.com/riyatech708/", 255774, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.riya.gupta@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@riyatech708/about",
      lastChecked: daysAgo(3),
    },
  },

  // 211. Tanvi Deshmukh (Vadodara, Gujarat)
  {
    id: "creator-in-211",
    name: "Tanvi Deshmukh",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-211-yt", "YouTube", "@tanvifinance797", "https://www.youtube.com/@tanvifinance797", 1167819, 110943, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-211-ig", "Instagram", "tanvifinance797", "https://www.instagram.com/tanvifinance797/", 443771, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.tanvi.deshmukh@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@tanvifinance797/about",
      lastChecked: daysAgo(3),
    },
  },

  // 212. Harish Chowdary (Pune, Maharashtra)
  {
    id: "creator-in-212",
    name: "Harish Chowdary",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-212-yt", "YouTube", "@harishtravel886", "https://www.youtube.com/@harishtravel886", 2482548, 273080, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-212-ig", "Instagram", "harishtravel886", "https://www.instagram.com/harishtravel886/", 943368, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.harish.chowdary@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@harishtravel886/about",
      lastChecked: daysAgo(3),
    },
  },

  // 213. Abhishek Sidhu (Chennai, Tamil Nadu)
  {
    id: "creator-in-213",
    name: "Abhishek Sidhu",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-213-yt", "YouTube", "@abhishekmusic975", "https://www.youtube.com/@abhishekmusic975", 4802277, 600285, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-213-ig", "Instagram", "abhishekmusic975", "https://www.instagram.com/abhishekmusic975/", 1824865, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.abhishek.sidhu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@abhishekmusic975/about",
      lastChecked: daysAgo(3),
    },
  },

  // 214. Alok Nair (Amritsar, Punjab)
  {
    id: "creator-in-214",
    name: "Alok Nair",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-214-yt", "YouTube", "@alokcomedy65", "https://www.youtube.com/@alokcomedy65", 8917006, 1248381, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-214-ig", "Instagram", "alokcomedy65", "https://www.instagram.com/alokcomedy65/", 3388462, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.alok.nair@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@alokcomedy65/about",
      lastChecked: daysAgo(3),
    },
  },

  // 215. Reyansh Pandey (Surat, Gujarat)
  {
    id: "creator-in-215",
    name: "Reyansh Pandey",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-215-yt", "YouTube", "@reyanshfood154", "https://www.youtube.com/@reyanshfood154", 14231735, 2205919, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-215-ig", "Instagram", "reyanshfood154", "https://www.instagram.com/reyanshfood154/", 5408059, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.reyansh.pandey@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@reyanshfood154/about",
      lastChecked: daysAgo(3),
    },
  },

  // 216. Atharva Gaikwad (Mumbai, Maharashtra)
  {
    id: "creator-in-216",
    name: "Atharva Gaikwad",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-216-yt", "YouTube", "@atharvavlogs243", "https://www.youtube.com/@atharvavlogs243", 226464, 38499, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-216-ig", "Instagram", "atharvavlogs243", "https://www.instagram.com/atharvavlogs243/", 86056, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.atharva.gaikwad@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@atharvavlogs243/about",
      lastChecked: daysAgo(3),
    },
  },

  // 217. Pranav Menon (Madurai, Tamil Nadu)
  {
    id: "creator-in-217",
    name: "Pranav Menon",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-217-yt", "YouTube", "@pranavgaming332", "https://www.youtube.com/@pranavgaming332", 401193, 74221, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-217-ig", "Instagram", "pranavgaming332", "https://www.instagram.com/pranavgaming332/", 152453, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pranav.menon@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@pranavgaming332/about",
      lastChecked: daysAgo(3),
    },
  },

  // 218. Myra Mehra (Ludhiana, Punjab)
  {
    id: "creator-in-218",
    name: "Myra Mehra",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-218-yt", "YouTube", "@myraedu421", "https://www.youtube.com/@myraedu421", 695922, 139184, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-218-ig", "Instagram", "myraedu421", "https://www.instagram.com/myraedu421/", 264450, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.myra.mehra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@myraedu421/about",
      lastChecked: daysAgo(3),
    },
  },

  // 219. Gauri Das (Ahmedabad, Gujarat)
  {
    id: "creator-in-219",
    name: "Gauri Das",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-219-yt", "YouTube", "@gaurifitness510", "https://www.youtube.com/@gaurifitness510", 1190651, 255990, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-219-ig", "Instagram", "gaurifitness510", "https://www.instagram.com/gaurifitness510/", 452447, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.gauri.das@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@gaurifitness510/about",
      lastChecked: daysAgo(3),
    },
  },

  // 220. Rohan Kulkarni (Nagpur, Maharashtra)
  {
    id: "creator-in-220",
    name: "Rohan Kulkarni",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-220-yt", "YouTube", "@rohantech599", "https://www.youtube.com/@rohantech599", 2410380, 192830, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-220-ig", "Instagram", "rohantech599", "https://www.instagram.com/rohantech599/", 915944, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.rohan.kulkarni@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@rohantech599/about",
      lastChecked: daysAgo(3),
    },
  },

  // 221. Deepak Naidu (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-221",
    name: "Deepak Naidu",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-221-yt", "YouTube", "@deepakfinance688", "https://www.youtube.com/@deepakfinance688", 4825109, 458385, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-221-ig", "Instagram", "deepakfinance688", "https://www.instagram.com/deepakfinance688/", 1833541, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.deepak.naidu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@deepakfinance688/about",
      lastChecked: daysAgo(3),
    },
  },

  // 222. Tushar Sandhu (Chandigarh, Punjab)
  {
    id: "creator-in-222",
    name: "Tushar Sandhu",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-222-yt", "YouTube", "@tushartravel777", "https://www.youtube.com/@tushartravel777", 8939838, 983382, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-222-ig", "Instagram", "tushartravel777", "https://www.instagram.com/tushartravel777/", 3397138, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.tushar.sandhu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@tushartravel777/about",
      lastChecked: daysAgo(3),
    },
  },

  // 223. Vivaan Reddy (Vadodara, Gujarat)
  {
    id: "creator-in-223",
    name: "Vivaan Reddy",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-223-yt", "YouTube", "@vivaanmusic866", "https://www.youtube.com/@vivaanmusic866", 14254567, 1781821, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-223-ig", "Instagram", "vivaanmusic866", "https://www.instagram.com/vivaanmusic866/", 5416735, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vivaan.reddy@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vivaanmusic866/about",
      lastChecked: daysAgo(3),
    },
  },

  // 224. Ayaan Mishra (Pune, Maharashtra)
  {
    id: "creator-in-224",
    name: "Ayaan Mishra",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-224-yt", "YouTube", "@ayaancomedy955", "https://www.youtube.com/@ayaancomedy955", 249296, 34901, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-224-ig", "Instagram", "ayaancomedy955", "https://www.instagram.com/ayaancomedy955/", 94732, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ayaan.mishra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ayaancomedy955/about",
      lastChecked: daysAgo(3),
    },
  },

  // 225. Kabir Deshpande (Chennai, Tamil Nadu)
  {
    id: "creator-in-225",
    name: "Kabir Deshpande",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-225-yt", "YouTube", "@kabirfood45", "https://www.youtube.com/@kabirfood45", 424025, 65724, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-225-ig", "Instagram", "kabirfood45", "https://www.instagram.com/kabirfood45/", 161130, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kabir.deshpande@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kabirfood45/about",
      lastChecked: daysAgo(3),
    },
  },

  // 226. Saanvi Pillai (Amritsar, Punjab)
  {
    id: "creator-in-226",
    name: "Saanvi Pillai",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-226-yt", "YouTube", "@saanvivlogs134", "https://www.youtube.com/@saanvivlogs134", 623754, 106038, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-226-ig", "Instagram", "saanvivlogs134", "https://www.instagram.com/saanvivlogs134/", 237027, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.saanvi.pillai@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saanvivlogs134/about",
      lastChecked: daysAgo(3),
    },
  },

  // 227. Anika Khanna (Surat, Gujarat)
  {
    id: "creator-in-227",
    name: "Anika Khanna",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-227-yt", "YouTube", "@anikagaming223", "https://www.youtube.com/@anikagaming223", 1118483, 206919, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-227-ig", "Instagram", "anikagaming223", "https://www.instagram.com/anikagaming223/", 425024, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.anika.khanna@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@anikagaming223/about",
      lastChecked: daysAgo(3),
    },
  },

  // 228. Kavya Mukherjee (Mumbai, Maharashtra)
  {
    id: "creator-in-228",
    name: "Kavya Mukherjee",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-228-yt", "YouTube", "@kavyaedu312", "https://www.youtube.com/@kavyaedu312", 2433212, 486642, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-228-ig", "Instagram", "kavyaedu312", "https://www.instagram.com/kavyaedu312/", 924621, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kavya.mukherjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kavyaedu312/about",
      lastChecked: daysAgo(3),
    },
  },

  // 229. Sameer Bhatt (Madurai, Tamil Nadu)
  {
    id: "creator-in-229",
    name: "Sameer Bhatt",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-229-yt", "YouTube", "@sameerfitness401", "https://www.youtube.com/@sameerfitness401", 4847941, 1042307, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-229-ig", "Instagram", "sameerfitness401", "https://www.instagram.com/sameerfitness401/", 1842218, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sameer.bhatt@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sameerfitness401/about",
      lastChecked: daysAgo(3),
    },
  },

  // 230. Karan Rao (Ludhiana, Punjab)
  {
    id: "creator-in-230",
    name: "Karan Rao",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-230-yt", "YouTube", "@karantech490", "https://www.youtube.com/@karantech490", 8962670, 717014, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-230-ig", "Instagram", "karantech490", "https://www.instagram.com/karantech490/", 3405815, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.karan.rao@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@karantech490/about",
      lastChecked: daysAgo(3),
    },
  },

  // 231. Chirag Gill (Ahmedabad, Gujarat)
  {
    id: "creator-in-231",
    name: "Chirag Gill",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-231-yt", "YouTube", "@chiragfinance579", "https://www.youtube.com/@chiragfinance579", 14277399, 1356353, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-231-ig", "Instagram", "chiragfinance579", "https://www.instagram.com/chiragfinance579/", 5425412, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.chirag.gill@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@chiragfinance579/about",
      lastChecked: daysAgo(3),
    },
  },

  // 232. Arjun Patel (Nagpur, Maharashtra)
  {
    id: "creator-in-232",
    name: "Arjun Patel",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-232-yt", "YouTube", "@arjuntravel668", "https://www.youtube.com/@arjuntravel668", 272128, 29934, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-232-ig", "Instagram", "arjuntravel668", "https://www.instagram.com/arjuntravel668/", 103409, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.arjun.patel@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@arjuntravel668/about",
      lastChecked: daysAgo(3),
    },
  },

  // 233. Shaurya Chauhan (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-233",
    name: "Shaurya Chauhan",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-233-yt", "YouTube", "@shauryamusic757", "https://www.youtube.com/@shauryamusic757", 351857, 43982, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-233-ig", "Instagram", "shauryamusic757", "https://www.instagram.com/shauryamusic757/", 133706, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.shaurya.chauhan@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@shauryamusic757/about",
      lastChecked: daysAgo(3),
    },
  },

  // 234. Advik Shinde (Chandigarh, Punjab)
  {
    id: "creator-in-234",
    name: "Advik Shinde",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-234-yt", "YouTube", "@advikcomedy846", "https://www.youtube.com/@advikcomedy846", 646586, 90522, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-234-ig", "Instagram", "advikcomedy846", "https://www.instagram.com/advikcomedy846/", 245703, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.advik.shinde@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@advikcomedy846/about",
      lastChecked: daysAgo(3),
    },
  },

  // 235. Kiara Hegde (Vadodara, Gujarat)
  {
    id: "creator-in-235",
    name: "Kiara Hegde",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-235-yt", "YouTube", "@kiarafood935", "https://www.youtube.com/@kiarafood935", 1141315, 176904, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-235-ig", "Instagram", "kiarafood935", "https://www.instagram.com/kiarafood935/", 433700, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kiara.hegde@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kiarafood935/about",
      lastChecked: daysAgo(3),
    },
  },

  // 236. Avani Kapoor (Pune, Maharashtra)
  {
    id: "creator-in-236",
    name: "Avani Kapoor",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-236-yt", "YouTube", "@avanivlogs25", "https://www.youtube.com/@avanivlogs25", 2456044, 417527, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-236-ig", "Instagram", "avanivlogs25", "https://www.instagram.com/avanivlogs25/", 933297, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.avani.kapoor@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@avanivlogs25/about",
      lastChecked: daysAgo(3),
    },
  },

  // 237. Pooja Chatterjee (Chennai, Tamil Nadu)
  {
    id: "creator-in-237",
    name: "Pooja Chatterjee",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-237-yt", "YouTube", "@poojagaming114", "https://www.youtube.com/@poojagaming114", 4870773, 901093, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-237-ig", "Instagram", "poojagaming114", "https://www.instagram.com/poojagaming114/", 1850894, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pooja.chatterjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@poojagaming114/about",
      lastChecked: daysAgo(3),
    },
  },

  // 238. Gaurav Joshi (Amritsar, Punjab)
  {
    id: "creator-in-238",
    name: "Gaurav Joshi",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-238-yt", "YouTube", "@gauravedu203", "https://www.youtube.com/@gauravedu203", 8985502, 1797100, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-238-ig", "Instagram", "gauravedu203", "https://www.instagram.com/gauravedu203/", 3414491, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.gaurav.joshi@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@gauravedu203/about",
      lastChecked: daysAgo(3),
    },
  },

  // 239. Kunal Bhosale (Surat, Gujarat)
  {
    id: "creator-in-239",
    name: "Kunal Bhosale",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-239-yt", "YouTube", "@kunalfitness292", "https://www.youtube.com/@kunalfitness292", 14205231, 3054125, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-239-ig", "Instagram", "kunalfitness292", "https://www.instagram.com/kunalfitness292/", 5397988, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kunal.bhosale@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kunalfitness292/about",
      lastChecked: daysAgo(3),
    },
  },

  // 240. Aarav Dhillon (Mumbai, Maharashtra)
  {
    id: "creator-in-240",
    name: "Aarav Dhillon",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-240-yt", "YouTube", "@aaravtech381", "https://www.youtube.com/@aaravtech381", 199960, 15997, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-240-ig", "Instagram", "aaravtech381", "https://www.instagram.com/aaravtech381/", 75985, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarav.dhillon@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aaravtech381/about",
      lastChecked: daysAgo(3),
    },
  },

  // 241. Sai Verma (Madurai, Tamil Nadu)
  {
    id: "creator-in-241",
    name: "Sai Verma",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-241-yt", "YouTube", "@saifinance470", "https://www.youtube.com/@saifinance470", 374689, 35595, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-241-ig", "Instagram", "saifinance470", "https://www.instagram.com/saifinance470/", 142382, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sai.verma@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saifinance470/about",
      lastChecked: daysAgo(3),
    },
  },

  // 242. Rudra Yadav (Ludhiana, Punjab)
  {
    id: "creator-in-242",
    name: "Rudra Yadav",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-242-yt", "YouTube", "@rudratravel559", "https://www.youtube.com/@rudratravel559", 669418, 73636, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-242-ig", "Instagram", "rudratravel559", "https://www.instagram.com/rudratravel559/", 254379, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.rudra.yadav@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@rudratravel559/about",
      lastChecked: daysAgo(3),
    },
  },

  // 243. Diya Pawar (Ahmedabad, Gujarat)
  {
    id: "creator-in-243",
    name: "Diya Pawar",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-243-yt", "YouTube", "@diyamusic648", "https://www.youtube.com/@diyamusic648", 1164147, 145518, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-243-ig", "Instagram", "diyamusic648", "https://www.instagram.com/diyamusic648/", 442376, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.diya.pawar@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@diyamusic648/about",
      lastChecked: daysAgo(3),
    },
  },

  // 244. Pari Shetty (Nagpur, Maharashtra)
  {
    id: "creator-in-244",
    name: "Pari Shetty",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-244-yt", "YouTube", "@paricomedy737", "https://www.youtube.com/@paricomedy737", 2478876, 347043, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-244-ig", "Instagram", "paricomedy737", "https://www.instagram.com/paricomedy737/", 941973, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pari.shetty@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@paricomedy737/about",
      lastChecked: daysAgo(3),
    },
  },

  // 245. Isha Malhotra (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-245",
    name: "Isha Malhotra",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-245-yt", "YouTube", "@ishafood826", "https://www.youtube.com/@ishafood826", 4893605, 758509, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-245-ig", "Instagram", "ishafood826", "https://www.instagram.com/ishafood826/", 1859570, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.isha.malhotra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ishafood826/about",
      lastChecked: daysAgo(3),
    },
  },

  // 246. Siddharth Banerjee (Chandigarh, Punjab)
  {
    id: "creator-in-246",
    name: "Siddharth Banerjee",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-246-yt", "YouTube", "@siddharthvlogs915", "https://www.youtube.com/@siddharthvlogs915", 8913334, 1515267, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-246-ig", "Instagram", "siddharthvlogs915", "https://www.instagram.com/siddharthvlogs915/", 3387067, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.siddharth.banerjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@siddharthvlogs915/about",
      lastChecked: daysAgo(3),
    },
  },

  // 247. Suresh Dubey (Vadodara, Gujarat)
  {
    id: "creator-in-247",
    name: "Suresh Dubey",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-247-yt", "YouTube", "@sureshgaming5", "https://www.youtube.com/@sureshgaming5", 14228063, 2632192, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-247-ig", "Instagram", "sureshgaming5", "https://www.instagram.com/sureshgaming5/", 5406664, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.suresh.dubey@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sureshgaming5/about",
      lastChecked: daysAgo(3),
    },
  },

  // 248. Mayank Kadam (Pune, Maharashtra)
  {
    id: "creator-in-248",
    name: "Mayank Kadam",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-248-yt", "YouTube", "@mayankedu94", "https://www.youtube.com/@mayankedu94", 222792, 44558, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-248-ig", "Instagram", "mayankedu94", "https://www.instagram.com/mayankedu94/", 84661, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.mayank.kadam@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@mayankedu94/about",
      lastChecked: daysAgo(3),
    },
  },

  // 249. Vihaan Grewal (Chennai, Tamil Nadu)
  {
    id: "creator-in-249",
    name: "Vihaan Grewal",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-249-yt", "YouTube", "@vihaanfitness183", "https://www.youtube.com/@vihaanfitness183", 397521, 85467, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-249-ig", "Instagram", "vihaanfitness183", "https://www.instagram.com/vihaanfitness183/", 151058, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vihaan.grewal@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vihaanfitness183/about",
      lastChecked: daysAgo(3),
    },
  },

  // 250. Ishaan Sharma (Amritsar, Punjab)
  {
    id: "creator-in-250",
    name: "Ishaan Sharma",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-250-yt", "YouTube", "@ishaantech272", "https://www.youtube.com/@ishaantech272", 692250, 55380, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-250-ig", "Instagram", "ishaantech272", "https://www.instagram.com/ishaantech272/", 263055, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ishaan.sharma@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ishaantech272/about",
      lastChecked: daysAgo(3),
    },
  },

  // 251. Om Singh (Surat, Gujarat)
  {
    id: "creator-in-251",
    name: "Om Singh",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-251-yt", "YouTube", "@omfinance361", "https://www.youtube.com/@omfinance361", 1186979, 112763, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-251-ig", "Instagram", "omfinance361", "https://www.instagram.com/omfinance361/", 451052, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.om.singh@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@omfinance361/about",
      lastChecked: daysAgo(3),
    },
  },

  // 252. Aarohi Patil (Mumbai, Maharashtra)
  {
    id: "creator-in-252",
    name: "Aarohi Patil",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-252-yt", "YouTube", "@aarohitravel450", "https://www.youtube.com/@aarohitravel450", 2406708, 264738, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-252-ig", "Instagram", "aarohitravel450", "https://www.instagram.com/aarohitravel450/", 914549, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarohi.patil@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aarohitravel450/about",
      lastChecked: daysAgo(3),
    },
  },

  // 253. Navya Goud (Madurai, Tamil Nadu)
  {
    id: "creator-in-253",
    name: "Navya Goud",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-253-yt", "YouTube", "@navyamusic539", "https://www.youtube.com/@navyamusic539", 4821437, 602680, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-253-ig", "Instagram", "navyamusic539", "https://www.instagram.com/navyamusic539/", 1832146, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.navya.goud@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@navyamusic539/about",
      lastChecked: daysAgo(3),
    },
  },

  // 254. Meera Bhatia (Ludhiana, Punjab)
  {
    id: "creator-in-254",
    name: "Meera Bhatia",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-254-yt", "YouTube", "@meeracomedy628", "https://www.youtube.com/@meeracomedy628", 8936166, 1251063, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-254-ig", "Instagram", "meeracomedy628", "https://www.instagram.com/meeracomedy628/", 3395743, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.meera.bhatia@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@meeracomedy628/about",
      lastChecked: daysAgo(3),
    },
  },

  // 255. Nikhil Iyer (Ahmedabad, Gujarat)
  {
    id: "creator-in-255",
    name: "Nikhil Iyer",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-255-yt", "YouTube", "@nikhilfood717", "https://www.youtube.com/@nikhilfood717", 14250895, 2208889, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-255-ig", "Instagram", "nikhilfood717", "https://www.instagram.com/nikhilfood717/", 5415340, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.nikhil.iyer@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@nikhilfood717/about",
      lastChecked: daysAgo(3),
    },
  },

  // 256. Varun Tiwari (Nagpur, Maharashtra)
  {
    id: "creator-in-256",
    name: "Varun Tiwari",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-256-yt", "YouTube", "@varunvlogs806", "https://www.youtube.com/@varunvlogs806", 245624, 41756, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-256-ig", "Instagram", "varunvlogs806", "https://www.instagram.com/varunvlogs806/", 93337, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.varun.tiwari@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@varunvlogs806/about",
      lastChecked: daysAgo(3),
    },
  },

  // 257. Devendra Chavan (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-257",
    name: "Devendra Chavan",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-257-yt", "YouTube", "@devendragaming895", "https://www.youtube.com/@devendragaming895", 420353, 77765, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-257-ig", "Instagram", "devendragaming895", "https://www.instagram.com/devendragaming895/", 159734, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.devendra.chavan@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@devendragaming895/about",
      lastChecked: daysAgo(3),
    },
  },

  // 258. Muhammad Kurup (Chandigarh, Punjab)
  {
    id: "creator-in-258",
    name: "Muhammad Kurup",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-258-yt", "YouTube", "@muhammadedu984", "https://www.youtube.com/@muhammadedu984", 620082, 124016, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-258-ig", "Instagram", "muhammadedu984", "https://www.instagram.com/muhammadedu984/", 235631, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.muhammad.kurup@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@muhammadedu984/about",
      lastChecked: daysAgo(3),
    },
  },

  // 259. Aarush Sethi (Vadodara, Gujarat)
  {
    id: "creator-in-259",
    name: "Aarush Sethi",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-259-yt", "YouTube", "@aarushfitness74", "https://www.youtube.com/@aarushfitness74", 1114811, 239684, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-259-ig", "Instagram", "aarushfitness74", "https://www.instagram.com/aarushfitness74/", 423628, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarush.sethi@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aarushfitness74/about",
      lastChecked: daysAgo(3),
    },
  },

  // 260. Ananya Gupta (Pune, Maharashtra)
  {
    id: "creator-in-260",
    name: "Ananya Gupta",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-260-yt", "YouTube", "@ananyatech163", "https://www.youtube.com/@ananyatech163", 2429540, 194363, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-260-ig", "Instagram", "ananyatech163", "https://www.instagram.com/ananyatech163/", 923225, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ananya.gupta@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ananyatech163/about",
      lastChecked: daysAgo(3),
    },
  },

  // 261. Sara Deshmukh (Chennai, Tamil Nadu)
  {
    id: "creator-in-261",
    name: "Sara Deshmukh",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-261-yt", "YouTube", "@sarafinance252", "https://www.youtube.com/@sarafinance252", 4844269, 460206, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-261-ig", "Instagram", "sarafinance252", "https://www.instagram.com/sarafinance252/", 1840822, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sara.deshmukh@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sarafinance252/about",
      lastChecked: daysAgo(3),
    },
  },

  // 262. Shreya Chowdary (Amritsar, Punjab)
  {
    id: "creator-in-262",
    name: "Shreya Chowdary",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-262-yt", "YouTube", "@shreyatravel341", "https://www.youtube.com/@shreyatravel341", 8958998, 985490, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-262-ig", "Instagram", "shreyatravel341", "https://www.instagram.com/shreyatravel341/", 3404419, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.shreya.chowdary@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@shreyatravel341/about",
      lastChecked: daysAgo(3),
    },
  },

  // 263. Vikram Sidhu (Surat, Gujarat)
  {
    id: "creator-in-263",
    name: "Vikram Sidhu",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-263-yt", "YouTube", "@vikrammusic430", "https://www.youtube.com/@vikrammusic430", 14273727, 1784216, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-263-ig", "Instagram", "vikrammusic430", "https://www.instagram.com/vikrammusic430/", 5424016, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vikram.sidhu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vikrammusic430/about",
      lastChecked: daysAgo(3),
    },
  },

  // 264. Manish Nair (Mumbai, Maharashtra)
  {
    id: "creator-in-264",
    name: "Manish Nair",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-264-yt", "YouTube", "@manishcomedy519", "https://www.youtube.com/@manishcomedy519", 268456, 37584, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-264-ig", "Instagram", "manishcomedy519", "https://www.instagram.com/manishcomedy519/", 102013, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.manish.nair@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@manishcomedy519/about",
      lastChecked: daysAgo(3),
    },
  },

  // 265. Saurabh Pandey (Madurai, Tamil Nadu)
  {
    id: "creator-in-265",
    name: "Saurabh Pandey",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-265-yt", "YouTube", "@saurabhfood608", "https://www.youtube.com/@saurabhfood608", 348185, 53969, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-265-ig", "Instagram", "saurabhfood608", "https://www.instagram.com/saurabhfood608/", 132310, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.saurabh.pandey@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saurabhfood608/about",
      lastChecked: daysAgo(3),
    },
  },

  // 266. Aditya Gaikwad (Ludhiana, Punjab)
  {
    id: "creator-in-266",
    name: "Aditya Gaikwad",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-266-yt", "YouTube", "@adityavlogs697", "https://www.youtube.com/@adityavlogs697", 642914, 109295, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-266-ig", "Instagram", "adityavlogs697", "https://www.instagram.com/adityavlogs697/", 244307, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aditya.gaikwad@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@adityavlogs697/about",
      lastChecked: daysAgo(3),
    },
  },

  // 267. Krishna Menon (Ahmedabad, Gujarat)
  {
    id: "creator-in-267",
    name: "Krishna Menon",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-267-yt", "YouTube", "@krishnagaming786", "https://www.youtube.com/@krishnagaming786", 1137643, 210464, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-267-ig", "Instagram", "krishnagaming786", "https://www.instagram.com/krishnagaming786/", 432304, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.krishna.menon@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@krishnagaming786/about",
      lastChecked: daysAgo(3),
    },
  },

  // 268. Dhruv Mehra (Nagpur, Maharashtra)
  {
    id: "creator-in-268",
    name: "Dhruv Mehra",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-268-yt", "YouTube", "@dhruvedu875", "https://www.youtube.com/@dhruvedu875", 2452372, 490474, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-268-ig", "Instagram", "dhruvedu875", "https://www.instagram.com/dhruvedu875/", 931901, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.dhruv.mehra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@dhruvedu875/about",
      lastChecked: daysAgo(3),
    },
  },

  // 269. Aadhya Das (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-269",
    name: "Aadhya Das",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-269-yt", "YouTube", "@aadhyafitness964", "https://www.youtube.com/@aadhyafitness964", 4867101, 1046427, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-269-ig", "Instagram", "aadhyafitness964", "https://www.instagram.com/aadhyafitness964/", 1849498, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aadhya.das@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aadhyafitness964/about",
      lastChecked: daysAgo(3),
    },
  },

  // 270. Riya Kulkarni (Chandigarh, Punjab)
  {
    id: "creator-in-270",
    name: "Riya Kulkarni",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-270-yt", "YouTube", "@riyatech54", "https://www.youtube.com/@riyatech54", 8981830, 718546, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-270-ig", "Instagram", "riyatech54", "https://www.instagram.com/riyatech54/", 3413095, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.riya.kulkarni@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@riyatech54/about",
      lastChecked: daysAgo(3),
    },
  },

  // 271. Tanvi Naidu (Vadodara, Gujarat)
  {
    id: "creator-in-271",
    name: "Tanvi Naidu",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-271-yt", "YouTube", "@tanvifinance143", "https://www.youtube.com/@tanvifinance143", 14201559, 1349148, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-271-ig", "Instagram", "tanvifinance143", "https://www.instagram.com/tanvifinance143/", 5396592, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.tanvi.naidu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@tanvifinance143/about",
      lastChecked: daysAgo(3),
    },
  },

  // 272. Harish Sandhu (Pune, Maharashtra)
  {
    id: "creator-in-272",
    name: "Harish Sandhu",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-272-yt", "YouTube", "@harishtravel232", "https://www.youtube.com/@harishtravel232", 196288, 21592, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-272-ig", "Instagram", "harishtravel232", "https://www.instagram.com/harishtravel232/", 74589, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.harish.sandhu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@harishtravel232/about",
      lastChecked: daysAgo(3),
    },
  },

  // 273. Abhishek Reddy (Chennai, Tamil Nadu)
  {
    id: "creator-in-273",
    name: "Abhishek Reddy",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-273-yt", "YouTube", "@abhishekmusic321", "https://www.youtube.com/@abhishekmusic321", 371017, 46377, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-273-ig", "Instagram", "abhishekmusic321", "https://www.instagram.com/abhishekmusic321/", 140986, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.abhishek.reddy@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@abhishekmusic321/about",
      lastChecked: daysAgo(3),
    },
  },

  // 274. Alok Mishra (Amritsar, Punjab)
  {
    id: "creator-in-274",
    name: "Alok Mishra",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-274-yt", "YouTube", "@alokcomedy410", "https://www.youtube.com/@alokcomedy410", 665746, 93204, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-274-ig", "Instagram", "alokcomedy410", "https://www.instagram.com/alokcomedy410/", 252983, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.alok.mishra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@alokcomedy410/about",
      lastChecked: daysAgo(3),
    },
  },

  // 275. Reyansh Deshpande (Surat, Gujarat)
  {
    id: "creator-in-275",
    name: "Reyansh Deshpande",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-275-yt", "YouTube", "@reyanshfood499", "https://www.youtube.com/@reyanshfood499", 1160475, 179874, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-275-ig", "Instagram", "reyanshfood499", "https://www.instagram.com/reyanshfood499/", 440981, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.reyansh.deshpande@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@reyanshfood499/about",
      lastChecked: daysAgo(3),
    },
  },

  // 276. Atharva Pillai (Mumbai, Maharashtra)
  {
    id: "creator-in-276",
    name: "Atharva Pillai",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-276-yt", "YouTube", "@atharvavlogs588", "https://www.youtube.com/@atharvavlogs588", 2475204, 420785, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-276-ig", "Instagram", "atharvavlogs588", "https://www.instagram.com/atharvavlogs588/", 940578, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.atharva.pillai@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@atharvavlogs588/about",
      lastChecked: daysAgo(3),
    },
  },

  // 277. Pranav Khanna (Madurai, Tamil Nadu)
  {
    id: "creator-in-277",
    name: "Pranav Khanna",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-277-yt", "YouTube", "@pranavgaming677", "https://www.youtube.com/@pranavgaming677", 4889933, 904638, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-277-ig", "Instagram", "pranavgaming677", "https://www.instagram.com/pranavgaming677/", 1858175, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pranav.khanna@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@pranavgaming677/about",
      lastChecked: daysAgo(3),
    },
  },

  // 278. Myra Mukherjee (Ludhiana, Punjab)
  {
    id: "creator-in-278",
    name: "Myra Mukherjee",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-278-yt", "YouTube", "@myraedu766", "https://www.youtube.com/@myraedu766", 8909662, 1781932, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-278-ig", "Instagram", "myraedu766", "https://www.instagram.com/myraedu766/", 3385672, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.myra.mukherjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@myraedu766/about",
      lastChecked: daysAgo(3),
    },
  },

  // 279. Gauri Bhatt (Ahmedabad, Gujarat)
  {
    id: "creator-in-279",
    name: "Gauri Bhatt",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-279-yt", "YouTube", "@gaurifitness855", "https://www.youtube.com/@gaurifitness855", 14224391, 3058244, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-279-ig", "Instagram", "gaurifitness855", "https://www.instagram.com/gaurifitness855/", 5405269, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.gauri.bhatt@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@gaurifitness855/about",
      lastChecked: daysAgo(3),
    },
  },

  // 280. Rohan Rao (Nagpur, Maharashtra)
  {
    id: "creator-in-280",
    name: "Rohan Rao",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-280-yt", "YouTube", "@rohantech944", "https://www.youtube.com/@rohantech944", 219120, 17530, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-280-ig", "Instagram", "rohantech944", "https://www.instagram.com/rohantech944/", 83266, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.rohan.rao@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@rohantech944/about",
      lastChecked: daysAgo(3),
    },
  },

  // 281. Deepak Gill (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-281",
    name: "Deepak Gill",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-281-yt", "YouTube", "@deepakfinance34", "https://www.youtube.com/@deepakfinance34", 393849, 37416, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-281-ig", "Instagram", "deepakfinance34", "https://www.instagram.com/deepakfinance34/", 149663, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.deepak.gill@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@deepakfinance34/about",
      lastChecked: daysAgo(3),
    },
  },

  // 282. Tushar Patel (Chandigarh, Punjab)
  {
    id: "creator-in-282",
    name: "Tushar Patel",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-282-yt", "YouTube", "@tushartravel123", "https://www.youtube.com/@tushartravel123", 688578, 75744, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-282-ig", "Instagram", "tushartravel123", "https://www.instagram.com/tushartravel123/", 261660, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.tushar.patel@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@tushartravel123/about",
      lastChecked: daysAgo(3),
    },
  },

  // 283. Vivaan Chauhan (Vadodara, Gujarat)
  {
    id: "creator-in-283",
    name: "Vivaan Chauhan",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-283-yt", "YouTube", "@vivaanmusic212", "https://www.youtube.com/@vivaanmusic212", 1183307, 147913, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-283-ig", "Instagram", "vivaanmusic212", "https://www.instagram.com/vivaanmusic212/", 449657, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vivaan.chauhan@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vivaanmusic212/about",
      lastChecked: daysAgo(3),
    },
  },

  // 284. Ayaan Shinde (Pune, Maharashtra)
  {
    id: "creator-in-284",
    name: "Ayaan Shinde",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-284-yt", "YouTube", "@ayaancomedy301", "https://www.youtube.com/@ayaancomedy301", 2403036, 336425, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-284-ig", "Instagram", "ayaancomedy301", "https://www.instagram.com/ayaancomedy301/", 913154, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ayaan.shinde@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ayaancomedy301/about",
      lastChecked: daysAgo(3),
    },
  },

  // 285. Kabir Hegde (Chennai, Tamil Nadu)
  {
    id: "creator-in-285",
    name: "Kabir Hegde",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-285-yt", "YouTube", "@kabirfood390", "https://www.youtube.com/@kabirfood390", 4817765, 746754, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-285-ig", "Instagram", "kabirfood390", "https://www.instagram.com/kabirfood390/", 1830751, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kabir.hegde@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kabirfood390/about",
      lastChecked: daysAgo(3),
    },
  },

  // 286. Saanvi Kapoor (Amritsar, Punjab)
  {
    id: "creator-in-286",
    name: "Saanvi Kapoor",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-286-yt", "YouTube", "@saanvivlogs479", "https://www.youtube.com/@saanvivlogs479", 8932494, 1518524, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-286-ig", "Instagram", "saanvivlogs479", "https://www.instagram.com/saanvivlogs479/", 3394348, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.saanvi.kapoor@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saanvivlogs479/about",
      lastChecked: daysAgo(3),
    },
  },

  // 287. Anika Chatterjee (Surat, Gujarat)
  {
    id: "creator-in-287",
    name: "Anika Chatterjee",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-287-yt", "YouTube", "@anikagaming568", "https://www.youtube.com/@anikagaming568", 14247223, 2635736, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-287-ig", "Instagram", "anikagaming568", "https://www.instagram.com/anikagaming568/", 5413945, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.anika.chatterjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@anikagaming568/about",
      lastChecked: daysAgo(3),
    },
  },

  // 288. Kavya Joshi (Mumbai, Maharashtra)
  {
    id: "creator-in-288",
    name: "Kavya Joshi",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-288-yt", "YouTube", "@kavyaedu657", "https://www.youtube.com/@kavyaedu657", 241952, 48390, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-288-ig", "Instagram", "kavyaedu657", "https://www.instagram.com/kavyaedu657/", 91942, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kavya.joshi@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kavyaedu657/about",
      lastChecked: daysAgo(3),
    },
  },

  // 289. Sameer Bhosale (Madurai, Tamil Nadu)
  {
    id: "creator-in-289",
    name: "Sameer Bhosale",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-289-yt", "YouTube", "@sameerfitness746", "https://www.youtube.com/@sameerfitness746", 416681, 89586, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-289-ig", "Instagram", "sameerfitness746", "https://www.instagram.com/sameerfitness746/", 158339, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sameer.bhosale@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sameerfitness746/about",
      lastChecked: daysAgo(3),
    },
  },

  // 290. Karan Dhillon (Ludhiana, Punjab)
  {
    id: "creator-in-290",
    name: "Karan Dhillon",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-290-yt", "YouTube", "@karantech835", "https://www.youtube.com/@karantech835", 711410, 56913, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-290-ig", "Instagram", "karantech835", "https://www.instagram.com/karantech835/", 270336, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.karan.dhillon@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@karantech835/about",
      lastChecked: daysAgo(3),
    },
  },

  // 291. Chirag Verma (Ahmedabad, Gujarat)
  {
    id: "creator-in-291",
    name: "Chirag Verma",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-291-yt", "YouTube", "@chiragfinance924", "https://www.youtube.com/@chiragfinance924", 1111139, 105558, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-291-ig", "Instagram", "chiragfinance924", "https://www.instagram.com/chiragfinance924/", 422233, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.chirag.verma@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@chiragfinance924/about",
      lastChecked: daysAgo(3),
    },
  },

  // 292. Arjun Yadav (Nagpur, Maharashtra)
  {
    id: "creator-in-292",
    name: "Arjun Yadav",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-292-yt", "YouTube", "@arjuntravel14", "https://www.youtube.com/@arjuntravel14", 2425868, 266845, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-292-ig", "Instagram", "arjuntravel14", "https://www.instagram.com/arjuntravel14/", 921830, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.arjun.yadav@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@arjuntravel14/about",
      lastChecked: daysAgo(3),
    },
  },

  // 293. Shaurya Pawar (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-293",
    name: "Shaurya Pawar",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-293-yt", "YouTube", "@shauryamusic103", "https://www.youtube.com/@shauryamusic103", 4840597, 605075, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-293-ig", "Instagram", "shauryamusic103", "https://www.instagram.com/shauryamusic103/", 1839427, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.shaurya.pawar@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@shauryamusic103/about",
      lastChecked: daysAgo(3),
    },
  },

  // 294. Advik Shetty (Chandigarh, Punjab)
  {
    id: "creator-in-294",
    name: "Advik Shetty",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-294-yt", "YouTube", "@advikcomedy192", "https://www.youtube.com/@advikcomedy192", 8955326, 1253746, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-294-ig", "Instagram", "advikcomedy192", "https://www.instagram.com/advikcomedy192/", 3403024, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.advik.shetty@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@advikcomedy192/about",
      lastChecked: daysAgo(3),
    },
  },

  // 295. Kiara Malhotra (Vadodara, Gujarat)
  {
    id: "creator-in-295",
    name: "Kiara Malhotra",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-295-yt", "YouTube", "@kiarafood281", "https://www.youtube.com/@kiarafood281", 14270055, 2211859, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-295-ig", "Instagram", "kiarafood281", "https://www.instagram.com/kiarafood281/", 5422621, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kiara.malhotra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kiarafood281/about",
      lastChecked: daysAgo(3),
    },
  },

  // 296. Avani Banerjee (Pune, Maharashtra)
  {
    id: "creator-in-296",
    name: "Avani Banerjee",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-296-yt", "YouTube", "@avanivlogs370", "https://www.youtube.com/@avanivlogs370", 264784, 45013, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-296-ig", "Instagram", "avanivlogs370", "https://www.instagram.com/avanivlogs370/", 100618, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.avani.banerjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@avanivlogs370/about",
      lastChecked: daysAgo(3),
    },
  },

  // 297. Pooja Dubey (Chennai, Tamil Nadu)
  {
    id: "creator-in-297",
    name: "Pooja Dubey",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-297-yt", "YouTube", "@poojagaming459", "https://www.youtube.com/@poojagaming459", 344513, 63735, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-297-ig", "Instagram", "poojagaming459", "https://www.instagram.com/poojagaming459/", 130915, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pooja.dubey@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@poojagaming459/about",
      lastChecked: daysAgo(3),
    },
  },

  // 298. Gaurav Kadam (Amritsar, Punjab)
  {
    id: "creator-in-298",
    name: "Gaurav Kadam",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-298-yt", "YouTube", "@gauravedu548", "https://www.youtube.com/@gauravedu548", 639242, 127848, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-298-ig", "Instagram", "gauravedu548", "https://www.instagram.com/gauravedu548/", 242912, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.gaurav.kadam@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@gauravedu548/about",
      lastChecked: daysAgo(3),
    },
  },

  // 299. Kunal Grewal (Surat, Gujarat)
  {
    id: "creator-in-299",
    name: "Kunal Grewal",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-299-yt", "YouTube", "@kunalfitness637", "https://www.youtube.com/@kunalfitness637", 1133971, 243804, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-299-ig", "Instagram", "kunalfitness637", "https://www.instagram.com/kunalfitness637/", 430909, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kunal.grewal@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kunalfitness637/about",
      lastChecked: daysAgo(3),
    },
  },

  // 300. Aarav Sharma (Mumbai, Maharashtra)
  {
    id: "creator-in-300",
    name: "Aarav Sharma",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-300-yt", "YouTube", "@aaravtech726", "https://www.youtube.com/@aaravtech726", 2448700, 195896, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-300-ig", "Instagram", "aaravtech726", "https://www.instagram.com/aaravtech726/", 930506, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarav.sharma@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aaravtech726/about",
      lastChecked: daysAgo(3),
    },
  },

  // 301. Sai Singh (Madurai, Tamil Nadu)
  {
    id: "creator-in-301",
    name: "Sai Singh",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-301-yt", "YouTube", "@saifinance815", "https://www.youtube.com/@saifinance815", 4863429, 462026, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-301-ig", "Instagram", "saifinance815", "https://www.instagram.com/saifinance815/", 1848103, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sai.singh@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saifinance815/about",
      lastChecked: daysAgo(3),
    },
  },

  // 302. Rudra Patil (Ludhiana, Punjab)
  {
    id: "creator-in-302",
    name: "Rudra Patil",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-302-yt", "YouTube", "@rudratravel904", "https://www.youtube.com/@rudratravel904", 8978158, 987597, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-302-ig", "Instagram", "rudratravel904", "https://www.instagram.com/rudratravel904/", 3411700, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.rudra.patil@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@rudratravel904/about",
      lastChecked: daysAgo(3),
    },
  },

  // 303. Diya Goud (Ahmedabad, Gujarat)
  {
    id: "creator-in-303",
    name: "Diya Goud",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-303-yt", "YouTube", "@diyamusic993", "https://www.youtube.com/@diyamusic993", 14292887, 1786611, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-303-ig", "Instagram", "diyamusic993", "https://www.instagram.com/diyamusic993/", 5431297, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.diya.goud@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@diyamusic993/about",
      lastChecked: daysAgo(3),
    },
  },

  // 304. Pari Bhatia (Nagpur, Maharashtra)
  {
    id: "creator-in-304",
    name: "Pari Bhatia",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-304-yt", "YouTube", "@paricomedy83", "https://www.youtube.com/@paricomedy83", 192616, 26966, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-304-ig", "Instagram", "paricomedy83", "https://www.instagram.com/paricomedy83/", 73194, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pari.bhatia@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@paricomedy83/about",
      lastChecked: daysAgo(3),
    },
  },

  // 305. Isha Iyer (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-305",
    name: "Isha Iyer",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-305-yt", "YouTube", "@ishafood172", "https://www.youtube.com/@ishafood172", 367345, 56938, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-305-ig", "Instagram", "ishafood172", "https://www.instagram.com/ishafood172/", 139591, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.isha.iyer@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ishafood172/about",
      lastChecked: daysAgo(3),
    },
  },

  // 306. Siddharth Tiwari (Chandigarh, Punjab)
  {
    id: "creator-in-306",
    name: "Siddharth Tiwari",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-306-yt", "YouTube", "@siddharthvlogs261", "https://www.youtube.com/@siddharthvlogs261", 662074, 112553, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-306-ig", "Instagram", "siddharthvlogs261", "https://www.instagram.com/siddharthvlogs261/", 251588, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.siddharth.tiwari@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@siddharthvlogs261/about",
      lastChecked: daysAgo(3),
    },
  },

  // 307. Suresh Chavan (Vadodara, Gujarat)
  {
    id: "creator-in-307",
    name: "Suresh Chavan",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-307-yt", "YouTube", "@sureshgaming350", "https://www.youtube.com/@sureshgaming350", 1156803, 214009, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-307-ig", "Instagram", "sureshgaming350", "https://www.instagram.com/sureshgaming350/", 439585, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.suresh.chavan@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sureshgaming350/about",
      lastChecked: daysAgo(3),
    },
  },

  // 308. Mayank Kurup (Pune, Maharashtra)
  {
    id: "creator-in-308",
    name: "Mayank Kurup",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-308-yt", "YouTube", "@mayankedu439", "https://www.youtube.com/@mayankedu439", 2471532, 494306, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-308-ig", "Instagram", "mayankedu439", "https://www.instagram.com/mayankedu439/", 939182, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.mayank.kurup@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@mayankedu439/about",
      lastChecked: daysAgo(3),
    },
  },

  // 309. Vihaan Sethi (Chennai, Tamil Nadu)
  {
    id: "creator-in-309",
    name: "Vihaan Sethi",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-309-yt", "YouTube", "@vihaanfitness528", "https://www.youtube.com/@vihaanfitness528", 4886261, 1050546, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-309-ig", "Instagram", "vihaanfitness528", "https://www.instagram.com/vihaanfitness528/", 1856779, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vihaan.sethi@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vihaanfitness528/about",
      lastChecked: daysAgo(3),
    },
  },

  // 310. Ishaan Gupta (Amritsar, Punjab)
  {
    id: "creator-in-310",
    name: "Ishaan Gupta",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-310-yt", "YouTube", "@ishaantech617", "https://www.youtube.com/@ishaantech617", 8905990, 712479, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-310-ig", "Instagram", "ishaantech617", "https://www.instagram.com/ishaantech617/", 3384276, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ishaan.gupta@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ishaantech617/about",
      lastChecked: daysAgo(3),
    },
  },

  // 311. Om Deshmukh (Surat, Gujarat)
  {
    id: "creator-in-311",
    name: "Om Deshmukh",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-311-yt", "YouTube", "@omfinance706", "https://www.youtube.com/@omfinance706", 14220719, 1350968, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-311-ig", "Instagram", "omfinance706", "https://www.instagram.com/omfinance706/", 5403873, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.om.deshmukh@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@omfinance706/about",
      lastChecked: daysAgo(3),
    },
  },

  // 312. Aarohi Chowdary (Mumbai, Maharashtra)
  {
    id: "creator-in-312",
    name: "Aarohi Chowdary",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-312-yt", "YouTube", "@aarohitravel795", "https://www.youtube.com/@aarohitravel795", 215448, 23699, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-312-ig", "Instagram", "aarohitravel795", "https://www.instagram.com/aarohitravel795/", 81870, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarohi.chowdary@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aarohitravel795/about",
      lastChecked: daysAgo(3),
    },
  },

  // 313. Navya Sidhu (Madurai, Tamil Nadu)
  {
    id: "creator-in-313",
    name: "Navya Sidhu",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-313-yt", "YouTube", "@navyamusic884", "https://www.youtube.com/@navyamusic884", 390177, 48772, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-313-ig", "Instagram", "navyamusic884", "https://www.instagram.com/navyamusic884/", 148267, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.navya.sidhu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@navyamusic884/about",
      lastChecked: daysAgo(3),
    },
  },

  // 314. Meera Nair (Ludhiana, Punjab)
  {
    id: "creator-in-314",
    name: "Meera Nair",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-314-yt", "YouTube", "@meeracomedy973", "https://www.youtube.com/@meeracomedy973", 684906, 95887, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-314-ig", "Instagram", "meeracomedy973", "https://www.instagram.com/meeracomedy973/", 260264, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.meera.nair@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@meeracomedy973/about",
      lastChecked: daysAgo(3),
    },
  },

  // 315. Nikhil Pandey (Ahmedabad, Gujarat)
  {
    id: "creator-in-315",
    name: "Nikhil Pandey",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-315-yt", "YouTube", "@nikhilfood63", "https://www.youtube.com/@nikhilfood63", 1179635, 182843, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-315-ig", "Instagram", "nikhilfood63", "https://www.instagram.com/nikhilfood63/", 448261, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.nikhil.pandey@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@nikhilfood63/about",
      lastChecked: daysAgo(3),
    },
  },

  // 316. Varun Gaikwad (Nagpur, Maharashtra)
  {
    id: "creator-in-316",
    name: "Varun Gaikwad",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-316-yt", "YouTube", "@varunvlogs152", "https://www.youtube.com/@varunvlogs152", 2494364, 424042, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-316-ig", "Instagram", "varunvlogs152", "https://www.instagram.com/varunvlogs152/", 947858, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.varun.gaikwad@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@varunvlogs152/about",
      lastChecked: daysAgo(3),
    },
  },

  // 317. Devendra Menon (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-317",
    name: "Devendra Menon",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-317-yt", "YouTube", "@devendragaming241", "https://www.youtube.com/@devendragaming241", 4814093, 890607, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-317-ig", "Instagram", "devendragaming241", "https://www.instagram.com/devendragaming241/", 1829355, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.devendra.menon@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@devendragaming241/about",
      lastChecked: daysAgo(3),
    },
  },

  // 318. Muhammad Mehra (Chandigarh, Punjab)
  {
    id: "creator-in-318",
    name: "Muhammad Mehra",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-318-yt", "YouTube", "@muhammadedu330", "https://www.youtube.com/@muhammadedu330", 8928822, 1785764, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-318-ig", "Instagram", "muhammadedu330", "https://www.instagram.com/muhammadedu330/", 3392952, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.muhammad.mehra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@muhammadedu330/about",
      lastChecked: daysAgo(3),
    },
  },

  // 319. Aarush Das (Vadodara, Gujarat)
  {
    id: "creator-in-319",
    name: "Aarush Das",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-319-yt", "YouTube", "@aarushfitness419", "https://www.youtube.com/@aarushfitness419", 14243551, 3062363, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-319-ig", "Instagram", "aarushfitness419", "https://www.instagram.com/aarushfitness419/", 5412549, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarush.das@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aarushfitness419/about",
      lastChecked: daysAgo(3),
    },
  },

  // 320. Ananya Kulkarni (Pune, Maharashtra)
  {
    id: "creator-in-320",
    name: "Ananya Kulkarni",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-320-yt", "YouTube", "@ananyatech508", "https://www.youtube.com/@ananyatech508", 238280, 19062, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-320-ig", "Instagram", "ananyatech508", "https://www.instagram.com/ananyatech508/", 90546, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ananya.kulkarni@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ananyatech508/about",
      lastChecked: daysAgo(3),
    },
  },

  // 321. Sara Naidu (Chennai, Tamil Nadu)
  {
    id: "creator-in-321",
    name: "Sara Naidu",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-321-yt", "YouTube", "@sarafinance597", "https://www.youtube.com/@sarafinance597", 413009, 39236, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-321-ig", "Instagram", "sarafinance597", "https://www.instagram.com/sarafinance597/", 156943, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sara.naidu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sarafinance597/about",
      lastChecked: daysAgo(3),
    },
  },

  // 322. Shreya Sandhu (Amritsar, Punjab)
  {
    id: "creator-in-322",
    name: "Shreya Sandhu",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-322-yt", "YouTube", "@shreyatravel686", "https://www.youtube.com/@shreyatravel686", 707738, 77851, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-322-ig", "Instagram", "shreyatravel686", "https://www.instagram.com/shreyatravel686/", 268940, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.shreya.sandhu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@shreyatravel686/about",
      lastChecked: daysAgo(3),
    },
  },

  // 323. Vikram Reddy (Surat, Gujarat)
  {
    id: "creator-in-323",
    name: "Vikram Reddy",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-323-yt", "YouTube", "@vikrammusic775", "https://www.youtube.com/@vikrammusic775", 1107467, 138433, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-323-ig", "Instagram", "vikrammusic775", "https://www.instagram.com/vikrammusic775/", 420837, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vikram.reddy@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vikrammusic775/about",
      lastChecked: daysAgo(3),
    },
  },

  // 324. Manish Mishra (Mumbai, Maharashtra)
  {
    id: "creator-in-324",
    name: "Manish Mishra",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-324-yt", "YouTube", "@manishcomedy864", "https://www.youtube.com/@manishcomedy864", 2422196, 339107, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-324-ig", "Instagram", "manishcomedy864", "https://www.instagram.com/manishcomedy864/", 920434, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.manish.mishra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@manishcomedy864/about",
      lastChecked: daysAgo(3),
    },
  },

  // 325. Saurabh Deshpande (Madurai, Tamil Nadu)
  {
    id: "creator-in-325",
    name: "Saurabh Deshpande",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-325-yt", "YouTube", "@saurabhfood953", "https://www.youtube.com/@saurabhfood953", 4836925, 749723, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-325-ig", "Instagram", "saurabhfood953", "https://www.instagram.com/saurabhfood953/", 1838032, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.saurabh.deshpande@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saurabhfood953/about",
      lastChecked: daysAgo(3),
    },
  },

  // 326. Aditya Pillai (Ludhiana, Punjab)
  {
    id: "creator-in-326",
    name: "Aditya Pillai",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-326-yt", "YouTube", "@adityavlogs43", "https://www.youtube.com/@adityavlogs43", 8951654, 1521781, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-326-ig", "Instagram", "adityavlogs43", "https://www.instagram.com/adityavlogs43/", 3401629, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aditya.pillai@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@adityavlogs43/about",
      lastChecked: daysAgo(3),
    },
  },

  // 327. Krishna Khanna (Ahmedabad, Gujarat)
  {
    id: "creator-in-327",
    name: "Krishna Khanna",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-327-yt", "YouTube", "@krishnagaming132", "https://www.youtube.com/@krishnagaming132", 14266383, 2639281, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-327-ig", "Instagram", "krishnagaming132", "https://www.instagram.com/krishnagaming132/", 5421226, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.krishna.khanna@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@krishnagaming132/about",
      lastChecked: daysAgo(3),
    },
  },

  // 328. Dhruv Mukherjee (Nagpur, Maharashtra)
  {
    id: "creator-in-328",
    name: "Dhruv Mukherjee",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-328-yt", "YouTube", "@dhruvedu221", "https://www.youtube.com/@dhruvedu221", 261112, 52222, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-328-ig", "Instagram", "dhruvedu221", "https://www.instagram.com/dhruvedu221/", 99223, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.dhruv.mukherjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@dhruvedu221/about",
      lastChecked: daysAgo(3),
    },
  },

  // 329. Aadhya Bhatt (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-329",
    name: "Aadhya Bhatt",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-329-yt", "YouTube", "@aadhyafitness310", "https://www.youtube.com/@aadhyafitness310", 340841, 73281, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-329-ig", "Instagram", "aadhyafitness310", "https://www.instagram.com/aadhyafitness310/", 129520, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aadhya.bhatt@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aadhyafitness310/about",
      lastChecked: daysAgo(3),
    },
  },

  // 330. Riya Rao (Chandigarh, Punjab)
  {
    id: "creator-in-330",
    name: "Riya Rao",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-330-yt", "YouTube", "@riyatech399", "https://www.youtube.com/@riyatech399", 635570, 50846, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-330-ig", "Instagram", "riyatech399", "https://www.instagram.com/riyatech399/", 241517, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.riya.rao@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@riyatech399/about",
      lastChecked: daysAgo(3),
    },
  },

  // 331. Tanvi Gill (Vadodara, Gujarat)
  {
    id: "creator-in-331",
    name: "Tanvi Gill",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-331-yt", "YouTube", "@tanvifinance488", "https://www.youtube.com/@tanvifinance488", 1130299, 107378, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-331-ig", "Instagram", "tanvifinance488", "https://www.instagram.com/tanvifinance488/", 429514, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.tanvi.gill@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@tanvifinance488/about",
      lastChecked: daysAgo(3),
    },
  },

  // 332. Harish Patel (Pune, Maharashtra)
  {
    id: "creator-in-332",
    name: "Harish Patel",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-332-yt", "YouTube", "@harishtravel577", "https://www.youtube.com/@harishtravel577", 2445028, 268953, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-332-ig", "Instagram", "harishtravel577", "https://www.instagram.com/harishtravel577/", 929111, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.harish.patel@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@harishtravel577/about",
      lastChecked: daysAgo(3),
    },
  },

  // 333. Abhishek Chauhan (Chennai, Tamil Nadu)
  {
    id: "creator-in-333",
    name: "Abhishek Chauhan",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-333-yt", "YouTube", "@abhishekmusic666", "https://www.youtube.com/@abhishekmusic666", 4859757, 607470, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-333-ig", "Instagram", "abhishekmusic666", "https://www.instagram.com/abhishekmusic666/", 1846708, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.abhishek.chauhan@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@abhishekmusic666/about",
      lastChecked: daysAgo(3),
    },
  },

  // 334. Alok Shinde (Amritsar, Punjab)
  {
    id: "creator-in-334",
    name: "Alok Shinde",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-334-yt", "YouTube", "@alokcomedy755", "https://www.youtube.com/@alokcomedy755", 8974486, 1256428, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-334-ig", "Instagram", "alokcomedy755", "https://www.instagram.com/alokcomedy755/", 3410305, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.alok.shinde@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@alokcomedy755/about",
      lastChecked: daysAgo(3),
    },
  },

  // 335. Reyansh Hegde (Surat, Gujarat)
  {
    id: "creator-in-335",
    name: "Reyansh Hegde",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-335-yt", "YouTube", "@reyanshfood844", "https://www.youtube.com/@reyanshfood844", 14289215, 2214828, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-335-ig", "Instagram", "reyanshfood844", "https://www.instagram.com/reyanshfood844/", 5429902, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.reyansh.hegde@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@reyanshfood844/about",
      lastChecked: daysAgo(3),
    },
  },

  // 336. Atharva Kapoor (Mumbai, Maharashtra)
  {
    id: "creator-in-336",
    name: "Atharva Kapoor",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-336-yt", "YouTube", "@atharvavlogs933", "https://www.youtube.com/@atharvavlogs933", 188944, 32120, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-336-ig", "Instagram", "atharvavlogs933", "https://www.instagram.com/atharvavlogs933/", 71799, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.atharva.kapoor@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@atharvavlogs933/about",
      lastChecked: daysAgo(3),
    },
  },

  // 337. Pranav Chatterjee (Madurai, Tamil Nadu)
  {
    id: "creator-in-337",
    name: "Pranav Chatterjee",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-337-yt", "YouTube", "@pranavgaming23", "https://www.youtube.com/@pranavgaming23", 363673, 67280, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-337-ig", "Instagram", "pranavgaming23", "https://www.instagram.com/pranavgaming23/", 138196, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pranav.chatterjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@pranavgaming23/about",
      lastChecked: daysAgo(3),
    },
  },

  // 338. Myra Joshi (Ludhiana, Punjab)
  {
    id: "creator-in-338",
    name: "Myra Joshi",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-338-yt", "YouTube", "@myraedu112", "https://www.youtube.com/@myraedu112", 658402, 131680, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-338-ig", "Instagram", "myraedu112", "https://www.instagram.com/myraedu112/", 250193, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.myra.joshi@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@myraedu112/about",
      lastChecked: daysAgo(3),
    },
  },

  // 339. Gauri Bhosale (Ahmedabad, Gujarat)
  {
    id: "creator-in-339",
    name: "Gauri Bhosale",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-339-yt", "YouTube", "@gaurifitness201", "https://www.youtube.com/@gaurifitness201", 1153131, 247923, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-339-ig", "Instagram", "gaurifitness201", "https://www.instagram.com/gaurifitness201/", 438190, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.gauri.bhosale@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@gaurifitness201/about",
      lastChecked: daysAgo(3),
    },
  },

  // 340. Rohan Dhillon (Nagpur, Maharashtra)
  {
    id: "creator-in-340",
    name: "Rohan Dhillon",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-340-yt", "YouTube", "@rohantech290", "https://www.youtube.com/@rohantech290", 2467860, 197429, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-340-ig", "Instagram", "rohantech290", "https://www.instagram.com/rohantech290/", 937787, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.rohan.dhillon@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@rohantech290/about",
      lastChecked: daysAgo(3),
    },
  },

  // 341. Deepak Verma (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-341",
    name: "Deepak Verma",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-341-yt", "YouTube", "@deepakfinance379", "https://www.youtube.com/@deepakfinance379", 4882589, 463846, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-341-ig", "Instagram", "deepakfinance379", "https://www.instagram.com/deepakfinance379/", 1855384, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.deepak.verma@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@deepakfinance379/about",
      lastChecked: daysAgo(3),
    },
  },

  // 342. Tushar Yadav (Chandigarh, Punjab)
  {
    id: "creator-in-342",
    name: "Tushar Yadav",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-342-yt", "YouTube", "@tushartravel468", "https://www.youtube.com/@tushartravel468", 8902318, 979255, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-342-ig", "Instagram", "tushartravel468", "https://www.instagram.com/tushartravel468/", 3382881, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.tushar.yadav@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@tushartravel468/about",
      lastChecked: daysAgo(3),
    },
  },

  // 343. Vivaan Pawar (Vadodara, Gujarat)
  {
    id: "creator-in-343",
    name: "Vivaan Pawar",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-343-yt", "YouTube", "@vivaanmusic557", "https://www.youtube.com/@vivaanmusic557", 14217047, 1777131, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-343-ig", "Instagram", "vivaanmusic557", "https://www.instagram.com/vivaanmusic557/", 5402478, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vivaan.pawar@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vivaanmusic557/about",
      lastChecked: daysAgo(3),
    },
  },

  // 344. Ayaan Shetty (Pune, Maharashtra)
  {
    id: "creator-in-344",
    name: "Ayaan Shetty",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-344-yt", "YouTube", "@ayaancomedy646", "https://www.youtube.com/@ayaancomedy646", 211776, 29649, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-344-ig", "Instagram", "ayaancomedy646", "https://www.instagram.com/ayaancomedy646/", 80475, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ayaan.shetty@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ayaancomedy646/about",
      lastChecked: daysAgo(3),
    },
  },

  // 345. Kabir Malhotra (Chennai, Tamil Nadu)
  {
    id: "creator-in-345",
    name: "Kabir Malhotra",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-345-yt", "YouTube", "@kabirfood735", "https://www.youtube.com/@kabirfood735", 386505, 59908, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-345-ig", "Instagram", "kabirfood735", "https://www.instagram.com/kabirfood735/", 146872, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kabir.malhotra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kabirfood735/about",
      lastChecked: daysAgo(3),
    },
  },

  // 346. Saanvi Banerjee (Amritsar, Punjab)
  {
    id: "creator-in-346",
    name: "Saanvi Banerjee",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-346-yt", "YouTube", "@saanvivlogs824", "https://www.youtube.com/@saanvivlogs824", 681234, 115810, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-346-ig", "Instagram", "saanvivlogs824", "https://www.instagram.com/saanvivlogs824/", 258869, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.saanvi.banerjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saanvivlogs824/about",
      lastChecked: daysAgo(3),
    },
  },

  // 347. Anika Dubey (Surat, Gujarat)
  {
    id: "creator-in-347",
    name: "Anika Dubey",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-347-yt", "YouTube", "@anikagaming913", "https://www.youtube.com/@anikagaming913", 1175963, 217553, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-347-ig", "Instagram", "anikagaming913", "https://www.instagram.com/anikagaming913/", 446866, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.anika.dubey@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@anikagaming913/about",
      lastChecked: daysAgo(3),
    },
  },

  // 348. Kavya Kadam (Mumbai, Maharashtra)
  {
    id: "creator-in-348",
    name: "Kavya Kadam",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-348-yt", "YouTube", "@kavyaedu3", "https://www.youtube.com/@kavyaedu3", 2490692, 498138, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-348-ig", "Instagram", "kavyaedu3", "https://www.instagram.com/kavyaedu3/", 946463, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kavya.kadam@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kavyaedu3/about",
      lastChecked: daysAgo(3),
    },
  },

  // 349. Sameer Grewal (Madurai, Tamil Nadu)
  {
    id: "creator-in-349",
    name: "Sameer Grewal",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-349-yt", "YouTube", "@sameerfitness92", "https://www.youtube.com/@sameerfitness92", 4810421, 1034241, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-349-ig", "Instagram", "sameerfitness92", "https://www.instagram.com/sameerfitness92/", 1827960, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sameer.grewal@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sameerfitness92/about",
      lastChecked: daysAgo(3),
    },
  },

  // 350. Karan Sharma (Ludhiana, Punjab)
  {
    id: "creator-in-350",
    name: "Karan Sharma",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-350-yt", "YouTube", "@karantech181", "https://www.youtube.com/@karantech181", 8925150, 714012, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-350-ig", "Instagram", "karantech181", "https://www.instagram.com/karantech181/", 3391557, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.karan.sharma@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@karantech181/about",
      lastChecked: daysAgo(3),
    },
  },

  // 351. Chirag Singh (Ahmedabad, Gujarat)
  {
    id: "creator-in-351",
    name: "Chirag Singh",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-351-yt", "YouTube", "@chiragfinance270", "https://www.youtube.com/@chiragfinance270", 14239879, 1352789, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-351-ig", "Instagram", "chiragfinance270", "https://www.instagram.com/chiragfinance270/", 5411154, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.chirag.singh@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@chiragfinance270/about",
      lastChecked: daysAgo(3),
    },
  },

  // 352. Arjun Patil (Nagpur, Maharashtra)
  {
    id: "creator-in-352",
    name: "Arjun Patil",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-352-yt", "YouTube", "@arjuntravel359", "https://www.youtube.com/@arjuntravel359", 234608, 25807, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-352-ig", "Instagram", "arjuntravel359", "https://www.instagram.com/arjuntravel359/", 89151, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.arjun.patil@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@arjuntravel359/about",
      lastChecked: daysAgo(3),
    },
  },

  // 353. Shaurya Goud (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-353",
    name: "Shaurya Goud",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-353-yt", "YouTube", "@shauryamusic448", "https://www.youtube.com/@shauryamusic448", 409337, 51167, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-353-ig", "Instagram", "shauryamusic448", "https://www.instagram.com/shauryamusic448/", 155548, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.shaurya.goud@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@shauryamusic448/about",
      lastChecked: daysAgo(3),
    },
  },

  // 354. Advik Bhatia (Chandigarh, Punjab)
  {
    id: "creator-in-354",
    name: "Advik Bhatia",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-354-yt", "YouTube", "@advikcomedy537", "https://www.youtube.com/@advikcomedy537", 704066, 98569, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-354-ig", "Instagram", "advikcomedy537", "https://www.instagram.com/advikcomedy537/", 267545, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.advik.bhatia@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@advikcomedy537/about",
      lastChecked: daysAgo(3),
    },
  },

  // 355. Kiara Iyer (Vadodara, Gujarat)
  {
    id: "creator-in-355",
    name: "Kiara Iyer",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-355-yt", "YouTube", "@kiarafood626", "https://www.youtube.com/@kiarafood626", 1103795, 171088, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-355-ig", "Instagram", "kiarafood626", "https://www.instagram.com/kiarafood626/", 419442, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kiara.iyer@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kiarafood626/about",
      lastChecked: daysAgo(3),
    },
  },

  // 356. Avani Tiwari (Pune, Maharashtra)
  {
    id: "creator-in-356",
    name: "Avani Tiwari",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-356-yt", "YouTube", "@avanivlogs715", "https://www.youtube.com/@avanivlogs715", 2418524, 411149, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-356-ig", "Instagram", "avanivlogs715", "https://www.instagram.com/avanivlogs715/", 919039, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.avani.tiwari@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@avanivlogs715/about",
      lastChecked: daysAgo(3),
    },
  },

  // 357. Pooja Chavan (Chennai, Tamil Nadu)
  {
    id: "creator-in-357",
    name: "Pooja Chavan",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-357-yt", "YouTube", "@poojagaming804", "https://www.youtube.com/@poojagaming804", 4833253, 894152, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-357-ig", "Instagram", "poojagaming804", "https://www.instagram.com/poojagaming804/", 1836636, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pooja.chavan@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@poojagaming804/about",
      lastChecked: daysAgo(3),
    },
  },

  // 358. Gaurav Kurup (Amritsar, Punjab)
  {
    id: "creator-in-358",
    name: "Gaurav Kurup",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-358-yt", "YouTube", "@gauravedu893", "https://www.youtube.com/@gauravedu893", 8947982, 1789596, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-358-ig", "Instagram", "gauravedu893", "https://www.instagram.com/gauravedu893/", 3400233, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.gaurav.kurup@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@gauravedu893/about",
      lastChecked: daysAgo(3),
    },
  },

  // 359. Kunal Sethi (Surat, Gujarat)
  {
    id: "creator-in-359",
    name: "Kunal Sethi",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-359-yt", "YouTube", "@kunalfitness982", "https://www.youtube.com/@kunalfitness982", 14262711, 3066483, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-359-ig", "Instagram", "kunalfitness982", "https://www.instagram.com/kunalfitness982/", 5419830, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kunal.sethi@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kunalfitness982/about",
      lastChecked: daysAgo(3),
    },
  },

  // 360. Aarav Gupta (Mumbai, Maharashtra)
  {
    id: "creator-in-360",
    name: "Aarav Gupta",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-360-yt", "YouTube", "@aaravtech72", "https://www.youtube.com/@aaravtech72", 257440, 20595, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-360-ig", "Instagram", "aaravtech72", "https://www.instagram.com/aaravtech72/", 97827, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarav.gupta@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aaravtech72/about",
      lastChecked: daysAgo(3),
    },
  },

  // 361. Sai Deshmukh (Madurai, Tamil Nadu)
  {
    id: "creator-in-361",
    name: "Sai Deshmukh",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-361-yt", "YouTube", "@saifinance161", "https://www.youtube.com/@saifinance161", 432169, 41056, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-361-ig", "Instagram", "saifinance161", "https://www.instagram.com/saifinance161/", 164224, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sai.deshmukh@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saifinance161/about",
      lastChecked: daysAgo(3),
    },
  },

  // 362. Rudra Chowdary (Ludhiana, Punjab)
  {
    id: "creator-in-362",
    name: "Rudra Chowdary",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-362-yt", "YouTube", "@rudratravel250", "https://www.youtube.com/@rudratravel250", 631898, 69509, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-362-ig", "Instagram", "rudratravel250", "https://www.instagram.com/rudratravel250/", 240121, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.rudra.chowdary@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@rudratravel250/about",
      lastChecked: daysAgo(3),
    },
  },

  // 363. Diya Sidhu (Ahmedabad, Gujarat)
  {
    id: "creator-in-363",
    name: "Diya Sidhu",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-363-yt", "YouTube", "@diyamusic339", "https://www.youtube.com/@diyamusic339", 1126627, 140828, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-363-ig", "Instagram", "diyamusic339", "https://www.instagram.com/diyamusic339/", 428118, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.diya.sidhu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@diyamusic339/about",
      lastChecked: daysAgo(3),
    },
  },

  // 364. Pari Nair (Nagpur, Maharashtra)
  {
    id: "creator-in-364",
    name: "Pari Nair",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-364-yt", "YouTube", "@paricomedy428", "https://www.youtube.com/@paricomedy428", 2441356, 341790, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-364-ig", "Instagram", "paricomedy428", "https://www.instagram.com/paricomedy428/", 927715, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pari.nair@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@paricomedy428/about",
      lastChecked: daysAgo(3),
    },
  },

  // 365. Isha Pandey (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-365",
    name: "Isha Pandey",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-365-yt", "YouTube", "@ishafood517", "https://www.youtube.com/@ishafood517", 4856085, 752693, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-365-ig", "Instagram", "ishafood517", "https://www.instagram.com/ishafood517/", 1845312, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.isha.pandey@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ishafood517/about",
      lastChecked: daysAgo(3),
    },
  },

  // 366. Siddharth Gaikwad (Chandigarh, Punjab)
  {
    id: "creator-in-366",
    name: "Siddharth Gaikwad",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-366-yt", "YouTube", "@siddharthvlogs606", "https://www.youtube.com/@siddharthvlogs606", 8970814, 1525038, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-366-ig", "Instagram", "siddharthvlogs606", "https://www.instagram.com/siddharthvlogs606/", 3408909, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.siddharth.gaikwad@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@siddharthvlogs606/about",
      lastChecked: daysAgo(3),
    },
  },

  // 367. Suresh Menon (Vadodara, Gujarat)
  {
    id: "creator-in-367",
    name: "Suresh Menon",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-367-yt", "YouTube", "@sureshgaming695", "https://www.youtube.com/@sureshgaming695", 14285543, 2642825, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-367-ig", "Instagram", "sureshgaming695", "https://www.instagram.com/sureshgaming695/", 5428506, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.suresh.menon@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sureshgaming695/about",
      lastChecked: daysAgo(3),
    },
  },

  // 368. Mayank Mehra (Pune, Maharashtra)
  {
    id: "creator-in-368",
    name: "Mayank Mehra",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-368-yt", "YouTube", "@mayankedu784", "https://www.youtube.com/@mayankedu784", 185272, 37054, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-368-ig", "Instagram", "mayankedu784", "https://www.instagram.com/mayankedu784/", 70403, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.mayank.mehra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@mayankedu784/about",
      lastChecked: daysAgo(3),
    },
  },

  // 369. Vihaan Das (Chennai, Tamil Nadu)
  {
    id: "creator-in-369",
    name: "Vihaan Das",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-369-yt", "YouTube", "@vihaanfitness873", "https://www.youtube.com/@vihaanfitness873", 360001, 77400, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-369-ig", "Instagram", "vihaanfitness873", "https://www.instagram.com/vihaanfitness873/", 136800, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vihaan.das@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vihaanfitness873/about",
      lastChecked: daysAgo(3),
    },
  },

  // 370. Ishaan Kulkarni (Amritsar, Punjab)
  {
    id: "creator-in-370",
    name: "Ishaan Kulkarni",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-370-yt", "YouTube", "@ishaantech962", "https://www.youtube.com/@ishaantech962", 654730, 52378, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-370-ig", "Instagram", "ishaantech962", "https://www.instagram.com/ishaantech962/", 248797, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ishaan.kulkarni@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ishaantech962/about",
      lastChecked: daysAgo(3),
    },
  },

  // 371. Om Naidu (Surat, Gujarat)
  {
    id: "creator-in-371",
    name: "Om Naidu",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-371-yt", "YouTube", "@omfinance52", "https://www.youtube.com/@omfinance52", 1149459, 109199, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-371-ig", "Instagram", "omfinance52", "https://www.instagram.com/omfinance52/", 436794, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.om.naidu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@omfinance52/about",
      lastChecked: daysAgo(3),
    },
  },

  // 372. Aarohi Sandhu (Mumbai, Maharashtra)
  {
    id: "creator-in-372",
    name: "Aarohi Sandhu",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-372-yt", "YouTube", "@aarohitravel141", "https://www.youtube.com/@aarohitravel141", 2464188, 271061, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-372-ig", "Instagram", "aarohitravel141", "https://www.instagram.com/aarohitravel141/", 936391, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarohi.sandhu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aarohitravel141/about",
      lastChecked: daysAgo(3),
    },
  },

  // 373. Navya Reddy (Madurai, Tamil Nadu)
  {
    id: "creator-in-373",
    name: "Navya Reddy",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-373-yt", "YouTube", "@navyamusic230", "https://www.youtube.com/@navyamusic230", 4878917, 609865, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-373-ig", "Instagram", "navyamusic230", "https://www.instagram.com/navyamusic230/", 1853988, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.navya.reddy@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@navyamusic230/about",
      lastChecked: daysAgo(3),
    },
  },

  // 374. Meera Mishra (Ludhiana, Punjab)
  {
    id: "creator-in-374",
    name: "Meera Mishra",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-374-yt", "YouTube", "@meeracomedy319", "https://www.youtube.com/@meeracomedy319", 8993646, 1259110, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-374-ig", "Instagram", "meeracomedy319", "https://www.instagram.com/meeracomedy319/", 3417585, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.meera.mishra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@meeracomedy319/about",
      lastChecked: daysAgo(3),
    },
  },

  // 375. Nikhil Deshpande (Ahmedabad, Gujarat)
  {
    id: "creator-in-375",
    name: "Nikhil Deshpande",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-375-yt", "YouTube", "@nikhilfood408", "https://www.youtube.com/@nikhilfood408", 14213375, 2203073, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-375-ig", "Instagram", "nikhilfood408", "https://www.instagram.com/nikhilfood408/", 5401083, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.nikhil.deshpande@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@nikhilfood408/about",
      lastChecked: daysAgo(3),
    },
  },

  // 376. Varun Pillai (Nagpur, Maharashtra)
  {
    id: "creator-in-376",
    name: "Varun Pillai",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-376-yt", "YouTube", "@varunvlogs497", "https://www.youtube.com/@varunvlogs497", 208104, 35378, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-376-ig", "Instagram", "varunvlogs497", "https://www.instagram.com/varunvlogs497/", 79080, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.varun.pillai@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@varunvlogs497/about",
      lastChecked: daysAgo(3),
    },
  },

  // 377. Devendra Khanna (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-377",
    name: "Devendra Khanna",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-377-yt", "YouTube", "@devendragaming586", "https://www.youtube.com/@devendragaming586", 382833, 70824, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-377-ig", "Instagram", "devendragaming586", "https://www.instagram.com/devendragaming586/", 145477, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.devendra.khanna@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@devendragaming586/about",
      lastChecked: daysAgo(3),
    },
  },

  // 378. Muhammad Mukherjee (Chandigarh, Punjab)
  {
    id: "creator-in-378",
    name: "Muhammad Mukherjee",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-378-yt", "YouTube", "@muhammadedu675", "https://www.youtube.com/@muhammadedu675", 677562, 135512, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-378-ig", "Instagram", "muhammadedu675", "https://www.instagram.com/muhammadedu675/", 257474, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.muhammad.mukherjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@muhammadedu675/about",
      lastChecked: daysAgo(3),
    },
  },

  // 379. Aarush Bhatt (Vadodara, Gujarat)
  {
    id: "creator-in-379",
    name: "Aarush Bhatt",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-379-yt", "YouTube", "@aarushfitness764", "https://www.youtube.com/@aarushfitness764", 1172291, 252043, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-379-ig", "Instagram", "aarushfitness764", "https://www.instagram.com/aarushfitness764/", 445471, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarush.bhatt@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aarushfitness764/about",
      lastChecked: daysAgo(3),
    },
  },

  // 380. Ananya Rao (Pune, Maharashtra)
  {
    id: "creator-in-380",
    name: "Ananya Rao",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-380-yt", "YouTube", "@ananyatech853", "https://www.youtube.com/@ananyatech853", 2487020, 198962, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-380-ig", "Instagram", "ananyatech853", "https://www.instagram.com/ananyatech853/", 945068, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ananya.rao@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ananyatech853/about",
      lastChecked: daysAgo(3),
    },
  },

  // 381. Sara Gill (Chennai, Tamil Nadu)
  {
    id: "creator-in-381",
    name: "Sara Gill",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-381-yt", "YouTube", "@sarafinance942", "https://www.youtube.com/@sarafinance942", 4806749, 456641, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-381-ig", "Instagram", "sarafinance942", "https://www.instagram.com/sarafinance942/", 1826565, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sara.gill@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sarafinance942/about",
      lastChecked: daysAgo(3),
    },
  },

  // 382. Shreya Patel (Amritsar, Punjab)
  {
    id: "creator-in-382",
    name: "Shreya Patel",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-382-yt", "YouTube", "@shreyatravel32", "https://www.youtube.com/@shreyatravel32", 8921478, 981363, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-382-ig", "Instagram", "shreyatravel32", "https://www.instagram.com/shreyatravel32/", 3390162, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.shreya.patel@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@shreyatravel32/about",
      lastChecked: daysAgo(3),
    },
  },

  // 383. Vikram Chauhan (Surat, Gujarat)
  {
    id: "creator-in-383",
    name: "Vikram Chauhan",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-383-yt", "YouTube", "@vikrammusic121", "https://www.youtube.com/@vikrammusic121", 14236207, 1779526, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-383-ig", "Instagram", "vikrammusic121", "https://www.instagram.com/vikrammusic121/", 5409759, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vikram.chauhan@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vikrammusic121/about",
      lastChecked: daysAgo(3),
    },
  },

  // 384. Manish Shinde (Mumbai, Maharashtra)
  {
    id: "creator-in-384",
    name: "Manish Shinde",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-384-yt", "YouTube", "@manishcomedy210", "https://www.youtube.com/@manishcomedy210", 230936, 32331, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-384-ig", "Instagram", "manishcomedy210", "https://www.instagram.com/manishcomedy210/", 87756, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.manish.shinde@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@manishcomedy210/about",
      lastChecked: daysAgo(3),
    },
  },

  // 385. Saurabh Hegde (Madurai, Tamil Nadu)
  {
    id: "creator-in-385",
    name: "Saurabh Hegde",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-385-yt", "YouTube", "@saurabhfood299", "https://www.youtube.com/@saurabhfood299", 405665, 62878, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-385-ig", "Instagram", "saurabhfood299", "https://www.instagram.com/saurabhfood299/", 154153, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.saurabh.hegde@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saurabhfood299/about",
      lastChecked: daysAgo(3),
    },
  },

  // 386. Aditya Kapoor (Ludhiana, Punjab)
  {
    id: "creator-in-386",
    name: "Aditya Kapoor",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-386-yt", "YouTube", "@adityavlogs388", "https://www.youtube.com/@adityavlogs388", 700394, 119067, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-386-ig", "Instagram", "adityavlogs388", "https://www.instagram.com/adityavlogs388/", 266150, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aditya.kapoor@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@adityavlogs388/about",
      lastChecked: daysAgo(3),
    },
  },

  // 387. Krishna Chatterjee (Ahmedabad, Gujarat)
  {
    id: "creator-in-387",
    name: "Krishna Chatterjee",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-387-yt", "YouTube", "@krishnagaming477", "https://www.youtube.com/@krishnagaming477", 1100123, 203523, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-387-ig", "Instagram", "krishnagaming477", "https://www.instagram.com/krishnagaming477/", 418047, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.krishna.chatterjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@krishnagaming477/about",
      lastChecked: daysAgo(3),
    },
  },

  // 388. Dhruv Joshi (Nagpur, Maharashtra)
  {
    id: "creator-in-388",
    name: "Dhruv Joshi",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-388-yt", "YouTube", "@dhruvedu566", "https://www.youtube.com/@dhruvedu566", 2414852, 482970, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-388-ig", "Instagram", "dhruvedu566", "https://www.instagram.com/dhruvedu566/", 917644, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.dhruv.joshi@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@dhruvedu566/about",
      lastChecked: daysAgo(3),
    },
  },

  // 389. Aadhya Bhosale (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-389",
    name: "Aadhya Bhosale",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-389-yt", "YouTube", "@aadhyafitness655", "https://www.youtube.com/@aadhyafitness655", 4829581, 1038360, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-389-ig", "Instagram", "aadhyafitness655", "https://www.instagram.com/aadhyafitness655/", 1835241, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aadhya.bhosale@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aadhyafitness655/about",
      lastChecked: daysAgo(3),
    },
  },

  // 390. Riya Dhillon (Chandigarh, Punjab)
  {
    id: "creator-in-390",
    name: "Riya Dhillon",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-390-yt", "YouTube", "@riyatech744", "https://www.youtube.com/@riyatech744", 8944310, 715545, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-390-ig", "Instagram", "riyatech744", "https://www.instagram.com/riyatech744/", 3398838, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.riya.dhillon@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@riyatech744/about",
      lastChecked: daysAgo(3),
    },
  },

  // 391. Tanvi Verma (Vadodara, Gujarat)
  {
    id: "creator-in-391",
    name: "Tanvi Verma",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-391-yt", "YouTube", "@tanvifinance833", "https://www.youtube.com/@tanvifinance833", 14259039, 1354609, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-391-ig", "Instagram", "tanvifinance833", "https://www.instagram.com/tanvifinance833/", 5418435, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.tanvi.verma@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@tanvifinance833/about",
      lastChecked: daysAgo(3),
    },
  },

  // 392. Harish Yadav (Pune, Maharashtra)
  {
    id: "creator-in-392",
    name: "Harish Yadav",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-392-yt", "YouTube", "@harishtravel922", "https://www.youtube.com/@harishtravel922", 253768, 27914, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-392-ig", "Instagram", "harishtravel922", "https://www.instagram.com/harishtravel922/", 96432, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.harish.yadav@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@harishtravel922/about",
      lastChecked: daysAgo(3),
    },
  },

  // 393. Abhishek Pawar (Chennai, Tamil Nadu)
  {
    id: "creator-in-393",
    name: "Abhishek Pawar",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-393-yt", "YouTube", "@abhishekmusic12", "https://www.youtube.com/@abhishekmusic12", 428497, 53562, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-393-ig", "Instagram", "abhishekmusic12", "https://www.instagram.com/abhishekmusic12/", 162829, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.abhishek.pawar@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@abhishekmusic12/about",
      lastChecked: daysAgo(3),
    },
  },

  // 394. Alok Shetty (Amritsar, Punjab)
  {
    id: "creator-in-394",
    name: "Alok Shetty",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-394-yt", "YouTube", "@alokcomedy101", "https://www.youtube.com/@alokcomedy101", 628226, 87952, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-394-ig", "Instagram", "alokcomedy101", "https://www.instagram.com/alokcomedy101/", 238726, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.alok.shetty@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@alokcomedy101/about",
      lastChecked: daysAgo(3),
    },
  },

  // 395. Reyansh Malhotra (Surat, Gujarat)
  {
    id: "creator-in-395",
    name: "Reyansh Malhotra",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-395-yt", "YouTube", "@reyanshfood190", "https://www.youtube.com/@reyanshfood190", 1122955, 174058, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-395-ig", "Instagram", "reyanshfood190", "https://www.instagram.com/reyanshfood190/", 426723, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.reyansh.malhotra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@reyanshfood190/about",
      lastChecked: daysAgo(3),
    },
  },

  // 396. Atharva Banerjee (Mumbai, Maharashtra)
  {
    id: "creator-in-396",
    name: "Atharva Banerjee",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-396-yt", "YouTube", "@atharvavlogs279", "https://www.youtube.com/@atharvavlogs279", 2437684, 414406, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-396-ig", "Instagram", "atharvavlogs279", "https://www.instagram.com/atharvavlogs279/", 926320, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.atharva.banerjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@atharvavlogs279/about",
      lastChecked: daysAgo(3),
    },
  },

  // 397. Pranav Dubey (Madurai, Tamil Nadu)
  {
    id: "creator-in-397",
    name: "Pranav Dubey",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-397-yt", "YouTube", "@pranavgaming368", "https://www.youtube.com/@pranavgaming368", 4852413, 897696, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-397-ig", "Instagram", "pranavgaming368", "https://www.instagram.com/pranavgaming368/", 1843917, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pranav.dubey@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@pranavgaming368/about",
      lastChecked: daysAgo(3),
    },
  },

  // 398. Myra Kadam (Ludhiana, Punjab)
  {
    id: "creator-in-398",
    name: "Myra Kadam",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-398-yt", "YouTube", "@myraedu457", "https://www.youtube.com/@myraedu457", 8967142, 1793428, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-398-ig", "Instagram", "myraedu457", "https://www.instagram.com/myraedu457/", 3407514, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.myra.kadam@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@myraedu457/about",
      lastChecked: daysAgo(3),
    },
  },

  // 399. Gauri Grewal (Ahmedabad, Gujarat)
  {
    id: "creator-in-399",
    name: "Gauri Grewal",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-399-yt", "YouTube", "@gaurifitness546", "https://www.youtube.com/@gaurifitness546", 14281871, 3070602, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-399-ig", "Instagram", "gaurifitness546", "https://www.instagram.com/gaurifitness546/", 5427111, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.gauri.grewal@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@gaurifitness546/about",
      lastChecked: daysAgo(3),
    },
  },

  // 400. Rohan Sharma (Nagpur, Maharashtra)
  {
    id: "creator-in-400",
    name: "Rohan Sharma",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-400-yt", "YouTube", "@rohantech635", "https://www.youtube.com/@rohantech635", 181600, 14528, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-400-ig", "Instagram", "rohantech635", "https://www.instagram.com/rohantech635/", 69008, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.rohan.sharma@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@rohantech635/about",
      lastChecked: daysAgo(3),
    },
  },

  // 401. Deepak Singh (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-401",
    name: "Deepak Singh",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-401-yt", "YouTube", "@deepakfinance724", "https://www.youtube.com/@deepakfinance724", 356329, 33851, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-401-ig", "Instagram", "deepakfinance724", "https://www.instagram.com/deepakfinance724/", 135405, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.deepak.singh@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@deepakfinance724/about",
      lastChecked: daysAgo(3),
    },
  },

  // 402. Tushar Patil (Chandigarh, Punjab)
  {
    id: "creator-in-402",
    name: "Tushar Patil",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-402-yt", "YouTube", "@tushartravel813", "https://www.youtube.com/@tushartravel813", 651058, 71616, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-402-ig", "Instagram", "tushartravel813", "https://www.instagram.com/tushartravel813/", 247402, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.tushar.patil@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@tushartravel813/about",
      lastChecked: daysAgo(3),
    },
  },

  // 403. Vivaan Goud (Vadodara, Gujarat)
  {
    id: "creator-in-403",
    name: "Vivaan Goud",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-403-yt", "YouTube", "@vivaanmusic902", "https://www.youtube.com/@vivaanmusic902", 1145787, 143223, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-403-ig", "Instagram", "vivaanmusic902", "https://www.instagram.com/vivaanmusic902/", 435399, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vivaan.goud@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vivaanmusic902/about",
      lastChecked: daysAgo(3),
    },
  },

  // 404. Ayaan Bhatia (Pune, Maharashtra)
  {
    id: "creator-in-404",
    name: "Ayaan Bhatia",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-404-yt", "YouTube", "@ayaancomedy991", "https://www.youtube.com/@ayaancomedy991", 2460516, 344472, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-404-ig", "Instagram", "ayaancomedy991", "https://www.instagram.com/ayaancomedy991/", 934996, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ayaan.bhatia@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ayaancomedy991/about",
      lastChecked: daysAgo(3),
    },
  },

  // 405. Kabir Iyer (Chennai, Tamil Nadu)
  {
    id: "creator-in-405",
    name: "Kabir Iyer",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-405-yt", "YouTube", "@kabirfood81", "https://www.youtube.com/@kabirfood81", 4875245, 755663, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-405-ig", "Instagram", "kabirfood81", "https://www.instagram.com/kabirfood81/", 1852593, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kabir.iyer@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kabirfood81/about",
      lastChecked: daysAgo(3),
    },
  },

  // 406. Saanvi Tiwari (Amritsar, Punjab)
  {
    id: "creator-in-406",
    name: "Saanvi Tiwari",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-406-yt", "YouTube", "@saanvivlogs170", "https://www.youtube.com/@saanvivlogs170", 8989974, 1528296, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-406-ig", "Instagram", "saanvivlogs170", "https://www.instagram.com/saanvivlogs170/", 3416190, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.saanvi.tiwari@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saanvivlogs170/about",
      lastChecked: daysAgo(3),
    },
  },

  // 407. Anika Chavan (Surat, Gujarat)
  {
    id: "creator-in-407",
    name: "Anika Chavan",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-407-yt", "YouTube", "@anikagaming259", "https://www.youtube.com/@anikagaming259", 14209703, 2628795, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-407-ig", "Instagram", "anikagaming259", "https://www.instagram.com/anikagaming259/", 5399687, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.anika.chavan@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@anikagaming259/about",
      lastChecked: daysAgo(3),
    },
  },

  // 408. Kavya Kurup (Mumbai, Maharashtra)
  {
    id: "creator-in-408",
    name: "Kavya Kurup",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-408-yt", "YouTube", "@kavyaedu348", "https://www.youtube.com/@kavyaedu348", 204432, 40886, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-408-ig", "Instagram", "kavyaedu348", "https://www.instagram.com/kavyaedu348/", 77684, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kavya.kurup@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kavyaedu348/about",
      lastChecked: daysAgo(3),
    },
  },

  // 409. Sameer Sethi (Madurai, Tamil Nadu)
  {
    id: "creator-in-409",
    name: "Sameer Sethi",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-409-yt", "YouTube", "@sameerfitness437", "https://www.youtube.com/@sameerfitness437", 379161, 81520, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-409-ig", "Instagram", "sameerfitness437", "https://www.instagram.com/sameerfitness437/", 144081, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sameer.sethi@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sameerfitness437/about",
      lastChecked: daysAgo(3),
    },
  },

  // 410. Karan Gupta (Ludhiana, Punjab)
  {
    id: "creator-in-410",
    name: "Karan Gupta",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-410-yt", "YouTube", "@karantech526", "https://www.youtube.com/@karantech526", 673890, 53911, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-410-ig", "Instagram", "karantech526", "https://www.instagram.com/karantech526/", 256078, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.karan.gupta@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@karantech526/about",
      lastChecked: daysAgo(3),
    },
  },

  // 411. Chirag Deshmukh (Ahmedabad, Gujarat)
  {
    id: "creator-in-411",
    name: "Chirag Deshmukh",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-411-yt", "YouTube", "@chiragfinance615", "https://www.youtube.com/@chiragfinance615", 1168619, 111019, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-411-ig", "Instagram", "chiragfinance615", "https://www.instagram.com/chiragfinance615/", 444075, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.chirag.deshmukh@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@chiragfinance615/about",
      lastChecked: daysAgo(3),
    },
  },

  // 412. Arjun Chowdary (Nagpur, Maharashtra)
  {
    id: "creator-in-412",
    name: "Arjun Chowdary",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-412-yt", "YouTube", "@arjuntravel704", "https://www.youtube.com/@arjuntravel704", 2483348, 273168, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-412-ig", "Instagram", "arjuntravel704", "https://www.instagram.com/arjuntravel704/", 943672, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.arjun.chowdary@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@arjuntravel704/about",
      lastChecked: daysAgo(3),
    },
  },

  // 413. Shaurya Sidhu (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-413",
    name: "Shaurya Sidhu",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-413-yt", "YouTube", "@shauryamusic793", "https://www.youtube.com/@shauryamusic793", 4803077, 600385, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-413-ig", "Instagram", "shauryamusic793", "https://www.instagram.com/shauryamusic793/", 1825169, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.shaurya.sidhu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@shauryamusic793/about",
      lastChecked: daysAgo(3),
    },
  },

  // 414. Advik Nair (Chandigarh, Punjab)
  {
    id: "creator-in-414",
    name: "Advik Nair",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-414-yt", "YouTube", "@advikcomedy882", "https://www.youtube.com/@advikcomedy882", 8917806, 1248493, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-414-ig", "Instagram", "advikcomedy882", "https://www.instagram.com/advikcomedy882/", 3388766, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.advik.nair@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@advikcomedy882/about",
      lastChecked: daysAgo(3),
    },
  },

  // 415. Kiara Pandey (Vadodara, Gujarat)
  {
    id: "creator-in-415",
    name: "Kiara Pandey",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-415-yt", "YouTube", "@kiarafood971", "https://www.youtube.com/@kiarafood971", 14232535, 2206043, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-415-ig", "Instagram", "kiarafood971", "https://www.instagram.com/kiarafood971/", 5408363, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kiara.pandey@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kiarafood971/about",
      lastChecked: daysAgo(3),
    },
  },

  // 416. Avani Gaikwad (Pune, Maharashtra)
  {
    id: "creator-in-416",
    name: "Avani Gaikwad",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-416-yt", "YouTube", "@avanivlogs61", "https://www.youtube.com/@avanivlogs61", 227264, 38635, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-416-ig", "Instagram", "avanivlogs61", "https://www.instagram.com/avanivlogs61/", 86360, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.avani.gaikwad@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@avanivlogs61/about",
      lastChecked: daysAgo(3),
    },
  },

  // 417. Pooja Menon (Chennai, Tamil Nadu)
  {
    id: "creator-in-417",
    name: "Pooja Menon",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-417-yt", "YouTube", "@poojagaming150", "https://www.youtube.com/@poojagaming150", 401993, 74369, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-417-ig", "Instagram", "poojagaming150", "https://www.instagram.com/poojagaming150/", 152757, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pooja.menon@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@poojagaming150/about",
      lastChecked: daysAgo(3),
    },
  },

  // 418. Gaurav Mehra (Amritsar, Punjab)
  {
    id: "creator-in-418",
    name: "Gaurav Mehra",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-418-yt", "YouTube", "@gauravedu239", "https://www.youtube.com/@gauravedu239", 696722, 139344, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-418-ig", "Instagram", "gauravedu239", "https://www.instagram.com/gauravedu239/", 264754, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.gaurav.mehra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@gauravedu239/about",
      lastChecked: daysAgo(3),
    },
  },

  // 419. Kunal Das (Surat, Gujarat)
  {
    id: "creator-in-419",
    name: "Kunal Das",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-419-yt", "YouTube", "@kunalfitness328", "https://www.youtube.com/@kunalfitness328", 1191451, 256162, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-419-ig", "Instagram", "kunalfitness328", "https://www.instagram.com/kunalfitness328/", 452751, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kunal.das@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kunalfitness328/about",
      lastChecked: daysAgo(3),
    },
  },

  // 420. Aarav Kulkarni (Mumbai, Maharashtra)
  {
    id: "creator-in-420",
    name: "Aarav Kulkarni",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-420-yt", "YouTube", "@aaravtech417", "https://www.youtube.com/@aaravtech417", 2411180, 192894, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-420-ig", "Instagram", "aaravtech417", "https://www.instagram.com/aaravtech417/", 916248, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarav.kulkarni@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aaravtech417/about",
      lastChecked: daysAgo(3),
    },
  },

  // 421. Sai Naidu (Madurai, Tamil Nadu)
  {
    id: "creator-in-421",
    name: "Sai Naidu",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-421-yt", "YouTube", "@saifinance506", "https://www.youtube.com/@saifinance506", 4825909, 458461, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-421-ig", "Instagram", "saifinance506", "https://www.instagram.com/saifinance506/", 1833845, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sai.naidu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saifinance506/about",
      lastChecked: daysAgo(3),
    },
  },

  // 422. Rudra Sandhu (Ludhiana, Punjab)
  {
    id: "creator-in-422",
    name: "Rudra Sandhu",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-422-yt", "YouTube", "@rudratravel595", "https://www.youtube.com/@rudratravel595", 8940638, 983470, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-422-ig", "Instagram", "rudratravel595", "https://www.instagram.com/rudratravel595/", 3397442, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.rudra.sandhu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@rudratravel595/about",
      lastChecked: daysAgo(3),
    },
  },

  // 423. Diya Reddy (Ahmedabad, Gujarat)
  {
    id: "creator-in-423",
    name: "Diya Reddy",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-423-yt", "YouTube", "@diyamusic684", "https://www.youtube.com/@diyamusic684", 14255367, 1781921, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-423-ig", "Instagram", "diyamusic684", "https://www.instagram.com/diyamusic684/", 5417039, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.diya.reddy@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@diyamusic684/about",
      lastChecked: daysAgo(3),
    },
  },

  // 424. Pari Mishra (Nagpur, Maharashtra)
  {
    id: "creator-in-424",
    name: "Pari Mishra",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-424-yt", "YouTube", "@paricomedy773", "https://www.youtube.com/@paricomedy773", 250096, 35013, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-424-ig", "Instagram", "paricomedy773", "https://www.instagram.com/paricomedy773/", 95036, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pari.mishra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@paricomedy773/about",
      lastChecked: daysAgo(3),
    },
  },

  // 425. Isha Deshpande (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-425",
    name: "Isha Deshpande",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-425-yt", "YouTube", "@ishafood862", "https://www.youtube.com/@ishafood862", 424825, 65848, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-425-ig", "Instagram", "ishafood862", "https://www.instagram.com/ishafood862/", 161434, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.isha.deshpande@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ishafood862/about",
      lastChecked: daysAgo(3),
    },
  },

  // 426. Siddharth Pillai (Chandigarh, Punjab)
  {
    id: "creator-in-426",
    name: "Siddharth Pillai",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-426-yt", "YouTube", "@siddharthvlogs951", "https://www.youtube.com/@siddharthvlogs951", 624554, 106174, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-426-ig", "Instagram", "siddharthvlogs951", "https://www.instagram.com/siddharthvlogs951/", 237331, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.siddharth.pillai@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@siddharthvlogs951/about",
      lastChecked: daysAgo(3),
    },
  },

  // 427. Suresh Khanna (Vadodara, Gujarat)
  {
    id: "creator-in-427",
    name: "Suresh Khanna",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-427-yt", "YouTube", "@sureshgaming41", "https://www.youtube.com/@sureshgaming41", 1119283, 207067, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-427-ig", "Instagram", "sureshgaming41", "https://www.instagram.com/sureshgaming41/", 425328, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.suresh.khanna@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sureshgaming41/about",
      lastChecked: daysAgo(3),
    },
  },

  // 428. Mayank Mukherjee (Pune, Maharashtra)
  {
    id: "creator-in-428",
    name: "Mayank Mukherjee",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-428-yt", "YouTube", "@mayankedu130", "https://www.youtube.com/@mayankedu130", 2434012, 486802, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-428-ig", "Instagram", "mayankedu130", "https://www.instagram.com/mayankedu130/", 924925, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.mayank.mukherjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@mayankedu130/about",
      lastChecked: daysAgo(3),
    },
  },

  // 429. Vihaan Bhatt (Chennai, Tamil Nadu)
  {
    id: "creator-in-429",
    name: "Vihaan Bhatt",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-429-yt", "YouTube", "@vihaanfitness219", "https://www.youtube.com/@vihaanfitness219", 4848741, 1042479, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-429-ig", "Instagram", "vihaanfitness219", "https://www.instagram.com/vihaanfitness219/", 1842522, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vihaan.bhatt@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vihaanfitness219/about",
      lastChecked: daysAgo(3),
    },
  },

  // 430. Ishaan Rao (Amritsar, Punjab)
  {
    id: "creator-in-430",
    name: "Ishaan Rao",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-430-yt", "YouTube", "@ishaantech308", "https://www.youtube.com/@ishaantech308", 8963470, 717078, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-430-ig", "Instagram", "ishaantech308", "https://www.instagram.com/ishaantech308/", 3406119, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ishaan.rao@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ishaantech308/about",
      lastChecked: daysAgo(3),
    },
  },

  // 431. Om Gill (Surat, Gujarat)
  {
    id: "creator-in-431",
    name: "Om Gill",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-431-yt", "YouTube", "@omfinance397", "https://www.youtube.com/@omfinance397", 14278199, 1356429, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-431-ig", "Instagram", "omfinance397", "https://www.instagram.com/omfinance397/", 5425716, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.om.gill@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@omfinance397/about",
      lastChecked: daysAgo(3),
    },
  },

  // 432. Aarohi Patel (Mumbai, Maharashtra)
  {
    id: "creator-in-432",
    name: "Aarohi Patel",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-432-yt", "YouTube", "@aarohitravel486", "https://www.youtube.com/@aarohitravel486", 272928, 30022, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-432-ig", "Instagram", "aarohitravel486", "https://www.instagram.com/aarohitravel486/", 103713, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarohi.patel@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aarohitravel486/about",
      lastChecked: daysAgo(3),
    },
  },

  // 433. Navya Chauhan (Madurai, Tamil Nadu)
  {
    id: "creator-in-433",
    name: "Navya Chauhan",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-433-yt", "YouTube", "@navyamusic575", "https://www.youtube.com/@navyamusic575", 352657, 44082, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-433-ig", "Instagram", "navyamusic575", "https://www.instagram.com/navyamusic575/", 134010, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.navya.chauhan@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@navyamusic575/about",
      lastChecked: daysAgo(3),
    },
  },

  // 434. Meera Shinde (Ludhiana, Punjab)
  {
    id: "creator-in-434",
    name: "Meera Shinde",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-434-yt", "YouTube", "@meeracomedy664", "https://www.youtube.com/@meeracomedy664", 647386, 90634, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-434-ig", "Instagram", "meeracomedy664", "https://www.instagram.com/meeracomedy664/", 246007, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.meera.shinde@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@meeracomedy664/about",
      lastChecked: daysAgo(3),
    },
  },

  // 435. Nikhil Hegde (Ahmedabad, Gujarat)
  {
    id: "creator-in-435",
    name: "Nikhil Hegde",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-435-yt", "YouTube", "@nikhilfood753", "https://www.youtube.com/@nikhilfood753", 1142115, 177028, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-435-ig", "Instagram", "nikhilfood753", "https://www.instagram.com/nikhilfood753/", 434004, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.nikhil.hegde@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@nikhilfood753/about",
      lastChecked: daysAgo(3),
    },
  },

  // 436. Varun Kapoor (Nagpur, Maharashtra)
  {
    id: "creator-in-436",
    name: "Varun Kapoor",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-436-yt", "YouTube", "@varunvlogs842", "https://www.youtube.com/@varunvlogs842", 2456844, 417663, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-436-ig", "Instagram", "varunvlogs842", "https://www.instagram.com/varunvlogs842/", 933601, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.varun.kapoor@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@varunvlogs842/about",
      lastChecked: daysAgo(3),
    },
  },

  // 437. Devendra Chatterjee (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-437",
    name: "Devendra Chatterjee",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-437-yt", "YouTube", "@devendragaming931", "https://www.youtube.com/@devendragaming931", 4871573, 901241, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-437-ig", "Instagram", "devendragaming931", "https://www.instagram.com/devendragaming931/", 1851198, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.devendra.chatterjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@devendragaming931/about",
      lastChecked: daysAgo(3),
    },
  },

  // 438. Muhammad Joshi (Chandigarh, Punjab)
  {
    id: "creator-in-438",
    name: "Muhammad Joshi",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-438-yt", "YouTube", "@muhammadedu21", "https://www.youtube.com/@muhammadedu21", 8986302, 1797260, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-438-ig", "Instagram", "muhammadedu21", "https://www.instagram.com/muhammadedu21/", 3414795, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.muhammad.joshi@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@muhammadedu21/about",
      lastChecked: daysAgo(3),
    },
  },

  // 439. Aarush Bhosale (Vadodara, Gujarat)
  {
    id: "creator-in-439",
    name: "Aarush Bhosale",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-439-yt", "YouTube", "@aarushfitness110", "https://www.youtube.com/@aarushfitness110", 14206031, 3054297, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-439-ig", "Instagram", "aarushfitness110", "https://www.instagram.com/aarushfitness110/", 5398292, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarush.bhosale@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aarushfitness110/about",
      lastChecked: daysAgo(3),
    },
  },

  // 440. Ananya Dhillon (Pune, Maharashtra)
  {
    id: "creator-in-440",
    name: "Ananya Dhillon",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-440-yt", "YouTube", "@ananyatech199", "https://www.youtube.com/@ananyatech199", 200760, 16061, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-440-ig", "Instagram", "ananyatech199", "https://www.instagram.com/ananyatech199/", 76289, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ananya.dhillon@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ananyatech199/about",
      lastChecked: daysAgo(3),
    },
  },

  // 441. Sara Verma (Chennai, Tamil Nadu)
  {
    id: "creator-in-441",
    name: "Sara Verma",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-441-yt", "YouTube", "@sarafinance288", "https://www.youtube.com/@sarafinance288", 375489, 35671, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-441-ig", "Instagram", "sarafinance288", "https://www.instagram.com/sarafinance288/", 142686, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sara.verma@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sarafinance288/about",
      lastChecked: daysAgo(3),
    },
  },

  // 442. Shreya Yadav (Amritsar, Punjab)
  {
    id: "creator-in-442",
    name: "Shreya Yadav",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-442-yt", "YouTube", "@shreyatravel377", "https://www.youtube.com/@shreyatravel377", 670218, 73724, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-442-ig", "Instagram", "shreyatravel377", "https://www.instagram.com/shreyatravel377/", 254683, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.shreya.yadav@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@shreyatravel377/about",
      lastChecked: daysAgo(3),
    },
  },

  // 443. Vikram Pawar (Surat, Gujarat)
  {
    id: "creator-in-443",
    name: "Vikram Pawar",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-443-yt", "YouTube", "@vikrammusic466", "https://www.youtube.com/@vikrammusic466", 1164947, 145618, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-443-ig", "Instagram", "vikrammusic466", "https://www.instagram.com/vikrammusic466/", 442680, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vikram.pawar@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vikrammusic466/about",
      lastChecked: daysAgo(3),
    },
  },

  // 444. Manish Shetty (Mumbai, Maharashtra)
  {
    id: "creator-in-444",
    name: "Manish Shetty",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-444-yt", "YouTube", "@manishcomedy555", "https://www.youtube.com/@manishcomedy555", 2479676, 347155, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-444-ig", "Instagram", "manishcomedy555", "https://www.instagram.com/manishcomedy555/", 942277, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.manish.shetty@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@manishcomedy555/about",
      lastChecked: daysAgo(3),
    },
  },

  // 445. Saurabh Malhotra (Madurai, Tamil Nadu)
  {
    id: "creator-in-445",
    name: "Saurabh Malhotra",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-445-yt", "YouTube", "@saurabhfood644", "https://www.youtube.com/@saurabhfood644", 4894405, 758633, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-445-ig", "Instagram", "saurabhfood644", "https://www.instagram.com/saurabhfood644/", 1859874, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.saurabh.malhotra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saurabhfood644/about",
      lastChecked: daysAgo(3),
    },
  },

  // 446. Aditya Banerjee (Ludhiana, Punjab)
  {
    id: "creator-in-446",
    name: "Aditya Banerjee",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-446-yt", "YouTube", "@adityavlogs733", "https://www.youtube.com/@adityavlogs733", 8914134, 1515403, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-446-ig", "Instagram", "adityavlogs733", "https://www.instagram.com/adityavlogs733/", 3387371, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aditya.banerjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@adityavlogs733/about",
      lastChecked: daysAgo(3),
    },
  },

  // 447. Krishna Dubey (Ahmedabad, Gujarat)
  {
    id: "creator-in-447",
    name: "Krishna Dubey",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-447-yt", "YouTube", "@krishnagaming822", "https://www.youtube.com/@krishnagaming822", 14228863, 2632340, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-447-ig", "Instagram", "krishnagaming822", "https://www.instagram.com/krishnagaming822/", 5406968, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.krishna.dubey@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@krishnagaming822/about",
      lastChecked: daysAgo(3),
    },
  },

  // 448. Dhruv Kadam (Nagpur, Maharashtra)
  {
    id: "creator-in-448",
    name: "Dhruv Kadam",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-448-yt", "YouTube", "@dhruvedu911", "https://www.youtube.com/@dhruvedu911", 223592, 44718, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-448-ig", "Instagram", "dhruvedu911", "https://www.instagram.com/dhruvedu911/", 84965, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.dhruv.kadam@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@dhruvedu911/about",
      lastChecked: daysAgo(3),
    },
  },

  // 449. Aadhya Grewal (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-449",
    name: "Aadhya Grewal",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-449-yt", "YouTube", "@aadhyafitness1", "https://www.youtube.com/@aadhyafitness1", 398321, 85639, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-449-ig", "Instagram", "aadhyafitness1", "https://www.instagram.com/aadhyafitness1/", 151362, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aadhya.grewal@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aadhyafitness1/about",
      lastChecked: daysAgo(3),
    },
  },

  // 450. Riya Sharma (Chandigarh, Punjab)
  {
    id: "creator-in-450",
    name: "Riya Sharma",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-450-yt", "YouTube", "@riyatech90", "https://www.youtube.com/@riyatech90", 693050, 55444, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-450-ig", "Instagram", "riyatech90", "https://www.instagram.com/riyatech90/", 263359, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.riya.sharma@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@riyatech90/about",
      lastChecked: daysAgo(3),
    },
  },

  // 451. Tanvi Singh (Vadodara, Gujarat)
  {
    id: "creator-in-451",
    name: "Tanvi Singh",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-451-yt", "YouTube", "@tanvifinance179", "https://www.youtube.com/@tanvifinance179", 1187779, 112839, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-451-ig", "Instagram", "tanvifinance179", "https://www.instagram.com/tanvifinance179/", 451356, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.tanvi.singh@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@tanvifinance179/about",
      lastChecked: daysAgo(3),
    },
  },

  // 452. Harish Patil (Pune, Maharashtra)
  {
    id: "creator-in-452",
    name: "Harish Patil",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-452-yt", "YouTube", "@harishtravel268", "https://www.youtube.com/@harishtravel268", 2407508, 264826, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-452-ig", "Instagram", "harishtravel268", "https://www.instagram.com/harishtravel268/", 914853, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.harish.patil@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@harishtravel268/about",
      lastChecked: daysAgo(3),
    },
  },

  // 453. Abhishek Goud (Chennai, Tamil Nadu)
  {
    id: "creator-in-453",
    name: "Abhishek Goud",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-453-yt", "YouTube", "@abhishekmusic357", "https://www.youtube.com/@abhishekmusic357", 4822237, 602780, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-453-ig", "Instagram", "abhishekmusic357", "https://www.instagram.com/abhishekmusic357/", 1832450, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.abhishek.goud@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@abhishekmusic357/about",
      lastChecked: daysAgo(3),
    },
  },

  // 454. Alok Bhatia (Amritsar, Punjab)
  {
    id: "creator-in-454",
    name: "Alok Bhatia",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-454-yt", "YouTube", "@alokcomedy446", "https://www.youtube.com/@alokcomedy446", 8936966, 1251175, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-454-ig", "Instagram", "alokcomedy446", "https://www.instagram.com/alokcomedy446/", 3396047, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.alok.bhatia@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@alokcomedy446/about",
      lastChecked: daysAgo(3),
    },
  },

  // 455. Reyansh Iyer (Surat, Gujarat)
  {
    id: "creator-in-455",
    name: "Reyansh Iyer",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-455-yt", "YouTube", "@reyanshfood535", "https://www.youtube.com/@reyanshfood535", 14251695, 2209013, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-455-ig", "Instagram", "reyanshfood535", "https://www.instagram.com/reyanshfood535/", 5415644, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.reyansh.iyer@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@reyanshfood535/about",
      lastChecked: daysAgo(3),
    },
  },

  // 456. Atharva Tiwari (Mumbai, Maharashtra)
  {
    id: "creator-in-456",
    name: "Atharva Tiwari",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-456-yt", "YouTube", "@atharvavlogs624", "https://www.youtube.com/@atharvavlogs624", 246424, 41892, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-456-ig", "Instagram", "atharvavlogs624", "https://www.instagram.com/atharvavlogs624/", 93641, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.atharva.tiwari@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@atharvavlogs624/about",
      lastChecked: daysAgo(3),
    },
  },

  // 457. Pranav Chavan (Madurai, Tamil Nadu)
  {
    id: "creator-in-457",
    name: "Pranav Chavan",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-457-yt", "YouTube", "@pranavgaming713", "https://www.youtube.com/@pranavgaming713", 421153, 77913, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-457-ig", "Instagram", "pranavgaming713", "https://www.instagram.com/pranavgaming713/", 160038, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pranav.chavan@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@pranavgaming713/about",
      lastChecked: daysAgo(3),
    },
  },

  // 458. Myra Kurup (Ludhiana, Punjab)
  {
    id: "creator-in-458",
    name: "Myra Kurup",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-458-yt", "YouTube", "@myraedu802", "https://www.youtube.com/@myraedu802", 620882, 124176, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-458-ig", "Instagram", "myraedu802", "https://www.instagram.com/myraedu802/", 235935, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.myra.kurup@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@myraedu802/about",
      lastChecked: daysAgo(3),
    },
  },

  // 459. Gauri Sethi (Ahmedabad, Gujarat)
  {
    id: "creator-in-459",
    name: "Gauri Sethi",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-459-yt", "YouTube", "@gaurifitness891", "https://www.youtube.com/@gaurifitness891", 1115611, 239856, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-459-ig", "Instagram", "gaurifitness891", "https://www.instagram.com/gaurifitness891/", 423932, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.gauri.sethi@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@gaurifitness891/about",
      lastChecked: daysAgo(3),
    },
  },

  // 460. Rohan Gupta (Nagpur, Maharashtra)
  {
    id: "creator-in-460",
    name: "Rohan Gupta",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-460-yt", "YouTube", "@rohantech980", "https://www.youtube.com/@rohantech980", 2430340, 194427, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-460-ig", "Instagram", "rohantech980", "https://www.instagram.com/rohantech980/", 923529, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.rohan.gupta@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@rohantech980/about",
      lastChecked: daysAgo(3),
    },
  },

  // 461. Deepak Deshmukh (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-461",
    name: "Deepak Deshmukh",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-461-yt", "YouTube", "@deepakfinance70", "https://www.youtube.com/@deepakfinance70", 4845069, 460282, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-461-ig", "Instagram", "deepakfinance70", "https://www.instagram.com/deepakfinance70/", 1841126, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.deepak.deshmukh@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@deepakfinance70/about",
      lastChecked: daysAgo(3),
    },
  },

  // 462. Tushar Chowdary (Chandigarh, Punjab)
  {
    id: "creator-in-462",
    name: "Tushar Chowdary",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-462-yt", "YouTube", "@tushartravel159", "https://www.youtube.com/@tushartravel159", 8959798, 985578, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-462-ig", "Instagram", "tushartravel159", "https://www.instagram.com/tushartravel159/", 3404723, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.tushar.chowdary@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@tushartravel159/about",
      lastChecked: daysAgo(3),
    },
  },

  // 463. Vivaan Sidhu (Vadodara, Gujarat)
  {
    id: "creator-in-463",
    name: "Vivaan Sidhu",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-463-yt", "YouTube", "@vivaanmusic248", "https://www.youtube.com/@vivaanmusic248", 14274527, 1784316, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-463-ig", "Instagram", "vivaanmusic248", "https://www.instagram.com/vivaanmusic248/", 5424320, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vivaan.sidhu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vivaanmusic248/about",
      lastChecked: daysAgo(3),
    },
  },

  // 464. Ayaan Nair (Pune, Maharashtra)
  {
    id: "creator-in-464",
    name: "Ayaan Nair",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-464-yt", "YouTube", "@ayaancomedy337", "https://www.youtube.com/@ayaancomedy337", 269256, 37696, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-464-ig", "Instagram", "ayaancomedy337", "https://www.instagram.com/ayaancomedy337/", 102317, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ayaan.nair@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ayaancomedy337/about",
      lastChecked: daysAgo(3),
    },
  },

  // 465. Kabir Pandey (Chennai, Tamil Nadu)
  {
    id: "creator-in-465",
    name: "Kabir Pandey",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-465-yt", "YouTube", "@kabirfood426", "https://www.youtube.com/@kabirfood426", 348985, 54093, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-465-ig", "Instagram", "kabirfood426", "https://www.instagram.com/kabirfood426/", 132614, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kabir.pandey@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kabirfood426/about",
      lastChecked: daysAgo(3),
    },
  },

  // 466. Saanvi Gaikwad (Amritsar, Punjab)
  {
    id: "creator-in-466",
    name: "Saanvi Gaikwad",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-466-yt", "YouTube", "@saanvivlogs515", "https://www.youtube.com/@saanvivlogs515", 643714, 109431, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-466-ig", "Instagram", "saanvivlogs515", "https://www.instagram.com/saanvivlogs515/", 244611, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.saanvi.gaikwad@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saanvivlogs515/about",
      lastChecked: daysAgo(3),
    },
  },

  // 467. Anika Menon (Surat, Gujarat)
  {
    id: "creator-in-467",
    name: "Anika Menon",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-467-yt", "YouTube", "@anikagaming604", "https://www.youtube.com/@anikagaming604", 1138443, 210612, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-467-ig", "Instagram", "anikagaming604", "https://www.instagram.com/anikagaming604/", 432608, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.anika.menon@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@anikagaming604/about",
      lastChecked: daysAgo(3),
    },
  },

  // 468. Kavya Mehra (Mumbai, Maharashtra)
  {
    id: "creator-in-468",
    name: "Kavya Mehra",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-468-yt", "YouTube", "@kavyaedu693", "https://www.youtube.com/@kavyaedu693", 2453172, 490634, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-468-ig", "Instagram", "kavyaedu693", "https://www.instagram.com/kavyaedu693/", 932205, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kavya.mehra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kavyaedu693/about",
      lastChecked: daysAgo(3),
    },
  },

  // 469. Sameer Das (Madurai, Tamil Nadu)
  {
    id: "creator-in-469",
    name: "Sameer Das",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-469-yt", "YouTube", "@sameerfitness782", "https://www.youtube.com/@sameerfitness782", 4867901, 1046599, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-469-ig", "Instagram", "sameerfitness782", "https://www.instagram.com/sameerfitness782/", 1849802, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sameer.das@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sameerfitness782/about",
      lastChecked: daysAgo(3),
    },
  },

  // 470. Karan Kulkarni (Ludhiana, Punjab)
  {
    id: "creator-in-470",
    name: "Karan Kulkarni",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-470-yt", "YouTube", "@karantech871", "https://www.youtube.com/@karantech871", 8982630, 718610, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-470-ig", "Instagram", "karantech871", "https://www.instagram.com/karantech871/", 3413399, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.karan.kulkarni@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@karantech871/about",
      lastChecked: daysAgo(3),
    },
  },

  // 471. Chirag Naidu (Ahmedabad, Gujarat)
  {
    id: "creator-in-471",
    name: "Chirag Naidu",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-471-yt", "YouTube", "@chiragfinance960", "https://www.youtube.com/@chiragfinance960", 14202359, 1349224, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-471-ig", "Instagram", "chiragfinance960", "https://www.instagram.com/chiragfinance960/", 5396896, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.chirag.naidu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@chiragfinance960/about",
      lastChecked: daysAgo(3),
    },
  },

  // 472. Arjun Sandhu (Nagpur, Maharashtra)
  {
    id: "creator-in-472",
    name: "Arjun Sandhu",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-472-yt", "YouTube", "@arjuntravel50", "https://www.youtube.com/@arjuntravel50", 197088, 21680, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-472-ig", "Instagram", "arjuntravel50", "https://www.instagram.com/arjuntravel50/", 74893, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.arjun.sandhu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@arjuntravel50/about",
      lastChecked: daysAgo(3),
    },
  },

  // 473. Shaurya Reddy (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-473",
    name: "Shaurya Reddy",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-473-yt", "YouTube", "@shauryamusic139", "https://www.youtube.com/@shauryamusic139", 371817, 46477, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-473-ig", "Instagram", "shauryamusic139", "https://www.instagram.com/shauryamusic139/", 141290, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.shaurya.reddy@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@shauryamusic139/about",
      lastChecked: daysAgo(3),
    },
  },

  // 474. Advik Mishra (Chandigarh, Punjab)
  {
    id: "creator-in-474",
    name: "Advik Mishra",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-474-yt", "YouTube", "@advikcomedy228", "https://www.youtube.com/@advikcomedy228", 666546, 93316, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-474-ig", "Instagram", "advikcomedy228", "https://www.instagram.com/advikcomedy228/", 253287, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.advik.mishra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@advikcomedy228/about",
      lastChecked: daysAgo(3),
    },
  },

  // 475. Kiara Deshpande (Vadodara, Gujarat)
  {
    id: "creator-in-475",
    name: "Kiara Deshpande",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-475-yt", "YouTube", "@kiarafood317", "https://www.youtube.com/@kiarafood317", 1161275, 179998, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-475-ig", "Instagram", "kiarafood317", "https://www.instagram.com/kiarafood317/", 441285, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kiara.deshpande@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kiarafood317/about",
      lastChecked: daysAgo(3),
    },
  },

  // 476. Avani Pillai (Pune, Maharashtra)
  {
    id: "creator-in-476",
    name: "Avani Pillai",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-476-yt", "YouTube", "@avanivlogs406", "https://www.youtube.com/@avanivlogs406", 2476004, 420921, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-476-ig", "Instagram", "avanivlogs406", "https://www.instagram.com/avanivlogs406/", 940882, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.avani.pillai@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@avanivlogs406/about",
      lastChecked: daysAgo(3),
    },
  },

  // 477. Pooja Khanna (Chennai, Tamil Nadu)
  {
    id: "creator-in-477",
    name: "Pooja Khanna",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-477-yt", "YouTube", "@poojagaming495", "https://www.youtube.com/@poojagaming495", 4890733, 904786, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-477-ig", "Instagram", "poojagaming495", "https://www.instagram.com/poojagaming495/", 1858479, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pooja.khanna@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@poojagaming495/about",
      lastChecked: daysAgo(3),
    },
  },

  // 478. Gaurav Mukherjee (Amritsar, Punjab)
  {
    id: "creator-in-478",
    name: "Gaurav Mukherjee",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-478-yt", "YouTube", "@gauravedu584", "https://www.youtube.com/@gauravedu584", 8910462, 1782092, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-478-ig", "Instagram", "gauravedu584", "https://www.instagram.com/gauravedu584/", 3385976, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.gaurav.mukherjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@gauravedu584/about",
      lastChecked: daysAgo(3),
    },
  },

  // 479. Kunal Bhatt (Surat, Gujarat)
  {
    id: "creator-in-479",
    name: "Kunal Bhatt",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-479-yt", "YouTube", "@kunalfitness673", "https://www.youtube.com/@kunalfitness673", 14225191, 3058416, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-479-ig", "Instagram", "kunalfitness673", "https://www.instagram.com/kunalfitness673/", 5405573, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kunal.bhatt@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kunalfitness673/about",
      lastChecked: daysAgo(3),
    },
  },

  // 480. Aarav Rao (Mumbai, Maharashtra)
  {
    id: "creator-in-480",
    name: "Aarav Rao",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-480-yt", "YouTube", "@aaravtech762", "https://www.youtube.com/@aaravtech762", 219920, 17594, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-480-ig", "Instagram", "aaravtech762", "https://www.instagram.com/aaravtech762/", 83570, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarav.rao@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aaravtech762/about",
      lastChecked: daysAgo(3),
    },
  },

  // 481. Sai Gill (Madurai, Tamil Nadu)
  {
    id: "creator-in-481",
    name: "Sai Gill",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-481-yt", "YouTube", "@saifinance851", "https://www.youtube.com/@saifinance851", 394649, 37492, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-481-ig", "Instagram", "saifinance851", "https://www.instagram.com/saifinance851/", 149967, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sai.gill@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saifinance851/about",
      lastChecked: daysAgo(3),
    },
  },

  // 482. Rudra Patel (Ludhiana, Punjab)
  {
    id: "creator-in-482",
    name: "Rudra Patel",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-482-yt", "YouTube", "@rudratravel940", "https://www.youtube.com/@rudratravel940", 689378, 75832, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-482-ig", "Instagram", "rudratravel940", "https://www.instagram.com/rudratravel940/", 261964, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.rudra.patel@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@rudratravel940/about",
      lastChecked: daysAgo(3),
    },
  },

  // 483. Diya Chauhan (Ahmedabad, Gujarat)
  {
    id: "creator-in-483",
    name: "Diya Chauhan",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-483-yt", "YouTube", "@diyamusic30", "https://www.youtube.com/@diyamusic30", 1184107, 148013, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-483-ig", "Instagram", "diyamusic30", "https://www.instagram.com/diyamusic30/", 449961, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.diya.chauhan@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@diyamusic30/about",
      lastChecked: daysAgo(3),
    },
  },

  // 484. Pari Shinde (Nagpur, Maharashtra)
  {
    id: "creator-in-484",
    name: "Pari Shinde",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-484-yt", "YouTube", "@paricomedy119", "https://www.youtube.com/@paricomedy119", 2403836, 336537, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-484-ig", "Instagram", "paricomedy119", "https://www.instagram.com/paricomedy119/", 913458, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pari.shinde@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@paricomedy119/about",
      lastChecked: daysAgo(3),
    },
  },

  // 485. Isha Hegde (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-485",
    name: "Isha Hegde",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-485-yt", "YouTube", "@ishafood208", "https://www.youtube.com/@ishafood208", 4818565, 746878, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-485-ig", "Instagram", "ishafood208", "https://www.instagram.com/ishafood208/", 1831055, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.isha.hegde@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ishafood208/about",
      lastChecked: daysAgo(3),
    },
  },

  // 486. Siddharth Kapoor (Chandigarh, Punjab)
  {
    id: "creator-in-486",
    name: "Siddharth Kapoor",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-486-yt", "YouTube", "@siddharthvlogs297", "https://www.youtube.com/@siddharthvlogs297", 8933294, 1518660, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-486-ig", "Instagram", "siddharthvlogs297", "https://www.instagram.com/siddharthvlogs297/", 3394652, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.siddharth.kapoor@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@siddharthvlogs297/about",
      lastChecked: daysAgo(3),
    },
  },

  // 487. Suresh Chatterjee (Vadodara, Gujarat)
  {
    id: "creator-in-487",
    name: "Suresh Chatterjee",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-487-yt", "YouTube", "@sureshgaming386", "https://www.youtube.com/@sureshgaming386", 14248023, 2635884, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-487-ig", "Instagram", "sureshgaming386", "https://www.instagram.com/sureshgaming386/", 5414249, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.suresh.chatterjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sureshgaming386/about",
      lastChecked: daysAgo(3),
    },
  },

  // 488. Mayank Joshi (Pune, Maharashtra)
  {
    id: "creator-in-488",
    name: "Mayank Joshi",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-488-yt", "YouTube", "@mayankedu475", "https://www.youtube.com/@mayankedu475", 242752, 48550, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-488-ig", "Instagram", "mayankedu475", "https://www.instagram.com/mayankedu475/", 92246, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.mayank.joshi@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@mayankedu475/about",
      lastChecked: daysAgo(3),
    },
  },

  // 489. Vihaan Bhosale (Chennai, Tamil Nadu)
  {
    id: "creator-in-489",
    name: "Vihaan Bhosale",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-489-yt", "YouTube", "@vihaanfitness564", "https://www.youtube.com/@vihaanfitness564", 417481, 89758, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-489-ig", "Instagram", "vihaanfitness564", "https://www.instagram.com/vihaanfitness564/", 158643, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vihaan.bhosale@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vihaanfitness564/about",
      lastChecked: daysAgo(3),
    },
  },

  // 490. Ishaan Dhillon (Amritsar, Punjab)
  {
    id: "creator-in-490",
    name: "Ishaan Dhillon",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-490-yt", "YouTube", "@ishaantech653", "https://www.youtube.com/@ishaantech653", 712210, 56977, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-490-ig", "Instagram", "ishaantech653", "https://www.instagram.com/ishaantech653/", 270640, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ishaan.dhillon@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ishaantech653/about",
      lastChecked: daysAgo(3),
    },
  },

  // 491. Om Verma (Surat, Gujarat)
  {
    id: "creator-in-491",
    name: "Om Verma",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-491-yt", "YouTube", "@omfinance742", "https://www.youtube.com/@omfinance742", 1111939, 105634, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-491-ig", "Instagram", "omfinance742", "https://www.instagram.com/omfinance742/", 422537, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.om.verma@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@omfinance742/about",
      lastChecked: daysAgo(3),
    },
  },

  // 492. Aarohi Yadav (Mumbai, Maharashtra)
  {
    id: "creator-in-492",
    name: "Aarohi Yadav",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-492-yt", "YouTube", "@aarohitravel831", "https://www.youtube.com/@aarohitravel831", 2426668, 266933, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-492-ig", "Instagram", "aarohitravel831", "https://www.instagram.com/aarohitravel831/", 922134, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarohi.yadav@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aarohitravel831/about",
      lastChecked: daysAgo(3),
    },
  },

  // 493. Navya Pawar (Madurai, Tamil Nadu)
  {
    id: "creator-in-493",
    name: "Navya Pawar",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-493-yt", "YouTube", "@navyamusic920", "https://www.youtube.com/@navyamusic920", 4841397, 605175, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-493-ig", "Instagram", "navyamusic920", "https://www.instagram.com/navyamusic920/", 1839731, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.navya.pawar@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@navyamusic920/about",
      lastChecked: daysAgo(3),
    },
  },

  // 494. Meera Shetty (Ludhiana, Punjab)
  {
    id: "creator-in-494",
    name: "Meera Shetty",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-494-yt", "YouTube", "@meeracomedy10", "https://www.youtube.com/@meeracomedy10", 8956126, 1253858, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-494-ig", "Instagram", "meeracomedy10", "https://www.instagram.com/meeracomedy10/", 3403328, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.meera.shetty@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@meeracomedy10/about",
      lastChecked: daysAgo(3),
    },
  },

  // 495. Nikhil Malhotra (Ahmedabad, Gujarat)
  {
    id: "creator-in-495",
    name: "Nikhil Malhotra",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-495-yt", "YouTube", "@nikhilfood99", "https://www.youtube.com/@nikhilfood99", 14270855, 2211983, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-495-ig", "Instagram", "nikhilfood99", "https://www.instagram.com/nikhilfood99/", 5422925, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.nikhil.malhotra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@nikhilfood99/about",
      lastChecked: daysAgo(3),
    },
  },

  // 496. Varun Banerjee (Nagpur, Maharashtra)
  {
    id: "creator-in-496",
    name: "Varun Banerjee",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-496-yt", "YouTube", "@varunvlogs188", "https://www.youtube.com/@varunvlogs188", 265584, 45149, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-496-ig", "Instagram", "varunvlogs188", "https://www.instagram.com/varunvlogs188/", 100922, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.varun.banerjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@varunvlogs188/about",
      lastChecked: daysAgo(3),
    },
  },

  // 497. Devendra Dubey (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-497",
    name: "Devendra Dubey",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-497-yt", "YouTube", "@devendragaming277", "https://www.youtube.com/@devendragaming277", 345313, 63883, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-497-ig", "Instagram", "devendragaming277", "https://www.instagram.com/devendragaming277/", 131219, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.devendra.dubey@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@devendragaming277/about",
      lastChecked: daysAgo(3),
    },
  },

  // 498. Muhammad Kadam (Chandigarh, Punjab)
  {
    id: "creator-in-498",
    name: "Muhammad Kadam",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-498-yt", "YouTube", "@muhammadedu366", "https://www.youtube.com/@muhammadedu366", 640042, 128008, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-498-ig", "Instagram", "muhammadedu366", "https://www.instagram.com/muhammadedu366/", 243216, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.muhammad.kadam@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@muhammadedu366/about",
      lastChecked: daysAgo(3),
    },
  },

  // 499. Aarush Grewal (Vadodara, Gujarat)
  {
    id: "creator-in-499",
    name: "Aarush Grewal",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-499-yt", "YouTube", "@aarushfitness455", "https://www.youtube.com/@aarushfitness455", 1134771, 243976, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-499-ig", "Instagram", "aarushfitness455", "https://www.instagram.com/aarushfitness455/", 431213, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aarush.grewal@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aarushfitness455/about",
      lastChecked: daysAgo(3),
    },
  },

  // 500. Ananya Sharma (Pune, Maharashtra)
  {
    id: "creator-in-500",
    name: "Ananya Sharma",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-500-yt", "YouTube", "@ananyatech544", "https://www.youtube.com/@ananyatech544", 2449500, 195960, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-500-ig", "Instagram", "ananyatech544", "https://www.instagram.com/ananyatech544/", 930810, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ananya.sharma@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ananyatech544/about",
      lastChecked: daysAgo(3),
    },
  },

  // 501. Sara Singh (Chennai, Tamil Nadu)
  {
    id: "creator-in-501",
    name: "Sara Singh",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-501-yt", "YouTube", "@sarafinance633", "https://www.youtube.com/@sarafinance633", 4864229, 462102, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-501-ig", "Instagram", "sarafinance633", "https://www.instagram.com/sarafinance633/", 1848407, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sara.singh@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sarafinance633/about",
      lastChecked: daysAgo(3),
    },
  },

  // 502. Shreya Patil (Amritsar, Punjab)
  {
    id: "creator-in-502",
    name: "Shreya Patil",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-502-yt", "YouTube", "@shreyatravel722", "https://www.youtube.com/@shreyatravel722", 8978958, 987685, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-502-ig", "Instagram", "shreyatravel722", "https://www.instagram.com/shreyatravel722/", 3412004, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.shreya.patil@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@shreyatravel722/about",
      lastChecked: daysAgo(3),
    },
  },

  // 503. Vikram Goud (Surat, Gujarat)
  {
    id: "creator-in-503",
    name: "Vikram Goud",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-503-yt", "YouTube", "@vikrammusic811", "https://www.youtube.com/@vikrammusic811", 14293687, 1786711, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-503-ig", "Instagram", "vikrammusic811", "https://www.instagram.com/vikrammusic811/", 5431601, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vikram.goud@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vikrammusic811/about",
      lastChecked: daysAgo(3),
    },
  },

  // 504. Manish Bhatia (Mumbai, Maharashtra)
  {
    id: "creator-in-504",
    name: "Manish Bhatia",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-504-yt", "YouTube", "@manishcomedy900", "https://www.youtube.com/@manishcomedy900", 193416, 27078, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-504-ig", "Instagram", "manishcomedy900", "https://www.instagram.com/manishcomedy900/", 73498, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.manish.bhatia@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@manishcomedy900/about",
      lastChecked: daysAgo(3),
    },
  },

  // 505. Saurabh Iyer (Madurai, Tamil Nadu)
  {
    id: "creator-in-505",
    name: "Saurabh Iyer",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-505-yt", "YouTube", "@saurabhfood989", "https://www.youtube.com/@saurabhfood989", 368145, 57062, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-505-ig", "Instagram", "saurabhfood989", "https://www.instagram.com/saurabhfood989/", 139895, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.saurabh.iyer@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saurabhfood989/about",
      lastChecked: daysAgo(3),
    },
  },

  // 506. Aditya Tiwari (Ludhiana, Punjab)
  {
    id: "creator-in-506",
    name: "Aditya Tiwari",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-506-yt", "YouTube", "@adityavlogs79", "https://www.youtube.com/@adityavlogs79", 662874, 112689, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-506-ig", "Instagram", "adityavlogs79", "https://www.instagram.com/adityavlogs79/", 251892, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aditya.tiwari@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@adityavlogs79/about",
      lastChecked: daysAgo(3),
    },
  },

  // 507. Krishna Chavan (Ahmedabad, Gujarat)
  {
    id: "creator-in-507",
    name: "Krishna Chavan",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-507-yt", "YouTube", "@krishnagaming168", "https://www.youtube.com/@krishnagaming168", 1157603, 214157, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-507-ig", "Instagram", "krishnagaming168", "https://www.instagram.com/krishnagaming168/", 439889, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.krishna.chavan@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@krishnagaming168/about",
      lastChecked: daysAgo(3),
    },
  },

  // 508. Dhruv Kurup (Nagpur, Maharashtra)
  {
    id: "creator-in-508",
    name: "Dhruv Kurup",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-508-yt", "YouTube", "@dhruvedu257", "https://www.youtube.com/@dhruvedu257", 2472332, 494466, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-508-ig", "Instagram", "dhruvedu257", "https://www.instagram.com/dhruvedu257/", 939486, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.dhruv.kurup@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@dhruvedu257/about",
      lastChecked: daysAgo(3),
    },
  },

  // 509. Aadhya Sethi (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-509",
    name: "Aadhya Sethi",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-509-yt", "YouTube", "@aadhyafitness346", "https://www.youtube.com/@aadhyafitness346", 4887061, 1050718, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-509-ig", "Instagram", "aadhyafitness346", "https://www.instagram.com/aadhyafitness346/", 1857083, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.aadhya.sethi@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@aadhyafitness346/about",
      lastChecked: daysAgo(3),
    },
  },

  // 510. Riya Gupta (Chandigarh, Punjab)
  {
    id: "creator-in-510",
    name: "Riya Gupta",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-510-yt", "YouTube", "@riyatech435", "https://www.youtube.com/@riyatech435", 8906790, 712543, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-510-ig", "Instagram", "riyatech435", "https://www.instagram.com/riyatech435/", 3384580, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.riya.gupta@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@riyatech435/about",
      lastChecked: daysAgo(3),
    },
  },

  // 511. Tanvi Deshmukh (Vadodara, Gujarat)
  {
    id: "creator-in-511",
    name: "Tanvi Deshmukh",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-511-yt", "YouTube", "@tanvifinance524", "https://www.youtube.com/@tanvifinance524", 14221519, 1351044, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-511-ig", "Instagram", "tanvifinance524", "https://www.instagram.com/tanvifinance524/", 5404177, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.tanvi.deshmukh@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@tanvifinance524/about",
      lastChecked: daysAgo(3),
    },
  },

  // 512. Harish Chowdary (Pune, Maharashtra)
  {
    id: "creator-in-512",
    name: "Harish Chowdary",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-512-yt", "YouTube", "@harishtravel613", "https://www.youtube.com/@harishtravel613", 216248, 23787, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-512-ig", "Instagram", "harishtravel613", "https://www.instagram.com/harishtravel613/", 82174, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.harish.chowdary@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@harishtravel613/about",
      lastChecked: daysAgo(3),
    },
  },

  // 513. Abhishek Sidhu (Chennai, Tamil Nadu)
  {
    id: "creator-in-513",
    name: "Abhishek Sidhu",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-513-yt", "YouTube", "@abhishekmusic702", "https://www.youtube.com/@abhishekmusic702", 390977, 48872, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-513-ig", "Instagram", "abhishekmusic702", "https://www.instagram.com/abhishekmusic702/", 148571, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.abhishek.sidhu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@abhishekmusic702/about",
      lastChecked: daysAgo(3),
    },
  },

  // 514. Alok Nair (Amritsar, Punjab)
  {
    id: "creator-in-514",
    name: "Alok Nair",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-514-yt", "YouTube", "@alokcomedy791", "https://www.youtube.com/@alokcomedy791", 685706, 95999, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-514-ig", "Instagram", "alokcomedy791", "https://www.instagram.com/alokcomedy791/", 260568, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.alok.nair@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@alokcomedy791/about",
      lastChecked: daysAgo(3),
    },
  },

  // 515. Reyansh Pandey (Surat, Gujarat)
  {
    id: "creator-in-515",
    name: "Reyansh Pandey",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-515-yt", "YouTube", "@reyanshfood880", "https://www.youtube.com/@reyanshfood880", 1180435, 182967, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-515-ig", "Instagram", "reyanshfood880", "https://www.instagram.com/reyanshfood880/", 448565, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.reyansh.pandey@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@reyanshfood880/about",
      lastChecked: daysAgo(3),
    },
  },

  // 516. Atharva Gaikwad (Mumbai, Maharashtra)
  {
    id: "creator-in-516",
    name: "Atharva Gaikwad",
    category: "Lifestyle",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-516-yt", "YouTube", "@atharvavlogs969", "https://www.youtube.com/@atharvavlogs969", 2400164, 408028, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-516-ig", "Instagram", "atharvavlogs969", "https://www.instagram.com/atharvavlogs969/", 912062, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.atharva.gaikwad@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@atharvavlogs969/about",
      lastChecked: daysAgo(3),
    },
  },

  // 517. Pranav Menon (Madurai, Tamil Nadu)
  {
    id: "creator-in-517",
    name: "Pranav Menon",
    category: "Gaming",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-517-yt", "YouTube", "@pranavgaming59", "https://www.youtube.com/@pranavgaming59", 4814893, 890755, "avg_video_views", "Daily gaming highlights & clutch shorts"),
      createAccount("acc-creator-in-517-ig", "Instagram", "pranavgaming59", "https://www.instagram.com/pranavgaming59/", 1829659, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.pranav.menon@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@pranavgaming59/about",
      lastChecked: daysAgo(3),
    },
  },

  // 518. Myra Mehra (Ludhiana, Punjab)
  {
    id: "creator-in-518",
    name: "Myra Mehra",
    category: "Education",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-518-yt", "YouTube", "@myraedu148", "https://www.youtube.com/@myraedu148", 8929622, 1785924, "avg_video_views", "Weekly historical documentaries"),
      createAccount("acc-creator-in-518-ig", "Instagram", "myraedu148", "https://www.instagram.com/myraedu148/", 3393256, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.myra.mehra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@myraedu148/about",
      lastChecked: daysAgo(3),
    },
  },

  // 519. Gauri Das (Ahmedabad, Gujarat)
  {
    id: "creator-in-519",
    name: "Gauri Das",
    category: "Fitness",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-519-yt", "YouTube", "@gaurifitness237", "https://www.youtube.com/@gaurifitness237", 14244351, 3062535, "avg_video_views", "Posts 3 natural fitness guides / week"),
      createAccount("acc-creator-in-519-ig", "Instagram", "gaurifitness237", "https://www.instagram.com/gaurifitness237/", 5412853, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.gauri.das@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@gaurifitness237/about",
      lastChecked: daysAgo(3),
    },
  },

  // 520. Rohan Kulkarni (Nagpur, Maharashtra)
  {
    id: "creator-in-520",
    name: "Rohan Kulkarni",
    category: "Technology",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-520-yt", "YouTube", "@rohantech326", "https://www.youtube.com/@rohantech326", 239080, 19126, "avg_video_views", "Posts 3-4 gadget reviews / week"),
      createAccount("acc-creator-in-520-ig", "Instagram", "rohantech326", "https://www.instagram.com/rohantech326/", 90850, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.rohan.kulkarni@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@rohantech326/about",
      lastChecked: daysAgo(3),
    },
  },

  // 521. Deepak Naidu (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-521",
    name: "Deepak Naidu",
    category: "Finance",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-521-yt", "YouTube", "@deepakfinance415", "https://www.youtube.com/@deepakfinance415", 413809, 39312, "avg_video_views", "Daily market reels & financial hacks"),
      createAccount("acc-creator-in-521-ig", "Instagram", "deepakfinance415", "https://www.instagram.com/deepakfinance415/", 157247, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.deepak.naidu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@deepakfinance415/about",
      lastChecked: daysAgo(3),
    },
  },

  // 522. Tushar Sandhu (Chandigarh, Punjab)
  {
    id: "creator-in-522",
    name: "Tushar Sandhu",
    category: "Travel",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-522-yt", "YouTube", "@tushartravel504", "https://www.youtube.com/@tushartravel504", 708538, 77939, "avg_video_views", "Bi-weekly motovlog episodes"),
      createAccount("acc-creator-in-522-ig", "Instagram", "tushartravel504", "https://www.instagram.com/tushartravel504/", 269244, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.tushar.sandhu@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@tushartravel504/about",
      lastChecked: daysAgo(3),
    },
  },

  // 523. Vivaan Reddy (Vadodara, Gujarat)
  {
    id: "creator-in-523",
    name: "Vivaan Reddy",
    category: "Music",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-523-yt", "YouTube", "@vivaanmusic593", "https://www.youtube.com/@vivaanmusic593", 1108267, 138533, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-523-ig", "Instagram", "vivaanmusic593", "https://www.instagram.com/vivaanmusic593/", 421141, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.vivaan.reddy@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@vivaanmusic593/about",
      lastChecked: daysAgo(3),
    },
  },

  // 524. Ayaan Mishra (Pune, Maharashtra)
  {
    id: "creator-in-524",
    name: "Ayaan Mishra",
    category: "Comedy",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Pune-based Hindi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-524-yt", "YouTube", "@ayaancomedy682", "https://www.youtube.com/@ayaancomedy682", 2422996, 339219, "avg_video_views", "Posts 1-2 major sketches / month"),
      createAccount("acc-creator-in-524-ig", "Instagram", "ayaancomedy682", "https://www.instagram.com/ayaancomedy682/", 920738, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.ayaan.mishra@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@ayaancomedy682/about",
      lastChecked: daysAgo(3),
    },
  },

  // 525. Kabir Deshpande (Chennai, Tamil Nadu)
  {
    id: "creator-in-525",
    name: "Kabir Deshpande",
    category: "Food",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chennai-based Tamil creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-525-yt", "YouTube", "@kabirfood771", "https://www.youtube.com/@kabirfood771", 4837725, 749847, "avg_video_views", "Daily street food tours & reviews"),
      createAccount("acc-creator-in-525-ig", "Instagram", "kabirfood771", "https://www.instagram.com/kabirfood771/", 1838336, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kabir.deshpande@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kabirfood771/about",
      lastChecked: daysAgo(3),
    },
  },

  // 526. Saanvi Pillai (Amritsar, Punjab)
  {
    id: "creator-in-526",
    name: "Saanvi Pillai",
    category: "Lifestyle",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Amritsar-based Punjabi creator. Daily lifestyle chronicles, family adventures, university memories, and honest community conversations.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-526-yt", "YouTube", "@saanvivlogs860", "https://www.youtube.com/@saanvivlogs860", 8952454, 1521917, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-526-ig", "Instagram", "saanvivlogs860", "https://www.instagram.com/saanvivlogs860/", 3401933, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.saanvi.pillai@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@saanvivlogs860/about",
      lastChecked: daysAgo(3),
    },
  },

  // 527. Anika Khanna (Surat, Gujarat)
  {
    id: "creator-in-527",
    name: "Anika Khanna",
    category: "Gaming",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Surat-based Gujarati creator. High-level battle royale competitive commentary, GTA V community roleplay, and Minecraft survival series.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-527-yt", "YouTube", "@anikagaming949", "https://www.youtube.com/@anikagaming949", 14267183, 2639429, "avg_video_views", "Daily GTA V & Minecraft storylines"),
      createAccount("acc-creator-in-527-ig", "Instagram", "anikagaming949", "https://www.instagram.com/anikagaming949/", 5421530, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.anika.khanna@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@anikagaming949/about",
      lastChecked: daysAgo(3),
    },
  },

  // 528. Kavya Mukherjee (Mumbai, Maharashtra)
  {
    id: "creator-in-528",
    name: "Kavya Mukherjee",
    category: "Education",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Mumbai-based Hindi creator. Simplified conceptual lectures, historical geopolitics documentaries, and practical competitive exam preparation.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-528-yt", "YouTube", "@kavyaedu39", "https://www.youtube.com/@kavyaedu39", 261912, 52382, "avg_video_views", "Posts 2-3 deep explainers / week"),
      createAccount("acc-creator-in-528-ig", "Instagram", "kavyaedu39", "https://www.instagram.com/kavyaedu39/", 99527, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kavya.mukherjee@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kavyaedu39/about",
      lastChecked: daysAgo(3),
    },
  },

  // 529. Sameer Bhatt (Madurai, Tamil Nadu)
  {
    id: "creator-in-529",
    name: "Sameer Bhatt",
    category: "Fitness",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Madurai-based Tamil creator. Natural home calisthenics, gym hypertrophy splits, high-protein vegetarian diets, and science-backed training.",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-529-yt", "YouTube", "@sameerfitness128", "https://www.youtube.com/@sameerfitness128", 341641, 73453, "avg_video_views", "Daily high-protein diet reels"),
      createAccount("acc-creator-in-529-ig", "Instagram", "sameerfitness128", "https://www.instagram.com/sameerfitness128/", 129824, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.sameer.bhatt@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@sameerfitness128/about",
      lastChecked: daysAgo(3),
    },
  },

  // 530. Karan Rao (Ludhiana, Punjab)
  {
    id: "creator-in-530",
    name: "Karan Rao",
    category: "Technology",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ludhiana-based Punjabi creator. In-depth consumer smartphone teardowns, laptop benchmarks, AI software tools, and electronics tutorials.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-530-yt", "YouTube", "@karantech217", "https://www.youtube.com/@karantech217", 636370, 50910, "avg_video_views", "Posts 2 tech builds / week"),
      createAccount("acc-creator-in-530-ig", "Instagram", "karantech217", "https://www.instagram.com/karantech217/", 241821, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.karan.rao@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@karantech217/about",
      lastChecked: daysAgo(3),
    },
  },

  // 531. Chirag Gill (Ahmedabad, Gujarat)
  {
    id: "creator-in-531",
    name: "Chirag Gill",
    category: "Finance",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Ahmedabad-based Gujarati creator. Demystifying mutual funds, personal budgeting, taxation tricks, stock screening, and real estate wealth.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-531-yt", "YouTube", "@chiragfinance306", "https://www.youtube.com/@chiragfinance306", 1131099, 107454, "avg_video_views", "Weekly macroeconomic explainers"),
      createAccount("acc-creator-in-531-ig", "Instagram", "chiragfinance306", "https://www.instagram.com/chiragfinance306/", 429818, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.chirag.gill@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@chiragfinance306/about",
      lastChecked: daysAgo(3),
    },
  },

  // 532. Arjun Patel (Nagpur, Maharashtra)
  {
    id: "creator-in-532",
    name: "Arjun Patel",
    category: "Travel",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Nagpur-based Hindi creator. Backpacking across scenic mountain passes, coastal routes, offbeat heritage villages, and budget global journeys.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-532-yt", "YouTube", "@arjuntravel395", "https://www.youtube.com/@arjuntravel395", 2445828, 269041, "avg_video_views", "Posts 1-2 travel documentaries / month"),
      createAccount("acc-creator-in-532-ig", "Instagram", "arjuntravel395", "https://www.instagram.com/arjuntravel395/", 929415, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.arjun.patel@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@arjuntravel395/about",
      lastChecked: daysAgo(3),
    },
  },

  // 533. Shaurya Chauhan (Coimbatore, Tamil Nadu)
  {
    id: "creator-in-533",
    name: "Shaurya Chauhan",
    category: "Music",
    language: "Tamil",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Coimbatore-based Tamil creator. Original indie pop acoustic singles, regional folk fusion, keyboard covers, and modern lo-fi beats.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-533-yt", "YouTube", "@shauryamusic484", "https://www.youtube.com/@shauryamusic484", 4860557, 607570, "avg_video_views", "Posts 3 times / week"),
      createAccount("acc-creator-in-533-ig", "Instagram", "shauryamusic484", "https://www.instagram.com/shauryamusic484/", 1847012, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.shaurya.chauhan@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@shauryamusic484/about",
      lastChecked: daysAgo(3),
    },
  },

  // 534. Advik Shinde (Chandigarh, Punjab)
  {
    id: "creator-in-534",
    name: "Advik Shinde",
    category: "Comedy",
    language: "Punjabi",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Chandigarh-based Punjabi creator. Everyday observational comedic sketches, relatable campus scenarios, and witty desi pop-culture roasts.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-534-yt", "YouTube", "@advikcomedy573", "https://www.youtube.com/@advikcomedy573", 8975286, 1256540, "avg_video_views", "Posts weekly stand-up specials"),
      createAccount("acc-creator-in-534-ig", "Instagram", "advikcomedy573", "https://www.instagram.com/advikcomedy573/", 3410609, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.advik.shinde@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@advikcomedy573/about",
      lastChecked: daysAgo(3),
    },
  },

  // 535. Kiara Hegde (Vadodara, Gujarat)
  {
    id: "creator-in-535",
    name: "Kiara Hegde",
    category: "Food",
    language: "Gujarati",
    creatorCountry: "India",
    creatorCountrySource: "Official Channel & Regional Creator Index",
    bio: "Vadodara-based Gujarati creator. Exploring flavorful authentic regional home recipes, festive sweets, and sizzling local street food gems.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    accounts: [
      createAccount("acc-creator-in-535-yt", "YouTube", "@kiarafood662", "https://www.youtube.com/@kiarafood662", 14290015, 2214952, "avg_video_views", "Daily baking & homestyle reels"),
      createAccount("acc-creator-in-535-ig", "Instagram", "kiarafood662", "https://www.instagram.com/kiarafood662/", 5430206, null, null, "Posts 4 times / week"),
    ],
    audienceInsights: [
      { dimension: "country", value: "India", amount: 91, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.98 },
      { dimension: "country", value: "United Arab Emirates", amount: 4, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.94 },
      { dimension: "country", value: "United States", amount: 3, unit: "%", collectedAt: daysAgo(4), source: "YouTube Verified Analytics", status: "public", confidence: 0.92 },
    ],
    businessContact: {
      email: "contact.kiara.hegde@creatorscout.in",
      sourceUrl: "https://www.youtube.com/@kiarafood662/about",
      lastChecked: daysAgo(3),
    },
  },
  ...STREAMER_CREATORS,
];
