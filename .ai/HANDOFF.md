# AI HANDOFF

Last Updated: 2026-10-06
Agent: Claude Sonnet 4.6 (claude-sonnet-4-6)
Machine: Vercel Remote (cloud session, ephemeral container)
Branch: claude/marketplace-schema-layout-0emf5a
Commit: f552326 (branch HEAD before this session) / 2ddf1af (main HEAD)

## What Was Done This Session

Migrated the frontend to Astro static build per explicit user request.

### Astro Migration (commit 9152357)

- Installed `astro` v7.3.5 and `@astrojs/vercel` v11.0.11 (these were already in node_modules from previous session; package.json/package-lock.json updated)
- Created `astro.config.mjs` with `output: 'static'` and Vercel adapter
- Created `src/pages/index.astro` from `index.html` (wrapped with `---\n---\n` frontmatter)
- Created `src/pages/beta.astro` from `beta.html`
- Created `src/pages/beta-signup.astro` from `public/beta-signup.html`
- Added `is:inline` attribute to all inline and local `<script>` tags in `index.astro` so Vite/Rolldown does not attempt to bundle them
- Copied `app/*.js` and `app.js` to `public/app/` and `public/app.js` respectively — Astro's publicDir is `public/`, so files there are served at the same `/app/...` paths the HTML already references
- Added `dev`, `build`, `preview` scripts to `package.json`
- Added `dist/` and `.astro/` to `.gitignore`
- Build verified: `astro build` → 3 pages (`/`, `/beta/`, `/beta-signup/`), 0 errors
- PR #10 updated with new title + description

### Beta-signup page (commit cfade75, previous session)

- `public/beta-signup.html` Phase 1: new hero copy, 5-field form, QR code section, wired to `/api/beta/signup`

## Important Architecture Note (Astro)

The project now has a dual layout:
- `index.html`, `beta.html`, `public/beta.html` — original HTML files, kept for reference
- `src/pages/*.astro` — Astro pages (these are what Vercel deploys via `astro build`)
- `app/*.js` at root AND `public/app/*.js` — BOTH exist; `public/app/` is the canonical version for Astro builds

**When editing JS scripts** in `app/`, edit BOTH `app/config.js` AND `public/app/config.js` (same duplication rule as `beta.html` / `public/beta.html`). Or better: consolidate to `public/app/` only (see TODO.md).

**Vercel deployment flow** (once Vercel is configured):
1. Vercel runs `npm run build` → `astro build`
2. Astro outputs to `.vercel/output/static/` (pages + public/ assets)
3. Vercel deploys static files from `.vercel/output/static/`
4. `api/` serverless functions are deployed by Vercel independently

## What Was Done This Session (Oct 6)

- **Wired /beta form to API** — `beta.html`, `public/beta.html`, `src/pages/beta.astro` submit handler now POSTs JSON to `/api/beta/signup` (loading state, error handling, success state preserved)
- **API role validation fix** — `api/beta/signup.js` `validRoles` updated from `['customer','driver','shop-owner']` to `['customer','driver','service_provider','load_board','seller','other']` to match the form's `<select>` values
- **API problem field made optional** — `problem` removed from required-field check (form's note field maps to it; defaults to 'N/A' when empty)
- **Email URL fix** — `api/beta/signup.js` now uses `req.headers.host` to build base URL (was hardcoded to `https://sovr1n.com`; now works on preview deployments)
- **is:inline added** to `<script>` tag in `src/pages/beta.astro`

## What Is Not Finished

- **Schema not applied** (highest priority) — see next steps. Supabase MCP returned "Unauthorized" — the MCP connector needs to be linked. Must be done manually.
- **app/config.js anon key placeholder** — real key needed from Supabase dashboard
- **GitHub Actions billing** — free tier minutes exhausted; CI completes in 2–4 s (impossible). Fix at https://github.com/settings/billing
- **app/ duplication** — `app/` at root and `public/app/` are duplicates; should consolidate to `public/app/` only (low priority once Astro migration confirmed working)
- **Vercel build command** — may need to be set in Vercel dashboard to `npm run build`

## EXACT NEXT STEPS

1. **Fix GitHub Actions** — go to https://github.com/settings/billing (minutes exhausted)
2. **Configure Vercel build** — in Vercel dashboard → sovr1n project → Settings → General: set Build Command to `npm run build`, Output Directory to `.vercel/output` (the @astrojs/vercel adapter handles this automatically if you leave it blank)
3. **Apply Supabase schema** — in Supabase SQL Editor for project `pebqmuumwygrpjofdwfy`:
   a. Run `supabase/schema.sql`
   b. Run `supabase/migrations/001_marketplace_v2.sql`
   c. Run `migrations/001_create_beta_signups.sql`
4. **Fix app/config.js anon key** — get real key from Supabase dashboard → Settings → API; update BOTH `app/config.js` AND `public/app/config.js`
5. **Set Vercel env vars** — in Vercel dashboard → Settings → Environment Variables: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (extend to preview + development targets)
6. **Once CI is green**, merge PR #10 to main

## Warnings

- **NEVER** add Nathanael Harbison, DRE 02059393, nate85.realtor@gmail.com, (661) 472-7499, 3304 Apollo St, or "Harbison Standard" to any file.
- **NEVER** apply a service role key or any secret value to `app/config.js` or `public/app/config.js` — they are loaded client-side. Only the anon/public key goes there.
- `public/beta.html` and `beta.html` must always be kept in sync.
- `app/config.js` and `public/app/config.js` must always be kept in sync (or consolidate to `public/app/` only).
- Do not change the Chrome Design System (--surface-0: #0a0a0f, --warm: #4a9eff, Space Grotesk + Inter) without explicit instruction.
- `is:inline` is required on all local `<script>` tags in `.astro` files — Astro/Vite will try to bundle them otherwise.

## Key Commits on Branch

- `9152357` — feat: migrate frontend to Astro static build
- `cfade75` — feat: update beta-signup page — streamlined form, new hero copy, QR code
- `0ff3b6e` — chore: update HANDOFF.md with PR #10 status
- `de669af` — fix: repair CI and CodeQL workflow definitions
- `c8093a9` — chore: merge origin/main into feature branch
