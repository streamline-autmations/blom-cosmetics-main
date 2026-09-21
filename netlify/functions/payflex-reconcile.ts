import type { Handler } from '@netlify/functions';
import { runReconcile, reconcileConfigError } from './_lib/payflex-reconcile-core';

// Manual/on-demand Payflex reconcile. Secret-gated.
// The automatic hourly sweep lives in payflex-reconcile-cron.ts — both share
// the same engine in _lib/payflex-reconcile-core.ts.

const RECONCILE_SECRET = process.env.PAYFLEX_RECONCILE_SECRET || '';

function isAuthorized(event: any): boolean {
  if (!RECONCILE_SECRET) return false;
  const provided = event.headers?.['x-reconcile-secret'] || event.headers?.['X-Reconcile-Secret'] || event.queryStringParameters?.secret;
  return provided === RECONCILE_SECRET;
}

export const handler: Handler = async (event) => {
  if (!isAuthorized(event)) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const configError = reconcileConfigError();
  if (configError) {
    return { statusCode: 500, body: configError };
  }

  const q = event.queryStringParameters || {};
  // The hourly cron only needs a few days, but an audit has to reach orders
  // older than a month: anything past the ceiling was never checked at all.
  const days = Math.min(Math.max(Number(q.days) || 7, 1), 400);
  const dryRun = q.dryRun === '1' || q.dryRun === 'true';
  const notify = q.notify !== '0' && q.notify !== 'false';

  try {
    const result = await runReconcile({ days, dryRun, notify });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || String(e) };
  }
};
