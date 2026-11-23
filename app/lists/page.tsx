"use client";

import Link from "next/link";
import {
  Bookmark, Download, FolderPlus, Plus, Trash2, Users, Pencil, Check, X,
  Share2, Sparkles, Mail
} from "lucide-react";
import { useMemo, useState } from "react";
import { useProspects } from "@/components/data-provider";
import { platformColors } from "@/lib/platforms";
import { currentFollowers, currentReach, reachMetricName } from "@/lib/metrics";
import type { ProspectStatus } from "@/lib/model";
import { getCountryFlag } from "@/lib/country-detector";

const prospectStatuses: ProspectStatus[] = ["To review", "Shortlisted", "Contacted", "Partnered"];

export default function ListsPage() {
  const {
    creators: allCreators,
    lists,
    hydrated,
    storageError,
    createList,
    deleteList,
    renameList,
    removeCreator,
    updateNote,
    updateTags,
    updateStatus,
    showToast,
  } = useProspects();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>({});

  const selected = lists.find((list) => list.id === selectedId) ?? lists[0] ?? null;
  const creators = useMemo(
    () =>
      selected?.creatorIds
        .map((id) => allCreators.find((creator) => creator.id === id))
        .filter((creator): creator is (typeof allCreators)[number] => !!creator) ?? [],
    [allCreators, selected],
  );

  function submitList(event: React.FormEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const id = createList(name);
    setSelectedId(id);
    setNewName("");
    setIsCreating(false);
  }

  function handleRename(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !renameDraft.trim()) return;
    renameList(selected.id, renameDraft.trim());
    setIsRenaming(false);
  }

  function handleDeleteCurrentList() {
    if (!selected) return;
    if (confirm(`Are you sure you want to delete the list "${selected.name}"?`)) {
      deleteList(selected.id);
      setSelectedId(null);
    }
  }

  function exportList() {
    if (!selected) return;
    const rows = [
      [
        "Creator",
        "Platform",
        "Handle",
        "Profile URL",
        "Category",
        "Country",
        "Followers / Subscribers",
        "Reach Metric",
        "Reach Value",
        "Prospect Status",
        "Notes",
        "Tags",
      ],
    ];

    creators.forEach((creator) => {
      creator.accounts.forEach((account) =>
        rows.push([
          creator.name,
          account.platform,
          account.handle,
          account.profileUrl,
          creator.category ?? "",
          creator.creatorCountry ?? "",
          currentFollowers(account)?.toString() ?? "",
          reachMetricName(account) === "avg_live_viewers"
            ? "Average Concurrent Viewers"
            : reachMetricName(account) === "avg_video_views"
            ? "Average Video Views"
            : "",
          currentReach(account)?.toString() ?? "",
          selected.statuses[creator.id] ?? "To review",
          selected.notes[creator.id] ?? "",
          (selected.tags?.[creator.id] ?? []).join("; "),
        ]),
      );
    });

    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFilename(selected.name)}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Exported "${selected.name}" shortlist CSV!`, "success");
  }

  function copySummary() {
    if (!selected) return;
    const text = `Shortlist: ${selected.name} (${creators.length} creators)\n${creators
      .map(
        (c) =>
          `• ${c.name} (${c.accounts[0]?.platform} ${c.accounts[0]?.handle}) - Status: ${
            selected.statuses[c.id] || "To review"
          }`,
      )
      .join("\n")}`;
    navigator.clipboard.writeText(text);
    showToast("Copied shortlist summary to clipboard!", "success");
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Sparkles size={12} className="inline-icon" /> PROSPECT CRM & SHORTLISTS
          </div>
          <h1>Campaign Shortlists & Outreach CRM.</h1>
          <p className="page-subtitle">
            Organize prospective partners, track outreach status, and collaborate on creator campaigns.
          </p>
        </div>
        <div className="page-heading-actions">
          <Link href="/discover" className="button button-primary">
            <Users size={14} /> Find & Add Creators
          </Link>
        </div>
      </div>

      {/* Demo Fixtures Notice for Visitors / Unauthenticated Users */}
      <div
        className="demo-fixtures-banner"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "13px 16px",
          background: "#fffbeb",
          border: "1px solid #fef3c7",
          borderRadius: 10,
          marginBottom: 16,
          color: "#92400e",
          fontSize: "12px",
          lineHeight: 1.5,
        }}
        role="status"
      >
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
        <div>
          <strong style={{ display: "block", color: "#78350f", marginBottom: 2 }}>
            Demo Campaign Shortlist (Sample Fixtures Preview)
          </strong>
          <span>
            You are viewing sample CRM shortlist fixtures with demonstration notes, tags, and outreach statuses.
            These sample records illustrate shortlist workflow and CRM staging. To create, save, and manage your private,
            secure workspace shortlists across devices, please{" "}
            <Link href="/auth" style={{ color: "#b45309", fontWeight: 700, textDecoration: "underline" }}>
              Sign In
            </Link>.
          </span>
        </div>
      </div>

      {storageError && (
        <div className="storage-error" role="alert">
          {storageError}
        </div>
      )}

      {!hydrated ? (
        <div className="card loading-card">Loading your shortlists…</div>
      ) : (
        <div className="list-layout">
          {/* Sidebar */}
          <aside className="card list-sidebar">
            <div className="list-sidebar-head">
              <strong>Your Lists ({lists.length})</strong>
              <button
                className="icon-button"
                onClick={() => setIsCreating(!isCreating)}
                aria-label="Create list"
                title="Create new list"
                type="button"
              >
                <Plus size={16} />
              </button>
            </div>

            {isCreating && (
              <form className="new-list-form" onSubmit={submitList}>
                <input
                  autoFocus
                  className="filter-input"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="New list name..."
                  aria-label="New list name"
                />
                <div className="new-list-actions">
                  <button className="button button-primary button-sm" type="submit">
                    Create
                  </button>
                  <button
                    className="button button-secondary button-sm"
                    type="button"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="list-nav-items">
              {lists.map((list) => (
                <button
                  key={list.id}
                  className={`list-item ${selected?.id === list.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedId(list.id);
                    setIsRenaming(false);
                  }}
                  type="button"
                >
                  <Bookmark size={14} />
                  <span>{list.name}</span>
                  {list.id === "list-default-shortlist" && (
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "1px 5px",
                        borderRadius: 4,
                        background: "#fef3c7",
                        color: "#92400e",
                        marginLeft: "auto",
                        marginRight: 6,
                      }}
                    >
                      Fixture
                    </span>
                  )}
                  <span className="list-item-count">{list.creatorIds.length}</span>
                </button>
              ))}
            </div>

            {!lists.length && !isCreating && (
              <div className="mini-empty">
                <FolderPlus size={20} />
                <span>No lists yet</span>
                <button onClick={() => setIsCreating(true)} type="button">
                  Create a list
                </button>
              </div>
            )}
          </aside>

          {/* Main Area */}
          <section className="list-main">
            {selected ? (
              <>
                <div className="list-main-head">
                  <div className="list-title-area">
                    {isRenaming ? (
                      <form onSubmit={handleRename} className="rename-form">
                        <input
                          autoFocus
                          className="filter-input"
                          value={renameDraft}
                          onChange={(e) => setRenameDraft(e.target.value)}
                        />
                        <button type="submit" className="button button-primary button-sm">
                          <Check size={13} />
                        </button>
                        <button
                          type="button"
                          className="button button-secondary button-sm"
                          onClick={() => setIsRenaming(false)}
                        >
                          <X size={13} />
                        </button>
                      </form>
                    ) : (
                      <div className="list-title-row">
                        <h2>{selected.name}</h2>
                        <button
                          className="icon-button"
                          onClick={() => {
                            setRenameDraft(selected.name);
                            setIsRenaming(true);
                          }}
                          title="Rename this list"
                          type="button"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="icon-button delete-list-btn"
                          onClick={handleDeleteCurrentList}
                          title="Delete this list"
                          type="button"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                    <p>
                      {creators.length} {creators.length === 1 ? "creator" : "creators"} shortlisted
                      in this workspace
                    </p>
                  </div>

                  <div className="list-actions">
                    <button
                      className="button button-secondary button-sm"
                      disabled={!creators.length}
                      onClick={copySummary}
                      type="button"
                    >
                      <Share2 size={13} /> Copy Summary
                    </button>
                    <button
                      className="button button-secondary button-sm"
                      disabled={!creators.length}
                      onClick={exportList}
                      type="button"
                    >
                      <Download size={13} /> Export CSV
                    </button>
                  </div>
                </div>

                <div className="card list-content-card">
                  {!creators.length ? (
                    <div className="empty-state">
                      <span className="empty-icon">
                        <Bookmark size={20} />
                      </span>
                      <strong>This shortlist is waiting for its first creator</strong>
                      <p>
                        Browse verified discovery results and click the bookmark icon on any creator.
                      </p>
                      <Link className="button button-primary button-sm" href="/discover">
                        Discover Creators Now
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="list-row list-row-header">
                        <span>Creator</span>
                        <span>Platform</span>
                        <span>Notes & Tags</span>
                        <span>Outreach Status</span>
                        <span aria-label="Actions" />
                      </div>

                      {creators.map((creator) => {
                        const account = creator.accounts[0];
                        const tagKey = `${selected.id}:${creator.id}`;

                        return (
                          <div key={creator.id} className="list-row prospect-row">
                            <div className="list-creator-col">
                              <Link href={`/creators/${creator.id}`} className="creator-cell">
                                <span className="creator-avatar">
                                  {creator.avatar && creator.avatar.startsWith("http") ? (
                                    <img
                                      src={creator.avatar}
                                      alt={creator.name}
                                      className="avatar-table-img"
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : null}
                                  <span>{creator.name.slice(0, 2).toUpperCase()}</span>
                                </span>
                                <span className="creator-meta-wrap">
                                  <span className="creator-name">{creator.name}</span>
                                  <span className="creator-handle">
                                    {account?.handle} · {getCountryFlag(creator.creatorCountry)}{" "}
                                    {creator.creatorCountry ?? "Global"}
                                  </span>
                                  {creator.businessContact?.email && (
                                    <span
                                      className="creator-list-email-badge"
                                      title={`Verified contact: ${creator.businessContact.email}`}
                                    >
                                      <Mail size={10} style={{ verticalAlign: "-1px", marginRight: 4 }} />
                                      {creator.businessContact.email}
                                    </span>
                                  )}
                                </span>
                              </Link>
                            </div>

                            <div className="list-platform-col">
                              {account && (
                                <span
                                  className={`platform-label platform-badge platform-${account.platform.toLowerCase()} list-platform`}
                                >
                                  <i
                                    className="platform-dot"
                                    style={{ background: platformColors[account.platform] }}
                                  />
                                  {account.platform}
                                </span>
                              )}
                            </div>

                            <div className="list-note">
                              <textarea
                                className="note-input"
                                aria-label={`Notes for ${creator.name}`}
                                placeholder="Add campaign notes, angle, or deliverables…"
                                value={selected.notes[creator.id] ?? ""}
                                onChange={(event) =>
                                  updateNote(selected.id, creator.id, event.target.value)
                                }
                                rows={2}
                              />
                              <input
                                className="tag-input"
                                aria-label={`Tags for ${creator.name}`}
                                placeholder="Tags, comma separated (e.g. Q4 Sponsor, Tech)"
                                value={
                                  tagDrafts[tagKey] ??
                                  (selected.tags?.[creator.id] ?? []).join(", ")
                                }
                                onChange={(event) =>
                                  setTagDrafts((current) => ({
                                    ...current,
                                    [tagKey]: event.target.value,
                                  }))
                                }
                                onBlur={() =>
                                  updateTags(
                                    selected.id,
                                    creator.id,
                                    [
                                      ...new Set(
                                        (
                                          tagDrafts[tagKey] ??
                                          (selected.tags?.[creator.id] ?? []).join(", ")
                                        )
                                          .split(",")
                                          .map((tag) => tag.trim())
                                          .filter(Boolean),
                                      ),
                                    ],
                                  )
                                }
                              />
                            </div>

                            <div className="list-status">
                              <select
                                aria-label={`Prospect status for ${creator.name}`}
                                className={`status-select status-select-${(
                                  selected.statuses[creator.id] ?? "To review"
                                )
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")}`}
                                value={selected.statuses[creator.id] ?? "To review"}
                                onChange={(event) =>
                                  updateStatus(
                                    selected.id,
                                    creator.id,
                                    event.target.value as ProspectStatus,
                                  )
                                }
                              >
                                {prospectStatuses.map((status) => (
                                  <option key={status}>{status}</option>
                                ))}
                              </select>
                            </div>

                            <button
                              className="icon-button list-remove"
                              onClick={() => removeCreator(selected.id, creator.id)}
                              aria-label={`Remove ${creator.name} from list`}
                              title="Remove from shortlist"
                              type="button"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="card list-empty-state">
                <div className="empty-state">
                  <span className="empty-icon">
                    <FolderPlus size={20} />
                  </span>
                  <strong>Create a campaign shortlist</strong>
                  <p>Organize creators by brand, niche, or campaign timeline.</p>
                  <button
                    className="button button-primary button-sm"
                    onClick={() => setIsCreating(true)}
                    type="button"
                  >
                    <Plus size={13} /> Create a list
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "creator-list";
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
