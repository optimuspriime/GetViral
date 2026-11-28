"use client";

import Link from "next/link";
import {
  ArrowUpRight, Check, CircleHelp, Database, KeyRound,
  RefreshCw, ShieldCheck, Sparkles, Terminal, CheckCircle2, AlertCircle,
  Zap, User, Copy, Lock, Palette, Sun, Moon
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Platform } from "@/lib/model";
import { INTEGRATIONS } from "@/lib/integrations";
import { SIGNAL_THEMES } from "@/lib/appearance";
import { ColorWheelPicker } from "@/components/color-wheel-picker";
import { getSupabaseBrowserClient, getSupabaseConfig, saveSupabaseConfig } from "@/lib/supabase/browser";
import { useProspects } from "@/components/data-provider";

export default function SettingsPage() {
  const {
    activeWorkspace,
    isGuest,
    isAdmin,
    userEmail: providerEmail,
    showToast,
    subscription,
    userRole,
    setUserRole,
    setPricingModalOpen,
    setCreatorModalOpen,
    surfaceMode,
    setSurfaceMode,
    signalTheme,
    setSignalTheme,
    customColor,
    setCustomColor,
    reduceMotion,
    setReduceMotion,
  } = useProspects();

  const [colorWheelOpen, setColorWheelOpen] = useState(false);

  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { status: "success" | "error"; message: string }>>({});

  // Dynamic Server Integration Health State
  const [connectorsLoaded, setConnectorsLoaded] = useState(false);
  const [integrationsStatus, setIntegrationsStatus] = useState<
    Array<{
      platform: Platform;
      connected: boolean;
      mode: string;
      connectorStatus: string;
      statusNote: string;
      documentationUrl: string;
      setup: string;
      limitation: string;
      supportsLiveDiscovery?: boolean;
      supportsHandleLookup?: boolean;
    }>
  >(() =>
    INTEGRATIONS.map((i) => ({
      platform: i.platform,
      connected: i.platform === "Kick",
      mode:
        i.platform === "Kick"
          ? "active_api"
          : i.requiresCreatorOAuth
          ? "requires_oauth"
          : "unconfigured",
      connectorStatus: i.connectorStatus,
      statusNote: i.statusNote,
      documentationUrl: i.documentationUrl,
      setup: i.setup,
      limitation: i.limitation,
      supportsLiveDiscovery: i.supportsLiveDiscovery,
      supportsHandleLookup: i.supportsHandleLookup,
    })),
  );

  // Admin-only diagnostic states (never rendered or populated for guests/non-admins)
  const [envStatus, setEnvStatus] = useState<{
    youtubeConfigured?: boolean;
    twitchClientConfigured?: boolean;
    twitchSecretConfigured?: boolean;
    kickConfigured?: boolean;
    tiktokConfigured?: boolean;
    metaConfigured?: boolean;
    supabaseConfigured?: boolean;
  } | null>(null);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [supabaseSaving, setSupabaseSaving] = useState(false);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState("");
  const [authError, setAuthError] = useState("");
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
  const [testConsolePlatform, setTestConsolePlatform] = useState("Kick");
  const [testConsoleHandle, setTestConsoleHandle] = useState("adinross");
  const [testConsoleLoading, setTestConsoleLoading] = useState(false);
  const [testConsoleOutput, setTestConsoleOutput] = useState<string | null>(null);

  useEffect(() => {
    const cfg = getSupabaseConfig();
    setSupabaseUrl(cfg.url);
    setSupabaseAnonKey(cfg.key);

    fetch("/api/integrations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.integrations)) {
          setIntegrationsStatus(data.integrations);
        }
        if (data.isAdmin && data.envStatus) {
          setEnvStatus(data.envStatus);
        }
      })
      .catch(() => {})
      .finally(() => setConnectorsLoaded(true));
  }, []);

  async function signOut() {
    const c = getSupabaseBrowserClient();
    if (c) {
      await c.auth.signOut();
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("mosaic_user_session");
      document.cookie = "mosaic_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    showToast("Signed out successfully", "info");
    window.location.assign("/auth");
  }

  async function handleSaveSupabase(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    setSupabaseSaving(true);
    setSupabaseStatusMsg("");
    setAuthError("");

    try {
      saveSupabaseConfig();
      const newClient = getSupabaseBrowserClient();
      if (newClient) {
        const { error } = await newClient.auth.getSession();
        if (error) {
          setAuthError(`Supabase responded: ${error.message}`);
        } else {
          setSupabaseStatusMsg("Supabase client settings updated.");
          showToast("Supabase configuration saved!", "success");
        }
      } else {
        setSupabaseStatusMsg("Custom credentials cleared.");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Failed to connect to Supabase");
    } finally {
      setSupabaseSaving(false);
    }
  }

  async function checkServerDbStatus() {
    if (!isAdmin) return;
    setCheckingDb(true);
    try {
      const res = await fetch("/api/database/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: supabaseUrl.trim(), key: supabaseAnonKey.trim() }),
      });
      const data = await res.json();
      setDbLiveStatus(data);
      if (res.ok && data.connected && data.tableExists) {
        showToast(`Database active: ${data.creatorCount} creators stored`, "success");
      } else {
        showToast(data.message || data.error || "Database check failed", "error");
      }
    } catch {
      showToast("Could not check database status", "error");
    } finally {
      setCheckingDb(false);
    }
  }

  async function triggerSeedDatabase() {
    if (!isAdmin) return;
    setSeedingDb(true);
    try {
      const res = await fetch("/api/database/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: supabaseUrl.trim(), key: supabaseAnonKey.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, "success");
        await checkServerDbStatus();
      } else {
        showToast(data.message || "Refresh failed", "error");
      }
    } catch {
      showToast("Refresh request failed", "error");
    } finally {
      setSeedingDb(false);
    }
  }

  async function testConnection(platform: string) {
    if (!isAdmin) return;
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

      const res = await fetch(
        `/api/lookup?mode=probe&platform=${encodeURIComponent(platform)}&handle=${encodeURIComponent(handle)}`,
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setTestResult((prev) => ({
          ...prev,
          [platform]: {
            status: "success",
            message: `Verified! Channel: ${data.creator?.handle} (Source: ${data.source ?? platform}, freshness: ${data.dataFreshness ?? "Live Snapshot"})`,
          },
        }));
        showToast(`${platform} connection verified!`, "success");
      } else {
        setTestResult((prev) => ({
          ...prev,
          [platform]: {
            status: "error",
            message: data.error || "Connection check returned unavailable",
          },
        }));
      }
    } catch {
      setTestResult((prev) => ({
        ...prev,
        [platform]: { status: "error", message: "Network request failed" },
      }));
    } finally {
      setTestingPlatform(null);
    }
  }

  async function runConsoleTest(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin || !testConsoleHandle.trim()) return;
    setTestConsoleLoading(true);
    setTestConsoleOutput(null);

    try {
      const res = await fetch(
        `/api/lookup?mode=probe&platform=${encodeURIComponent(testConsolePlatform)}&handle=${encodeURIComponent(
          testConsoleHandle.trim(),
        )}`,
      );
      const data = await res.json();
      setTestConsoleOutput(JSON.stringify(data, null, 2));
      showToast("Query completed", "success");
    } catch (err) {
      setTestConsoleOutput(
        JSON.stringify({ error: err instanceof Error ? err.message : "Query failed" }, null, 2),
      );
    } finally {
      setTestConsoleLoading(false);
    }
  }

  const SQL_SCHEMA_SNIPPET = `-- Run in Supabase SQL Editor
create extension if not exists pgcrypto;
-- Refer to supabase/schema.sql in repository for full table definitions.`;

  function copySqlToClipboard() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(SQL_SCHEMA_SNIPPET);
      setCopiedSql(true);
      showToast("SQL reference copied", "success");
      setTimeout(() => setCopiedSql(false), 2500);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Sparkles size={12} className="inline-icon" /> ACCOUNT &amp; PREFERENCES
          </div>
          <h1>Account Settings &amp; Quotas.</h1>
          <p className="page-subtitle">
            Manage your workspace profile, view search quotas, and review platform availability.
          </p>
        </div>
      </div>

      {isGuest && (
        <div
          className="notice-bar"
          style={{
            background: "#fffbeb",
            borderColor: "#fef3c7",
            color: "#92400e",
            marginBottom: 18,
            padding: "12px 16px",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <Lock size={15} />
            <span>
              <strong>Guest Preview Mode (Read-Only):</strong> Sign in with an account to modify preferences, unlock 50 monthly searches, and save creators.
            </span>
          </span>
          <Link href="/auth" className="button button-primary button-sm">
            Sign In / Register <ArrowUpRight size={13} />
          </Link>
        </div>
      )}

      <div className="settings-grid">
        {/* Left Column: Marketer-Friendly Platform Availability Overview */}
        <section>
          <div className="card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Platform Availability</h2>
                <p className="card-caption">
                  Live discovery and handle lookup status across supported platforms
                </p>
              </div>
              {!connectorsLoaded ? (
                <span className="skeleton-pill" />
              ) : (
                <span
                  className="status-label"
                  style={{
                    backgroundColor:
                      integrationsStatus.filter((i) => i.connected).length > 1
                        ? "rgba(34, 197, 94, 0.12)"
                        : "rgba(234, 179, 8, 0.14)",
                    color:
                      integrationsStatus.filter((i) => i.connected).length > 1
                        ? "#15803d"
                        : "#92400e",
                    border: `1px solid ${
                      integrationsStatus.filter((i) => i.connected).length > 1
                        ? "rgba(34, 197, 94, 0.3)"
                        : "rgba(234, 179, 8, 0.3)"
                    }`,
                  }}
                >
                  <CheckCircle2 size={12} />{" "}
                  {integrationsStatus.filter((i) => i.connected).length} / {integrationsStatus.length} Active
                </span>
              )}
            </div>

            <div className="integration-list">
              {integrationsStatus.map((integration) => {
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
                        {!connectorsLoaded ? (
                          <span className="skeleton-pill" />
                        ) : (
                          <span
                            className={`live-verified-badge ${
                              integration.connected
                                ? "capability-badge-live"
                                : integration.mode === "requires_oauth"
                                ? "capability-badge-oauth"
                                : "capability-badge-pending"
                            }`}
                          >
                            {integration.connected ? <Check size={11} /> : <AlertCircle size={11} />}{" "}
                            {integration.connectorStatus}
                          </span>
                        )}
                      </div>
                      <span>{integration.statusNote}</span>
                      <p className="integration-limitation">{integration.limitation}</p>

                      {isAdmin && result && (
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
                      {isAdmin && (
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
                            "Test Probe"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Admin-Only Live Channel Probe Console */}
          {isAdmin && (
            <div className="card section-spacer">
              <div className="card-head">
                <div>
                  <h2 className="card-title">
                    <Terminal size={14} className="inline-icon" /> Admin Channel Probe Console
                  </h2>
                  <p className="card-caption">
                    Internal operator diagnostic tester (ADMIN_EMAILS only)
                  </p>
                </div>
              </div>

              <form onSubmit={runConsoleTest} className="test-console-form">
                <div className="console-inputs-row">
                  <select
                    className="filter-select console-select"
                    aria-label="Platform to test"
                    value={testConsolePlatform}
                    onChange={(e) => setTestConsolePlatform(e.target.value)}
                  >
                    <option value="YouTube">YouTube</option>
                    <option value="Twitch">Twitch</option>
                    <option value="Kick">Kick</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram">Instagram</option>
                  </select>

                  <input
                    className="filter-input console-input"
                    placeholder="Handle (e.g. adinross, MrBeast)"
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
                      "Run Probe"
                    )}
                  </button>
                </div>

                {testConsoleOutput && (
                  <div className="console-output-wrap">
                    <div className="console-output-label">PROBE RESPONSE</div>
                    <pre className="console-output-pre">{testConsoleOutput}</pre>
                  </div>
                )}
              </form>
            </div>
          )}

          <div className="notice-bar section-spacer">
            <CircleHelp size={14} />
            <span>
              <strong>Transparent Attribution:</strong> GetViral retrieves channel reach and public business emails from live connected channels with origin timestamps, and complies with{" "}
              <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
                YouTube Terms of Service
              </a>.
            </span>
          </div>
        </section>

        {/* Right Column: Interface Appearance, Quota, Role, Authentication & Legal */}
        <section>
          {/* Interface Appearance Card */}
          <div className="card appearance-card">
            <div className="card-head">
              <div>
                <h2 className="card-title">
                  <Palette size={14} className="inline-icon" style={{ marginRight: 6, color: "var(--accent-primary, #16834B)" }} />
                  Interface Appearance
                </h2>
                <p className="card-caption">Personalize studio colors and animation comfort</p>
              </div>
              <span className="coverage-tag">Browser Preference</span>
            </div>

            <div className="appearance-section">
              <div className="motion-toggle-row motion-toggle-row-wrap">
                <div className="appearance-label-block">
                  <strong>Theme mode</strong>
                  <span>Whole-site Light or Dark appearance</span>
                </div>

                <div className="surface-mode-segmented" role="group" aria-label="Choose light or dark mode">
                  <button
                    type="button"
                    className={`surface-mode-btn ${surfaceMode === "light" ? "active" : ""}`}
                    aria-pressed={surfaceMode === "light"}
                    onClick={() => setSurfaceMode("light")}
                  >
                    <Sun size={13} />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    className={`surface-mode-btn ${surfaceMode === "dark" ? "active" : ""}`}
                    aria-pressed={surfaceMode === "dark"}
                    onClick={() => setSurfaceMode("dark")}
                  >
                    <Moon size={13} />
                    <span>Dark</span>
                  </button>
                </div>
              </div>

              <hr className="divider" />

              <div className="appearance-group">
                <div className="appearance-label-block">
                  <strong>Color theme</strong>
                  <span>Choose your dashboard signal color</span>
                </div>

                <div className="theme-swatch-grid" role="group" aria-label="Choose your dashboard signal color">
                  {SIGNAL_THEMES.map((themeOption) => {
                    const active = signalTheme === themeOption.id;
                    return (
                      <button
                        key={themeOption.id}
                        type="button"
                        className={`theme-swatch-btn ${active ? "active" : ""}`}
                        aria-pressed={active}
                        title={`${themeOption.label} — ${themeOption.mood}`}
                        onClick={() => {
                          setSignalTheme(themeOption.id);
                          setColorWheelOpen(false);
                        }}
                      >
                        <span
                          className="theme-swatch-orb"
                          style={{
                            background: `linear-gradient(135deg, ${themeOption.primary} 0%, ${themeOption.highlight} 100%)`,
                          }}
                          aria-hidden="true"
                        >
                          {active && <Check size={12} strokeWidth={3} />}
                        </span>
                        <span className="theme-swatch-text">
                          <strong>{themeOption.label}</strong>
                          <small>{themeOption.mood}</small>
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    className={`theme-swatch-btn ${signalTheme === "custom" ? "active" : ""}`}
                    aria-pressed={signalTheme === "custom"}
                    aria-expanded={colorWheelOpen}
                    title="Pick any color from the interactive color wheel"
                    onClick={() => {
                      if (signalTheme !== "custom") {
                        setSignalTheme("custom");
                      }
                      setColorWheelOpen((prev) => !prev);
                    }}
                  >
                    <span
                      className="theme-swatch-orb theme-swatch-orb-wheel"
                      style={
                        signalTheme === "custom"
                          ? { boxShadow: `0 0 0 2px #FFFFFF, 0 0 0 4px ${customColor}` }
                          : undefined
                      }
                      aria-hidden="true"
                    >
                      {signalTheme === "custom" && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="theme-swatch-text">
                      <strong>Pick your own</strong>
                      <small>{signalTheme === "custom" ? customColor : "Open color wheel"}</small>
                    </span>
                  </button>
                </div>

                {colorWheelOpen && (
                  <ColorWheelPicker
                    value={customColor}
                    onChange={setCustomColor}
                    onClose={() => setColorWheelOpen(false)}
                  />
                )}
              </div>

              <hr className="divider" />

              <div className="motion-toggle-row">
                <div className="appearance-label-block">
                  <strong id="reduce-motion-label">Reduce motion</strong>
                  <span id="reduce-motion-desc">Pause ambient and entrance animations.</span>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={reduceMotion}
                  aria-labelledby="reduce-motion-label"
                  aria-describedby="reduce-motion-desc"
                  className={`motion-switch ${reduceMotion ? "active" : ""}`}
                  onClick={() => setReduceMotion(!reduceMotion)}
                >
                  <span className="motion-switch-thumb" />
                </button>
              </div>
            </div>
          </div>

          {/* Subscription & Search Quota Card */}
          <div className="card settings-sub-card section-spacer">
            <div className="card-head">
              <div>
                <h2 className="card-title">
                  <Zap size={14} className="text-amber" style={{ verticalAlign: "-2px", marginRight: 6 }} />
                  Search Quota &amp; Plan
                </h2>
                <p className="card-caption">
                  Current Tier: <strong>{isGuest ? "GUEST PREVIEW" : subscription.planId.toUpperCase()}</strong>
                </p>
              </div>
              <button
                type="button"
                className="button button-primary button-sm"
                onClick={() => setPricingModalOpen(true)}
              >
                View Plans
              </button>
            </div>

            <div className="quota-status-block">
              <div className="quota-meter-head">
                <span>Searches Remaining</span>
                <strong>
                  {subscription.totalQuota === -1
                    ? "Unlimited"
                    : `${subscription.searchesRemaining} of ${subscription.totalQuota}`}
                </strong>
              </div>
              {subscription.totalQuota !== -1 && (
                <div className="progress-track" style={{ marginTop: 8 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.max(
                        4,
                        Math.min(
                          100,
                          Math.round((subscription.searchesRemaining / Math.max(1, subscription.totalQuota)) * 100),
                        ),
                      )}%`,
                    }}
                  />
                </div>
              )}
              <p className="quota-note">
                {isGuest
                  ? "Guest preview allows 5 server-enforced searches. Create a free account to unlock 50 monthly searches."
                  : "Account quotas are enforced server-side. Failed or unconfigured searches never consume quota."}
              </p>
            </div>
          </div>

          {/* Role Mode Card (Gated for Guests) */}
          <div className="card section-spacer">
            <div className="card-head">
              <div>
                <h2 className="card-title">
                  <User size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                  Workspace Mode
                </h2>
                <p className="card-caption">
                  Current Mode: <strong>{isGuest ? "Guest Preview (Read-Only)" : userRole === "creator" ? "Creator / Talent" : "Brand / Marketer"}</strong>
                </p>
              </div>
              {!isGuest && userRole === "creator" && (
                <button
                  type="button"
                  className="button button-primary button-sm"
                  onClick={() => setCreatorModalOpen(true)}
                >
                  <Sparkles size={13} />
                  <span>My Profile</span>
                </button>
              )}
            </div>

            <div className="role-switch-box">
              <p className="role-explainer">
                Choose whether you primarily scout creators for campaigns or manage creator insights.
              </p>

              <div className="role-pills-row">
                <button
                  type="button"
                  className={`role-pill ${userRole === "viewer" ? "active" : ""}`}
                  disabled={isGuest}
                  title={isGuest ? "Sign in to change workspace mode" : undefined}
                  onClick={() => setUserRole("viewer")}
                >
                  <User size={13} />
                  <span>Brand / Marketer</span>
                </button>

                <button
                  type="button"
                  className={`role-pill ${userRole === "creator" ? "active" : ""}`}
                  disabled={isGuest}
                  title={isGuest ? "Sign in to change workspace mode" : undefined}
                  onClick={() => setUserRole("creator")}
                >
                  <Sparkles size={13} />
                  <span>Creator / Talent</span>
                </button>
              </div>
            </div>
          </div>

          {/* Account Authentication & Isolation Card */}
          <div className="card settings-auth-card section-spacer">
            <div className="card-head">
              <div>
                <h2 className="card-title">
                  <ShieldCheck size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                  Account &amp; Security
                </h2>
                <p className="card-caption">
                  Workspace: <strong>{activeWorkspace.name}</strong> ({activeWorkspace.role})
                </p>
              </div>
              <ShieldCheck size={16} color="#46735a" />
            </div>

            <div className="settings-note">
              {!isGuest && providerEmail ? (
                <div className="user-session-box">
                  <p>
                    Signed in as <strong>{providerEmail}</strong>
                  </p>
                  <p className="session-help">
                    Saved creators, shortlist folders, notes, and monthly quotas are isolated strictly to your account.
                  </p>
                  <button className="button button-secondary button-sm" onClick={signOut} type="button">
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="user-session-box">
                  <p>You are browsing as a guest. Sign in or create a free account to save creators and unlock 50 monthly searches.</p>
                  <Link href="/auth" className="button button-primary button-sm">
                    Sign In / Create Account
                  </Link>
                </div>
              )}

              <div className="settings-doc-link" style={{ marginTop: 14 }}>
                <Link href="/privacy">Privacy Policy</Link>
                <Link href="/terms">Terms of Service</Link>
                <Link href="/support">Support</Link>
              </div>
            </div>
          </div>

          {/* Admin-Only Infrastructure Controls (Strictly Hidden from Guests and Regular Users) */}
          {isAdmin && (
            <>
              <div className="card section-spacer">
                <div className="card-head">
                  <div>
                    <h2 className="card-title">
                      <Database size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                      Admin Database Controls
                    </h2>
                    <p className="card-caption">Visible to internal ADMIN_EMAILS accounts only</p>
                  </div>
                </div>

                <form onSubmit={handleSaveSupabase} className="settings-sb-form">
                  <div className="sb-form-group">
                    <label className="form-label" htmlFor="settings-sb-url">Supabase Project URL</label>
                    <input
                      id="settings-sb-url"
                      type="url"
                      className="form-input"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                    />
                  </div>
                  <div className="sb-form-group">
                    <label className="form-label" htmlFor="settings-sb-key">Supabase Anon Key</label>
                    <input
                      id="settings-sb-key"
                      type="password"
                      className="form-input"
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    />
                  </div>
                  {supabaseStatusMsg && <div className="test-result-inline text-green">{supabaseStatusMsg}</div>}
                  {authError && <div className="test-result-inline text-coral">{authError}</div>}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    <button type="submit" className="button button-primary button-sm" disabled={supabaseSaving}>
                      {supabaseSaving ? "Saving…" : "Save Override"}
                    </button>
                    <button type="button" className="button button-secondary button-sm" onClick={checkServerDbStatus} disabled={checkingDb}>
                      {checkingDb ? "Checking…" : "Verify Server DB"}
                    </button>
                    <button type="button" className="button button-secondary button-sm" onClick={triggerSeedDatabase} disabled={seedingDb}>
                      {seedingDb ? "Refreshing…" : "Refresh My Saved"}
                    </button>
                    <button type="button" className="button button-secondary button-sm" onClick={() => setShowSqlViewer(!showSqlViewer)}>
                      {showSqlViewer ? "Hide SQL" : "SQL Ref"}
                    </button>
                  </div>
                </form>

                {dbLiveStatus && (
                  <div style={{ marginTop: 12, fontSize: 12 }}>
                    <strong>{dbLiveStatus.connected ? "Connected" : "Offline"}:</strong> {dbLiveStatus.message}
                  </div>
                )}

                {showSqlViewer && (
                  <div style={{ marginTop: 10 }}>
                    <button type="button" className="button button-secondary button-sm" onClick={copySqlToClipboard}>
                      {copiedSql ? <Check size={11} /> : <Copy size={11} />} Copy SQL Ref
                    </button>
                    <pre style={{ fontSize: 11, marginTop: 6 }}>{SQL_SCHEMA_SNIPPET}</pre>
                  </div>
                )}
              </div>

              {envStatus && (
                <div className="card provider-info-card section-spacer">
                  <div className="card-head">
                    <div>
                      <h2 className="card-title">Admin Server Environment Check</h2>
                      <p className="card-caption">Internal connector provisioning status</p>
                    </div>
                    <KeyRound size={15} color="#46735a" />
                  </div>
                  <ul className="principle-list">
                    <li>YouTube Connector: {envStatus.youtubeConfigured ? "Configured" : "Not Set"}</li>
                    <li>Twitch Connector: {envStatus.twitchClientConfigured && envStatus.twitchSecretConfigured ? "Configured" : "Not Set"}</li>
                    <li>Kick Channel Service: {envStatus.kickConfigured ? "Active" : "Offline"}</li>
                    <li>TikTok OAuth App: {envStatus.tiktokConfigured ? "Configured (OAuth needed)" : "Not Set"}</li>
                    <li>Instagram OAuth App: {envStatus.metaConfigured ? "Configured (OAuth needed)" : "Not Set"}</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
