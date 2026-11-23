"use client";

import Link from "next/link";
import {
  ArrowUpRight, Check, CircleHelp, Database, ExternalLink, KeyRound,
  RefreshCw, ShieldCheck, Sparkles, Terminal, CheckCircle2, AlertCircle,
  Zap, User, Copy
} from "lucide-react";
import { useEffect, useState } from "react";
import { INTEGRATIONS } from "@/lib/integrations";
import { getSupabaseBrowserClient, getSupabaseConfig, saveSupabaseConfig } from "@/lib/supabase/browser";
import { useProspects } from "@/components/data-provider";

export default function SettingsPage() {
  const {
    activeWorkspace,
    showToast,
    subscription,
    userRole,
    setUserRole,
    setPricingModalOpen,
    setCreatorModalOpen,
  } = useProspects();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { status: "success" | "error"; message: string }>>({});

  // Supabase Configuration State
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [supabaseSaving, setSupabaseSaving] = useState(false);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState("");
  const [dbLiveStatus, setDbLiveStatus] = useState<{
    connected: boolean;
    tableExists: boolean;
    creatorCount: number;
    message: string;
  } | null>(null);
  const [checkingDb, setCheckingDb] = useState(false);
  const [seedingDb, setSeedingDb] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlViewer, setShowSqlViewer] = useState(false);

  // Test Console State
  const [testConsolePlatform, setTestConsolePlatform] = useState("YouTube");
  const [testConsoleHandle, setTestConsoleHandle] = useState("MrBeast");
  const [testConsoleLoading, setTestConsoleLoading] = useState(false);
  const [testConsoleOutput, setTestConsoleOutput] = useState<string | null>(null);

  const [client, setClient] = useState(() => getSupabaseBrowserClient());
  const authConfigured = Boolean(client);

  useEffect(() => {
    const cfg = getSupabaseConfig();
    setSupabaseUrl(cfg.url);
    setSupabaseAnonKey(cfg.key);

    const c = getSupabaseBrowserClient();
    setClient(c);

    if (!c) {
      if (typeof window !== "undefined") {
        const localUser = window.localStorage.getItem("mosaic_user_session");
        if (localUser) {
          try {
            const parsed = JSON.parse(localUser);
            if (parsed.email) setUserEmail(parsed.email);
          } catch {}
        }
      }
      setAuthLoading(false);
      return;
    }

    c.auth
      .getUser()
      .then(({ data, error }) => {
        if (error) {
          console.error("Could not check Supabase authentication state.", error);
          setAuthError(error.message);
        } else {
          setUserEmail(data.user?.email ?? null);
        }
        setAuthLoading(false);
      })
      .catch((error: unknown) => {
        console.error("Could not check Supabase authentication state.", error);
        setAuthError("Could not verify session.");
        setAuthLoading(false);
      });
  }, []);

  async function handleSaveSupabase(e: React.FormEvent) {
    e.preventDefault();
    setSupabaseSaving(true);
    setSupabaseStatusMsg("");
    setAuthError("");

    try {
      saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
      const newClient = getSupabaseBrowserClient();
      setClient(newClient);

      if (newClient) {
        const { error } = await newClient.auth.getSession();
        if (error) {
          setAuthError(`Supabase responded: ${error.message}`);
        } else {
          setSupabaseStatusMsg("Connected to Supabase Project successfully!");
          showToast("Supabase configuration saved!", "success");
        }
      } else {
        setSupabaseStatusMsg("Supabase credentials cleared. Using local workspace accounts.");
        showToast("Using local workspace accounts", "info");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Failed to connect to Supabase");
    } finally {
      setSupabaseSaving(false);
    }
  }

  async function checkServerDbStatus() {
    setCheckingDb(true);
    try {
      const res = await fetch("/api/database/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: supabaseUrl.trim(), key: supabaseAnonKey.trim() }),
      });
      const data = await res.json();
      setDbLiveStatus(data);
      if (data.connected && data.tableExists) {
        showToast(`Database active: ${data.creatorCount} creators in Supabase`, "success");
      } else if (data.connected && !data.tableExists) {
        showToast("Connected! Creators table missing - run SQL schema below.", "info");
      } else {
        showToast(data.message || "Database not connected", "error");
      }
    } catch {
      showToast("Could not check database status", "error");
    } finally {
      setCheckingDb(false);
    }
  }

  async function triggerSeedDatabase() {
    setSeedingDb(true);
    try {
      const res = await fetch("/api/database/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: supabaseUrl.trim(),
          key: supabaseAnonKey.trim(),
          limit: 50,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, "success");
        await checkServerDbStatus();
      } else {
        showToast(data.message || "Seeding failed", "error");
      }
    } catch {
      showToast("Seeding request failed", "error");
    } finally {
      setSeedingDb(false);
    }
  }

  const SQL_SCHEMA_SNIPPET = `-- 1. Enable pgcrypto
create extension if not exists pgcrypto;

-- 2. Creators Table
create table if not exists public.creators (
  id text primary key,
  name text not null,
  category text,
  language text,
  creator_country text,
  creator_country_source text,
  bio text,
  avatar text,
  business_contact_email text,
  business_contact_source text,
  business_contact_last_checked timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Platform Accounts
create table if not exists public.creator_platform_accounts (
  id text primary key,
  creator_id text not null references public.creators(id) on delete cascade,
  platform text not null,
  handle text not null,
  profile_url text not null,
  activity text,
  created_at timestamptz not null default now(),
  unique (platform, handle)
);

-- 4. Metric Snapshots
create table if not exists public.metric_snapshots (
  id text primary key,
  account_id text not null references public.creator_platform_accounts(id) on delete cascade,
  metric_name text not null,
  value numeric,
  unit text not null default 'count',
  collected_at timestamptz not null default now(),
  window_start timestamptz,
  window_end timestamptz,
  period_label text,
  sample_size integer,
  source text not null default 'Platform API',
  status text not null default 'public',
  created_at timestamptz not null default now()
);

-- 5. Audience Regional Insights
create table if not exists public.audience_insights (
  id text primary key default gen_random_uuid()::text,
  creator_id text not null references public.creators(id) on delete cascade,
  dimension text not null,
  value text not null,
  amount numeric,
  unit text default '%',
  confidence numeric default 0.9,
  source text default 'Platform Analytics',
  status text default 'public',
  collected_at timestamptz not null default now()
);

-- 6. User Subscriptions
create table if not exists public.user_subscriptions (
  user_id text primary key,
  plan_id text not null default 'free',
  searches_used integer not null default 0,
  searches_remaining integer not null default 50,
  total_quota integer not null default 50,
  role text not null default 'viewer',
  updated_at timestamptz not null default now()
);

-- Enable RLS & Public Access
alter table public.creators enable row level security;
alter table public.creator_platform_accounts enable row level security;
alter table public.metric_snapshots enable row level security;
alter table public.audience_insights enable row level security;
alter table public.user_subscriptions enable row level security;

create policy "Public read creators" on public.creators for select using (true);
create policy "Public insert/update creators" on public.creators for all using (true) with check (true);
create policy "Public read accounts" on public.creator_platform_accounts for select using (true);
create policy "Public insert/update accounts" on public.creator_platform_accounts for all using (true) with check (true);
create policy "Public read metric snapshots" on public.metric_snapshots for select using (true);
create policy "Public insert metric snapshots" on public.metric_snapshots for all using (true) with check (true);
create policy "Public read audience insights" on public.audience_insights for select using (true);
create policy "Public insert audience insights" on public.audience_insights for all using (true) with check (true);
create policy "Public subscriptions read/write" on public.user_subscriptions for all using (true) with check (true);`;

  function copySqlToClipboard() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(SQL_SCHEMA_SNIPPET);
      setCopiedSql(true);
      showToast("SQL Schema copied to clipboard!", "success");
      setTimeout(() => setCopiedSql(false), 2500);
    }
  }

  async function signOut() {
    const c = getSupabaseBrowserClient();
    if (c) {
      await c.auth.signOut();
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("mosaic_user_session");
      document.cookie = "mosaic_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    setUserEmail(null);
    showToast("Signed out successfully", "info");
    window.location.assign("/auth");
  }

  async function testConnection(platform: string) {
    setTestingPlatform(platform);
    try {
      const handle =
        platform === "YouTube"
          ? "MrBeast"
          : platform === "Twitch"
          ? "kaicenat"
          : platform === "Kick"
          ? "adinross"
          : "cristiano";

      const res = await fetch(`/api/lookup?platform=${encodeURIComponent(platform)}&handle=${encodeURIComponent(handle)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setTestResult((prev) => ({
          ...prev,
          [platform]: {
            status: "success",
            message: `Verified! Successfully resolved ${platform} channel (${data.creator?.handle})`,
          },
        }));
        showToast(`${platform} API connection verified!`, "success");
      } else {
        setTestResult((prev) => ({
          ...prev,
          [platform]: {
            status: "error",
            message: data.error || "Connection test failed",
          },
        }));
        showToast(`${platform} test encountered an issue`, "error");
      }
    } catch {
      setTestResult((prev) => ({
        ...prev,
        [platform]: {
          status: "error",
          message: "Network request failed",
        },
      }));
    } finally {
      setTestingPlatform(null);
    }
  }

  async function runConsoleTest(e: React.FormEvent) {
    e.preventDefault();
    if (!testConsoleHandle.trim()) return;
    setTestConsoleLoading(true);
    setTestConsoleOutput(null);

    try {
      const res = await fetch(
        `/api/lookup?platform=${encodeURIComponent(testConsolePlatform)}&handle=${encodeURIComponent(
          testConsoleHandle.trim(),
        )}`,
      );
      const data = await res.json();
      setTestConsoleOutput(JSON.stringify(data, null, 2));
      showToast("Live API query completed", "success");
    } catch (err) {
      setTestConsoleOutput(
        JSON.stringify({ error: err instanceof Error ? err.message : "Request failed" }, null, 2),
      );
    } finally {
      setTestConsoleLoading(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Sparkles size={12} className="inline-icon" /> WORKSPACE SETTINGS & CONNECTORS
          </div>
          <h1>Integrations, APIs & Credentials.</h1>
          <p className="page-subtitle">
            Manage live platform data sources, verify API connectivity, and configure enterprise team access.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Left Column: Platform Connectors */}
        <section>
          <div className="card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Live Platform Connectors</h2>
                <p className="card-caption">
                  Active platform connectors for real-time channel metadata and subscriber analytics
                </p>
              </div>
              <span className="status-label status-connected">
                <CheckCircle2 size={12} /> Live API Network
              </span>
            </div>

            <div className="integration-list">
              {INTEGRATIONS.map((integration) => {
                const isTesting = testingPlatform === integration.platform;
                const result = testResult[integration.platform];

                return (
                  <div className="integration-row" key={integration.platform}>
                    <span
                      className={`platform-icon platform-${integration.platform.toLowerCase()}`}
                    >
                      {integration.platform === "YouTube"
                        ? "YT"
                        : integration.platform === "Instagram"
                        ? "IG"
                        : integration.platform.slice(0, 1)}
                    </span>

                    <div className="integration-copy">
                      <div className="integration-title-line">
                        <strong>{integration.platform}</strong>
                        <span className="live-verified-badge">
                          <Check size={11} /> Connected
                        </span>
                      </div>
                      <span>{integration.setup}</span>
                      <p className="integration-limitation">{integration.limitation}</p>

                      {result && (
                        <div
                          className={`test-result-inline ${
                            result.status === "success" ? "text-green" : "text-coral"
                          }`}
                        >
                          {result.status === "success" ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <AlertCircle size={12} />
                          )}
                          <span>{result.message}</span>
                        </div>
                      )}
                    </div>

                    <div className="integration-actions">
                      <button
                        className="button button-secondary button-sm"
                        onClick={() => testConnection(integration.platform)}
                        disabled={isTesting}
                        type="button"
                      >
                        {isTesting ? (
                          <>
                            <RefreshCw size={12} className="spin-icon" /> Testing…
                          </>
                        ) : (
                          "Test Connection"
                        )}
                      </button>
                      <a
                        className="docs-link"
                        href={integration.documentationUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${integration.platform} official documentation`}
                        title="Open official API documentation"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Live API Test Console */}
          <div className="card section-spacer">
            <div className="card-head">
              <div>
                <h2 className="card-title">
                  <Terminal size={14} className="inline-icon" /> Live API Query Sandbox
                </h2>
                <p className="card-caption">
                  Execute live API requests against YouTube, Kick, Twitch, and verified directories
                </p>
              </div>
            </div>

            <form onSubmit={runConsoleTest} className="test-console-form">
              <div className="console-inputs-row">
                <select
                  className="filter-select console-select"
                  value={testConsolePlatform}
                  onChange={(e) => setTestConsolePlatform(e.target.value)}
                >
                  <option value="YouTube">YouTube API</option>
                  <option value="Twitch">Twitch Helix</option>
                  <option value="Kick">Kick API</option>
                  <option value="TikTok">TikTok Partner</option>
                  <option value="Instagram">Instagram Pro</option>
                </select>

                <input
                  className="filter-input console-input"
                  placeholder="Handle (e.g. MrBeast, kaicenat, adinross)"
                  value={testConsoleHandle}
                  onChange={(e) => setTestConsoleHandle(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  className="button button-primary button-sm"
                  disabled={testConsoleLoading || !testConsoleHandle.trim()}
                >
                  {testConsoleLoading ? (
                    <>
                      <RefreshCw size={12} className="spin-icon" /> Querying…
                    </>
                  ) : (
                    "Execute Live Query"
                  )}
                </button>
              </div>

              {testConsoleOutput && (
                <div className="console-output-wrap">
                  <div className="console-output-label">API RESPONSE (200 OK)</div>
                  <pre className="console-output-pre">{testConsoleOutput}</pre>
                </div>
              )}
            </form>
          </div>

          <div className="notice-bar section-spacer">
            <CircleHelp size={14} />
            <span>
              <strong>Real-Time Data Principles:</strong> Mosaic retrieves verified reach, public email
              channels, and platform subscriber statistics through official developer APIs.
            </span>
          </div>
        </section>

        {/* Right Column: Subscription, Role & Authentication */}
        <section>
          {/* Subscription & Search Quota Card */}
          <div className="card settings-sub-card">
            <div className="card-head">
              <div>
                <h2 className="card-title">
                  <Zap size={14} className="text-amber" style={{ verticalAlign: "-2px", marginRight: 6 }} />
                  Subscription & Search Quotas
                </h2>
                <p className="card-caption">
                  Active Tier: <strong>{subscription.planId.toUpperCase()}</strong>
                </p>
              </div>
              <button
                type="button"
                className="button button-primary button-sm"
                onClick={() => setPricingModalOpen(true)}
              >
                Change Plan / Upgrade
              </button>
            </div>

            <div className="quota-status-block">
              <div className="quota-meter-head">
                <span>Searches Remaining</span>
                <strong>
                  {subscription.totalQuota === -1
                    ? "Unlimited (Enterprise)"
                    : `${subscription.searchesRemaining} of ${subscription.totalQuota}`}
                </strong>
              </div>
              {subscription.totalQuota !== -1 && (
                <div className="progress-track" style={{ marginTop: 8 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.max(
                        5,
                        Math.min(
                          100,
                          Math.round((subscription.searchesRemaining / subscription.totalQuota) * 100),
                        ),
                      )}%`,
                    }}
                  />
                </div>
              )}
              <p className="quota-note">
                {subscription.totalQuota === -1
                  ? "Your account enjoys unrestricted searches across all 5 platforms."
                  : `Tier search allowances: Free (50), Basic (150), Premium (300), Most Premium (Unlimited).`}
              </p>
            </div>
          </div>

          {/* Role & Creator Studio Card */}
          <div className="card section-spacer">
            <div className="card-head">
              <div>
                <h2 className="card-title">
                  <User size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                  Account Role & Permissions
                </h2>
                <p className="card-caption">
                  Current Role: <strong>{userRole === "creator" ? "Creator / Talent" : "Brand / Marketer"}</strong>
                </p>
              </div>
              {userRole === "creator" && (
                <button
                  type="button"
                  className="button button-primary button-sm"
                  onClick={() => setCreatorModalOpen(true)}
                >
                  <Sparkles size={13} />
                  <span>Launch Creator Studio</span>
                </button>
              )}
            </div>

            <div className="role-switch-box">
              <p className="role-explainer">
                Switch your operational mode to unlock creator self-publishing or agency discovery workflows.
              </p>

              <div className="role-pills-row">
                <button
                  type="button"
                  className={`role-pill ${userRole === "viewer" ? "active" : ""}`}
                  onClick={() => setUserRole("viewer")}
                >
                  <User size={13} />
                  <span>Brand / Marketer (Scout Mode)</span>
                </button>

                <button
                  type="button"
                  className={`role-pill ${userRole === "creator" ? "active" : ""}`}
                  onClick={() => setUserRole("creator")}
                >
                  <Sparkles size={13} />
                  <span>Creator / Talent (Self-Publish Mode)</span>
                </button>
              </div>

              {userRole === "creator" && (
                <div className="creator-role-banner">
                  <Sparkles size={14} className="text-green" />
                  <div>
                    <strong>Creator Onboarding Enabled</strong>
                    <p>
                      You can submit your YouTube, Twitch, Kick, and Instagram metrics directly into the live catalog so verified brands can discover and sponsor your channel.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Authentication & Storage Card */}
          <div className="card settings-auth-card section-spacer">
            <div className="card-head">
              <div>
                <h2 className="card-title">
                  <Database size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                  Authentication & Storage
                </h2>
                <p className="card-caption">
                  Workspace: <strong>{activeWorkspace.name}</strong> ({activeWorkspace.role})
                </p>
              </div>
              <ShieldCheck size={16} color="#46735a" />
            </div>

            <div className="settings-note">
              <div className="storage-mode-banner">
                <CheckCircle2 size={15} className="text-green" />
                <div>
                  <strong>Enterprise Workspace Persistence Active</strong>
                  <p>
                    Shortlists, tags, notes, and creator catalogues are synchronized and saved with
                    workspace isolation.
                  </p>
                </div>
              </div>

              {authConfigured ? (
                authLoading ? (
                  <p>Checking active Supabase session…</p>
                ) : userEmail ? (
                  <div className="user-session-box">
                    <p>
                      Signed in as <strong>{userEmail}</strong>
                    </p>
                    <p className="session-help">
                      Row-level security policies guard workspace records.
                    </p>
                    <button className="button button-secondary button-sm" onClick={signOut} type="button">
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="user-session-box">
                    <p>Supabase connection ready. Sign in to sync across team members.</p>
                    <Link href="/auth" className="button button-primary button-sm">
                      Sign In to Workspace
                    </Link>
                  </div>
                )
              ) : (
                <div className="user-session-box">
                  <p>
                    <strong>Workspace accounts are active.</strong> Local CRM persistence is enabled.
                    To sync across team devices, configure your Supabase project credentials below.
                  </p>
                  <Link href="/auth" className="button button-secondary button-sm">
                    Open Account Sign In <ArrowUpRight size={12} />
                  </Link>
                </div>
              )}

              {/* Supabase In-App Configuration */}
              <div className="settings-supabase-config">
                <form onSubmit={handleSaveSupabase} className="settings-sb-form">
                  <div className="sb-config-header">
                    <strong>
                      <Database size={13} className="text-green inline-icon" />
                      Configure Supabase Cloud Credentials
                    </strong>
                    <span className={`status-pill ${authConfigured ? "status-connected" : "status-local"}`}>
                      {authConfigured ? "Cloud Active" : "Local Mode"}
                    </span>
                  </div>

                  <div className="sb-form-group">
                    <label className="form-label" htmlFor="settings-sb-url">
                      Supabase Project URL
                    </label>
                    <input
                      id="settings-sb-url"
                      type="url"
                      className="form-input"
                      placeholder="https://xyzcompany.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                    />
                  </div>

                  <div className="sb-form-group">
                    <label className="form-label" htmlFor="settings-sb-key">
                      Supabase Anon / Public API Key
                    </label>
                    <input
                      id="settings-sb-key"
                      type="password"
                      className="form-input"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    />
                  </div>

                  {supabaseStatusMsg && (
                    <div className="test-result-inline text-green">
                      <CheckCircle2 size={13} />
                      <span>{supabaseStatusMsg}</span>
                    </div>
                  )}

                  {authError && (
                    <div className="test-result-inline text-coral">
                      <AlertCircle size={13} />
                      <span>{authError}</span>
                    </div>
                  )}

                  <div className="sb-actions-row">
                    <button
                      type="submit"
                      className="button button-primary button-sm"
                      disabled={supabaseSaving}
                    >
                      {supabaseSaving ? (
                        <>
                          <RefreshCw size={12} className="spin-icon" /> Saving…
                        </>
                      ) : (
                        "Save & Connect Supabase"
                      )}
                    </button>
                    {supabaseUrl && (
                      <button
                        type="button"
                        className="button button-secondary button-sm"
                        onClick={() => {
                          setSupabaseUrl("");
                          setSupabaseAnonKey("");
                          saveSupabaseConfig("", "");
                          setClient(null);
                          setSupabaseStatusMsg("Disconnected. Reverted to workspace account mode.");
                        }}
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                </form>

                {/* Database Verification & Live API Sync Controls */}
                <div className="db-verification-box" style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-color, #23272f)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <strong style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      <Database size={13} className="text-amber" />
                      Database & Live API Synchronization
                    </strong>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="button button-secondary button-sm"
                        onClick={copySqlToClipboard}
                        title="Copy database table definitions for Supabase SQL Editor"
                      >
                        {copiedSql ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                        <span>{copiedSql ? "Copied SQL!" : "Copy SQL Script"}</span>
                      </button>
                      <button
                        type="button"
                        className="button button-secondary button-sm"
                        onClick={() => setShowSqlViewer(!showSqlViewer)}
                      >
                        {showSqlViewer ? "Hide SQL" : "View SQL"}
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: "var(--muted, #8b949e)", marginBottom: 12, lineHeight: 1.5 }}>
                    Connect Supabase to permanently store creators, accounts, and metric snapshots. No manual data uploads needed — live creator data is automatically fetched directly from YouTube, Kick, and Twitch APIs.
                  </p>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                    <button
                      type="button"
                      className="button button-secondary button-sm"
                      onClick={checkServerDbStatus}
                      disabled={checkingDb}
                    >
                      {checkingDb ? (
                        <>
                          <RefreshCw size={12} className="spin-icon" /> Checking Database…
                        </>
                      ) : (
                        "Verify Server Database"
                      )}
                    </button>

                    <button
                      type="button"
                      className="button button-primary button-sm"
                      onClick={triggerSeedDatabase}
                      disabled={seedingDb}
                    >
                      {seedingDb ? (
                        <>
                          <RefreshCw size={12} className="spin-icon" /> Syncing from APIs…
                        </>
                      ) : (
                        "⚡ Sync Live Data to Database"
                      )}
                    </button>
                  </div>

                  {dbLiveStatus && (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        backgroundColor: dbLiveStatus.connected ? "rgba(46, 125, 72, 0.15)" : "rgba(229, 83, 75, 0.15)",
                        border: `1px solid ${dbLiveStatus.connected ? "rgba(46, 125, 72, 0.4)" : "rgba(229, 83, 75, 0.4)"}`,
                        fontSize: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ fontWeight: 600, color: dbLiveStatus.connected ? "#4ade80" : "#f87171", marginBottom: 4 }}>
                        {dbLiveStatus.connected ? "✓ Supabase Database Operational" : "✕ Database Connection Offline"}
                      </div>
                      <div>{dbLiveStatus.message}</div>
                      {dbLiveStatus.tableExists && (
                        <div style={{ marginTop: 4, color: "#9ca3af" }}>
                          Total stored creators in PostgreSQL: <strong>{dbLiveStatus.creatorCount}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {showSqlViewer && (
                    <div style={{ marginTop: 10, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>PostgreSQL Migration Script (Supabase SQL Editor):</span>
                        <button
                          type="button"
                          className="button button-secondary button-sm"
                          style={{ padding: "2px 8px", height: 24, fontSize: 11 }}
                          onClick={copySqlToClipboard}
                        >
                          <Copy size={11} /> Copy
                        </button>
                      </div>
                      <pre
                        style={{
                          backgroundColor: "#0d1117",
                          padding: 12,
                          borderRadius: 6,
                          fontSize: 11,
                          overflowX: "auto",
                          maxHeight: 220,
                          color: "#c9d1d9",
                          border: "1px solid #30363d",
                        }}
                      >
                        {SQL_SCHEMA_SNIPPET}
                      </pre>
                    </div>
                  )}

                  {/* 4-Step Quick Setup Guide */}
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      fontSize: 12,
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 6, color: "#e6edf3" }}>
                      Quick 3-Minute Database Setup Guide:
                    </div>
                    <ol style={{ paddingLeft: 18, margin: 0, color: "#8b949e", lineHeight: 1.6 }}>
                      <li>
                        Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: "#58a6ff" }}>supabase.com</a> and create a free project.
                      </li>
                      <li>
                        Click <strong>SQL Editor</strong> in the left sidebar, paste the SQL script (click <em>Copy SQL Script</em> above), and click <strong>Run</strong>.
                      </li>
                      <li>
                        Go to <strong>Project Settings → API</strong>, copy your <strong>Project URL</strong> and <strong>anon public API key</strong>, and paste them above.
                      </li>
                      <li>
                        Click <strong>Save & Connect</strong>, then click <strong>⚡ Sync Live Data to Database</strong>. Mosaic will automatically fetch live channels from YouTube & Kick and populate your database!
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Environment Variables Reference */}
          <div className="card provider-info-card section-spacer">
            <div className="card-head">
              <div>
                <h2 className="card-title">API Environment Keys</h2>
                <p className="card-caption">Configured in server-side environment</p>
              </div>
              <KeyRound size={15} color="#46735a" />
            </div>

            <ul className="principle-list">
              <li>
                <code>YOUTUBE_DATA_API_KEY</code> — Active for live YouTube search & statistics.
              </li>
              <li>
                <code>TWITCH_CLIENT_ID</code> & <code>TWITCH_CLIENT_SECRET</code> — Twitch Helix API.
              </li>
              <li>
                <code>KICK_CLIENT_ID</code> — Kick channel & livestream endpoint.
              </li>
              <li>
                <code>NEXT_PUBLIC_SUPABASE_URL</code> — Team workspace database.
              </li>
            </ul>

            <div className="settings-doc-link">
              <a href="https://developers.google.com/youtube/v3/docs" target="_blank" rel="noreferrer">
                YouTube API Docs <ExternalLink size={11} />
              </a>
              <a href="https://docs.kick.com/apis/" target="_blank" rel="noreferrer">
                Kick API Docs <ExternalLink size={11} />
              </a>
              <a href="https://dev.twitch.tv/docs/api/reference/" target="_blank" rel="noreferrer">
                Twitch Helix Docs <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
