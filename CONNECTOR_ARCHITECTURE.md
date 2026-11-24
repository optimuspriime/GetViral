# Federated Platform Connector Architecture & Official API Specification

## 1. Overview & Architectural Shift

The Mosaic platform has transitioned from a fixed seed catalog (previously 1,035–1,042 static profiles) to a **server-side federated search engine**. Searches execute in real-time across official platform integrations at query time. Test fixtures are strictly isolated to `tests/fixtures/sample-creators.ts` and are never served or imported into production paths.

```
                           [ User Query: Discover / Dashboard ]
                                          │
                                          ▼
                            [ GET /api/creators?q=... ]
                                          │
                                          ▼
                         [ Federated Search Orchestrator ]
                         (lib/connectors/federated.ts)
                                          │
          ┌──────────────┬────────────────┼──────────────┬──────────────┐
          ▼              ▼                ▼              ▼              ▼
     [ YouTube ]    [ Twitch ]        [ Kick ]       [ TikTok ]    [ Instagram ]
     Google Data   Twitch Helix     Public REST    Display API    Meta Graph API
       API v3         API              v2           (OAuth)       (Professional)
          │              │                │              │              │
          └──────────────┴────────────────┼──────────────┴──────────────┘
                                          ▼
                             [ Normalization & Deduping ]
                              (Platform + Handle hashing)
                                          │
                                          ▼
                             [ Short-Lived Server Cache ]
                             (TTL: 3 minutes, bypassable)
                                          │
                                          ▼
                               [ Client Presentation ]
                     (Explicit Provenance, Timestamps, Freshness)
```

---

## 2. Platform Capabilities & Official API Matrix

Every connector declares its honest official API capabilities. Unsupported operations are never simulated or faked.

| Platform | Official API Integration | Live Keyword Discovery | Known Handle Lookup | Live Stream / Viewer Concurrency | Required Server Authorization | Limitation & Official Constraint |
|---|---|:---:|:---:|:---:|---|---|
| **YouTube** | Google Cloud YouTube Data API v3 | **YES** | **YES** | **YES** (via `video` search & statistics) | `YOUTUBE_DATA_API_KEY` (Google Cloud Server API Key) | Quota allocation (10,000 units/day default). Search costs 100 units per page. |
| **Twitch** | Twitch Helix API v5 | **YES** | **YES** | **YES** (real-time stream viewer count) | `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` (App Access OAuth Token) | Helix requires server-to-server App Access OAuth token. Historical averages require windowed snapshots. |
| **Kick** | Kick Public API v2 | **NO** | **YES** | **YES** (real-time stream status & viewer count) | Public REST endpoints (No API key required) | Kick endpoints support exact channel/handle resolution and stream state. Global arbitrary keyword discovery is **not supported** by Kick's API. |
| **TikTok** | TikTok Display API / Login Kit | **NO** | **YES** (with creator token) | **NO** | TikTok Developer App Review & Creator OAuth Authorization | Official Display API requires explicit creator OAuth authorization. **Global arbitrary keyword crawling across unauthenticated creators is strictly prohibited by TikTok Developer Policy.** |
| **Instagram** | Meta Instagram Graph API | **NO** | **YES** (Professional only) | **NO** | Meta Developer App Review, Graph API permissions & Professional Account Token | Meta limits Graph API access to registered Professional Accounts. **Unauthenticated global keyword crawling across consumer accounts is strictly prohibited by Meta Platform Terms.** |

---

## 3. What Cannot Be Delivered Through Official APIs

To maintain compliance with provider terms of service, security standards, and platform access boundaries:

1. **Global Unauthenticated Scraping on Meta / TikTok**:
   - Neither Meta nor TikTok offers an open, unauthenticated public discovery endpoint to crawl all 1+ billion consumer profiles by arbitrary keyword.
   - Any service claiming to provide open keyword discovery across all Instagram/TikTok accounts without authorization relies on fragile, unauthorized web scraping that violates developer terms.
   - Mosaic honestly declares `unsupported_operation` for arbitrary global discovery on these platforms and provides verified direct handle resolution for authorized accounts.

2. **Kick Arbitrary Keyword Crawling**:
   - Kick's official public REST API exposes `/channels/{slug}` and livestream metadata, but lacks a public `/search/channels?query=` keyword index.
   - Mosaic supports exact-handle resolution for Kick streamers and displays real-time viewer count and broadcast status.

3. **Audience Geographic Demographics Without Creator OAuth**:
   - Audience geography breakdowns (e.g. audience country percentages) are private analytics. Platform APIs only return these to the verified creator who has authorized the app via OAuth.
   - Mosaic labels audience demographics as requiring Creator OAuth and never fabricates demographic percentages.

---

## 4. Provenance & Freshness Architecture

Every metric presented in the application carries explicit origin metadata:
- **`source`**: The exact provider API that returned the metric (e.g., `YouTube Data API v3`, `Twitch Helix API`, `Kick Public API v2`).
- **`fetchedAt`**: ISO 8601 timestamp of when the provider response was received.
- **`freshness`**: Human-readable freshness label (e.g., `Live Platform API Response` or `Server Cache (45s ago)`).
- **`isLive`**: Boolean indicating whether data was retrieved directly from the platform provider or served from the short-lived cache.
- **On-Demand Refresh**: The UI provides a "Refresh from Platform" button for every creator row, which bypasses cache and queries the platform provider directly.

---

## 5. Security & Access Control Model

1. **Server-Only Credentials**:
   - External API keys (`YOUTUBE_DATA_API_KEY`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, Supabase Service Role keys) reside strictly on the server and are never exposed in client bundle code.
2. **Signed-Out / Guest Sandbox Restrictions**:
   - Unauthenticated visitors or guest sessions are isolated to a read-only sandbox.
   - Mutative actions on `/lists` (Create list, Rename list, Delete list, Update notes, Update tags, Update outreach status, Remove creator) are disabled for guests.
   - Server-side route handlers (`POST /api/creators`, `POST /api/sync`) verify authorization and return `401 Unauthorized` for guest write attempts.
   - The sign-in page offers a transparent "Explore Sandbox as Guest (Isolated Read-Only)" demo session with zero cloud-write permissions.

---

## 6. Automated Verification

The automated test suite in `tests/connectors.test.ts` validates:
- YouTube unconfigured state, capabilities declaration, and quota handling.
- Twitch unconfigured state, capabilities declaration, and OAuth token lifecycle.
- Kick direct handle resolution and rejection of unsupported keyword crawling.
- TikTok and Instagram honest declaration of OAuth / Professional account requirements.
- Short-lived in-memory cache TTL (3 minutes), age formatting, and cache bypass.
- Federated search parallel execution and multi-platform deduplication.
- Complete isolation of test fixtures from production search paths.

Run tests at any time with:
```bash
npm test
```
