"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Bookmark, CircleHelp, Globe2, Mail } from "lucide-react";
import { useParams } from "next/navigation";
import { useProspects } from "@/components/data-provider";
import { platformColors, platformMetricLabel } from "@/lib/platforms";
import { currentFollowers, currentReach, latestMetric, reachMetricName } from "@/lib/metrics";
import type { Creator, MetricSnapshot, PlatformAccount } from "@/lib/model";

export default function CreatorProfilePage() {
  const params = useParams<{ id: string }>();
  const { creators, lists, hydrated, addCreator, createList } = useProspects();
  const creator = creators.find((item) => item.id === params.id);
  if (!creator) return <div className="card"><div className="empty-state"><strong>Creator not found</strong><p>This profile is not included in the demo data.</p><Link href="/discover" className="button button-secondary button-sm">Back to discovery</Link></div></div>;
  const creatorId = creator.id;
  const saved = lists.some((list) => list.creatorIds.includes(creatorId));

  function save() {
    if (!hydrated) return;
    const list = lists[0];
    if (list) addCreator(list.id, creatorId);
    else addCreator(createList("Campaign shortlist"), creatorId);
  }

  return (
    <>
      <Link href="/discover" className="back-link"><ArrowLeft size={14} /> Back to discovery</Link>
      <div className="card profile-card">
        <div className="profile-head">
          <span className="profile-avatar">{creator.avatar}</span>
          <div className="profile-main">
            <div className="eyebrow">CREATOR PROFILE · DEMO RECORD</div>
            <h1>{creator.name}</h1>
            <div className="profile-meta">
              {creator.accounts.map((account) => <span className={`profile-platform platform-badge platform-${account.platform.toLowerCase()}`} key={account.id}><i className="platform-dot" style={{ background: platformColors[account.platform] }} />{account.platform} · {account.handle}</span>)}
              <span>{creator.category ?? "Category unavailable"}</span><span>{creator.language ?? "Language unavailable"}</span>
            </div>
            <p className="profile-bio">{creator.bio}</p>
          </div>
          <button className={`button ${saved ? "button-secondary" : "button-primary"}`} disabled={!hydrated} onClick={save}><Bookmark size={14} fill={saved ? "currentColor" : "none"} />{saved ? "Saved to list" : "Save prospect"}</button>
        </div>
      </div>
      <div className="profile-stats">
        {creator.accounts.map((account) => <AccountMetricCards key={account.id} account={account} />)}
      </div>
      <div className="profile-content-grid">
        <section className="card">
          <div className="card-head"><div><h2 className="card-title">Platform account history</h2><p className="card-caption">Dated snapshots. Missing fields are not estimated.</p></div><CircleHelp size={15} color="#97a29a" /></div>
          {creator.accounts.map((account) => <AccountSnapshots key={account.id} account={account} />)}
          <div className="definition"><strong>Metric definitions.</strong> Growth is calculated from dated snapshots. Average concurrent viewers is the mean of collected stream-viewer snapshots over the measurement window, not a current live count. Video-view averages use recent public posts where available; the post count and measurement period must be supplied by the data source.</div>
        </section>
        <section className="card">
          <div className="card-head"><div><h2 className="card-title">Profile details</h2><p className="card-caption">Source transparency for every field</p></div></div>
          <dl className="detail-list">
            <Detail label="Creator country" value={creator.creatorCountry ?? "Unavailable"} source={creator.creatorCountrySource ?? undefined} />
            {creator.audienceInsights.filter((insight) => ["country", "audience_country"].includes(insight.dimension.toLowerCase())).length
              ? creator.audienceInsights.filter((insight) => ["country", "audience_country"].includes(insight.dimension.toLowerCase())).map((insight) =>
                <Detail key={`${insight.dimension}:${insight.value}:${insight.collectedAt}`} label={`Audience country · ${insight.value}`} value={`${insight.amount === null ? "Unavailable" : `${insight.amount} ${insight.unit}`} · ${insight.status}${insight.confidence === null ? "" : ` · confidence ${Math.round(insight.confidence * 100)}%`}`} source={`${insight.source} · ${formatDate(insight.collectedAt)}`} />
              )
              : <Detail label="Audience country" value="Unavailable" source="No licensed audience-insights source in demo data" />}
            <Detail label="Category / niche" value={creator.category ?? "Unavailable"} source="Synthetic demo record" />
            <Detail label="Language" value={creator.language ?? "Unavailable"} source="Synthetic demo record" />
            <Detail label="Latest snapshot" value={latestSnapshot(creator)} source="Synthetic demo record" />
          </dl>
          <hr className="divider" />
          <div className="card-head profile-contact-head"><div><h2 className="card-title">Public business contact</h2><p className="card-caption">Public listing only; no private contact lookups</p></div><Mail size={14} color="#97a29a" /></div>
          {creator.businessContact ? <dl className="detail-list contact-details">
            <Detail label="Email" value={<a href={`mailto:${creator.businessContact.email}`} className="source-link">{creator.businessContact.email}</a>} />
            <Detail label="Source URL" value={<a className="source-link" href={creator.businessContact.sourceUrl} target="_blank" rel="noreferrer">{creator.businessContact.sourceUrl}<ArrowUpRight size={10} /></a>} />
            <Detail label="Last checked" value={formatDate(creator.businessContact.lastChecked)} />
          </dl> : <p className="profile-empty">No public business email is available in this demo record.</p>}
          <hr className="divider" />
          {creator.accounts.map((account) => <div key={account.id} className="profile-link-row"><span><Globe2 size={13} />{account.platform} profile</span><a className="source-link" href={account.profileUrl} target="_blank" rel="noreferrer">Open example profile <ArrowUpRight size={10} /></a></div>)}
          <p className="profile-fineprint">Demo profile URLs are reserved example links and do not point to real creator accounts.</p>
        </section>
      </div>
    </>
  );
}

