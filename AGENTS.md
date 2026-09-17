# BLOM Cosmetics Codex Guide

## Project Overview

BLOM Cosmetics is a React/Vite e-commerce site for professional nail products, courses, checkout, PayFast/Payflex payments, invoice generation, shipping, reviews, coupons, and course enrollment automation. The primary user-facing app lives in `src/`; server-side integration code lives in Netlify Functions under `netlify/functions/`; database changes live under `supabase/migrations/`.

The current repository is production-oriented and contains historical fix plans, SQL diagnostics, and workflow notes. Treat current source code, migrations, and actively referenced docs as more authoritative than old one-off troubleshooting reports.

## Source of Truth

- `README.md` for project structure, baseline scripts, environment variable names, and deployment notes.
- `package.json`, `package-lock.json`, `netlify.toml`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, and `tailwind.config.js` for tooling.
- `src/` for frontend behavior and design conventions.
- `netlify/functions/` for checkout, payment, shipping, invoice, course, and review APIs.
- `supabase/migrations/` for database schema history.
- `PAYFAST_SETUP.md` and `CHECKOUT_FLOW_DOCUMENTATION.md` for payment and invoice flow details.
- `docs/academy-database-schema.md` and `COURSE_ENROLLMENT_FLOW.md` for academy enrollment context.
- `.agents/skills/n8n-architect/SKILL.md` and the generated n8n block below for n8n-as-code work.

Do not invent project facts that are already documented. If docs conflict, prefer current source/configuration, then newer explicitly marked decisions, then stable source-of-truth docs, then older troubleshooting notes.

## Tech Stack

- React 18, TypeScript, Vite, React Router.
- Tailwind CSS plus local reusable components in `src/components/`.
- Netlify hosting and Netlify Functions with esbuild.
- Supabase PostgreSQL, Storage, Auth, and MCP access.
- PayFast and Payflex payment integrations.
- Shiplogic/Uber-style shipping integrations where implemented.
- n8n automation managed through n8n-as-code when configured.
- Node 22 (`package.json` engines, `netlify.toml`; `.nvmrc` currently says `20`, so prefer the explicit build config unless the user decides otherwise).
- Package manager: npm, based on `package-lock.json`.

## Repository Map

- `src/App.tsx` and `src/main.tsx`: frontend entry and routing.
- `src/pages/`: route-level screens.
- `src/components/`: layout, UI, product, checkout, course, and shared components.
- `src/lib/`, `src/utils/`, `src/hooks/`, `src/types/`: shared client utilities and types.
- `netlify/functions/`: backend API and webhook functions.
- `netlify/functions/_lib/`: shared function helpers.
- `supabase/migrations/`: database migrations; do not edit old migrations casually.
- `scripts/`: maintenance and seed scripts.
- `docs/`, root `*.md`, and `plans/`: project context and historical plans.
- `.agents/skills/`: repository-scoped Codex skills.
- `.codex/`: repository-scoped Codex configuration and custom agents.
- `.claude/` and `CLAUDE.md`: preserved Claude Code setup.

## Working Rules

- Inspect existing implementation before changing it.
- Prefer existing patterns, helpers, and component conventions over new abstractions.
- Keep changes focused; avoid unrelated refactors and generated-file churn.
- Preserve user changes and dirty worktree state.
- Use TypeScript intentionally; do not silence type errors with `any` unless there is a narrow, documented reason.
- Keep checkout, payment, coupon, stock, and invoice math server-authoritative.
- Do not trust frontend totals for discounts, stock, shipping, or payment amounts.
- Validate PayFast/Payflex signatures and amounts in server functions.
- Never expose service-role keys, payment secrets, tokens, private URLs, or SMTP credentials in committed files.
- Use environment variable names only in docs and config; do not copy values from `.env`, `.env.production`, or `ENVIRONMENT_VARIABLES.md`.
- Treat database writes, migrations, payment webhooks, production n8n pushes, and live credential changes as high risk and require explicit user approval when they affect production.
- For UI work, keep the existing BLOM visual language, responsive behavior, and accessibility expectations.
- Mobile width is a hard rule: nothing may make the page wider than the screen (it makes phones zoom the whole site out). Never remove the `html, body { overflow-x: clip }` guard in `src/index.css`. Rows that can grow (tabs, pills, chips, instructor or date lists) must scroll inside their own container, using `src/components/ui/ScrollableTabRow.tsx` for tab and pill rows. Verify UI changes at 375–390px, where `document.documentElement.scrollWidth` must equal the viewport width. See `CLAUDE.md`.
- For n8n work, use the `n8n-architect` skill and backend-resolved workspace state; never hand-edit n8n manager secrets or raw config.
- After code changes that affect cloud cost, infrastructure, Supabase, APIs, bundles, caching, automation, or external integrations, run the `cost-review` skill before finishing.

## How to Work

- Start multi-step tasks with a short plan.
- Read related files before editing.
- Use `rg`/`rg --files` for search.
- Use `apply_patch` for manual edits.
- Explain assumptions when project context is incomplete or contradictory.
- Do not commit, push, force-push, reset, or discard changes unless explicitly asked.
- Do not run destructive SQL, production mutations, or remote workflow pushes without explicit permission.

