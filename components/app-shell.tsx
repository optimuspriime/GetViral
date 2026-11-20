"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight, Bookmark, ChevronDown, Compass, LayoutDashboard,
  Menu, Search, Settings2, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useProspects } from "@/components/data-provider";
import { BrandMark } from "@/components/brand-mark";

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, tone: "violet" },
  { label: "Discover", href: "/discover", icon: Compass, tone: "cyan" },
  { label: "Saved Creators", href: "/lists", icon: Bookmark, tone: "coral" },
  { label: "Settings", href: "/settings", icon: Settings2, tone: "lime" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lists } = useProspects();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const savedCount = new Set(lists.flatMap((list) => list.creatorIds)).size;

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        router.push("/discover");
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [router]);

  if (pathname.startsWith("/auth")) {
    return <main className="auth-main"><Link href="/" className="auth-brand"><BrandMark />Mosaic<span className="brand-period">.</span></Link>{children}</main>;
  }

  return (
    <div className="app-frame">
      {mobileOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => { setMobileOpen(false); setWorkspaceOpen(false); }} />}
      <header className="topbar app-topbar">
        <Link href="/" className="brand" onClick={() => setMobileOpen(false)}>
          <BrandMark />
          <span>Mosaic<span className="brand-period">.</span></span>
        </Link>
        <button className="mobile-menu" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} aria-controls="primary-navigation" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav id="primary-navigation" className={`top-nav ${mobileOpen ? "top-nav-open" : ""}`} aria-label="Main navigation">
          <button className="workspace-switch mobile-workspace-switch" aria-expanded={workspaceOpen} onClick={() => setWorkspaceOpen(!workspaceOpen)}>
            <span className="workspace-avatar">M</span>
            <span className="workspace-copy"><strong>Mosaic demo</strong><small>Workspace</small></span>
            <ChevronDown size={15} className={workspaceOpen ? "rotate" : ""} />
          </button>
          {workspaceOpen && mobileOpen && <div className="workspace-popover mobile-workspace-popover">
            <strong>Demo workspace</strong>
            <span>Connect Supabase to add team members and shared workspaces.</span>
            <Link href="/settings" onClick={() => { setWorkspaceOpen(false); setMobileOpen(false); }}>Workspace settings <ArrowUpRight size={13} /></Link>
          </div>}
          {navigation.map(({ label, href, icon: Icon, tone }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`nav-link ${active ? "active" : ""}`} onClick={() => setMobileOpen(false)}>
                <span className={`nav-icon nav-icon-${tone}`}><Icon size={17} strokeWidth={1.9} /></span><span>{label}</span>
                {href === "/lists" && savedCount > 0 && <span className="nav-count">{savedCount}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="topbar-actions">
          <Link href="/discover" className="top-search" aria-label="Search creators"><Search size={16} /><span>Search creators</span><kbd>⌘ K</kbd></Link>
          <button className="workspace-switch top-workspace-switch" aria-expanded={workspaceOpen} onClick={() => setWorkspaceOpen(!workspaceOpen)}>
            <span className="workspace-avatar">M</span>
            <span className="workspace-copy"><strong>Mosaic demo</strong><small>Workspace</small></span>
            <ChevronDown size={15} className={workspaceOpen ? "rotate" : ""} />
          </button>
          <span className="demo-chip"><span /> DEMO DATA</span>
          <Link href="/settings" className="top-avatar" aria-label="Open user settings">A</Link>
        </div>
        {workspaceOpen && !mobileOpen && <div className="workspace-popover top-workspace-popover">
          <strong>Demo workspace</strong>
          <span>Connect Supabase to add team members and shared workspaces.</span>
          <Link href="/settings" onClick={() => setWorkspaceOpen(false)}>Workspace settings <ArrowUpRight size={13} /></Link>
        </div>}
      </header>
      <main className="main-area">
        <div className="route-crumb"><span>Mosaic demo</span><span className="crumb-slash">/</span><strong>{pageTitle(pathname)}</strong></div>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

function pageTitle(pathname: string) {
  if (pathname.startsWith("/discover")) return "Discover";
  if (pathname.startsWith("/creators")) return "Creator profile";
  if (pathname.startsWith("/lists")) return "My lists";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Dashboard";
}
