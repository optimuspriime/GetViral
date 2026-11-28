import { useId } from "react";

export function BrandMark({ className = "" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const bgId = `gv-bg-${uid}`;
  const pulseId = `gv-pulse-${uid}`;
  const sheenId = `gv-sheen-${uid}`;

  return (
    <span className={`brand-mark ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 44 44" width="24" height="24" fill="none">
        <defs>
          <linearGradient id={bgId} x1="4" y1="4" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E9E59" style={{ stopColor: "var(--accent-soft, #1E9E59)" }} />
            <stop offset="55%" stopColor="#16834B" style={{ stopColor: "var(--accent-primary, #16834B)" }} />
            <stop offset="100%" stopColor="#0E5C34" style={{ stopColor: "var(--accent-dark, #0E5C34)" }} />
          </linearGradient>
          <linearGradient id={pulseId} x1="12" y1="30" x2="34" y2="11" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#86EFAC" style={{ stopColor: "var(--accent-pulse-start, #86EFAC)" }} />
            <stop offset="52%" stopColor="#B9F36A" style={{ stopColor: "var(--accent-highlight, #B9F36A)" }} />
            <stop offset="100%" stopColor="#E4FC9C" style={{ stopColor: "var(--accent-pulse-end, #E4FC9C)" }} />
          </linearGradient>
          <linearGradient id={sheenId} x1="6" y1="4" x2="26" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Glossy Studio Leaf-Squircle Field */}
        <path
          d="M9 6h18c6.627 0 12 5.373 12 12v10c0 6.627-5.373 12-12 12H15C8.373 40 4 35.627 4 29V11c0-2.761 2.239-5 5-5Z"
          fill={`url(#${bgId})`}
        />
        <path
          d="M9 6h18c6.627 0 12 5.373 12 12v4C29 15 17 17 4 21V11c0-2.761 2.239-5 5-5Z"
          fill={`url(#${sheenId})`}
        />

        {/* Stylized Open G-Arc */}
        <path
          d="M28.5 14.2A10.2 10.2 0 0 0 12.1 22c0 5.6 4.5 10.1 10.1 10.1 4.1 0 7.7-2.4 9.3-5.9h-5.8"
          stroke="#ECFEF2"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Upward Viral V-Pulse Crest */}
        <path
          d="M17.2 21.8 21.8 26.2 31.4 15.6"
          stroke={`url(#${pulseId})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
