# PROJECT OPERATING INSTRUCTIONS

Before modifying this repository:

1. Read this entire file.
2. Read `.ai/PROJECT_STATE.md`.
3. Read `.ai/DECISIONS.md`.
4. Read `.ai/TODO.md`.
5. Read `.ai/HANDOFF.md`.
6. Inspect the existing code before proposing changes.
7. Check `git status` and current branch.

## SOURCE OF TRUTH

The current repository and its Git history are authoritative.

Do not recreate, redesign, restructure, or replace existing work merely
because another implementation seems preferable.

Preserve existing:
- design (Chrome Design System — dark theme, #0a0a0f, #4a9eff, Space Grotesk + Inter)
- architecture (vanilla HTML/JS frontend, Vercel serverless /api/ functions)
- functionality
- styling
- integrations

unless explicitly instructed otherwise.

## PERMANENT CONSTRAINTS — NON-NEGOTIABLE

The following content must NEVER appear in any file in this repository:

- Name: Nathanael Harbison (or any spelling variant)
- DRE: 02059393
- Email: nate85.realtor@gmail.com
- Phone: (661) 472-7499
- Address: 3304 Apollo St
- Brand: Harbison Standard

This is a hard constraint from the project owner. No exception. No "temporary" or "test" use.

## BEFORE MAKING CHANGES

Explain:
- what currently exists
- what you intend to change
- which files will change

Do not assume unfinished work should be replaced.

## KEY ARCHITECTURE NOTES

- `beta.html` (project root) and `public/beta.html` MUST always be identical.
  Vercel merges public/ into the web root — both copies are required for routing.
- `app/config.js` is loaded client-side. Never put service role keys or secrets there.
- Supabase project ID: pebqmuumwygrpjofdwfy
- Schema must be applied in order: supabase/schema.sql → supabase/migrations/001_marketplace_v2.sql → migrations/001_create_beta_signups.sql

## AFTER COMPLETING WORK

Update:

`.ai/PROJECT_STATE.md`
`.ai/DECISIONS.md` if architectural or product decisions were made
`.ai/TODO.md`
`.ai/HANDOFF.md`

HANDOFF.md must contain enough information for another AI agent on
another computer to continue the project without access to this conversation.

Never place passwords, API keys, tokens, service-role keys,
or other secrets in these files. Environment-variable names are allowed, values are not.

## GIT SAFETY

Never:
- force push to main
- reset --hard without committing/stashing first
- delete branches without confirmation
- overwrite uncommitted work

Always run `git status` before any destructive git operation.

Before finishing, report:
- files changed
- tests/build performed
- current Git status
- recommended next action
