# TODO

## Critical — Blocking Beta Launch

- [ ] **Apply schema to Supabase** — Run the three SQL files in the Supabase SQL editor in order:
  1. `supabase/schema.sql`
  2. `supabase/migrations/001_marketplace_v2.sql`
  3. `migrations/001_create_beta_signups.sql`
  Project: pebqmuumwygrpjofdwfy (https://app.supabase.com/project/pebqmuumwygrpjofdwfy)

- [ ] **Set Vercel environment variables** — In Vercel dashboard → sovr1n project → Settings → Environment Variables:
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - STRIPE_SECRET_KEY
  - STRIPE_PUBLISHABLE_KEY

- [ ] **Fix app/config.js anon key** — Replace the placeholder SUPABASE_ANON_KEY value with the real key from Supabase dashboard → Settings → API

- [ ] **Wire /beta form to API** — The beta access form in `beta.html` and `public/beta.html` currently shows success client-side only. It must POST to `/api/beta/signup` with fields: name, email, role, and map `note` to `problem`.

## High Priority

- [ ] **Set up RLS policies** — After applying schema, add Row Level Security policies to Supabase tables. At minimum: users can only read/write their own rows in users, listings, loads, orders; providers are publicly readable.

- [ ] **Email provider integration** — `api/email/send.js` exists but has no real email provider. Integrate Resend (preferred — MCP tool available) or SendGrid. The beta signup confirmation email is already templated, just needs a live sender.

- [ ] **Merge or close PR #3** (Vercel Web Analytics) — Open draft PR from Vercel bot. Adds `/_vercel/insights/script.js` to index.html for Web Analytics. Speed Insights already present. Decide: merge or close.

## Medium Priority

- [ ] **Remove or archive Flutter/Dart files** — `lib/main.dart`, `lib/app_test.dart`, `lib/core/`, `lib/data/`, `lib/domain/`, `lib/ui/`, `pubspec.yaml` are leftover from an abandoned mobile prototype. They clutter the repo and are not used.

- [ ] **Fix email/send.js absolute URL** — `api/beta/signup.js` calls `https://sovr1n.com/api/email/send` with a hardcoded production URL. Use a relative path or environment variable so it works in preview deployments.

- [ ] **Supabase MCP verification** — The Supabase MCP (mcp__Supabase__*) could not access project pebqmuumwygrpjofdwfy in the last session. Verify the MCP connection has the correct project selected before attempting schema changes through it.

## Low Priority / Nice to Have

- [ ] **Stripe wiring** — Schema has stripe_customer_id and stripe_connect_account_id columns, and lib/stripe.js exists, but no API route uses Stripe for actual payments yet. Wire up when ready for monetization.

- [ ] **Driver verification** — `api/driver/verify.js` exists (CDL/license upload endpoint). Needs storage bucket setup in Supabase and integration with the frontend profile page.

- [ ] **Contract generation** — `api/contracts/generate.js` exists. Needs testing and frontend integration.

- [ ] **Admin beta tester dashboard** — `public/beta/admin.html` and `api/beta/testers.js` exist. Needs auth gating and testing.

- [ ] **Consolidate app/ duplication** — `app/` at root and `public/app/` are now duplicates. When editing JS scripts, update both. Long-term: delete root `app/` and use only `public/app/` as canonical. Update `.astro` page script src paths if needed.
- [ ] **Merge feature branch** — `claude/marketplace-schema-layout-0emf5a` is ahead of main. Contains: Astro migration, beta-signup page, marketplace schema, .ai/ memory.

## Done

- [x] Astro v7.3.5 migration — `src/pages/` pages, `@astrojs/vercel` static adapter, `npm run build` verified (3 pages, 0 errors)
- [x] Beta-signup page Phase 1 — new hero copy, 5-field form, QR code, wired to `/api/beta/signup`
- [x] Chrome Design System adopted (Decision 001)
- [x] All Harbison/DRE references purged from main codebase (Decision 002)
- [x] /beta page created and live at www.sovr1n.com/beta (PRs #8, #9)
- [x] public/index.html (old design) deleted (routing fix)
- [x] public/beta.html added (routing fix, Decision 003)
- [x] Vercel Speed Insights added to all pages
- [x] Security headers (CSP, X-Frame-Options, etc.) in vercel.json
- [x] API rate limiting and input sanitization in lib/security.js
- [x] CI workflow (.github/workflows/ci.yml)
- [x] Dependabot configured (.github/dependabot.yml)
- [x] .ai/ persistent memory initialized (this session)
