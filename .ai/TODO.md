# TODO

## Critical — Blocking Beta Launch

- [x] **Apply schema to Supabase** — All three SQL files run manually in Supabase SQL Editor (2026-10-10)
- [x] **Partial Vercel env vars** — SUPABASE_URL, RESEND_API_KEY, EMAIL_FROM set via Vercel MCP (2026-10-10)

- [ ] **Get Supabase keys + finish Vercel env vars** — Go to https://app.supabase.com/project/pebqmuumwygrpjofdwfy/settings/api; copy anon key and service_role key; paste to Claude to set SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY in Vercel and update app/config.js

- [ ] **Fix app/config.js anon key** — Replace placeholder in BOTH `app/config.js` AND `public/app/config.js` once anon key is available

- [ ] **Verify sovr1n.com in Resend** — Resend dashboard → Domains → Add Domain → sovr1n.com; add DNS TXT records. Blocked on DNS access from domain registrant.

- [x] **Wire /beta form to API** — Done. `beta.html`, `public/beta.html`, and `src/pages/beta.astro` now POST to `/api/beta/signup`. API updated: broader `validRoles`, `problem` optional, email URL uses `req.headers.host`.

## High Priority

- [ ] **Set up RLS policies** — After applying schema, add Row Level Security policies to Supabase tables. At minimum: users can only read/write their own rows in users, listings, loads, orders; providers are publicly readable.

- [ ] **Email provider integration** — `api/email/send.js` exists but has no real email provider. Integrate Resend (preferred — MCP tool available) or SendGrid. The beta signup confirmation email is already templated, just needs a live sender.

- [ ] **Merge or close PR #3** (Vercel Web Analytics) — Open draft PR from Vercel bot. Adds `/_vercel/insights/script.js` to index.html for Web Analytics. Speed Insights already present. Decide: merge or close.

## Medium Priority

- [ ] **Remove or archive Flutter/Dart files** — `lib/main.dart`, `lib/app_test.dart`, `lib/core/`, `lib/data/`, `lib/domain/`, `lib/ui/`, `pubspec.yaml` are leftover from an abandoned mobile prototype. They clutter the repo and are not used.

- [x] **Fix email/send.js absolute URL** — `api/beta/signup.js` now uses `req.headers.host` to construct the base URL dynamically (works in both production and preview).

- [ ] **Supabase MCP verification** — The Supabase MCP (mcp__Supabase__*) could not access project pebqmuumwygrpjofdwfy in the last session. Verify the MCP connection has the correct project selected before attempting schema changes through it.

## Low Priority / Nice to Have

- [ ] **Stripe wiring** — Schema has stripe_customer_id and stripe_connect_account_id columns, and lib/stripe.js exists, but no API route uses Stripe for actual payments yet. Wire up when ready for monetization.

- [ ] **Driver verification** — `api/driver/verify.js` exists (CDL/license upload endpoint). Needs storage bucket setup in Supabase and integration with the frontend profile page.

- [ ] **Contract generation** — `api/contracts/generate.js` exists. Needs testing and frontend integration.

- [ ] **Admin beta tester dashboard** — `public/beta/admin.html` and `api/beta/testers.js` exist. Needs auth gating and testing.

- [ ] **Consolidate app/ duplication** — `app/` at root and `public/app/` are now duplicates. When editing JS scripts, update both. Long-term: delete root `app/` and use only `public/app/` as canonical. Update `.astro` page script src paths if needed.
- [x] **Merge feature branch** — PR #10 merged 2026-10-06. Astro migration, beta-signup page, marketplace schema, .ai/ memory, launch countdown all on main.

## Done

- [x] **SOVR1N metallic logo** — `public/logo-dark.png` and `public/logo-light.png` added. All pages use `/logo-dark.png` in nav header and hero. PR #17 merged 2026-10-08.
- [x] **Horizontal role box wording confirmed** — Market (Shoppers/Shop owners), Services (Customers/Providers), Transportation (Drivers/Loads) already correct; no changes needed.
- [x] Astro v7.3.5 migration — `src/pages/` pages, `@astrojs/vercel` static adapter, `npm run build` verified (3 pages, 0 errors)
- [x] Beta-signup page Phase 1 — new hero copy, 5-field form, QR code, wired to `/api/beta/signup`
- [x] Chrome Design System adopted (Decision 001)
- [x] Third-party identity references purged from main codebase (Decision 002)
- [x] /beta page created and live at www.sovr1n.com/beta (PRs #8, #9)
- [x] public/index.html (old design) deleted (routing fix)
- [x] public/beta.html added (routing fix, Decision 003)
- [x] Vercel Speed Insights added to all pages
- [x] Security headers (CSP, X-Frame-Options, etc.) in vercel.json
- [x] API rate limiting and input sanitization in lib/security.js
- [x] CI workflow (.github/workflows/ci.yml)
- [x] Dependabot configured (.github/dependabot.yml)
- [x] .ai/ persistent memory initialized (this session)
