# Mosaic — Enterprise Creator Intelligence & Discovery Platform

Mosaic is an enterprise-grade creator discovery, reach analytics, and prospect CRM platform built with Next.js App Router, React 19, TypeScript, Tailwind CSS, and Recharts.

The application connects verified cross-platform creator data across YouTube, Twitch, Kick, TikTok, and Instagram, featuring live platform lookup endpoints, prospect shortlists, audience geography benchmarks, and verified direct talent management contacts.

## Key Features

- **Executive Intelligence Dashboard**:
  - Live cross-platform creator metrics and growth snapshots over 7D, 30D, and 90D windows.
  - Interactive platform breakdown charts (YouTube, Twitch, Kick, TikTok, Instagram).
  - Reach benchmark graphs comparing average concurrent live stream viewers (Twitch & Kick) and average views per video (YouTube & TikTok).
  - Audience tier distribution and verified geographic demographic analysis.
  - Quick metric definitions dialog explaining verification standards.

- **Multi-Platform Creator Discovery**:
  - Combined text, platform, category, language, country, follower range, live concurrency, and video view filters.
  - Interactive bookmarking system to save creators to designated campaign shortlists.
  - **Live API Creator Import**: Query official platform APIs (YouTube Data API v3, Kick API, Twitch Helix) by channel handle to import live statistics directly into your workspace catalog.
  - One-click CSV export of filtered discovery results with verified data points.

- **Verified Creator Profiles**:
  - Multi-platform channel cards with real external links directly to official YouTube, Twitch, Kick, TikTok, and Instagram accounts.
  - High-resolution creator avatars and talent bios.
  - Dated snapshot history tables tracking subscriber counts, ACV (average concurrent viewers), and recent video views.
  - Direct public talent management emails with source verification and last-checked timestamps.
  - Shareable profile links with one-click clipboard copying.

- **Prospect CRM & Campaign Shortlists**:
  - Create, rename, and manage multiple campaign shortlists (e.g. "Q4 Brand Sponsors", "Gaming Ambassadors").
  - Track outreach status per creator (`To review`, `Shortlisted`, `Contacted`, `Partnered`).
  - Add contextual campaign notes and custom comma-separated tags with instant autosave.
  - Copy formatted shortlist summaries or export complete CSV spreadsheets.
  - Delete or organize lists seamlessly.

- **Workspace Management & Quick Navigation**:
  - Interactive workspace switcher supporting multiple teams and roles (e.g., "Primary Production", "Brand Partnerships").
  - Instant Command Palette (`⌘ K` / `Ctrl + K`) for rapid search and keyboard navigation across all creators and app pages.
  - Interactive Account dropdown menu with profile details and workspace actions.

- **API Integrations & Live Query Sandbox**:
  - Interactive Settings page with real-time API connector status and connection testing for each platform.
  - Live API query sandbox to inspect raw JSON responses from platform endpoints.
  - Configured for optional Supabase Auth and team database synchronization.

## Quick Start

```powershell
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Verification

```powershell
npm run typecheck
npm run lint
npm run build
npm start
```

## API Environment Variables (Optional)

Configure in `.env.local` to enable additional cloud features:

| Variable | Description |
| --- | --- |
| `YOUTUBE_DATA_API_KEY` | Google Cloud API Key with YouTube Data API v3 enabled |
| `TWITCH_CLIENT_ID` | Twitch Developer Application Client ID |
| `TWITCH_CLIENT_SECRET` | Twitch Developer Application Client Secret |
| `KICK_CLIENT_ID` | Kick Developer Application Client ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL for team synchronization |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key for browser authentication |
