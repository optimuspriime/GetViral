"use client";

import { useEffect, useState } from "react";
import { Cookie, ShieldCheck, X } from "lucide-react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = window.localStorage.getItem("mosaic_cookie_consent");
      if (!consent) {
        // Show after a brief delay for smooth appearance
        const timer = setTimeout(() => {
          setVisible(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  function handleAccept() {
    try {
      window.localStorage.setItem("mosaic_cookie_consent", "accepted");
      document.cookie = "mosaic_cookie_consent=accepted; path=/; max-age=31536000; SameSite=Lax";
    } catch {}
    setVisible(false);
  }

  function handleDecline() {
    try {
      window.localStorage.setItem("mosaic_cookie_consent", "essential");
      document.cookie = "mosaic_cookie_consent=essential; path=/; max-age=31536000; SameSite=Lax";
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      className="cookie-banner-wrap"
      aria-label="Cookie consent banner"
      role="region"
    >
      <div className="cookie-banner-card">
        <div className="cookie-banner-head">
          <div className="cookie-title-row">
            <span className="cookie-icon-box">
              <Cookie size={17} />
            </span>
            <div>
              <strong>Cookie & Workspace Privacy</strong>
              <span className="cookie-compliance-badge">
                <ShieldCheck size={11} /> GDPR & CCPA
              </span>
            </div>
          </div>
          <button
            type="button"
            className="cookie-close-btn"
            onClick={handleDecline}
            aria-label="Dismiss cookie banner"
          >
            <X size={15} />
          </button>
        </div>

        <p className="cookie-banner-body">
          We use essential cookies and browser storage to maintain your session, enforce fair guest evaluation limits, and store saved creator lists for signed-in accounts. Read our{" "}
          <a href="/privacy" style={{ textDecoration: "underline", color: "inherit", fontWeight: 600 }}>
            Privacy Policy
          </a>.
        </p>

        <div className="cookie-banner-actions">
          <button
            type="button"
            className="button button-primary button-sm cookie-btn-accept"
            onClick={handleAccept}
          >
            Accept All Cookies
          </button>
          <button
            type="button"
            className="button button-secondary button-sm cookie-btn-essential"
            onClick={handleDecline}
          >
            Essential Only
          </button>
        </div>
      </div>
    </aside>
  );
}
