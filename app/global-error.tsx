"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#f2f7f2" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div
            style={{
              maxWidth: "480px",
              width: "100%",
              padding: "32px",
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#fee2e2",
                color: "#dc2626",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <h2 style={{ fontSize: "18px", color: "#1c3c26", margin: "0 0 8px 0" }}>App Recovery Mode</h2>
            <p style={{ fontSize: "13px", color: "#617d69", margin: "0 0 20px 0" }}>
              A temporary runtime issue occurred. Click below to reload.
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: "10px 20px",
                background: "#2e7d48",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <RefreshCw size={14} /> Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
