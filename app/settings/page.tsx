"use client";

import Link from "next/link";
import { ArrowUpRight, Check, CircleHelp, Database, ExternalLink, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { INTEGRATIONS } from "@/lib/integrations";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const authConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setAuthLoading(false);
      return;
    }
    client.auth.getUser().then(({ data, error }) => {
      if (error) setAuthError(error.message);
      setUserEmail(data.user?.email ?? null);
      setAuthLoading(false);
    }).catch((error: unknown) => {
      console.error("Could not check Supabase authentication state.", error);
      setAuthError("Could not verify the current Supabase session.");
      setAuthLoading(false);
    });
  }, []);

  async function signOut() {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) {
      setAuthError(error.message);
      return;
    }
    window.location.assign("/auth");
  }

  return (
    <>
      <div className="page-heading">
        <div><div className="eyebrow">WORKSPACE CONFIGURATION</div><h1>Integrations & settings.</h1><p className="page-subtitle">Connect approved data sources. Each platform has different coverage and permissions.</p></div>
      </div>
      <div className="settings-grid">
        <section>
          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Platform data sources</h2><p className="card-caption">No connector will run until configured and authorized.</p></div><span className="status-pill">Demo mode</span></div>
            <div className="integration-list">
              {INTEGRATIONS.map((integration) => <div className="integration-row" key={integration.platform}>
                <span className={`platform-icon platform-${integration.platform.toLowerCase()}`}>{integration.platform === "YouTube" ? "YT" : integration.platform === "Instagram" ? "IG" : integration.platform.slice(0, 1)}</span>
                <div className="integration-copy"><strong>{integration.platform}</strong><span>{integration.setup}</span><p className="integration-limitation">{integration.limitation}</p></div>
                <div className="integration-actions"><span className="status-label">Not connected</span><a className="docs-link" href={integration.documentationUrl} target="_blank" rel="noreferrer" aria-label={`${integration.platform} official API documentation`} title="Open official documentation"><ExternalLink size={13} /></a></div>
              </div>)}
            </div>
          </div>
          <div className="notice-bar"><CircleHelp size={14} /><span><strong>Audience insights:</strong> creator country and audience country are stored as distinct fields. Audience demographics stay unavailable unless a documented, licensed source supplies their value, date, and confidence.</span></div>
          <div className="notice-bar"><LockKeyhole size={14} /><span><strong>Credential safety:</strong> API secrets belong in server-side environment variables only. Do not use the Supabase service-role key or platform secrets in browser code.</span></div>
        </section>
        <section>
          <div className="card settings-auth-card">
            <div className="card-head"><div><h2 className="card-title"><Database size={14} style={{ verticalAlign: "-3px", marginRight: 6 }} />Authentication & database</h2><p className="card-caption">Supabase Auth, Postgres, and row-level security</p></div><ShieldCheck size={16} color="#6e937b" /></div>
            <div className="settings-note">
              {!authConfigured ? <>
                <p><strong>Demo workspace is active.</strong> Set the Supabase URL and anon key in <code>.env.local</code> to enable account authentication.</p>
                <p>Database migrations define workspace membership, saved lists, creator profiles and accounts, dated snapshots, contacts, notes, tags, and sync-run history.</p>
                <Link href="/auth" className="button button-secondary button-sm">Open account sign in <ArrowUpRight size={12} /></Link>
              </> : authLoading ? <p>Checking Supabase session…</p> : userEmail ? <>
                <p><strong>Signed in as {userEmail}</strong></p>
                <p>Protected routes use Supabase Auth. Workspace records are guarded by Postgres RLS policies.</p>
                <button className="button button-secondary button-sm" onClick={signOut}>Sign out</button>
              </> : <>
                <p><strong>No signed-in user detected.</strong></p>
                <p>Authentication is configured, but a session is not available in this browser.</p>
                <Link href="/auth" className="button button-primary button-sm">Sign in</Link>
              </>}
              {authError && <p className="auth-error">{authError}</p>}
              <p className="settings-storage-warning">Prospect list CRUD in this MVP remains browser-local; the RLS schema is ready for workspace persistence, but the client-side Supabase sync adapter is not yet enabled.</p>
            </div>
          </div>
          <div className="card provider-info-card">
            <div className="card-head"><div><h2 className="card-title">Data principles</h2><p className="card-caption">Mosaic only stores what a source permits</p></div><Check size={15} color="#6e937b" /></div>
            <ul className="principle-list">
              <li>Historical metrics append dated snapshots; new collections do not overwrite prior values.</li>
              <li>Current live viewers are never relabeled as average concurrent viewers.</li>
              <li>Video views and livestream reach stay as separate metric types.</li>
              <li>Contact details must be public or entered by the user, with source URL and checked date.</li>
              <li>No scraping, private-email lookup, or automated outreach is performed.</li>
            </ul>
            <div className="settings-doc-link"><a href="https://developers.google.com/youtube/data-api" target="_blank" rel="noreferrer">YouTube API docs <ExternalLink size={11} /></a><a href="https://docs.kick.com/apis/" target="_blank" rel="noreferrer">Kick API docs <ExternalLink size={11} /></a></div>
          </div>
        </section>
      </div>
    </>
  );
}
