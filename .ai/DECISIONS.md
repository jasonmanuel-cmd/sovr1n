# PROJECT DECISIONS

## Decision 001

Date: 2026-09-26
Decision: Adopt Chrome Design System as the single visual identity
Reason: Original "Desert Modern" (Bebas Neue / Barlow, sand/clay palette) was replaced with a dark-theme Chrome-blue system matching an approved Vercel preview. The approved look: --surface-0: #0a0a0f, --warm: #4a9eff, Space Grotesk + Inter fonts, gradient logo text. All pages (index.html, beta.html, public/beta.html) now use this system.
Files affected: index.html, beta.html, public/beta.html, design-preview.html (reference only)
Status: Active — do not revert or introduce a competing palette

---

## Decision 002

Date: 2026-09-26
Decision: Permanently remove all references to the former real-estate third party (see AGENTS.md for the explicit list of prohibited values)
Reason: Explicit and permanent instruction from the project owner: this project has no affiliation with that party. The project belongs to Frank Hernandez (founder) and Jason Manuel (developer) under Chaotically Organized AI.
Files affected: index.html (purged), .well-known/llms.txt (sanitized), robots.txt (sanitized).
Status: Active — permanent constraint, no exceptions. Full prohibition list is in AGENTS.md.

---

## Decision 003

Date: 2026-09-26
Decision: Duplicate beta.html to public/beta.html for Vercel routing reliability
Reason: Vercel merges `public/` directory content into the web root alongside project-root files. Having beta.html only at the project root was insufficient — a stale `public/index.html` was interfering. Both copies must stay in sync.
Files affected: public/beta.html (added), public/index.html (deleted)
Status: Active — keep both beta.html and public/beta.html identical on every update to the beta page

---

## Decision 004

Date: 2026-09-26
Decision: Static vanilla HTML/JS frontend, no framework
Reason: Project started as a static Vercel deployment. No React/Vue/Next.js build step. Pages are raw HTML files with inline or side-loaded JS. Supabase-js and Stripe.js are loaded via CDN or npm in API routes only. Frontend config is app/config.js loaded as a plain script tag.
Files affected: All .html files, vercel.json (framework: null)
Status: Active — do not introduce a frontend framework without explicit instruction

---

## Decision 005

Date: 2026-09-26
Decision: Supabase schema split into three migration files applied in order
Reason: Schema evolved over time. The correct application order is:
  1. supabase/schema.sql — base tables (users, listings, service_providers, loads, reviews)
  2. supabase/migrations/001_marketplace_v2.sql — adds profiles, orders, extends listings
  3. migrations/001_create_beta_signups.sql — beta testing tables (separate concerns)
Files affected: supabase/schema.sql, supabase/migrations/001_marketplace_v2.sql, migrations/001_create_beta_signups.sql
Status: Active — schema not yet applied to Supabase project pebqmuumwygrpjofdwfy

---

## Decision 006

Date: 2026-09-27
Decision: Initialize persistent AI project memory in .ai/ directory
Reason: Multiple AI agents and Claude Code sessions have worked on this project. Without a shared state file, each new session starts cold. The .ai/ system provides AGENTS.md (operating instructions), PROJECT_STATE.md, DECISIONS.md, TODO.md, and HANDOFF.md for continuity.
Files affected: AGENTS.md, CLAUDE.md, .ai/PROJECT_STATE.md, .ai/DECISIONS.md, .ai/TODO.md, .ai/HANDOFF.md
Status: Active — update .ai/ files at the end of every development session
