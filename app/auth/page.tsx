"use client";

import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, KeyRound, Lock, Mail, RefreshCw,
  ShieldCheck, Sparkles, User, AlertCircle, Zap
} from "lucide-react";
import { useEffect, useState } from "react";
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
  const [needsVerificationEmail, setNeedsVerificationEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const errParam = new URLSearchParams(window.location.search).get("error");
    if (errParam === "callback") {
      setError("Email confirmation link expired or invalid. Please sign in or request a new verification email.");
    }
  }, []);

  async function handleInstantGuestPreview() {
    const activeClient = getSupabaseBrowserClient();
    if (activeClient) {
      await activeClient.auth.signOut().catch(() => {});
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("mosaic_user_session");
      document.cookie = "mosaic_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    const next = new URLSearchParams(window.location.search).get("next") ?? "/";
    const targetUrl = next.startsWith("/") && !next.startsWith("//") ? next : "/";
    window.location.assign(targetUrl);
  }

  async function handleResendVerification() {
    if (!client || !needsVerificationEmail) return;
    setResending(true);
    setError("");
    try {
      const { error: resendErr } = await client.auth.resend({
        type: "signup",
        email: needsVerificationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (resendErr) {
        setError(resendErr.message);
      } else {
        setMessage(`Verification email resent to ${needsVerificationEmail}. Please check your inbox and spam folder.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setNeedsVerificationEmail(null);
    setBusy(true);

    const cleanEmail = email.trim().toLowerCase();
    const userName = fullName.trim() || cleanEmail.split("@")[0];
    const next = new URLSearchParams(window.location.search).get("next") ?? "/";
    const targetUrl = next.startsWith("/") && !next.startsWith("//") ? next : "/";

    try {
      const activeClient = getSupabaseBrowserClient();

      if (!activeClient) {
        setError(
          "Authentication service is not configured on this server (missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY). Explore in Guest Sandbox or configure Supabase in Settings.",
        );
        return;
      }

      if (mode === "sign-up") {
        const { data, error: signUpError } = await activeClient.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: userName, role },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        // Supabase returns identities=[] when the email is already registered under privacy protection
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setError("An account with this email already exists. Please switch to Sign In.");
          return;
        }

        if (data?.session && data.user?.id) {
          saveUserRole(role, data.user.id);
          await fetch("/api/quota", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role }),
          }).catch(() => {});
          window.location.assign(targetUrl);
          return;
        }

        // Email confirmation is required before an authenticated session is issued
        setNeedsVerificationEmail(cleanEmail);
        setMessage(
          `Account created for ${cleanEmail}! Please open the confirmation link sent to your email inbox, then sign in.`,
        );
        return;
      }

      // Real Sign-In verification — never bypass failed credentials
      const { data: signInData, error: signInError } = await activeClient.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) {
        if (signInError.message.toLowerCase().includes("email not confirmed")) {
          setNeedsVerificationEmail(cleanEmail);
          setError("Your email address has not been confirmed yet. Check your inbox or click Resend Confirmation below.");
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (!signInData?.session || !signInData.user?.id) {
        setError("Sign in did not return an active session. Please try again.");
        return;
      }

      saveUserRole(role, signInData.user.id);
      await fetch("/api/quota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      }).catch(() => {});
      window.location.assign(targetUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
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
          Sign in with verified account credentials to sync your isolated workspace CRM, shortlists, and server-enforced search quota.
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
                  <p>Manage creator profile preferences and discovery tools</p>
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

          {needsVerificationEmail && (
            <button
              type="button"
              className="button button-secondary"
              style={{ width: "100%", justifyContent: "center", marginBottom: 10 }}
              disabled={resending}
              onClick={handleResendVerification}
            >
              {resending ? "Sending…" : `Resend Confirmation Email to ${needsVerificationEmail}`}
            </button>
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
              ? "Your campaign lists, notes, tags, and quota will be saved and strictly isolated under your account."
              : "Access your saved creator shortlists, CRM stages, and custom tags across devices."}
          </p>

          <button
            className="auth-toggle"
            type="button"
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setError("");
              setMessage("");
              setNeedsVerificationEmail(null);
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
