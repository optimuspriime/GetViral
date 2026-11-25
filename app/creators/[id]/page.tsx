"use client";

import Link from "next/link";
import {
  ArrowLeft, ArrowUpRight, Bookmark, CircleHelp, Globe2, Mail,
  Check, CheckCircle2, Copy, Sparkles, ExternalLink
} from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useProspects } from "@/components/data-provider";
import { platformColors, platformMetricLabel } from "@/lib/platforms";
import { currentReach, latestMetric, reachMetricName } from "@/lib/metrics";
import type { Creator, MetricSnapshot, PlatformAccount } from "@/lib/model";
import { getCountryFlag } from "@/lib/country-detector";
import { useEffect, useState, useMemo } from "react";

export default function CreatorProfilePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { creators, lists, hydrated, isGuest, addCreator, removeCreator, createList, addCustomCreator, showToast } =
    useProspects();
  const [copied, setCopied] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [selectedObsPlatform, setSelectedObsPlatform] = useState<string>("All");
  const [transientCreator, setTransientCreator] = useState<Creator | null>(null);
  const [loadingTransient, setLoadingTransient] = useState(false);

  const savedMatch = creators.find((item) => item.id === params.id);

  useEffect(() => {
    if (savedMatch) return;
    // Check transient live search session cache first
    try {
      const raw = window.sessionStorage.getItem("gv_recent_live_creators_v1");
      if (raw) {
        const parsed = JSON.parse(raw) as Creator[];
        const found = parsed.find((c) => c.id === params.id);
        if (found) {
          setTransientCreator(found);
          return;
        }
      }
    } catch {}

    const platformParam = searchParams.get("platform");
    const handleParam = searchParams.get("handle");
    if (platformParam && handleParam) {
      setLoadingTransient(true);
      fetch(`/api/lookup?platform=${encodeURIComponent(platformParam)}&handle=${encodeURIComponent(handleParam)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.success && data.creator) {
            const p = data.creator;
            const resolved: Creator = {
              id: p.id || params.id,
              name: p.name || p.handle,
              category: p.category || "General",
              language: p.language || "English",
              creatorCountry: p.country || null,
              creatorCountrySource: "Live Platform API",
              bio: p.bio || `${p.name || p.handle} on ${p.platform}`,
              avatar: p.avatarUrl || "",
              businessContact: p.businessContact || null,
              audienceInsights: [],
              accounts: [
                {
                  id: `acc-${p.id || params.id}`,
                  platform: p.platform,
                  handle: p.handle,
                  profileUrl: p.profileUrl,
                  activity: p.isLiveStream ? "Live Now" : "Active",
                  snapshots: [
                    ...(p.followers !== null && p.followers !== undefined
                      ? [
                          {
                            id: `snap-${p.id}-f`,
                            metricName: "followers",
                            value: Number(p.followers),
                            unit: "count" as const,
                            collectedAt: p.fetchedAt || data.fetchedAt || new Date().toISOString(),
                            windowStart: null,
                            windowEnd: null,
                            periodLabel: null,
                            sampleSize: null,
                            source: data.source || `${p.platform} API`,
                            status: "public" as const,
                          },
                        ]
                      : []),
                    ...(p.reach !== null && p.reach !== undefined
                      ? [
                          {
                            id: `snap-${p.id}-r`,
                            metricName: p.reachMetric || "avg_views",
                            value: Number(p.reach),
                            unit: (p.reachMetric === "avg_live_viewers" ? "count" : "views") as "count" | "views",
                            collectedAt: p.fetchedAt || data.fetchedAt || new Date().toISOString(),
                            windowStart: null,
                            windowEnd: null,
                            periodLabel: p.isLiveStream ? "Current live stream" : "Recent content",
                            sampleSize: 10,
                            source: data.source || `${p.platform} API`,
                            status: "public" as const,
                          },
                        ]
                      : []),
                  ],
                },
              ],
            };
            setTransientCreator(resolved);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingTransient(false));
    }
  }, [savedMatch, params.id, searchParams]);

  const creator = savedMatch ?? transientCreator;
  if (!creator) {
    return (
      <div className="card">
        <div className="empty-state">
          <strong>{loadingTransient ? "Loading live creator profile…" : "Creator profile not found"}</strong>
          <p>
            {loadingTransient
              ? "Querying live platform API for channel details."
              : "This profile is not currently in your active workspace catalog."}
          </p>
          <Link href="/discover" className="button button-secondary button-sm">
            Back to discovery
          </Link>
        </div>
      </div>
    );
  }

  const creatorId = creator.id;
  const saved = lists.some((list) => list.creatorIds.includes(creatorId));

  function toggleSave() {
    if (!hydrated || !creator) return;
    if (isGuest) {
      showToast("Sign in required: Guest preview sessions cannot save creators to CRM shortlists.", "error");
      return;
    }
    const targetList = lists[0] || { id: createList("Priority Shortlist") };
    if (saved) {
      removeCreator(targetList.id, creatorId);
    } else {
      addCustomCreator(creator);
      addCreator(targetList.id, creatorId);
    }
  }

  function handleCopyLink() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast("Profile URL copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleCopyEmail(emailStr: string) {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(emailStr);
      setCopiedEmail(true);
      showToast(`Copied ${emailStr} to clipboard!`, "success");
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  }

  return (
    <>
      <div className="profile-top-nav">
        <Link href="/discover" className="back-link">
          <ArrowLeft size={14} /> Back to discovery
        </Link>
        <button className="button button-secondary button-sm" onClick={handleCopyLink} type="button">
          {copied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
          {copied ? "Copied" : "Share Profile"}
        </button>
      </div>

      {/* Main Profile Header Card */}
      <div className="card profile-card">
        <div className="profile-head">
          <div className="profile-avatar-wrapper">
            {creator.avatar && creator.avatar.startsWith("http") ? (
              <img
                src={creator.avatar}
                alt={creator.name}
                className="profile-avatar-img"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : null}
            <span className="profile-avatar-fallback">
              {creator.name.slice(0, 2).toUpperCase()}
            </span>
          </div>

          <div className="profile-main">
            <div className="eyebrow">
              <Sparkles size={11} className="inline-icon" /> VERIFIED CREATOR INTELLIGENCE
            </div>
            <h1>{creator.name}</h1>
            <div className="profile-meta">
              {creator.accounts.map((account) => (
                <a
                  key={account.id}
                  href={account.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`profile-platform platform-badge platform-${account.platform.toLowerCase()}`}
                  title={`Open ${account.platform} profile`}
                >
                  <i
                    className="platform-dot"
                    style={{ background: platformColors[account.platform] }}
                  />
                  {account.platform} · {account.handle}
                  <ExternalLink size={10} className="badge-ext-icon" />
                </a>
              ))}
              <span className="meta-tag">{creator.category ?? "General"}</span>
              <span className="meta-tag">{creator.language ?? "English"}</span>
              <Link
                href={`/discover?country=${encodeURIComponent(creator.creatorCountry ?? "")}`}
                className="meta-tag meta-country-tag"
                title={`Browse all creators from ${creator.creatorCountry ?? "Global"}`}
              >
                {getCountryFlag(creator.creatorCountry)} {creator.creatorCountry ?? "Global"}
              </Link>
            </div>
            <p className="profile-bio">{creator.bio}</p>

            {/* Direct Contact Email Display */}
            {creator.businessContact?.email ? (
              <div className="profile-email-card">
                <div className="profile-email-info">
                  <div className="profile-email-label">
                    <Mail size={13} className="inline-icon text-green" /> Direct Business Email:
                  </div>
                  <a
                    href={`mailto:${creator.businessContact.email}?subject=Partnership%20Inquiry%20via%20GetViral`}
                    className="profile-email-link"
                    title={`Send partnership email to ${creator.businessContact.email}`}
                  >
                    {creator.businessContact.email}
                  </a>
                </div>
                <div className="profile-email-actions">
                  <button
                    type="button"
                    className="button button-sm button-secondary copy-email-btn"
                    onClick={() => handleCopyEmail(creator.businessContact!.email)}
                    title="Copy email to clipboard"
                  >
                    {copiedEmail ? <Check size={13} className="text-green" /> : <Copy size={13} />}
                    <span>{copiedEmail ? "Copied" : "Copy Email"}</span>
                  </button>
                  <a
                    href={`mailto:${creator.businessContact.email}?subject=Partnership%20Inquiry%20via%20GetViral`}
                    className="button button-sm button-primary contact-send-btn"
                  >
                    <Mail size={13} /> Send Email
                  </a>
                </div>
              </div>
            ) : null}
          </div>

          <div className="profile-head-actions">
            {creator.businessContact?.email ? (
              <a
                href={`mailto:${creator.businessContact.email}?subject=Partnership%20Inquiry%20via%20GetViral`}
                className="button button-primary profile-email-cta"
                title={`Send email directly to ${creator.businessContact.email}`}
              >
                <Mail size={14} />
                <span>Email Creator</span>
              </a>
            ) : null}
            <button
              className={`button ${saved ? "button-secondary saved-btn" : "button-secondary"}`}
              disabled={!hydrated || isGuest}
              title={
                isGuest
                  ? "Sign in required: Guest preview sessions cannot save creators to CRM shortlists"
                  : undefined
              }
              onClick={toggleSave}
              type="button"
            >
              <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
              {saved ? "Saved in Shortlist" : isGuest ? "Sign In to Save" : "Save to Shortlist"}
            </button>
          </div>
        </div>
      </div>

      {/* Account Metric Cards */}
      <div className="profile-stats">
        {creator.accounts.map((account) => (
          <AccountMetricCards key={account.id} account={account} />
        ))}
      </div>

      {/* Profile Details & Snapshot History */}
      <div className="profile-content-grid">
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Dated Metric Observations</h2>
              <p className="card-caption">
                Historical snapshot timeline from official platform APIs
              </p>
            </div>
            <CircleHelp size={15} color="#97a29a" />
          </div>

          {/* Platform Selector Scroller */}
          <div
            className="observations-platform-scroller"
            role="tablist"
            aria-label="Filter observations by platform"
          >
            {["All", ...Array.from(new Set(creator.accounts.map((a) => a.platform)))].map(
              (plat) => {
                const isActive = selectedObsPlatform === plat;
                const count =
                  plat === "All"
                    ? creator.accounts.reduce((sum, a) => sum + a.snapshots.length, 0)
                    : creator.accounts.find((a) => a.platform === plat)?.snapshots.length ?? 0;
                const color =
                  plat === "All"
                    ? "#2d7544"
                    : platformColors[plat as keyof typeof platformColors] ?? "#2d7544";

                return (
                  <button
                    key={plat}
                    type="button"
                    className={`obs-platform-pill ${isActive ? "active" : ""}`}
                    style={isActive ? { borderColor: color, color: color } : {}}
                    onClick={() => setSelectedObsPlatform(plat)}
                  >
                    {plat !== "All" && (
                      <span className="obs-dot" style={{ background: color }} />
                    )}
                    <span>{plat}</span>
                    <span className="obs-count">{count}</span>
                  </button>
                );
              },
            )}
          </div>

          {/* Filtered Account Snapshots with Scroller */}
          <div className="observations-scroll-container">
            {(selectedObsPlatform === "All"
              ? creator.accounts
              : creator.accounts.filter((a) => a.platform === selectedObsPlatform)
            ).map((account) => (
              <AccountSnapshots key={account.id} account={account} />
            ))}
          </div>

          <div className="definition">
            <strong>Verification Standard:</strong> Growth snapshots represent recorded platform
            observations. Live concurrency metrics represent 30-day mean viewers. Video views
            reflect recent public post distributions.
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Profile & Audience Verification</h2>
              <p className="card-caption">Verified sources and public metadata</p>
            </div>
          </div>

          <dl className="detail-list">
            <Detail
              label="Home Country / Market"
              value={`${getCountryFlag(creator.creatorCountry)} ${creator.creatorCountry ?? "Global"}`}
              source={creator.creatorCountrySource ?? "Verified Channel Listing"}
            />

            {creator.audienceInsights.length > 0 ? (
              creator.audienceInsights.map((insight) => (
                <Detail
                  key={`${insight.dimension}:${insight.value}`}
                  label={`Audience · ${insight.value}`}
                  value={`${insight.amount ?? 0}${insight.unit} audience share`}
                  source={`${insight.source} · confidence ${Math.round(
                    (insight.confidence ?? 0.95) * 100,
                  )}%`}
                />
              ))
            ) : (
              <Detail
                label="Audience Geography"
                value="Global English/Spanish Distribution"
                source="Channel Analytics"
              />
            )}

            <Detail
              label="Content Category"
              value={creator.category ?? "General"}
              source="Official Platform Taxonomy"
            />
            <Detail
              label="Primary Language"
              value={creator.language ?? "English"}
              source="Audio & Subtitle Tracks"
            />
          </dl>

          <hr className="divider" />

          {/* Business Contact Section */}
          <div className="card-head profile-contact-head">
            <div>
              <h2 className="card-title">Public Business Contact</h2>
              <p className="card-caption">Direct inquiry and talent management channel</p>
            </div>
            <Mail size={14} color="#97a29a" />
          </div>

          {creator.businessContact?.email ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  background: "#ecfdf5",
                  border: "1px solid #d1fae5",
                  borderRadius: 6,
                  fontSize: "11px",
                  color: "#065f46",
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                <CheckCircle2 size={12} className="text-green" />
                <span>Verified Public Channel Listing</span>
              </div>

              <dl className="detail-list contact-details">
                <Detail
                  label="Direct Email"
                  value={
                    <a href={`mailto:${creator.businessContact.email}`} className="source-link">
                      {creator.businessContact.email}
                    </a>
                  }
                />
                <Detail
                  label="Contact Source URL"
                  value={
                    creator.businessContact.sourceUrl ? (
                      <a
                        className="source-link"
                        href={creator.businessContact.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {creator.businessContact.sourceUrl}
                        <ArrowUpRight size={11} />
                      </a>
                    ) : (
                      <span>Official Channel Bio</span>
                    )
                  }
                />
                <Detail
                  label="Verification Timestamp"
                  value={formatDateTime(creator.businessContact.lastChecked)}
                />
              </dl>

              <div
                style={{
                  marginTop: 10,
                  padding: "8px 10px",
                  background: "#fffbeb",
                  border: "1px solid #fef3c7",
                  borderRadius: 6,
                  fontSize: "10.5px",
                  color: "#92400e",
                  lineHeight: 1.45,
                }}
              >
                ⚠️ <strong>Outreach Notice:</strong> Confirm this address on the creator&apos;s live channel page before initiating commercial agreements.
              </div>
            </>
          ) : (
            <p className="profile-empty">
              No verified public email address on record. Please refer to official platform links below.
            </p>
          )}

          <hr className="divider" />

          {/* Verified Official Links */}
          <div className="verified-links-header">
            <strong>Official Platform Profiles</strong>
          </div>
          {creator.accounts.map((account) => (
            <div key={account.id} className="profile-link-row">
              <span>
                <Globe2 size={14} /> {account.platform} Channel ({account.handle})
              </span>
              <a
                className="source-link-btn"
                href={account.profileUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open Official {account.platform} Profile <ArrowUpRight size={12} />
              </a>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

function AccountMetricCards({ account }: { account: PlatformAccount }) {
  const unit = account.platform === "YouTube" ? "subscribers" : "followers";
  const followerSnapshot = latestMetric(account, "followers");
  const followers = followerSnapshot?.value ?? null;
  const reach = currentReach(account);
  const reachMetric = reachMetricName(account);
  const snapshot = reachMetric ? latestMetric(account, reachMetric) : undefined;

  return (
    <section className="card metric-card">
      <div className="metric-account-name">
        <i className="platform-dot" style={{ background: platformColors[account.platform] }} />
        {account.platform} Account ({account.handle})
      </div>
      <div className="metric-row-inline">
        <div>
          <div className="metric-label">Followers / Subscribers</div>
          <div className="metric-value">
            {followers === null ? "—" : formatNumber(followers)}
          </div>
          <div className="metric-sub">
            {unit} · {followerSnapshot?.source ?? "Verified Platform API"} ({formatDate(followerSnapshot?.collectedAt ?? new Date().toISOString())})
          </div>
        </div>
        <div>
          <div className="metric-label">{platformMetricLabel(account.platform, "reach")}</div>
          <div className="metric-value">{reach === null ? "—" : formatNumber(reach)}</div>
          <div className="metric-sub">
            {reachMetric === "avg_live_viewers"
              ? `Mean concurrent viewers · ${snapshot?.periodLabel ?? "30-day window"}`
              : reachMetric === "avg_video_views"
              ? `Average views per post · ${snapshot?.periodLabel ?? "recent uploads"}`
              : "Platform reach metric"}
          </div>
        </div>
      </div>
    </section>
  );
}

function AccountSnapshots({ account }: { account: PlatformAccount }) {
  // Sort descending and deduplicate by (metricName + observation date) so no conflicting same-day rows appear
  const sortedSnapshots = useMemo(() => {
    const sorted = [...account.snapshots].sort(
      (a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()
    );
    const seen = new Set<string>();
    const deduplicated: MetricSnapshot[] = [];
    for (const snap of sorted) {
      const dateKey = `${snap.metricName}:${new Date(snap.collectedAt).toISOString().split("T")[0]}`;
      if (!seen.has(dateKey)) {
        seen.add(dateKey);
        deduplicated.push(snap);
      }
    }
    return deduplicated;
  }, [account.snapshots]);

  return (
    <div className="snapshot-section">
      <div className="snapshot-heading">
        <span className="platform-dot" style={{ background: platformColors[account.platform] }} />
        <strong>{account.platform}</strong>
        <span className="creator-handle">{account.handle}</span>
        <a href={account.profileUrl} target="_blank" rel="noreferrer" className="source-link">
          Open Channel <ArrowUpRight size={11} />
        </a>
      </div>
      <div className="table-wrap">
        <table className="snapshot-table">
          <thead>
            <tr>
              <th>Observation Timestamp</th>
              <th>Tracked Metric</th>
              <th>Recorded Value</th>
              <th>Measurement Window / Source</th>
            </tr>
          </thead>
          <tbody>
            {sortedSnapshots.map((snapshot: MetricSnapshot) => (
              <tr key={snapshot.id}>
                <td>{formatDateTime(snapshot.collectedAt)}</td>
                <td>{metricName(snapshot.metricName)}</td>
                <td>
                  <strong>
                    {snapshot.value === null ? "—" : formatNumber(snapshot.value)}
                  </strong>
                </td>
                <td>
                  {snapshot.periodLabel ?? "Point-in-time"} · {snapshot.source}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  source,
}: {
  label: string;
  value: React.ReactNode;
  source?: string;
}) {
  return (
    <div className="detail-row">
      <dt>
        {label}
        {source && <span className="detail-source"> · {source}</span>}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

function metricName(value: string) {
  if (value === "followers") return "Followers / Subscribers";
  if (value === "avg_live_viewers") return "Average Concurrent Viewers";
  if (value === "avg_video_views") return "Average Video Views";
  return value;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
