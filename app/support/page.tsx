import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support & Help Center",
  description: "Get help with GetViral creator search, platform capabilities, account privacy, and OAuth access.",
};

export default function SupportPage() {
  return (
    <article className="card legal-doc-card">
      <div className="legal-doc-header">
        <span className="eyebrow">SUPPORT & DOCUMENTATION</span>
        <h1>Support & Platform Guide</h1>
        <p className="page-subtitle">Help with creator search, handle lookup, quotas, and account requests</p>
      </div>

      <section className="legal-section">
        <h2>Contact Support</h2>
        <p>
          For account assistance, data deletion requests, bug reports, or partnership questions, reach our team at{" "}
          <a href="mailto:support@getviral.io">support@getviral.io</a>.
        </p>
      </section>

      <section className="legal-section">
        <h2>How Each Platform Connector Works</h2>
        <ul>
          <li><strong>YouTube &amp; Twitch:</strong> Support keyword search and live channel metrics when platform services are active.</li>
          <li><strong>Kick:</strong> Supports exact single-word handle lookup only (for example, <code>adinross</code> or <code>@xqc</code>). Multi-word phrases are automatically skipped on Kick.</li>
          <li><strong>TikTok &amp; Instagram:</strong> Require individual creator or professional account authorization and are unavailable for anonymous public keyword discovery.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Quotas & Account Privacy</h2>
        <p>
          Guest preview sessions allow 5 server-enforced test searches. Creating a free account unlocks 50 monthly searches and private creator shortlists. Searches that return no results from unconfigured platforms never consume your quota.
        </p>
      </section>

      <div className="legal-doc-actions">
        <Link href="/discover" className="button button-primary button-sm">
          Open Discover
        </Link>
        <Link href="/privacy" className="button button-secondary button-sm">
          Privacy Policy
        </Link>
        <Link href="/terms" className="button button-secondary button-sm">
          Terms of Service
        </Link>
      </div>
    </article>
  );
}
