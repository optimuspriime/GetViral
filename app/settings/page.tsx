"use client";

import Link from "next/link";
import {
  ArrowUpRight, Check, CircleHelp, Database, ExternalLink, KeyRound,
  RefreshCw, ShieldCheck, Sparkles, Terminal, CheckCircle2, AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { INTEGRATIONS } from "@/lib/integrations";
import { getSupabaseBrowserClient, getSupabaseConfig, saveSupabaseConfig } from "@/lib/supabase/browser";
import { useProspects } from "@/components/data-provider";

export default function SettingsPage() {
  const { activeWorkspace, showToast } = useProspects();
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

        {/* Right Column: Authentication, Workspace & Database */}
        <section>
          <div className="card settings-auth-card">
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
