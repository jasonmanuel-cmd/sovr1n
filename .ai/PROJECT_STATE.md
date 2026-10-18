# PROJECT STATE

Last Updated: 2026-10-10
Current Branch: claude/marketplace-schema-layout-0emf5a
Last Known Good Commit (main): 077f305 — feat: add SOVR1N metallic logo (PR #17 squash merge)

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

- Supabase anon key + service role key — need from user (Supabase dashboard → Settings → API); MCP has no access to project pebqmuumwygrpjofdwfy
- Resend domain verification — `sovr1n.com` must be verified in Resend before emails deliver; blocked on user getting DNS access from domain registrant
- Remaining Vercel env vars — SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY not yet set

## Known Problems

1. **Placeholder anon key**: `app/config.js` and `public/app/config.js` have a non-functional SUPABASE_ANON_KEY value. Must be replaced with the real key from Supabase dashboard → Settings → API → "anon / public". Update BOTH files.
2. **Vercel env vars partially set**: SUPABASE_URL, RESEND_API_KEY, EMAIL_FROM are set. Still missing: SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY.
3. **Resend domain not verified**: `sovr1n.com` must be added and DNS-verified in Resend dashboard before beta signup confirmation emails can deliver. Blocked on DNS access from domain registrant.
4. **Orphaned Flutter/Dart files**: `lib/main.dart`, `lib/app_test.dart`, `lib/core/`, `lib/data/`, `lib/domain/`, `lib/ui/`, `pubspec.yaml` — leftover mobile prototype, not used.
5. **Open PR #3** (Vercel Web Analytics bot) — draft, old base SHA. Decide: merge or close.

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
- RESEND_API_KEY — **SET** (sovr1n-production key, sending_access only)
- EMAIL_FROM — **SET** (`noreply@sovr1n.com`)

## Current Objective

Complete the beta pipeline:
1. Get Supabase anon key + service role key → set in Vercel → update app/config.js
2. Verify sovr1n.com domain in Resend (requires DNS access from domain registrant)
3. Set Stripe keys in Vercel when ready for payments
