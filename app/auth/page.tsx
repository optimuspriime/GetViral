"use client";

import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, Database, KeyRound, Lock, Mail, RefreshCw,
  Server, ShieldCheck, Sparkles, User, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getSupabaseBrowserClient,
  getSupabaseConfig,
  saveSupabaseConfig
} from "@/lib/supabase/browser";

export default function AuthPage() {
  const [client, setClient] = useState(() => getSupabaseBrowserClient());
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Supabase Configuration state
  const [showConfig, setShowConfig] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [configMessage, setConfigMessage] = useState("");
  const [configError, setConfigError] = useState("");
  const [testingConfig, setTestingConfig] = useState(false);

  useEffect(() => {
    const cfg = getSupabaseConfig();
    setSupabaseUrl(cfg.url);
    setSupabaseAnonKey(cfg.key);
    setClient(getSupabaseBrowserClient());
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    try {
      const activeClient = getSupabaseBrowserClient();

      if (activeClient) {
        // Authenticate with Supabase Cloud Auth
        if (mode === "sign-up") {
          const { data, error: signUpError } = await activeClient.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName.trim() },
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          if (signUpError) throw signUpError;
          if (data.session) {
            window.localStorage.setItem(
              "mosaic_user_session",
              JSON.stringify({ email, name: fullName.trim() || email.split("@")[0] })
            );
            window.location.assign("/");
          } else {
            setMessage("Confirmation email sent! Check your inbox to confirm your account.");
          }
        } else {
          const { error: signInError } = await activeClient.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) throw signInError;
          window.localStorage.setItem(
            "mosaic_user_session",
            JSON.stringify({ email, name: email.split("@")[0] })
          );
          const next = new URLSearchParams(window.location.search).get("next") ?? "/";
          window.location.assign(next.startsWith("/") && !next.startsWith("//") ? next : "/");
        }
      } else {
        // Authenticate with Workspace Account (Local / Fast Enterprise Session)
        const trimmedEmail = email.trim().toLowerCase();
        const userName = fullName.trim() || trimmedEmail.split("@")[0];

        // Store active session
        window.localStorage.setItem(
          "mosaic_user_session",
          JSON.stringify({ email: trimmedEmail, name: userName, role: "Owner" })
        );
        document.cookie = `mosaic_user_session=${encodeURIComponent(trimmedEmail)}; path=/; max-age=2592000; SameSite=Lax`;

        // If sign-up, register user profile
        if (mode === "sign-up") {
          const existingUsersStr = window.localStorage.getItem("mosaic_registered_users") || "[]";
          try {
            const users = JSON.parse(existingUsersStr);
            if (!users.some((u: { email: string }) => u.email === trimmedEmail)) {
              users.push({ email: trimmedEmail, name: userName, createdAt: new Date().toISOString() });
              window.localStorage.setItem("mosaic_registered_users", JSON.stringify(users));
            }
          } catch {}
        }

        const next = new URLSearchParams(window.location.search).get("next") ?? "/";
        window.location.assign(next.startsWith("/") && !next.startsWith("//") ? next : "/");
      }
    } catch (caught) {
      console.error("Authentication request failed.", caught);
      setError(caught instanceof Error ? caught.message : "Authentication failed. Please check credentials.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveSupabase(e: React.FormEvent) {
    e.preventDefault();
    setConfigError("");
    setConfigMessage("");
    setTestingConfig(true);

    try {
      const cleanUrl = supabaseUrl.trim();
      const cleanKey = supabaseAnonKey.trim();

      if (!cleanUrl || !cleanKey) {
        saveSupabaseConfig("", "");
        setClient(null);
        setConfigMessage("Supabase credentials cleared. Using local workspace accounts.");
        setTestingConfig(false);
        return;
      }

      // Save credentials to browser storage
      saveSupabaseConfig(cleanUrl, cleanKey);
      const newClient = getSupabaseBrowserClient();
      setClient(newClient);

      if (newClient) {
        // Test connection
        const { error } = await newClient.auth.getSession();
        if (error) {
          setConfigError(`Supabase connection warning: ${error.message}`);
        } else {
          setConfigMessage("Successfully connected to Supabase Cloud Auth & Database!");
        }
      }
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : "Failed to connect to Supabase.");
    } finally {
      setTestingConfig(false);
    }
  }

  const isSupabaseActive = Boolean(client);

  return (
    <div className="auth-page">
      <div className="auth-top-nav">
        <Link href="/" className="back-link">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
        <Link href="/settings" className="back-link">
          Settings & Integrations
        </Link>
      </div>

      <div className="auth-card card">
        <span className="auth-mark">
          {isSupabaseActive ? <ShieldCheck size={18} /> : <KeyRound size={17} />}
        </span>

        <div className="eyebrow">
          <Sparkles size={11} className="inline-icon" /> MOSAIC WORKSPACE ACCOUNTS
        </div>

        <h1>{mode === "sign-in" ? "Welcome back." : "Create your account."}</h1>

        <p className="page-subtitle">
          {isSupabaseActive
            ? "Connected to Supabase Cloud Auth. Sign in to sync your workspace CRM and creator lists."
            : "Workspace accounts active. Sign in with your work email or register below."}
        </p>

        {/* Status Badge */}
        <div className="auth-backend-status">
          {isSupabaseActive ? (
            <span className="status-badge status-cloud">
              <CheckCircle2 size={12} className="text-green" />
              <span>Supabase Cloud Connected</span>
            </span>
          ) : (
            <span className="status-badge status-local">
              <Server size={12} />
              <span>Workspace Accounts Enabled (Local Persistence)</span>
            </span>
          )}
        </div>

        {/* Primary Account Form (Always Available) */}
        <form onSubmit={submit} className="auth-main-form">
          {mode === "sign-up" && (
            <div className="form-group">
              <label className="form-label" htmlFor="full-name">
                Full Name
              </label>
              <div className="input-with-icon">
                <User size={15} className="input-icon" />
                <input
                  id="full-name"
                  className="form-input has-icon"
                  autoComplete="name"
                  placeholder="e.g. Alex Turner"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Work Email
            </label>
            <div className="input-with-icon">
              <Mail size={15} className="input-icon" />
              <input
                id="email"
                type="email"
                className="form-input has-icon"
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="input-with-icon">
              <Lock size={15} className="input-icon" />
              <input
                id="password"
                type="password"
                className="form-input has-icon"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="auth-success-banner" role="status">
              <CheckCircle2 size={14} />
              <span>{message}</span>
            </div>
          )}

          <button className="button button-primary auth-submit" type="submit" disabled={busy}>
            {busy ? (
              <>
                <RefreshCw size={14} className="spin-icon" /> Please wait…
              </>
            ) : mode === "sign-in" ? (
              "Sign In to Workspace"
            ) : (
              "Create Account"
            )}
          </button>

          <p className="form-help">
            {mode === "sign-up"
              ? "Your campaign lists, notes, and tags will be saved and partitioned under your account."
              : "Access your saved creator shortlists, CRM stages, and custom tags across devices."}
          </p>

          <button
            className="auth-toggle"
            type="button"
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setError("");
              setMessage("");
            }}
          >
            {mode === "sign-in"
              ? "New to Mosaic? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </form>

        {/* Supabase Configuration Drawer */}
        <div className="supabase-config-drawer">
          <button
            type="button"
            className="supabase-toggle-btn"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Database size={14} className="text-green" />
            <span>Configure Supabase Project (Cloud Sync & Postgres)</span>
            {showConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showConfig && (
            <form onSubmit={handleSaveSupabase} className="supabase-config-form">
              <p className="config-desc">
                Connect your Supabase project URL and public Anon key to enable remote PostgreSQL
                synchronization and Supabase Cloud Auth.
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="sb-url">
                  Supabase Project URL
                </label>
                <input
                  id="sb-url"
                  type="url"
                  className="form-input"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sb-key">
                  Supabase Anon Key
                </label>
                <input
                  id="sb-key"
                  type="password"
                  className="form-input"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                />
              </div>

              {configError && (
                <div className="auth-error-banner" role="alert">
                  <AlertCircle size={14} />
                  <span>{configError}</span>
                </div>
              )}

              {configMessage && (
                <div className="auth-success-banner" role="status">
                  <CheckCircle2 size={14} />
                  <span>{configMessage}</span>
                </div>
              )}

              <div className="config-actions">
                <button
                  type="submit"
                  className="button button-secondary button-sm"
                  disabled={testingConfig}
                >
                  {testingConfig ? (
                    <>
                      <RefreshCw size={12} className="spin-icon" /> Connecting…
                    </>
                  ) : (
                    "Save & Connect Supabase"
                  )}
                </button>
                {supabaseUrl && (
                  <button
                    type="button"
                    className="button button-sm button-ghost"
                    onClick={() => {
                      setSupabaseUrl("");
                      setSupabaseAnonKey("");
                      saveSupabaseConfig("", "");
                      setClient(null);
                      setConfigMessage("Disconnected Supabase. Running in workspace account mode.");
                    }}
                  >
                    Clear Keys
                  </button>
                )}
              </div>

              <div className="supabase-guide-tip">
                <strong>How to find your keys:</strong> In your Supabase Dashboard, go to{" "}
                <em>Project Settings → API</em>. Copy your <code>Project URL</code> and{" "}
                <code>anon / public</code> key.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
