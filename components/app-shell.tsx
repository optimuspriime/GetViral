"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight, Bookmark, Check, ChevronDown, Compass, LayoutDashboard,
  LogOut, Menu, Plus, Search, Settings2, Sparkles, X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useProspects } from "@/components/data-provider";
import { BrandMark } from "@/components/brand-mark";
import { CommandPalette } from "@/components/command-palette";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, tone: "violet" },
  { label: "Discover", href: "/discover", icon: Compass, tone: "cyan" },
  { label: "Saved Creators", href: "/lists", icon: Bookmark, tone: "coral" },
  { label: "Settings", href: "/settings", icon: Settings2, tone: "lime" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lists, workspaces, activeWorkspace, setActiveWorkspace, createWorkspace, showToast } =
    useProspects();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isCreatingWs, setIsCreatingWs] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const savedCount = new Set(lists.flatMap((list) => list.creatorIds)).size;

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (client) {
      client.auth.getUser().then(({ data }) => {
        if (data.user?.email) setUserEmail(data.user.email);
      });
    }
  }, []);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) {
        setWorkspaceOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!newWsName.trim()) return;
    createWorkspace(newWsName.trim());
    setNewWsName("");
    setIsCreatingWs(false);
    setWorkspaceOpen(false);
  }

  async function handleSignOut() {
    const client = getSupabaseBrowserClient();
    if (client) {
      await client.auth.signOut();
    }
    showToast("Signed out", "info");
    setAccountMenuOpen(false);
    router.push("/auth");
  }

  if (pathname.startsWith("/auth")) {
    return (
      <main className="auth-main">
        <Link href="/" className="auth-brand">
          <BrandMark />
          Mosaic<span className="brand-period">.</span>
        </Link>
        {children}
      </main>
    );
  }

  return (
    <div className="app-frame">
      {mobileOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => {
            setMobileOpen(false);
            setWorkspaceOpen(false);
          }}
        />
      )}

      <header className="topbar app-topbar">
        <Link href="/" className="brand" onClick={() => setMobileOpen(false)}>
          <BrandMark />
          <span>
            Mosaic<span className="brand-period">.</span>
          </span>
        </Link>

        <button
          className="mobile-menu"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          aria-controls="primary-navigation"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav
          id="primary-navigation"
          className={`top-nav ${mobileOpen ? "top-nav-open" : ""}`}
          aria-label="Main navigation"
        >
          {navigation.map(({ label, href, icon: Icon, tone }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link ${active ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <span className={`nav-icon nav-icon-${tone}`}>
                  <Icon size={17} strokeWidth={1.9} />
                </span>
                <span>{label}</span>
                {href === "/lists" && savedCount > 0 && <span className="nav-count">{savedCount}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="topbar-actions">
          {/* Quick Search */}
          <button
            className="top-search"
            aria-label="Search creators"
            onClick={() => setPaletteOpen(true)}
            type="button"
          >
            <Search size={15} />
            <span>Search creators</span>
            <kbd>⌘ K</kbd>
          </button>

          {/* Interactive Workspace Switcher */}
          <div className="workspace-relative" ref={workspaceRef}>
            <button
              className="workspace-switch top-workspace-switch"
              aria-expanded={workspaceOpen}
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              type="button"
            >
              <span className="workspace-avatar">{activeWorkspace.name.charAt(0)}</span>
              <span className="workspace-copy">
                <strong>{activeWorkspace.name}</strong>
                <small>{activeWorkspace.role}</small>
              </span>
              <ChevronDown size={14} className={workspaceOpen ? "rotate" : ""} />
            </button>

            {workspaceOpen && (
              <div className="workspace-dropdown-menu">
                <div className="ws-dropdown-header">
                  <strong>Workspaces</strong>
                  <span>Switch or create workspace</span>
                </div>
                <div className="ws-list">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      className={`ws-dropdown-item ${ws.id === activeWorkspace.id ? "active" : ""}`}
                      onClick={() => {
                        setActiveWorkspace(ws);
                        setWorkspaceOpen(false);
                      }}
                    >
                      <span className="ws-dot" />
                      <div className="ws-item-info">
                        <strong>{ws.name}</strong>
                        <small>{ws.role}</small>
                      </div>
                      {ws.id === activeWorkspace.id && <Check size={14} className="check-icon" />}
                    </button>
                  ))}
                </div>

                {isCreatingWs ? (
                  <form onSubmit={handleCreateWorkspace} className="ws-create-form">
                    <input
                      autoFocus
                      placeholder="Workspace name"
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      className="filter-input ws-input"
                    />
                    <div className="ws-create-actions">
                      <button type="submit" className="button button-primary button-sm">
                        Create
                      </button>
                      <button
                        type="button"
                        className="button button-secondary button-sm"
                        onClick={() => setIsCreatingWs(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    className="ws-create-btn"
                    onClick={() => setIsCreatingWs(true)}
                    type="button"
                  >
                    <Plus size={14} /> Create workspace
                  </button>
                )}

                <div className="ws-dropdown-footer">
                  <Link
                    href="/settings"
                    onClick={() => setWorkspaceOpen(false)}
                    className="ws-settings-link"
                  >
                    Workspace settings <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Live Platform Status Chip */}
          <div className="live-status-chip" title="Real-time multi-platform data enabled">
            <span className="status-live-pulse" />
            <Sparkles size={11} className="chip-sparkle" />
            <span>LIVE CATALOG</span>
          </div>

          {/* Interactive Account Menu */}
          <div className="account-menu-relative" ref={accountRef}>
            <button
              className="top-avatar"
              aria-label="Open user account menu"
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              type="button"
            >
              {userEmail ? userEmail.charAt(0).toUpperCase() : "A"}
            </button>

            {accountMenuOpen && (
              <div className="account-dropdown-menu">
                <div className="account-menu-head">
                  <div className="account-avatar-large">
                    {userEmail ? userEmail.charAt(0).toUpperCase() : "A"}
                  </div>
                  <div className="account-info">
                    <strong>{userEmail ? userEmail.split("@")[0] : "Alex Turner"}</strong>
                    <small>{userEmail || "alex.turner@mosaic.io"}</small>
                  </div>
                </div>

                <div className="account-menu-links">
                  <Link
                    href="/lists"
                    onClick={() => setAccountMenuOpen(false)}
                    className="account-menu-item"
                  >
                    <Bookmark size={15} />
                    <span>My Shortlists</span>
                    {savedCount > 0 && <span className="nav-count">{savedCount}</span>}
                  </Link>
                  <Link
                    href="/discover"
                    onClick={() => setAccountMenuOpen(false)}
                    className="account-menu-item"
                  >
                    <Compass size={15} />
                    <span>Discover Creators</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setAccountMenuOpen(false)}
                    className="account-menu-item"
                  >
                    <Settings2 size={15} />
                    <span>Settings & APIs</span>
                  </Link>
                </div>

                <div className="account-menu-footer">
                  <button
                    className="account-signout-btn"
                    onClick={handleSignOut}
                    type="button"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-area">
        <div className="route-crumb">
          <span>{activeWorkspace.name}</span>
          <span className="crumb-slash">/</span>
          <strong>{pageTitle(pathname)}</strong>
        </div>
        <div className="page-content">{children}</div>
      </main>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

function pageTitle(pathname: string) {
  if (pathname.startsWith("/discover")) return "Discover";
  if (pathname.startsWith("/creators")) return "Creator Profile";
  if (pathname.startsWith("/lists")) return "Prospect CRM Shortlists";
  if (pathname.startsWith("/settings")) return "Settings & Integrations";
  return "Creator Intelligence Dashboard";
}
