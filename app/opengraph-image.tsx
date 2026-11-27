import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GetViral — Creator Discovery & Campaign CRM";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #f3faf2 0%, #e1f2e3 55%, #cbe7cf 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#163824",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "14px",
              background: "#267c49",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "28px",
              fontWeight: 800,
            }}
          >
            GV
          </div>
          <span style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-0.02em" }}>
            GetViral.
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "920px" }}>
          <div
            style={{
              fontSize: "58px",
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              color: "#122f1d",
            }}
          >
            Discover Real-Time Creators &amp; Campaign Intelligence.
          </div>
          <div style={{ fontSize: "26px", lineHeight: 1.4, color: "#3d664c" }}>
            Search live YouTube channels, look up Kick @handles, and manage creator partnerships with transparent source timestamps.
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", fontSize: "20px", fontWeight: 600, color: "#215a38" }}>
          <span>YouTube Live Search</span>
          <span>•</span>
          <span>Kick Handle Lookup</span>
          <span>•</span>
          <span>Source Timestamps</span>
          <span>•</span>
          <span>Creator CRM</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
