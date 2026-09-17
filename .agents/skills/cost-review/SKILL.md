---
name: cost-review
description: Review BLOM Cosmetics code or configuration changes for cloud, infrastructure, database, API, bundle, automation, and operational cost impact. Use after modifying Supabase queries or migrations, Netlify Functions, payment/shipping integrations, n8n workflows, caching, build output, dependency bundles, or external API usage. Do not use for pure copy/docs edits unless they change operational procedures.
---

# Cost Review

Use this skill before finishing any implementation that could affect operating cost.

## Workflow

1. Inspect the diff for changed files.
2. Identify cost surfaces:
   - Supabase queries, indexes, RLS policies, migrations, storage, auth, and service-role usage.
   - Netlify Functions, scheduled jobs, webhook handlers, PDF generation, Chromium/Puppeteer usage, and function timeouts.
   - Payment, shipping, email, Cloudinary, n8n, and other external API calls.
   - Frontend bundle size, image loading, caching, and repeated client requests.
   - Retry loops, backfills, reconciliation scripts, and bulk maintenance scripts.
3. Check for avoidable repeated work:
   - N+1 queries or API calls.
   - Missing filters, limits, indexes, pagination, or debouncing.
   - Large payloads, unbounded logs, unnecessary PDF/image regeneration, or repeated webhook forwarding.
   - Client-side polling that could be event-driven or cached.
4. Check for production risk:
   - Scheduled functions or backfills that can run too broadly.
   - Retry behavior without caps or idempotency.
   - Service-role operations that bypass RLS unnecessarily.
   - External API calls made before validation or auth checks.
5. Recommend only concrete, scoped improvements. Do not introduce speculative complexity.

## Expected Output

Return a short cost review with:

- `Cost impact`: low, medium, high, or none.
- `Findings`: file-specific issues with suggested fixes.
- `No action needed`: when the diff does not create meaningful cost risk.
- `Validation`: checks run or checks still needed.

## Validation

When practical, verify with existing commands from `AGENTS.md`:

```bash
npm run typecheck
npm run lint
npm run build
```

For database or workflow changes, prefer dry-run/status/validation commands and avoid production mutations unless the user explicitly approves them.
