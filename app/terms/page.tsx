import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions governing use of GetViral creator discovery and campaign CRM.",
};

export default function TermsOfServicePage() {
  return (
    <article className="card legal-doc-card">
      <div className="legal-doc-header">
        <span className="eyebrow">TERMS & ACCEPTABLE USE</span>
        <h1>Terms of Service</h1>
        <p className="page-subtitle">Last updated: November 25, 2026</p>
      </div>

      <section className="legal-section">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using GetViral (&ldquo;the Service&rdquo;), you agree to comply with these Terms of Service and all applicable laws and regulations. If you do not agree, do not use the Service.
        </p>
      </section>

      <section className="legal-section">
        <h2>2. Connected Platform Terms</h2>
        <p>
          GetViral connects with supported creator platforms strictly within platform guidelines and authorized creator permissions. When interacting with YouTube data or features, you also agree to be bound by the{" "}
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer">
            YouTube Terms of Service
          </a>{" "}
          and{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
            Google Privacy Policy
          </a>.
        </p>
      </section>

      <section className="legal-section">
        <h2>3. Permitted Use & Restrictions</h2>
        <ul>
          <li>You may use GetViral for legitimate creator discovery, analytics evaluation, and campaign partnership outreach.</li>
          <li>You may not attempt to bypass server-side rate limits, search quotas, or authentication controls, nor scrape, automate bulk abuse, or misuse public contact details for unsolicited spam.</li>
          <li>Creator metrics and availability depend on connected social platforms and are provided with origin timestamps on an &ldquo;as-is&rdquo; basis.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>4. Accounts & Quotas</h2>
        <p>
          Guest preview sessions are limited to a small evaluation quota enforced by the server. Registered accounts receive 50 complimentary searches per month with private shortlist isolation.
        </p>
      </section>

      <div className="legal-doc-actions">
        <Link href="/privacy" className="button button-secondary button-sm">
          Read Privacy Policy
        </Link>
        <Link href="/support" className="button button-primary button-sm">
          Contact Support
        </Link>
      </div>
    </article>
  );
}
