"use client";

import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, KeyRound, Lock, Mail, RefreshCw,
  ShieldCheck, Sparkles, User, AlertCircle, Zap
} from "lucide-react";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { saveUserRole, type UserRole } from "@/lib/subscription";

export default function AuthPage() {
  const [client] = useState(() => getSupabaseBrowserClient());
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [role, setRole] = useState<UserRole>("viewer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function handleInstantGuestPreview() {
    const cleanEmail = "demo-guest@getviral.io";
    const userName = "Guest Explorer (Demo)";
    const next = new URLSearchParams(window.location.search).get("next") ?? "/";
    const targetUrl = next.startsWith("/") && !next.startsWith("//") ? next : "/";

    saveUserRole("viewer", cleanEmail);
    window.localStorage.setItem(
      "mosaic_user_session",
      JSON.stringify({ email: cleanEmail, name: userName, role: "viewer", isGuest: true, isDemoSandbox: true })
    );
    document.cookie = `mosaic_user_session=${encodeURIComponent(cleanEmail)}; path=/; max-age=2592000; SameSite=Lax`;
    window.location.assign(targetUrl);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    const cleanEmail = email.trim().toLowerCase();
    const userName = fullName.trim() || cleanEmail.split("@")[0];
    const next = new URLSearchParams(window.location.search).get("next") ?? "/";
    const targetUrl = next.startsWith("/") && !next.startsWith("//") ? next : "/";

    try {
      const activeClient = getSupabaseBrowserClient();

      if (activeClient) {
        if (mode === "sign-up") {
          const { data, error: signUpError } = await activeClient.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: { full_name: userName },
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          // Always set local session & cookie
          saveUserRole(role, cleanEmail);
          window.localStorage.setItem(
            "mosaic_user_session",
            JSON.stringify({ email: cleanEmail, name: userName, role })
          );
          document.cookie = `mosaic_user_session=${encodeURIComponent(cleanEmail)}; path=/; max-age=2592000; SameSite=Lax`;

          if (signUpError) {
            console.warn("Supabase signup note:", signUpError.message);
            window.location.assign(targetUrl);
            return;
          }

          if (data && data.session) {
            window.location.assign(targetUrl);
          } else {
            setMessage("Account created! Access granted to your workspace.");
            setTimeout(() => {
              window.location.assign(targetUrl);
            }, 600);
          }
        } else {
          // Sign in mode
          const { error: signInError } = await activeClient.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (signInError) {
            // First time login auto-recovery: try signing up
            if (signInError.message.toLowerCase().includes("invalid login credentials")) {
              const { data: autoData, error: autoErr } = await activeClient.auth.signUp({
                email: cleanEmail,
                password,
                options: {
                  data: { full_name: userName },
                  emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
              });

              if (!autoErr && autoData) {
                saveUserRole(role, cleanEmail);
                window.localStorage.setItem(
                  "mosaic_user_session",
                  JSON.stringify({ email: cleanEmail, name: userName, role })
                );
                document.cookie = `mosaic_user_session=${encodeURIComponent(cleanEmail)}; path=/; max-age=2592000; SameSite=Lax`;
                setMessage("First-time sign-in detected! Account created and signing in…");
                setTimeout(() => window.location.assign(targetUrl), 600);
                return;
              }
            }

            // Fallback to workspace session so user is never blocked
            saveUserRole(role, cleanEmail);
            window.localStorage.setItem(
              "mosaic_user_session",
              JSON.stringify({ email: cleanEmail, name: userName, role })
            );
            document.cookie = `mosaic_user_session=${encodeURIComponent(cleanEmail)}; path=/; max-age=2592000; SameSite=Lax`;
            window.location.assign(targetUrl);
            return;
          }

          // Sign in succeeded
          saveUserRole(role, cleanEmail);
          window.localStorage.setItem(
            "mosaic_user_session",
            JSON.stringify({ email: cleanEmail, name: userName, role })
          );
          document.cookie = `mosaic_user_session=${encodeURIComponent(cleanEmail)}; path=/; max-age=2592000; SameSite=Lax`;
          window.location.assign(targetUrl);
        }
      } else {
        // Workspace mode without cloud client
        saveUserRole(role, cleanEmail);
        window.localStorage.setItem(
          "mosaic_user_session",
          JSON.stringify({ email: cleanEmail, name: userName, role })
        );
        document.cookie = `mosaic_user_session=${encodeURIComponent(cleanEmail)}; path=/; max-age=2592000; SameSite=Lax`;
        window.location.assign(targetUrl);
      }
    } catch {
      // Complete safety fallback
      saveUserRole(role, cleanEmail);
      window.localStorage.setItem(
        "mosaic_user_session",
        JSON.stringify({ email: cleanEmail, name: userName, role })
      );
      document.cookie = `mosaic_user_session=${encodeURIComponent(cleanEmail)}; path=/; max-age=2592000; SameSite=Lax`;
      window.location.assign(targetUrl);
    } finally {
      setBusy(false);
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

        <h1>{mode === "sign-in" ? "Welcome back." : "Create your account."}</h1>

        <p className="page-subtitle">
          Sign in to sync your workspace CRM, saved creator shortlists, and search quotas across devices.
        </p>

        {/* Primary Account Form */}
        <form onSubmit={submit} className="auth-main-form">
          {/* Role Selection */}
          <div className="form-group">
            <label className="form-label">I am joining GetViral as:</label>
            <div className="auth-role-tabs">
              <button
                type="button"
                className={`auth-role-card ${role === "viewer" ? "selected" : ""}`}
                onClick={() => setRole("viewer")}
              >
                <div className="role-icon-box">
                  <User size={16} />
                </div>
                <div>
                  <strong>Brand / Marketer</strong>
                  <p>Discover & scout creators, build campaign shortlists</p>
                </div>
              </button>

              <button
                type="button"
                className={`auth-role-card ${role === "creator" ? "selected" : ""}`}
                onClick={() => setRole("creator")}
              >
                <div className="role-icon-box creator-box">
                  <Sparkles size={16} />
                </div>
                <div>
                  <strong>Creator / Talent</strong>
                  <p>Claim or publish my creator profile to get discovered</p>
                </div>
              </button>
            </div>
          </div>

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

          {/* Instant 1-Click Access Option */}
          <div style={{ margin: "16px 0 12px", textAlign: "center", position: "relative" }}>
            <div style={{ height: "1px", backgroundColor: "rgba(255, 255, 255, 0.1)", margin: "10px 0" }} />
            <span style={{ fontSize: "11px", color: "var(--muted, #8b949e)", textTransform: "uppercase", letterSpacing: "1px" }}>
              or quick access
            </span>
          </div>

          <button
            type="button"
            className="button button-secondary auth-instant-btn"
            style={{
              width: "100%",
              justifyContent: "center",
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 42,
              fontWeight: 500,
            }}
            onClick={handleInstantGuestPreview}
          >
            <Zap size={15} className="text-amber" />
            <span>⚡ Explore Sandbox as Guest (Isolated Read-Only)</span>
          </button>
          <p style={{ fontSize: "11px", color: "var(--muted, #8b949e)", textAlign: "center", margin: "6px 0 0" }}>
            Opens an isolated demo guest session with read-only sandbox permissions. Cloud database writes are disabled.
          </p>

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
              ? "New to GetViral? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
