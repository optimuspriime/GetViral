# Mosaic — Creator intelligence

Mosaic is a Next.js App Router MVP for discovering creator profiles, comparing platform-appropriate metrics, and keeping a shortlist. The default experience is a **clearly labeled demo**: creator records and their dated metrics are synthetic, and demo profile URLs use the reserved `.example` domain.

The demo catalogue includes 30 fictional creator profiles and daily synthetic snapshots for accounts with supported metrics. These values are for product previews and testing only; they do not represent actual platform reach or Mosaic adoption.

## Run locally

Requirements: Node.js 20.9+ and npm.

```powershell
npm install
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app works without API credentials in demo mode. For a production build:

```powershell
npm run typecheck
npm run build
npm start
```

`npm run lint` runs ESLint with the Next.js core-web-vitals and TypeScript rules.

## What is implemented

- **Overview:** date-range controls and charts for platform accounts, dated follower/subscriber snapshots, platform-specific reach snapshots, creator categories, and creator countries. Chart coverage and source notes are shown; audience-country reporting stays unavailable without sourced insight records.
- **Discovery:** combined text, platform, category, language, creator-country, audience-size, live-viewer, video-view, activity, and public-contact filters; sorting; creator profiles; and CSV export of the filtered results.
- **Creator profiles:** multi-platform accounts, metric history, collection windows, sample counts, country/contact sources, and explicit unavailable fields.
- **Prospect CRM:** create lists, save/remove creators, add notes and tags, track prospect status, and export a list. In demo mode, this data is stored in this browser's local storage. With Supabase configured, the browser storage key is isolated by authenticated user ID, but **the MVP does not yet sync prospect changes to Postgres or share lists across team members**.
- **Settings and auth:** Supabase email/password sign-up and sign-in; protected app routes when Supabase is configured; workspace bootstrap trigger; migration schema with RLS; official platform documentation and coverage caveats.
- **Provider boundary:** server-only provider modules and a shared request error contract for expired tokens, permissions, rate limits, and upstream failures. Providers intentionally report “not configured”; no platform API requests or scraping run yet.

## Supabase setup

1. Create a Supabase project and copy its project URL and anon/public key.
2. Put `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only; this MVP does not need it at runtime.
3. Apply the migrations in `supabase/migrations/` using the [Supabase CLI](https://supabase.com/docs/guides/cli):

   ```powershell
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

   For a local Supabase stack, use `supabase start` and `supabase db reset`.
4. Configure Supabase Auth email/password and add `http://localhost:3000/auth/callback` to the allowed redirect URLs.
5. Restart `npm run dev`. New users receive a private workspace and owner membership through the auth trigger. RLS restricts lists, list memberships, notes, tags, and sync runs to workspace members. The creator catalog and sourced public metrics are readable by authenticated users; CRM records are not.

The database schema is ready for normalized creator accounts, append-only metric snapshots, public content, sourced audience insights, public business contacts, saved lists, tags, prospect notes/status, and platform sync history. The current demo UI remains local-storage-backed until a server-side provider ingestion and workspace persistence adapter is configured.

## Platform integrations and environment variables

The example environment file contains placeholders only:

| Variable | Use |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase administration, if a future ingestion job needs it |
| `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` | Reserved for a future approved Twitch connector |
| `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET` | Reserved for a future approved Kick connector |
| `YOUTUBE_DATA_API_KEY` | Reserved for YouTube Data API v3 |
| `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | Reserved for creator-authorized TikTok access |
| `META_APP_ID`, `META_APP_SECRET` | Reserved for eligible Instagram Professional account access |
| `CREATOR_DATA_PROVIDER` | Optional name of a separately approved creator-data provider |

Adding a key alone does not activate a connector. Each adapter must be implemented against the then-current official docs and approved permissions. In particular:

- Kick's documented user/channel lookup is based on supplied identifiers; the app does not claim exhaustive creator discovery. Current viewer count is not a historical average.
- YouTube Data API has quota constraints; video-view averages require an explicit set of public posts, sample size, and date window.
- TikTok authorization is creator-scoped and does not grant another creator's private analytics.
- Instagram's official API is limited to eligible Professional accounts and approved access; consumer-account coverage and private analytics are not implied.
- Audience geography/demographics require a documented or licensed source, collection date, and confidence/status. Creator country is a separate field.
- Public business email may only be stored from a public listing or user-provided/imported contact, with source URL and last-checked date. Mosaic does not scrape, look up private email addresses, or automate outreach.

Official references: [Twitch API](https://dev.twitch.tv/docs/api/reference/), [Kick API](https://docs.kick.com/apis/), [YouTube Data API](https://developers.google.com/youtube/data-api), [TikTok Display API](https://developers.tiktok.com/doc/display-api-overview/), and [Instagram Platform](https://developers.facebook.com/documentation/instagram-platform/).

## Known limitations

- All included creators, metrics, and public contact examples are synthetic; their source label is visible. No live platform data or real creator profiles are represented.
- No production platform connector is active. API keys, OAuth approval, scopes, quotas, and platform review may be required.
- Supabase Auth and RLS are implemented, but prospect CRUD remains browser-local and is not synchronized to the database in this MVP.
- Metric charts use only stored demo snapshots. Growth uses dated snapshots, not interpolation. A selected date range may contain only one or no points.
- Instagram/TikTok metrics, audience geography, demographics, engagement rate, and other unsupported fields stay unavailable unless a future approved provider supplies them.
- Billing and automated outreach are intentionally out of scope.
