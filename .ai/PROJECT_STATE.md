# PROJECT STATE

Last Updated: 2026-09-29
Current Branch: claude/marketplace-schema-layout-0emf5a
Last Known Good Commit (main): 1c399c2 — Merge PR #7 (dependabot)

## Project

Name: sovr1n
Purpose: Local marketplace for Kern County / Bakersfield, CA — connects buyers, sellers, service providers, CDL/hot-shot drivers, and freight shippers in one app
Production URL: https://www.sovr1n.com
Beta landing page: https://www.sovr1n.com/beta
Repository: https://github.com/jasonmanuel-cmd/sovr1n

## Key People

- Frank Hernandez — Founder / public face, Chaotically Organized AI
- Jason Manuel — Developer / architect

## Technology

Frontend: Astro v7.3.5 static build — Chrome Design System (--surface-0: #0a0a0f, --warm: #4a9eff, Space Grotesk + Inter fonts)
Backend: Vercel serverless functions (Node.js, CommonJS, /api/ directory)
Database: Supabase (Postgres + Auth + RLS) — project ID: pebqmuumwygrpjofdwfy
Hosting: Vercel — cleanUrls: true, adapter: @astrojs/vercel (static), output: dist/ + .vercel/output/
Authentication: Supabase Auth (JWT via supabase-js)
Payments: Stripe (keys and schema columns present, not yet fully wired)
Insights: Vercel Speed Insights (/_vercel/speed-insights/script.js)

## Current Architecture

Astro v7.3.5 static build. Pages live in `src/pages/` as `.astro` files. `npm run build` runs `astro build`, which outputs to `dist/` and `.vercel/output/static/`. The `@astrojs/vercel` adapter handles Vercel deployment. Existing `api/` serverless functions are deployed by Vercel independently. `public/` directory assets (including `app/*.js` browser scripts) are copied to the build output at the same paths.

API routes live in `/api/**/*.js` as Vercel serverless functions. All API handlers use `lib/security.js` for rate limiting and CSP headers, `lib/auth.js` for authentication middleware, and `lib/errors.js` for consistent error responses.

The Supabase client is split: `lib/supabase.js` (anon key, for authenticated user requests) and `lib/supabase-admin.js` (service role key, server-side only). Frontend config is in `app/config.js` — loaded as a plain script tag.

## Working Features

- `/` — Main app: city selector, marketplace overview, Chrome Design System dark theme
- `/beta` — Beta access landing page, same Chrome Design System as main app
- `/api/health` — Health check (returns env-var presence flags)
- `/api/auth/*` — Login, logout, register, profile (Supabase-backed)
- `/api/listings/*` — CRUD for market + service listings
- `/api/loads/*` — Driver/freight load board (open, reserved, in_transit, delivered, cancelled states)
- `/api/providers/*` — Service provider directory
- `/api/orders/*` — Order lifecycle
- `/api/reviews/*` — Review system (linked to completed orders in v2 schema)
- `/api/beta/signup` — Beta signup API (writes to beta_signups table, attempts confirmation email)
- `/api/beta/testers` — Admin beta tester management
- Vercel Speed Insights on all pages
- Security: CSP headers, rate limiting, input sanitization, XSS/injection defense

## In Progress

- Supabase schema NOT yet applied — all schema files exist locally but tables do not exist in project pebqmuumwygrpjofdwfy
- Beta form on `/beta` page is client-side only (shows success UI without calling /api/beta/signup)
- Feature branch `claude/marketplace-schema-layout-0emf5a` has a sync commit that mirrors what's already on main; can be merged or discarded

## Known Problems

1. **Schema not applied**: `supabase/schema.sql`, `supabase/migrations/001_marketplace_v2.sql`, and `migrations/001_create_beta_signups.sql` have never been run against the Supabase project. API calls will fail with table-not-found errors.
2. **Placeholder anon key**: `app/config.js` has a non-functional SUPABASE_ANON_KEY value (suffix: "placeholder"). Must be replaced with the real key from the Supabase dashboard.
3. **Vercel env vars not confirmed set**: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY must be configured in the Vercel project dashboard for API functions to work.
4. **Beta form not wired**: `/beta` page form submits client-side only; it does not POST to `/api/beta/signup`.
5. **Orphaned Flutter/Dart files**: `lib/main.dart`, `lib/app_test.dart`, `lib/core/`, `lib/data/`, `lib/domain/`, `lib/ui/`, `pubspec.yaml` — these are not used by the web app and are leftover from an earlier mobile prototype.
6. **Email send uses absolute URL**: `api/beta/signup.js` posts to `https://sovr1n.com/api/email/send`. That email handler (`api/email/send.js`) exists but has no actual email provider integration (no SendGrid/Resend/etc. key). Emails silently fail.
7. **Open PR #3** (Vercel Web Analytics, Vercel bot) — draft, old base SHA, adds `/_vercel/insights/script.js` to index.html. Speed Insights already present; this PR adds Web Analytics separately.

## Important Files

- `index.html` — Main app (source of truth for Chrome Design System)
- `beta.html` — Beta landing page (project root)
- `public/beta.html` — Beta landing page (public/ copy, both required for Vercel routing)
- `app/config.js` — Frontend config: Supabase URL, anon key (has placeholder), city list, cargo tiers, categories
- `vercel.json` — Deployment config, CSP headers, rewrites
- `supabase/schema.sql` — Full DB schema (users, listings, service_providers, loads, reviews)
- `supabase/migrations/001_marketplace_v2.sql` — V2 migration: profiles, orders, extends listings
- `migrations/001_create_beta_signups.sql` — Beta testing tables
- `lib/supabase.js` — Anon client (reads env vars at runtime)
- `lib/supabase-admin.js` — Service role client (server-side only)
- `lib/security.js` — Rate limiting, sanitization, security headers
- `lib/auth.js` — Auth middleware
- `lib/errors.js` — Error response helpers
- `lib/stripe.js` — Stripe client setup
- `design-preview.html` — Design system component preview (Desert Modern palette — reference only, not production design)

## Environment

Required environment variable NAMES only (never put values here):

- SUPABASE_URL — Supabase project URL (https://pebqmuumwygrpjofdwfy.supabase.co)
- SUPABASE_ANON_KEY — Supabase public/anon key
- SUPABASE_SERVICE_ROLE_KEY — Supabase service role key (server-side only, never expose to frontend)
- STRIPE_SECRET_KEY — Stripe secret key (server-side API routes)
- STRIPE_PUBLISHABLE_KEY — Stripe publishable key (frontend use)

Set all of these in the Vercel project dashboard under Settings → Environment Variables.

## Current Objective

Get the beta pipeline fully functional:
1. Apply the three SQL migration files to Supabase in order
2. Confirm Vercel env vars are set
3. Fix `app/config.js` anon key placeholder
4. Wire the `/beta` form to POST `/api/beta/signup`
