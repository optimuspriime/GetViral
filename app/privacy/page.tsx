import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How GetViral collects, uses, and protects account, creator, and API-sourced data.",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="card legal-doc-card">
      <div className="legal-doc-header">
        <span className="eyebrow">LEGAL & PRIVACY COMPLIANCE</span>
        <h1>Privacy Policy</h1>
        <p className="page-subtitle">Last updated: November 25, 2026</p>
      </div>

      <section className="legal-section">
        <h2>1. Information We Collect</h2>
        <p>
          GetViral collects only the information required to provide authenticated workspace access, enforce fair search quotas, and persist creator shortlists saved by signed-in users:
        </p>
        <ul>
          <li><strong>Account Data:</strong> Your email address, display name, and selected workspace role when you register or sign in via Supabase Authentication.</li>
          <li><strong>Workspace & Shortlist Data:</strong> Creators you choose to save, shortlist folder names, outreach stages, tags, and campaign notes. All saved CRM records are scoped strictly to your authenticated user ID.</li>
          <li><strong>Usage & Rate-Limiting Data:</strong> Server-side search counters (monthly quota for signed-in accounts, and hashed IP/cookie rate limits for unauthenticated guest previews).</li>
          <li><strong>Essential Cookies:</strong> Authentication session tokens, signed guest preview rate-limit tokens, and cookie consent preferences.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>2. Third-Party Platform API Services & Attribution</h2>
        <p>
          When platform connectors are enabled, GetViral queries official developer APIs at runtime and displays fetched metrics with source attribution and timestamps:
        </p>
        <ul>
          <li>
            <strong>YouTube API Services:</strong> GetViral uses YouTube API Services for YouTube channel discovery and public statistics. By using YouTube features inside GetViral, you agree to be bound by the{" "}
            <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer">
              YouTube Terms of Service
            </a>{" "}
            and acknowledge the{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
              Google Privacy Policy
            </a>.
          </li>
          <li>
            <strong>Google Security Settings:</strong> If you ever authorize Google/YouTube OAuth scopes, you can revoke GetViral&apos;s access at any time via the{" "}
            <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noreferrer">
              Google Security Settings page
            </a>.
          </li>
          <li>
            <strong>Twitch, Kick, TikTok & Meta (Instagram):</strong> Twitch Helix, Kick channel endpoints, TikTok Display API, and Meta Instagram Graph API are queried strictly within each provider&apos;s authorized endpoints and terms. We never scrape private user data or fabricate unverified contact records.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>3. Data Retention & Deletion</h2>
        <p>
          Shortlists, notes, and tags remain stored while your workspace account is active. Temporary query caches expire automatically in short intervals. To request export or complete deletion of your account and stored data, visit our{" "}
          <Link href="/support">Support page</Link> or email{" "}
          <a href="mailto:support@getviral.io">support@getviral.io</a>.
        </p>
      </section>

      <div className="legal-doc-actions">
        <Link href="/terms" className="button button-secondary button-sm">
          Read Terms of Service
        </Link>
        <Link href="/support" className="button button-primary button-sm">
          Contact Support
        </Link>
      </div>
    </article>
  );
}
