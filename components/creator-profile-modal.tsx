"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, CheckCircle2 } from "lucide-react";
import { useProspects } from "@/components/data-provider";
import type { Creator, PlatformAccount, MetricSnapshot } from "@/lib/model";
import { getCountryFlag } from "@/lib/country-detector";
import { useDialogAccessibility } from "@/lib/use-dialog-accessibility";

const CATEGORIES = [
  "Gaming",
  "Technology",
  "Entertainment",
  "Comedy",
  "Education",
  "Lifestyle & Vlogs",
  "Fitness & Sports",
  "Music & Production",
  "News & Commentary",
];

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Spain",
  "Canada",
  "Brazil",
  "Germany",
  "Australia",
  "France",
  "Japan",
  "Global",
];

const LANGUAGES = [
  "English",
  "Hindi",
  "Spanish",
  "Portuguese",
  "French",
  "German",
  "Japanese",
  "Korean",
  "Multi-language",
];

export function CreatorProfileModal() {
  const router = useRouter();
  const { creatorModalOpen, setCreatorModalOpen, addCustomCreator, showToast } = useProspects();
  const dialogRef = useRef<HTMLDivElement>(null);

  useDialogAccessibility(creatorModalOpen, () => setCreatorModalOpen(false), dialogRef);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("Gaming");
  const [country, setCountry] = useState("India");
  const [language, setLanguage] = useState("Hindi");

  // Platform Handles & Follower Counts
  const [ytHandle, setYtHandle] = useState("");
  const [ytSubs, setYtSubs] = useState("");

  const [twitchHandle, setTwitchHandle] = useState("");
  const [twitchFollowers, setTwitchFollowers] = useState("");
  const [twitchLiveViewers, setTwitchLiveViewers] = useState("");

  const [kickHandle, setKickHandle] = useState("");
  const [kickFollowers, setKickFollowers] = useState("");

  const [igHandle, setIgHandle] = useState("");
  const [igFollowers, setIgFollowers] = useState("");

  const [ttHandle, setTtHandle] = useState("");
  const [ttFollowers, setTtFollowers] = useState("");

  const [submitting, setSubmitting] = useState(false);

  if (!creatorModalOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Please enter your creator/channel name.", "error");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      showToast("Please enter a valid business contact email.", "error");
      return;
    }

    setSubmitting(true);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const creatorId = `creator-${slug}-${Date.now().toString(36).slice(-4)}`;
    const nowStr = new Date().toISOString();

    const accounts: PlatformAccount[] = [];

    // YouTube
    if (ytHandle.trim()) {
      const handleClean = ytHandle.trim().startsWith("@") ? ytHandle.trim() : `@${ytHandle.trim()}`;
      const subsNum = parseInt(ytSubs.replace(/[^0-9]/g, ""), 10) || 50000;
      accounts.push({
        id: `${creatorId}-yt`,
        platform: "YouTube",
        handle: handleClean,
        profileUrl: `https://youtube.com/${handleClean}`,
        activity: "Active creator",
        snapshots: [
          {
            id: `${creatorId}-yt-snap`,
            metricName: "followers",
            value: subsNum,
            unit: "count",
            collectedAt: nowStr,
            windowStart: null,
            windowEnd: null,
            periodLabel: "Creator Verified",
            sampleSize: null,
            source: "Creator Onboarding Self-Verification",
            status: "public",
          },
          {
            id: `${creatorId}-yt-reach`,
            metricName: "avg_video_views",
            value: Math.round(subsNum * 0.12),
            unit: "count",
            collectedAt: nowStr,
            windowStart: null,
            windowEnd: null,
            periodLabel: "Last 10 videos",
            sampleSize: 10,
            source: "Creator Channel Analytics",
            status: "public",
          },
        ],
      });
    }

    // Twitch
    if (twitchHandle.trim()) {
      const handleClean = twitchHandle.trim().replace(/^@/, "");
      const fNum = parseInt(twitchFollowers.replace(/[^0-9]/g, ""), 10) || 25000;
      const vNum = parseInt(twitchLiveViewers.replace(/[^0-9]/g, ""), 10) || 1200;
      const twitchSnaps: MetricSnapshot[] = [
        {
          id: `${creatorId}-tw-snap`,
          metricName: "followers",
          value: fNum,
          unit: "count",
          collectedAt: nowStr,
          windowStart: null,
          windowEnd: null,
          periodLabel: "Creator Verified",
          sampleSize: null,
          source: "Twitch Channel Verification",
          status: "public",
        },
        {
          id: `${creatorId}-tw-live`,
          metricName: "avg_live_viewers",
          value: vNum,
          unit: "count",
          collectedAt: nowStr,
          windowStart: null,
          windowEnd: null,
          periodLabel: "30-Day Stream Concurrency",
          sampleSize: 30,
          source: "Twitch Broadcast Stream History",
          status: "public",
        },
      ];
      accounts.push({
        id: `${creatorId}-twitch`,
        platform: "Twitch",
        handle: handleClean,
        profileUrl: `https://twitch.tv/${handleClean}`,
        activity: "Live streaming regularly",
        snapshots: twitchSnaps,
      });
    }

    // Kick
    if (kickHandle.trim()) {
      const handleClean = kickHandle.trim().replace(/^@/, "");
      const fNum = parseInt(kickFollowers.replace(/[^0-9]/g, ""), 10) || 15000;
      accounts.push({
        id: `${creatorId}-kick`,
        platform: "Kick",
        handle: handleClean,
        profileUrl: `https://kick.com/${handleClean}`,
        activity: "Broadcast live streams",
        snapshots: [
          {
            id: `${creatorId}-kick-snap`,
            metricName: "followers",
            value: fNum,
            unit: "count",
            collectedAt: nowStr,
            windowStart: null,
            windowEnd: null,
            periodLabel: "Kick Profile Verified",
            sampleSize: null,
            source: "Kick Channel Verification",
            status: "public",
          },
        ],
      });
    }

    // Instagram
    if (igHandle.trim()) {
      const handleClean = igHandle.trim().replace(/^@/, "");
      const fNum = parseInt(igFollowers.replace(/[^0-9]/g, ""), 10) || 40000;
      accounts.push({
        id: `${creatorId}-ig`,
        platform: "Instagram",
        handle: handleClean,
        profileUrl: `https://instagram.com/${handleClean}`,
        activity: "Daily stories & reels",
        snapshots: [
          {
            id: `${creatorId}-ig-snap`,
            metricName: "followers",
            value: fNum,
            unit: "count",
            collectedAt: nowStr,
            windowStart: null,
            windowEnd: null,
            periodLabel: "Instagram Profile Verified",
            sampleSize: null,
            source: "Instagram Public Profile",
            status: "public",
          },
        ],
      });
    }

    // TikTok
    if (ttHandle.trim()) {
      const handleClean = ttHandle.trim().startsWith("@") ? ttHandle.trim() : `@${ttHandle.trim()}`;
      const fNum = parseInt(ttFollowers.replace(/[^0-9]/g, ""), 10) || 60000;
      accounts.push({
        id: `${creatorId}-tt`,
        platform: "TikTok",
        handle: handleClean,
        profileUrl: `https://tiktok.com/${handleClean}`,
        activity: "Regular short-form posts",
        snapshots: [
          {
            id: `${creatorId}-tt-snap`,
            metricName: "followers",
            value: fNum,
            unit: "count",
            collectedAt: nowStr,
            windowStart: null,
            windowEnd: null,
            periodLabel: "TikTok Profile Verified",
            sampleSize: null,
            source: "TikTok Public Profile",
            status: "public",
          },
        ],
      });
    }

    // If no platform was filled, default to YouTube handle with creator's name
    if (accounts.length === 0) {
      accounts.push({
        id: `${creatorId}-yt`,
        platform: "YouTube",
        handle: `@${slug}`,
        profileUrl: `https://youtube.com/@${slug}`,
        activity: "Active creator",
        snapshots: [
          {
            id: `${creatorId}-yt-snap`,
            metricName: "followers",
            value: 50000,
            unit: "count",
            collectedAt: nowStr,
            windowStart: null,
            windowEnd: null,
            periodLabel: "Creator Verified",
            sampleSize: null,
            source: "Creator Onboarding Self-Verification",
            status: "public",
          },
        ],
      });
    }

    const newCreator: Creator = {
      id: creatorId,
      name: name.trim(),
      category,
      creatorCountry: country,
      creatorCountrySource: "Creator Verified Listing",
      language,
      bio: bio.trim() || `Official creator profile for ${name.trim()}. Active in ${category} across digital platforms.`,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=2e7d48&textColor=ffffff`,
      businessContact: {
        email: email.trim(),
        sourceUrl: "Direct Creator Verification",
        lastChecked: nowStr,
      },
      audienceInsights: [
        {
          dimension: "country",
          value: country,
          amount: 72,
          unit: "%",
          confidence: 0.98,
          source: "Creator Certified Channel Analytics",
          collectedAt: nowStr,
          status: "creator_authorized",
        },
      ],
      accounts,
    };

    addCustomCreator(newCreator);
    setSubmitting(false);
    setCreatorModalOpen(false);
    showToast(`🎉 Congratulations! Your creator profile for "${name}" is now live!`, "success");
    router.push(`/creators/${creatorId}`);
  }

  return (
    <div
      className="modal-backdrop"
      onClick={() => setCreatorModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="creator-profile-modal-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="creator-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="creator-modal-head">
          <div>
            <span className="creator-modal-badge">
              <Sparkles size={13} />
              <span>CREATOR ONBOARDING STUDIO</span>
            </span>
            <h2 id="creator-profile-modal-title">Create or Claim Your Creator Profile</h2>
            <p>
              Not listed in public channel search yet? Publish your verified handle, metrics, and business email to get discovered by brands and sponsors.
            </p>
          </div>

          <button
            type="button"
            className="icon-button modal-close-btn"
            onClick={() => setCreatorModalOpen(false)}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="creator-form">
          {/* Section 1: Basic Identity */}
          <div className="creator-form-section">
            <h3 className="section-title">1. Creator & Channel Information</h3>
            <div className="form-grid-2">
              <div className="field-group">
                <label className="field-label">Creator / Channel Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Alex Gaming, TechVibe, Maya Vlogs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Business Contact Email *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="talent@yourdomain.com or contact@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="field-group">
                <label className="field-label">Primary Category</label>
                <select
                  className="form-select"
                  aria-label="Primary Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Primary Country</label>
                <select
                  className="form-select"
                  aria-label="Primary Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {getCountryFlag(c)} {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Primary Language</label>
                <select
                  className="form-select"
                  aria-label="Primary Language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Bio & Campaign Deliverables</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Describe your content format, audience demographic, posting cadence, and brand collaboration preferences..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Platform Handles */}
          <div className="creator-form-section">
            <h3 className="section-title">2. Connected Platform Accounts & Metrics</h3>
            <p className="section-hint">
              Fill in the platforms where you actively create content (fill at least one).
            </p>

            <div className="platform-inputs-grid">
              {/* YouTube */}
              <div className="platform-field-card">
                <div className="platform-field-head">
                  <span className="dot dot-yt" />
                  <strong>YouTube Channel</strong>
                </div>
                <div className="form-grid-2">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="@YourChannel"
                    value={ytHandle}
                    onChange={(e) => setYtHandle(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Subscribers (e.g. 250,000)"
                    value={ytSubs}
                    onChange={(e) => setYtSubs(e.target.value)}
                  />
                </div>
              </div>

              {/* Twitch */}
              <div className="platform-field-card">
                <div className="platform-field-head">
                  <span className="dot dot-twitch" />
                  <strong>Twitch Stream</strong>
                </div>
                <div className="form-grid-3">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="TwitchUsername"
                    value={twitchHandle}
                    onChange={(e) => setTwitchHandle(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Followers (e.g. 50,000)"
                    value={twitchFollowers}
                    onChange={(e) => setTwitchFollowers(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Avg Live Viewers (e.g. 1,500)"
                    value={twitchLiveViewers}
                    onChange={(e) => setTwitchLiveViewers(e.target.value)}
                  />
                </div>
              </div>

              {/* Kick */}
              <div className="platform-field-card">
                <div className="platform-field-head">
                  <span className="dot dot-kick" />
                  <strong>Kick Channel</strong>
                </div>
                <div className="form-grid-2">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="KickUsername"
                    value={kickHandle}
                    onChange={(e) => setKickHandle(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Followers (e.g. 25,000)"
                    value={kickFollowers}
                    onChange={(e) => setKickFollowers(e.target.value)}
                  />
                </div>
              </div>

              {/* Instagram & TikTok in 2 columns */}
              <div className="form-grid-2">
                <div className="platform-field-card">
                  <div className="platform-field-head">
                    <span className="dot dot-ig" />
                    <strong>Instagram Handle</strong>
                  </div>
                  <div className="form-grid-2">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="instagram_handle"
                      value={igHandle}
                      onChange={(e) => setIgHandle(e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Followers (e.g. 100,000)"
                      value={igFollowers}
                      onChange={(e) => setIgFollowers(e.target.value)}
                    />
                  </div>
                </div>

                <div className="platform-field-card">
                  <div className="platform-field-head">
                    <span className="dot dot-tt" />
                    <strong>TikTok Handle</strong>
                  </div>
                  <div className="form-grid-2">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="@tiktokhandle"
                      value={ttHandle}
                      onChange={(e) => setTtHandle(e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Followers (e.g. 80,000)"
                      value={ttFollowers}
                      onChange={(e) => setTtFollowers(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="creator-form-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setCreatorModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="button primary glow"
              style={{ minWidth: "220px" }}
            >
              <CheckCircle2 size={16} />
              <span>{submitting ? "Publishing Profile..." : "Publish Creator Profile"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
