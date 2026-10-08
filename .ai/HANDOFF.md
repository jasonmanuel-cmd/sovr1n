# AI HANDOFF

Last Updated: 2026-10-08
Agent: Claude Sonnet 4.6 (claude-sonnet-4-6)
Machine: Vercel Remote (cloud session, ephemeral container)
Branch: main (PR #17 merged 2026-10-08; squash SHA 077f305)
Active feature branch: claude/marketplace-schema-layout-0emf5a

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

- **Schema not applied** (highest priority) — Supabase MCP returned "Unauthorized". Must be done manually via Supabase SQL Editor.
- **app/config.js anon key placeholder** — real key needed from Supabase dashboard
- **GitHub Actions billing** — free tier minutes exhausted. Fix at https://github.com/settings/billing
- **Email provider** — `api/email/send.js` is a stub. Resend MCP is available to integrate.
- **RLS policies** — needed after schema is applied
- **app/ duplication** — `app/` at root and `public/app/` are duplicates (low priority)

## EXACT NEXT STEPS

1. **Fix GitHub Actions** — go to https://github.com/settings/billing (minutes exhausted)
2. **Configure Vercel build** — in Vercel dashboard → sovr1n project → Settings → General: Build Command `npm run build`, Output Directory blank (adapter handles it)
3. **Apply Supabase schema** — in Supabase SQL Editor for project `pebqmuumwygrpjofdwfy`:
   a. Run `supabase/schema.sql`
   b. Run `supabase/migrations/001_marketplace_v2.sql`
   c. Run `migrations/001_create_beta_signups.sql`
4. **Fix app/config.js anon key** — get real key from Supabase dashboard → Settings → API; update BOTH `app/config.js` AND `public/app/config.js`
5. **Set Vercel env vars** — SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY
6. **Integrate Resend email** — `api/email/send.js` is a stub; Resend MCP available

## Warnings

- **NEVER** add the former real-estate third party's identity or brand to any file — see AGENTS.md for the explicit prohibited values list.
- **NEVER** apply a service role key or any secret value to `app/config.js` or `public/app/config.js` — they are loaded client-side. Only the anon/public key goes there.
- `public/beta.html` and `beta.html` must always be kept in sync.
- `app/config.js` and `public/app/config.js` must always be kept in sync (or consolidate to `public/app/` only).
- Do not change the Chrome Design System (--surface-0: #0a0a0f, --warm: #4a9eff, Space Grotesk + Inter) without explicit instruction.
- `is:inline` is required on all local `<script>` tags in `.astro` files — Astro/Vite will try to bundle them otherwise.

## What Was Done This Session (Oct 8)

### SOVR1N Metallic Logo (PR #17, merged squash SHA 077f305)

User provided the official metallic chrome-blue SOVR1N serif logo as an image file.

- `public/logo-dark.png` — metallic SOVR1N text on black background (used for dark site theme)
- `public/logo-light.png` — metallic SOVR1N text on white background (available for light contexts)
- `src/pages/index.astro` — nav header logo changed to `<img src="/logo-dark.png" style="height:32px">`, hero H1 changed to `<img src="/logo-dark.png" style="height:clamp(56px,12vw,88px);filter:drop-shadow(0 0 32px rgba(74,158,255,0.35))">` 
- `src/pages/beta.astro` — nav header and footer logos changed to `<img src="/logo-dark.png">`
- `beta.html` — nav header and footer logos changed to `<img src="/logo-dark.png">`
- `public/beta.html` — synced with `beta.html` (identical)

Horizontal role box wording (Market: Shoppers/Shop owners, Services: Customers/Providers, Transportation: Drivers/Loads) was confirmed already correct in `src/pages/index.astro` — no changes needed.

CI failures on PR #17 were pre-existing GitHub Actions billing exhaustion (all jobs complete in 2–4 seconds impossibly fast). User requested merge-skip-CI; PR was converted from draft to ready and squash-merged.

## Key Commits on Branch

- `0171ee5` — feat: add SOVR1N metallic logo; replace text logos across all pages
- `ef72f51` — chore: update .ai docs — PR #10 merged, next steps updated
- `9152357` — feat: migrate frontend to Astro static build
- `cfade75` — feat: update beta-signup page — streamlined form, new hero copy, QR code