function AccountMetricCards({ account }: { account: PlatformAccount }) {
  const unit = account.platform === "YouTube" ? "subscribers" : "followers";
  const followers = currentFollowers(account);
  const reach = currentReach(account);
  const reachMetric = reachMetricName(account);
  const snapshot = reachMetric ? latestMetric(account, reachMetric) : undefined;
  return <section className="card metric-card"><div className="metric-account-name"><i className="platform-dot" style={{ background: platformColors[account.platform] }} />{account.platform} account</div>
    <div className="metric-row-inline">
      <div><div className="metric-label">Followers / subscribers</div><div className="metric-value">{followers === null ? "Unavailable" : formatNumber(followers)}</div><div className="metric-sub">{unit} · demo snapshot</div></div>
      <div><div className="metric-label">{platformMetricLabel(account.platform, "reach")}</div><div className="metric-value">{reach === null ? "Unavailable" : formatNumber(reach)}</div><div className="metric-sub">{reachMetric === "avg_live_viewers" ? `Mean of ${snapshot?.sampleSize ?? "?"} snapshots · ${snapshot?.periodLabel ?? "window unavailable"}` : reachMetric === "avg_video_views" ? `Mean of ${snapshot?.sampleSize ?? "?"} posts · ${snapshot?.periodLabel ?? "window unavailable"}` : "Not supplied by this platform"}</div></div>
    </div>
  </section>;
}

function AccountSnapshots({ account }: { account: PlatformAccount }) {
  return <div className="snapshot-section">
    <div className="snapshot-heading"><span className="platform-dot" style={{ background: platformColors[account.platform] }} /><strong>{account.platform}</strong><span className="creator-handle">{account.handle}</span><a href={account.profileUrl} target="_blank" rel="noreferrer" className="source-link">Example link <ArrowUpRight size={10} /></a></div>
    <div className="table-wrap"><table className="snapshot-table"><thead><tr><th>Collected</th><th>Metric</th><th>Value</th><th>Window / source</th></tr></thead><tbody>
      {account.snapshots.map((snapshot: MetricSnapshot) => <tr key={snapshot.id}><td>{formatDate(snapshot.collectedAt)}</td><td>{metricName(snapshot.metricName)}</td><td>{snapshot.value === null ? "Unavailable" : formatNumber(snapshot.value)}</td><td>{snapshot.periodLabel ?? "Point-in-time"}{snapshot.sampleSize ? ` · ${snapshot.sampleSize} items` : ""} · {snapshot.source}</td></tr>)}
    </tbody></table></div>
  </div>;
}

function Detail({ label, value, source }: { label: string; value: React.ReactNode; source?: string }) {
  return <div className="detail-row"><dt>{label}{source && <span className="detail-source"> · {source}</span>}</dt><dd>{value}</dd></div>;
}
function metricName(value: string) {
  if (value === "followers") return "Followers / subscribers";
  if (value === "avg_live_viewers") return "Average concurrent viewers";
  if (value === "avg_video_views") return "Average video views";
  return value;
}
function formatNumber(value: number) { return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value); }
function formatDate(value: string) { return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function latestSnapshot(creator: Creator) {
  const latest = creator.accounts.flatMap((account: PlatformAccount) => account.snapshots).sort((a: MetricSnapshot, b: MetricSnapshot) => b.collectedAt.localeCompare(a.collectedAt))[0];
  return latest ? formatDate(latest.collectedAt) : "Unavailable";
}
