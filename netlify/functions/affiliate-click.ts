import type { Handler } from '@netlify/functions'
import {
  buildRefCookie,
  getActiveAffiliate,
  getClientIp,
  hashValue,
  normalizeCode,
  sb,
} from './_lib/affiliate'

const CLICK_DEDUPE_HOURS = 24

const truncate = (value: unknown, max = 500): string | null => {
  const str = String(value || '').trim()
  return str ? str.slice(0, max) : null
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const body = JSON.parse(event.body || '{}')
    const code = normalizeCode(body.ref)
    if (!code) return { statusCode: 204, body: '' }

    const affiliate = await getActiveAffiliate(code)
    // Unknown or disabled code: say nothing useful, don't set a cookie.
    if (!affiliate) return { statusCode: 204, body: '' }

    const ipHash = hashValue(getClientIp(event))
    const uaHash = hashValue(event.headers?.['user-agent'])

    // This endpoint is unauthenticated, so anyone who knows the code could flood it.
    // A repeat click from the same fingerprint inside the dedupe window is NOT inserted —
    // it only refreshes the cookie. That bounds row growth to one per device per day and
    // keeps a flood from filling the same database the payment flow writes to.
    if (ipHash && uaHash) {
      const since = new Date(Date.now() - CLICK_DEDUPE_HOURS * 60 * 60 * 1000).toISOString()
      const dupeRes = await sb(
        `affiliate_clicks?affiliate_id=eq.${affiliate.id}&ip_hash=eq.${ipHash}&ua_hash=eq.${uaHash}` +
          `&occurred_at=gte.${since}&select=id&limit=1`
      )
      if (dupeRes.ok) {
        const existing = (await dupeRes.json()) || []
        if (existing.length > 0) {
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            multiValueHeaders: {
              'Set-Cookie': [buildRefCookie(affiliate.code, existing[0].id, affiliate.attribution_days)],
            },
            body: JSON.stringify({ ok: true, ref: affiliate.code }),
          }
        }
      }
    }

    const insertRes = await sb('affiliate_clicks', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        affiliate_id: affiliate.id,
        landing_path: truncate(body.path, 300),
        referrer: truncate(body.referrer, 300),
        utm_source: truncate(body.utm_source, 100),
        utm_medium: truncate(body.utm_medium, 100),
        utm_campaign: truncate(body.utm_campaign, 100),
        ip_hash: ipHash,
        ua_hash: uaHash,
        is_unique: true,
      }),
    })

    const click = insertRes.ok ? (await insertRes.json())?.[0] : null

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      multiValueHeaders: {
        'Set-Cookie': [buildRefCookie(affiliate.code, click?.id || null, affiliate.attribution_days)],
      },
      body: JSON.stringify({ ok: true, ref: affiliate.code }),
    }
  } catch (error: any) {
    // Click tracking must never surface an error to a shopper.
    console.error('affiliate-click failed:', error?.message || error)
    return { statusCode: 204, body: '' }
  }
}
