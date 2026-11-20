"use client";

import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AuthPage() {
  const client = getSupabaseBrowserClient();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!client) return;
    setBusy(true);
    try {
      if (mode === "sign-up") {
        const { data, error: signUpError } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) window.location.assign("/");
        else setMessage("Check your inbox to confirm your email, then sign in.");
      } else {
        const { error: signInError } = await client.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        const next = new URLSearchParams(window.location.search).get("next") ?? "/";
        window.location.assign(next.startsWith("/") && !next.startsWith("//") ? next : "/");
      }
    } catch (caught) {
      console.error("Supabase authentication request failed.", caught);
      setError(caught instanceof Error ? caught.message : "Authentication failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <Link href="/settings" className="back-link"><ArrowLeft size={14} /> Back to settings</Link>
      <div className="auth-card card">
        <span className="auth-mark"><KeyRound size={17} /></span>
        <div className="eyebrow">MOSAIC WORKSPACE</div>
        <h1>{mode === "sign-in" ? "Welcome back." : "Create your account."}</h1>
        <p className="page-subtitle">{client ? "Sign in to your private workspace." : "Demo mode runs without authentication. Configure Supabase to enable accounts."}</p>
        {client ? <form onSubmit={submit}>
          {mode === "sign-up" && <><label className="form-label" htmlFor="full-name">Name</label><input id="full-name" className="form-input" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required /></>}
          <label className="form-label" htmlFor="email">Work email</label><input id="email" type="email" className="form-input" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label className="form-label" htmlFor="password">Password</label><input id="password" type="password" className="form-input" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error && <div className="auth-error" role="alert">{error}</div>}
          {message && <div className="auth-success" role="status">{message}</div>}
          <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}</button>
          <p className="form-help">{mode === "sign-up" ? "A private workspace is created when your account is registered." : "Database-backed workspace tables use row-level security. Demo CRM edits remain browser-local."}</p>
          <button className="auth-toggle" type="button" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setError(""); setMessage(""); }}>{mode === "sign-in" ? "New to Mosaic? Create an account" : "Already have an account? Sign in"}</button>
        </form> : <div className="auth-demo-note"><p><strong>Start demo mode without an account.</strong> Lists are stored locally in this browser.</p><Link className="button button-primary" href="/">Continue to demo</Link><p className="form-help">See README setup steps to connect Supabase Auth and Postgres.</p></div>}
      </div>
    </div>
  );
}
