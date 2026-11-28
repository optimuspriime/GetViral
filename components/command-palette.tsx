"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Activity, Search, X, Compass, LayoutDashboard, Bookmark, Settings2, ArrowRight } from "lucide-react";
import { useProspects } from "@/components/data-provider";
import { platformColors } from "@/lib/platforms";
import { currentFollowers } from "@/lib/metrics";
import { getCountryFlag } from "@/lib/country-detector";
import { useDialogAccessibility } from "@/lib/use-dialog-accessibility";

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const { creators } = useProspects();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef(true);

  useDialogAccessibility(isOpen, onClose, dialogRef, inputRef, restoreFocusRef);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredCreators = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return creators.slice(0, 6);
    return creators
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.accounts.some((a) => a.handle.toLowerCase().includes(q)) ||
          (c.category && c.category.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [creators, query]);

  const quickNav = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Discover Creators", href: "/discover", icon: Compass },
    { label: "Creator Analytics Studio", href: "/analytics", icon: Activity },
    { label: "Saved Creators", href: "/lists", icon: Bookmark },
    { label: "Account & Settings", href: "/settings", icon: Settings2 },
  ];

  function handleSelectCreator(id: string) {
    restoreFocusRef.current = false;
    onClose();
    router.push(`/creators/${id}`);
  }

  function handleNav(href: string) {
    restoreFocusRef.current = false;
    onClose();
    router.push(href);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCreators.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCreators.length) % Math.max(1, filteredCreators.length));
      } else if (e.key === "Enter" && filteredCreators[selectedIndex]) {
        e.preventDefault();
        restoreFocusRef.current = false;
        onClose();
        router.push(`/creators/${filteredCreators[selectedIndex].id}`);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCreators, onClose, router]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="command-palette-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="command-palette-title" className="sr-only">
          Quick Search and Navigation
        </h2>
        <div className="command-palette-search">
          <Search size={18} className="search-icon-muted" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search creators, handles, categories, or quick jump..."
            aria-label="Command palette search"
          />
          {query ? (
            <button className="icon-btn-clear" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={15} />
            </button>
          ) : (
            <kbd className="esc-badge">ESC</kbd>
          )}
        </div>

        <div className="command-palette-body">
          {filteredCreators.length > 0 && (
            <div className="palette-section">
              <div className="palette-section-title">CREATORS ({filteredCreators.length})</div>
              <div className="palette-list">
                {filteredCreators.map((creator, idx) => {
                  const account = creator.accounts[0];
                  const followers = account ? currentFollowers(account) : null;
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={creator.id}
                      className={`palette-item ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectCreator(creator.id)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div className="palette-avatar">
                        {creator.avatar && creator.avatar.startsWith("http") ? (
                          <img
                            src={creator.avatar}
                            alt={creator.name}
                            className="avatar-img"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : null}
                        <span>{creator.name.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="palette-item-info">
                        <strong>{creator.name}</strong>
                        <small>
                          {account?.handle} · {creator.category} · {getCountryFlag(creator.creatorCountry)}{" "}
                          {creator.creatorCountry}
                        </small>
                      </div>
                      <div className="palette-item-meta">
                        {account && (
                          <span
                            className="platform-dot-badge"
                            style={{
                              backgroundColor: `${platformColors[account.platform]}18`,
                              color: platformColors[account.platform],
                            }}
                          >
                            <i
                              className="platform-dot-small"
                              style={{ backgroundColor: platformColors[account.platform] }}
                            />
                            {account.platform}
                          </span>
                        )}
                        {followers !== null && (
                          <span className="followers-count">
                            {new Intl.NumberFormat("en", { notation: "compact" }).format(followers)}{" "}
                            {account?.platform === "YouTube" ? "subs" : "followers"}
                          </span>
                        )}
                        <ArrowRight size={13} className="hover-arrow" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!query && (
            <div className="palette-section">
              <div className="palette-section-title">QUICK NAVIGATION</div>
              <div className="palette-quick-grid">
                {quickNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      className="palette-quick-btn"
                      onClick={() => handleNav(item.href)}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredCreators.length === 0 && (
            <div className="palette-empty">
              <p>No creators found matching &ldquo;{query}&rdquo;</p>
              <button
                className="button button-secondary button-sm"
                onClick={() => handleNav(`/discover?q=${encodeURIComponent(query)}`)}
              >
                Search all discovery filters
              </button>
            </div>
          )}
        </div>

        <div className="command-palette-footer">
          <span>Navigate with <kbd>↑</kbd> <kbd>↓</kbd></span>
          <span>Select with <kbd>↵</kbd></span>
          <span>Close with <kbd>ESC</kbd></span>
        </div>
      </div>
    </div>
  );
}
