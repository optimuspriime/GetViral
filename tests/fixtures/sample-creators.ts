import type { Creator } from "@/lib/model";

/**
 * Isolated test fixtures for automated testing ONLY.
 * Never imported or served in production paths.
 */
export const TEST_FIXTURE_CREATORS: Creator[] = [
  {
    id: "creator-carryminati",
    name: "CarryMinati",
    category: "Entertainment",
    language: "Hindi",
    creatorCountry: "India",
    creatorCountrySource: "Platform API",
    bio: "Ajey Nagar, known as CarryMinati, is an Indian YouTuber and streamer known for comedy videos and roasting.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    audienceInsights: [],
    businessContact: {
      email: "business@carryminati.com",
      sourceUrl: "https://www.youtube.com/@CarryMinati/about",
      lastChecked: "2026-11-20T10:00:00.000Z",
    },
    accounts: [
      {
        id: "acc-carryminati-yt",
        platform: "YouTube",
        handle: "@CarryMinati",
        profileUrl: "https://www.youtube.com/@CarryMinati",
        activity: "Weekly uploads",
        snapshots: [
          {
            id: "snap-yt-1",
            metricName: "followers",
            value: 44200000,
            unit: "count",
            collectedAt: "2026-11-20T10:00:00.000Z",
            windowStart: null,
            windowEnd: null,
            periodLabel: null,
            sampleSize: null,
            source: "YouTube Data API v3",
            status: "public",
          },
          {
            id: "snap-yt-2",
            metricName: "avg_video_views",
            value: 28500000,
            unit: "views",
            collectedAt: "2026-11-20T10:00:00.000Z",
            windowStart: null,
            windowEnd: null,
            periodLabel: "Last 10 videos",
            sampleSize: 10,
            source: "YouTube Data API v3",
            status: "public",
          },
        ],
      },
      {
        id: "acc-carryminati-kick",
        platform: "Kick",
        handle: "carryminati",
        profileUrl: "https://kick.com/carryminati",
        activity: "Live streams",
        snapshots: [
          {
            id: "snap-kick-1",
            metricName: "followers",
            value: 21500000,
            unit: "count",
            collectedAt: "2026-11-20T10:00:00.000Z",
            windowStart: null,
            windowEnd: null,
            periodLabel: null,
            sampleSize: null,
            source: "Kick API v2",
            status: "public",
          },
        ],
      },
    ],
  },
  {
    id: "creator-mrbeast",
    name: "MrBeast",
    category: "Entertainment",
    language: "English",
    creatorCountry: "United States",
    creatorCountrySource: "Platform API",
    bio: "Jimmy Donaldson, best known as MrBeast, is an American YouTuber known for fast-paced and high-production videos.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    audienceInsights: [],
    businessContact: {
      email: "contact@mrbeastbusiness.com",
      sourceUrl: "https://www.youtube.com/@MrBeast/about",
      lastChecked: "2026-11-20T10:00:00.000Z",
    },
    accounts: [
      {
        id: "acc-mrbeast-yt",
        platform: "YouTube",
        handle: "@MrBeast",
        profileUrl: "https://www.youtube.com/@MrBeast",
        activity: "Bi-weekly uploads",
        snapshots: [
          {
            id: "snap-mrbeast-yt-1",
            metricName: "followers",
            value: 318000000,
            unit: "count",
            collectedAt: "2026-11-20T10:00:00.000Z",
            windowStart: null,
            windowEnd: null,
            periodLabel: null,
            sampleSize: null,
            source: "YouTube Data API v3",
            status: "public",
          },
        ],
      },
    ],
  },
];
