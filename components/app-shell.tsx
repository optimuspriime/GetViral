"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight, Bookmark, Check, ChevronDown, Compass, LayoutDashboard,
  LogOut, LogIn, Menu, Plus, Search, Settings2, Sparkles, X, RefreshCw, Zap
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useProspects } from "@/components/data-provider";
import { BrandMark } from "@/components/brand-mark";
import { CommandPalette } from "@/components/command-palette";
import { PricingModal } from "@/components/pricing-modal";
import { CreatorProfileModal } from "@/components/creator-profile-modal";
import { CookieBanner } from "@/components/cookie-banner";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, tone: "violet" },
  { label: "Discover", href: "/discover", icon: Compass, tone: "cyan" },
  { label: "Saved Creators", href: "/lists", icon: Bookmark, tone: "coral" },
  { label: "Settings", href: "/settings", icon: Settings2, tone: "lime" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    lists,
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    createWorkspace,
    showToast,
    isSyncing,
    syncAllPlatforms,
    subscription,
    userRole,
    userEmail,
    isGuest,
    setPricingModalOpen,
    setCreatorModalOpen,
  } = useProspects();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isCreatingWs, setIsCreatingWs] = useState(false);
  const [newWsName, setNewWsName] = useState("");

  const workspaceRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const savedCount = new Set(lists.flatMap((list) => list.creatorIds)).size;

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
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("mosaic_user_session");
      document.cookie = "mosaic_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    showToast("Signed out successfully", "info");
    setAccountMenuOpen(false);
    window.location.assign("/auth");
  }

  if (pathname.startsWith("/auth")) {
    return (
      <main className="auth-main">
        <Link href="/" className="auth-brand">
          <BrandMark />
          GetViral<span className="brand-period">.</span>
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
            GetViral<span className="brand-period">.</span>
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
          {isGuest && mobileOpen && (
            <Link
              href="/auth"
              className="nav-link nav-signin-link"
              onClick={() => setMobileOpen(false)}
            >
              <span className="nav-icon nav-icon-violet">
                <LogIn size={17} strokeWidth={1.9} />
              </span>
              <span>Sign In</span>
            </Link>
          )}
        </nav>

        <div className="topbar-actions">
          {/* Creator Profile Button (Role-based) */}
          {userRole === "creator" && (
            <button
              type="button"
              className="topbar-creator-btn"
              onClick={() => setCreatorModalOpen(true)}
              title="Publish or update your creator profile"
            >
              <Sparkles size={13} />
              <span className="creator-btn-text">My Profile</span>
            </button>
          )}

          {/* Search Quota Indicator & Upgrade Pill */}
          <button
            type="button"
            className="topbar-quota-pill"
            onClick={() => setPricingModalOpen(true)}
            title={`Current Plan: ${subscription.planId.toUpperCase()} (${
              subscription.totalQuota === -1
                ? "Unlimited"
                : `${subscription.searchesRemaining} of ${subscription.totalQuota}`
            } searches remaining). Click to view plans & upgrade.`}
            aria-label="Subscription and search quota"
            suppressHydrationWarning
          >
            <Zap size={13} className="text-amber" />
            <span className="quota-pill-label" suppressHydrationWarning>
              {subscription.totalQuota === -1
                ? "Unlimited"
                : `${subscription.searchesRemaining} / ${subscription.totalQuota}`}
            </span>
            <span className="quota-pill-badge">Plans</span>
          </button>

          {/* Quick Platform Sync */}
          <button
            className="icon-button topbar-sync-btn"
            onClick={() => {
              if (isGuest) {
                showToast("Sign in required: Guest sandbox sessions cannot trigger platform sync.", "error");
                return;
              }
              void syncAllPlatforms();
            }}
            disabled={isGuest || isSyncing}
            title={
              isGuest
                ? "Sign in as workspace owner or admin to trigger live platform sync"
                : "Sync and refresh data across YouTube, Twitch, Kick, TikTok & Instagram APIs"
            }
            type="button"
            aria-label="Sync all platform data"
            style={isGuest ? { opacity: 0.65, cursor: "not-allowed" } : undefined}
          >
            <RefreshCw size={14} className={isSyncing ? "spin-icon text-green" : ""} />
          </button>

          {/* Quick Search */}
          <button
            className="top-search"
            aria-label="Search creators"
            onClick={() => setPaletteOpen(true)}
            type="button"
          >
            <Search size={15} />
            <span className="top-search-label">Search creators</span>
            <kbd>⌘ K</kbd>
          </button>

          {/* Sign In Button on Side for Guests */}
          {isGuest && (
            <Link
              href="/auth"
              className="topbar-signin-pill"
              title="Sign In or Register to GetViral"
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </Link>
          )}

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
            <span>LIVE PLATFORMS</span>
          </div>

          {/* Interactive Account Menu */}
          <div className="account-menu-relative" ref={accountRef}>
            <button
              className="top-avatar"
              aria-label="Open user account menu"
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              type="button"
            >
              {isGuest ? "G" : userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
            </button>

            {accountMenuOpen && (
              <div className="account-dropdown-menu">
                <div className="account-menu-head">
                  <div className="account-avatar-large">
                    {isGuest ? "G" : userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="account-info">
                    <strong>{isGuest ? "Guest Explorer" : userEmail ? userEmail.split("@")[0] : "Workspace User"}</strong>
                    <small>
                      {isGuest
                        ? `Guest Sandbox (${subscription.searchesRemaining} / ${subscription.totalQuota} searches)`
                        : userEmail || "Authenticated Workspace"}
                    </small>
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

                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      setPricingModalOpen(true);
                    }}
                    className="account-menu-item"
                  >
                    <Zap size={15} className="text-amber" />
                    <span>Plans & Search Quotas</span>
                  </button>

                  {userRole === "creator" && (
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        setCreatorModalOpen(true);
                      }}
                      className="account-menu-item"
                    >
                      <Sparkles size={15} />
                      <span>Edit / Claim Creator Profile</span>
                    </button>
                  )}
                </div>

                <div className="account-menu-footer">
                  {isGuest ? (
                    <Link
                      href="/auth"
                      className="account-signout-btn guest-signin-btn"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <LogIn size={14} />
                      <span>Sign In / Register</span>
                    </Link>
                  ) : (
                    <button
                      className="account-signout-btn"
                      onClick={handleSignOut}
                      type="button"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  )}
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

      {/* Subscription Pricing Modal */}
      <PricingModal />

      {/* Creator Profile Creation & Claiming Modal */}
      <CreatorProfileModal />

      {/* Cookie Consent Banner */}
      <CookieBanner />
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
