# Automated SEO Page System

A daily, hands-off pipeline that generates and maintains SEO pages for games, teams, players, props, and "best bets today" hubs — stored in the database, served via dynamic React routes, and tracked from an admin dashboard.

## What gets built

### 1. Database tables (new)

- **`seo_pages`** — one row per generated page
  - `slug` (unique), `page_type` (`game_preview` | `game_result` | `team` | `player` | `player_prop` | `daily_best` ), `sport`, `entity_id` (game id / team / player), `title`, `meta_description`, `h1`, `content_json` (sections, odds snapshot, AI summary, internal links), `status` (`upcoming` | `live` | `final` | `stale`), `game_date`, `published_at`, `updated_at`, `last_data_hash`
- **`seo_run_logs`** — one row per cron run
  - `job_name`, `started_at`, `finished_at`, `pages_created`, `pages_updated`, `pages_failed`, `errors_json`, `next_run_at`
- **`seo_page_errors`** — failed-page log
  - `slug`, `page_type`, `reason`, `payload_json`, `created_at`

All tables: RLS on, admin-only read/write, service role full access for edge functions.

### 2. Edge functions (new, deployed automatically)

- `seo-generate-daily` — orchestrator. Calls the sub-functions below in order, writes a row to `seo_run_logs`.
- `seo-generate-games` — fetches upcoming games (next 7 days) via existing odds pipeline; upserts `game_preview` pages; refreshes odds/injuries/AI pick on existing ones; flips finished games to `game_result` with final score + grade.
- `seo-generate-entities` — refreshes team, player, and player-prop pages for active sports.
- `seo-generate-daily-hubs` — rebuilds "Best NBA Bets Today", "Best MLB Bets Today", "Best Parlays Today", "Best Player Props Today" using current picks.
- `seo-rebuild-sitemap` — regenerates `sitemap.xml` content from `seo_pages` + core routes and writes it to a `public.sitemap_cache` row served by a tiny `sitemap` edge function at `/sitemap.xml`.
- All functions: dedupe by deterministic slug, skip-and-log when API data is missing, compute `last_data_hash` so unchanged pages don't trigger `updated_at` churn.

### 3. Cron schedule (pg_cron + pg_net)

- `00:01` UTC daily → `seo-generate-daily` (full pipeline)
- Every 6 hours → light refresh on `game_preview` rows kicking off in next 24h (odds/injuries only)
- Every 15 min during game windows → `game_result` finalizer for games that just ended

Runs happen server-side, independent of login.

### 4. Dynamic SEO routes (frontend)

- `/predictions/:slug` — renders `seo_pages` of type `game_preview` / `game_result`
- `/teams/:slug`, `/players/:slug`, `/props/:slug`
- `/best/:slug` — daily hubs
- Each route reads from `seo_pages`, sets `<Helmet>` title/description/canonical/JSON-LD, renders content_json sections, and injects internal links (team ↔ player ↔ predictions ↔ props ↔ results).
- Sitemap served at `/sitemap.xml` via edge function.

### 5. Admin dashboard (`/admin/seo`)

A new tab in the existing Admin page showing:
- Pages generated today / failed today
- Last run time + duration + status
- Next scheduled run (from cron metadata)
- Total SEO pages (by type)
- Recent failures table with reason + retry button
- Manual "Run now" button → invokes `seo-generate-daily`

## Technical notes

- Uses existing odds, picks, props, and AI analysis pipelines — no new data sources.
- Off-season sports excluded via existing `seasonGuard.ts`.
- Internal linking generated at write time from related entity IDs (team page links to its upcoming games, players, props; game page links back to team + player pages).
- Slug format: `nba-lakers-vs-celtics-2026-06-04`, `player-lebron-james-points-2026-06-04`, etc. — deterministic to prevent duplicates.
- Content stays indexed forever; status flips `upcoming → final` but row persists.

## Out of scope (ask before adding)

- Multilingual SEO pages (existing localized pages stay manual).
- Per-page custom OG images.
- Blog-style long-form articles.

## Heads-up

This is a large build (~3 tables, ~6 edge functions, 4+ new routes, 1 admin view, cron setup). I'll need approval on the migration when it surfaces. After approval I'll wire the routes, edge functions, and admin dashboard in one pass.
