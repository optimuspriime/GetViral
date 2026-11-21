"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, Trash2 } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for diagnostics
    console.error("Mosaic App Error Caught:", error);
  }, [error]);

  const handleResetCache = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("mosaic-creators-v7");
        window.location.href = "/";
      }
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="app-shell" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div
        className="glass-card"
        style={{
          maxWidth: "520px",
          width: "100%",
          padding: "36px 32px",
          borderRadius: "20px",
          background: "rgba(255, 255, 255, 0.95)",
          boxShadow: "0 20px 48px rgba(35, 79, 44, 0.12)",
          border: "1px solid #dce9dc",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "#fee2e2",
            color: "#dc2626",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "18px",
          }}
        >
          <AlertTriangle size={28} />
        </div>

        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#163a23", marginBottom: "8px" }}>
          Something unexpected happened
        </h2>

        <p style={{ fontSize: "13px", color: "#54705b", lineHeight: "1.6", marginBottom: "24px" }}>
          The application encountered a temporary display issue. Don&apos;t worry, your workspace shortlists and creator data remain safe.
        </p>

        {error.message && (
          <div
            style={{
              padding: "10px 14px",
              background: "#f8faf8",
              border: "1px solid #e2ece3",
              borderRadius: "10px",
              fontSize: "11px",
              color: "#748879",
              fontFamily: "monospace",
              textAlign: "left",
              marginBottom: "24px",
              wordBreak: "break-word",
            }}
          >
            {error.message}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            onClick={() => reset()}
            className="button primary"
            style={{
              width: "100%",
              padding: "11px",
              fontSize: "13px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <RefreshCw size={15} /> Try Again
          </button>

          <Link
            href="/"
            className="button secondary"
            style={{
              width: "100%",
              padding: "11px",
              fontSize: "13px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              textDecoration: "none",
            }}
          >
            <Home size={15} /> Return to Dashboard
          </Link>

          <button
            type="button"
            onClick={handleResetCache}
            style={{
              background: "none",
              border: "none",
              color: "#6b8772",
              fontSize: "11px",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginTop: "8px",
            }}
          >
            <Trash2 size={13} /> Reset local cache and reload
          </button>
        </div>
      </div>
    </div>
  );
}
