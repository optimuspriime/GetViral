"use client";

import Link from "next/link";
import { Bookmark, Download, FolderPlus, Plus, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useProspects } from "@/components/data-provider";
import { platformColors } from "@/lib/platforms";
import { currentFollowers, currentReach, latestMetric, reachMetricName } from "@/lib/metrics";
import type { ProspectStatus } from "@/lib/model";

const prospectStatuses: ProspectStatus[] = ["To review", "Shortlisted", "Contacted", "Partnered"];

export default function ListsPage() {
  const { creators: allCreators, lists, hydrated, storageError, createList, removeCreator, updateNote, updateTags, updateStatus } = useProspects();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>({});
  const selected = lists.find((list) => list.id === selectedId) ?? lists[0] ?? null;
  const creators = useMemo(() => selected?.creatorIds
    .map((id) => allCreators.find((creator) => creator.id === id))
    .filter((creator): creator is (typeof allCreators)[number] => !!creator) ?? [], [allCreators, selected]);

  function submitList(event: React.FormEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const id = createList(name);
    setSelectedId(id);
    setNewName("");
    setIsCreating(false);
  }

  function exportList() {
    if (!selected) return;
    const rows = [["Creator", "Platform", "Handle", "Profile URL", "Category", "Country", "Followers / subscribers", "Reach metric", "Reach", "Reach sample size", "Reach window", "Reach source", "Prospect status", "Notes", "Tags"]];
    creators.forEach((creator) => {
      creator.accounts.forEach((account) => rows.push([
        creator.name, account.platform, account.handle, account.profileUrl, creator.category ?? "",
        creator.creatorCountry ?? "", currentFollowers(account)?.toString() ?? "",
        reachMetricName(account) === "avg_live_viewers" ? "Average concurrent viewers" : reachMetricName(account) === "avg_video_views" ? "Average views per video" : "",
        currentReach(account)?.toString() ?? "",
        latestMetric(account, reachMetricName(account) ?? "")?.sampleSize?.toString() ?? "",
        latestMetric(account, reachMetricName(account) ?? "")?.periodLabel ?? "",
        latestMetric(account, reachMetricName(account) ?? "")?.source ?? "",
        selected.statuses[creator.id] ?? "To review", selected.notes[creator.id] ?? "",
        (selected.tags?.[creator.id] ?? []).join("; "),
      ]));
    });
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFilename(selected.name)}-demo.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <div className="page-heading">
        <div><div className="eyebrow">PROSPECT CRM</div><h1>Your saved creators.</h1><p className="page-subtitle">Organize prospects, add context, and keep your shortlist moving.</p></div>
        <Link href="/discover" className="button button-primary"><Users size={14} /> Find creators</Link>
      </div>
      <div className="demo-banner"><span className="banner-dot" /><span>Lists, notes, tags, and status are browser-local in this MVP; they are not yet synced across workspace members.</span></div>
      {storageError && <div className="storage-error" role="alert">{storageError}</div>}
      {!hydrated ? <div className="card loading-card">Loading your saved lists…</div> : <div className="list-layout">
        <aside className="card list-sidebar">
          <div className="list-sidebar-head"><strong>Saved lists</strong><button className="icon-button" onClick={() => setIsCreating(!isCreating)} aria-label="Create list"><Plus size={15} /></button></div>
          {isCreating && <form className="new-list-form" onSubmit={submitList}><input autoFocus className="filter-input" value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="List name" aria-label="New list name" /><button className="button button-primary button-sm" type="submit">Create</button></form>}
          {lists.map((list) => <button key={list.id} className={`list-item ${selected?.id === list.id ? "selected" : ""}`} onClick={() => setSelectedId(list.id)}><Bookmark size={14} /><span>{list.name}</span><span className="list-item-count">{list.creatorIds.length}</span></button>)}
          {!lists.length && !isCreating && <div className="mini-empty"><FolderPlus size={20} /><span>No lists yet</span><button onClick={() => setIsCreating(true)}>Create a list</button></div>}
        </aside>
        <section className="list-main">
          {selected ? <>
            <div className="list-main-head"><div><h2>{selected.name}</h2><p>{creators.length} {creators.length === 1 ? "creator" : "creators"} · saved locally in demo mode</p></div><button className="button button-secondary button-sm" disabled={!creators.length} onClick={exportList}><Download size={13} /> Export list</button></div>
            <div className="card list-content-card">
              {!creators.length ? <div className="empty-state"><span className="empty-icon"><Bookmark size={18} /></span><strong>Your list is ready for its first prospect</strong><p>Save creators while browsing discovery results, or start exploring now.</p><Link className="button button-primary button-sm" href="/discover">Discover creators</Link></div> : <>
                <div className="list-row list-row-header"><span>Creator</span><span>Platform</span><span>Notes & tags</span><span>Status</span><span /></div>
                {creators.map((creator) => {
                  const account = creator.accounts[0];
                  const tagKey = `${selected.id}:${creator.id}`;
                  return <div key={creator.id} className="list-row prospect-row">
                    <Link href={`/creators/${creator.id}`} className="creator-cell"><span className="creator-avatar">{creator.avatar}</span><span><span className="creator-name">{creator.name}</span><span className="creator-handle">{account.handle}</span></span></Link>
                    <span className={`platform-label platform-badge platform-${account.platform.toLowerCase()} list-platform`}><i className="platform-dot" style={{ background: platformColors[account.platform] }} />{account.platform}</span>
                    <div className="list-note"><textarea className="note-input" aria-label={`Notes for ${creator.name}`} placeholder="Add a note…" value={selected.notes[creator.id] ?? ""} onChange={(event) => updateNote(selected.id, creator.id, event.target.value)} rows={2} /><input className="tag-input" aria-label={`Tags for ${creator.name}`} placeholder="Tags, comma separated" value={tagDrafts[tagKey] ?? (selected.tags?.[creator.id] ?? []).join(", ")} onChange={(event) => setTagDrafts((current) => ({ ...current, [tagKey]: event.target.value }))} onBlur={() => updateTags(selected.id, creator.id, [...new Set((tagDrafts[tagKey] ?? (selected.tags?.[creator.id] ?? []).join(", ")).split(",").map((tag) => tag.trim()).filter(Boolean))])} /></div>
                    <div className="list-status"><select aria-label={`Prospect status for ${creator.name}`} className="status-select" value={selected.statuses[creator.id] ?? "To review"} onChange={(event) => updateStatus(selected.id, creator.id, event.target.value as ProspectStatus)}>{prospectStatuses.map((status) => <option key={status}>{status}</option>)}</select></div>
                    <button className="icon-button list-remove" onClick={() => removeCreator(selected.id, creator.id)} aria-label={`Remove ${creator.name} from list`} title="Remove from list"><Trash2 size={14} /></button>
                  </div>;
                })}
              </>}
            </div>
          </> : <div className="card list-empty-state"><div className="empty-state"><span className="empty-icon"><FolderPlus size={18} /></span><strong>Create your first shortlist</strong><p>Save creators, track progress, and add notes that stay with your team.</p><button className="button button-primary button-sm" onClick={() => setIsCreating(true)}><Plus size={13} /> Create a list</button></div></div>}
        </section>
      </div>}
      <p className="storage-disclaimer"><span className="status-pill">Browser-local</span> CRM edits stay on this device. Supabase migrations define workspace-scoped RLS, but a database sync adapter is not enabled yet.</p>
    </>
  );
}

function safeFilename(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "creator-list"; }
function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