## Commands

Run from this repository root unless a command says otherwise.

- Install: `npm install`
- Development server: `npm run dev`
- Build: `npm run build`
- Preview build: `npm run preview`
- Lint: `npm run lint`
- Type-check: `npm run typecheck`
- Product seed: `npm run seed:products`
- n8n workspace migration dry-run: `npx --yes n8nac workspace migrate --json`
- n8n workspace status after migration is not required: `npx --yes n8nac workspace status --json`

There is no dedicated `npm test` script in `package.json`. Use focused scripts in the repo only after inspecting what they do and whether they require live credentials.

## Verification

- Frontend/source changes: run `npm run typecheck`, `npm run lint`, and `npm run build` when practical.
- Netlify Function changes: run `npm run typecheck` and `npm run build`; inspect any relevant function-specific scripts before using them.
- Database changes: review migrations carefully; prefer dry-run/local validation first; do not apply to production without explicit approval.
- n8n changes: follow `n8n-architect`, pull before editing, validate, push with `--verify`, test where appropriate, and present the workflow URL through `n8nac`.
- Before finishing, review `git diff -- AGENTS.md .agents .codex docs/ai` plus any touched files.

## Forbidden or High-Risk Actions

- Do not delete, rename, or weaken `CLAUDE.md`, `.claude/`, or existing project docs as part of Codex migration.
- Do not reset, checkout, or clean the worktree to remove user changes.
- Do not edit `.env`, `.env.production`, local secret stores, or n8n manager secret files.
- Do not commit real secrets into docs, TOML, skills, prompts, or agents.
- Do not run production database migrations, payment mutations, credential creation, or n8n pushes without explicit approval.
- Do not edit generated build output (`dist/`, `tsconfig.tsbuildinfo`) unless the user specifically asks.
- Do not overwrite generated n8n-as-code context manually except through `npx --yes n8nac update-ai`.

## Skills

- `cost-review`: Use after code/config changes that may affect cloud, infrastructure, API, database, bundle, automation, or operational cost.
- `n8n-architect`: Use for creating, editing, validating, syncing, pushing, pulling, testing, or troubleshooting n8n workflows and n8n-as-code state.

## Additional Context

Detailed migration notes live in `docs/ai/CODEX_MIGRATION.md`. Keep stable project facts in source/config/docs, workflow procedures in skills, and only current operating rules in this file.

<!-- n8n-as-code-start -->
<!-- n8nac-version: 2.1.2 -->

## n8n-as-code Context Root

This block is generated by `npx --yes n8nac update-ai`. It is bootstrap context only, not a configuration source of truth.

- Context root: `c:\Users\User\OneDrive\Blom-Cosmetics\Blom-Working_repo\blom-cosmetics-main`
- n8n version at generation time: Unknown
- n8nac command: `npx --yes n8nac`
- n8n-manager command: `npx --yes @n8n-as-code/n8n-manager`
- n8n knowledge command: `npx --yes n8nac skills`

Run workspace commands from this context root. Do not `cd` into the n8n-as-code source repository, n8n-manager source repository, plugin directory, or package directory to run `npx --yes n8nac workspace ...`, `npx --yes n8nac list`, `npx --yes n8nac pull`, `npx --yes n8nac push`, or `npx --yes n8nac update-ai`.

---

## Required Local Agent

A VS Code and GitHub Copilot-compatible agent is generated here:

- `.github/agents/n8n-architect.agent.md`

A portable skill fallback is also generated for runtimes that do not read `.github/agents`:

- `.agents/skills/n8n-architect/SKILL.md`

If your agent runtime supports workspace agents, use the `.github/agents/*.agent.md` file. If it supports skills instead, load the skill file. Otherwise, treat these files as mandatory instructions.

---

## n8n Source Of Truth

Do not infer configuration from this block. It intentionally avoids storing the effective instance, project, sync folder, or workflow directory.

n8nac backend resolution remains the only source of effective workspace state.
- Workspace environments live in `n8nac-config.json` and are managed by `npx --yes n8nac env ...`.
- Managed local runtime state and secrets live in n8n-manager storage and are managed by `npx --yes @n8n-as-code/n8n-manager ...`.
- The effective context is resolved by the backend.

Before any n8n workflow command, run migration dry-run first, then workspace status only after migration is not required or has been applied:

```bash
cd c:\Users\User\OneDrive\Blom-Cosmetics\Blom-Working_repo\blom-cosmetics-main
npx --yes n8nac workspace migrate --json
npx --yes n8nac workspace status --json
```

Use the returned `workflowDir` exactly as provided. Do not reconstruct paths from raw config files.

---

## n8n Safe Commands

- Primary workspace, environment, sync, validation, push, and pull work: `npx --yes n8nac ...`
- Local managed runtime lifecycle and tunnels only: `npx --yes @n8n-as-code/n8n-manager ...`
- Workspace status and migration: `npx --yes n8nac workspace ...`
- Workflow sync and validation: `npx --yes n8nac ...`
- Node knowledge and schema lookup: `npx --yes n8nac skills ...`

Never write `n8nac-config.json`, `~/.n8n-manager`, or n8n-manager secret files by hand.
<!-- n8n-as-code-end -->
