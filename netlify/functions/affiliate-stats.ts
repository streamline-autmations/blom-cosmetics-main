import type { Handler } from '@netlify/functions'
import { sb } from './_lib/affiliate'
import { getSession } from './_lib/affiliate-session'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    // The affiliate id comes from the server-side session, never from the request, so a
    // partner cannot ask for another partner's numbers.
    const session = await getSession(event)
    if (!session) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Not signed in.' }),
      }
    }

    const res = await sb('rpc/affiliate_dashboard', {
      method: 'POST',
      body: JSON.stringify({ p_affiliate_id: session.affiliateId }),
    })
    if (!res.ok) {
      console.error('affiliate_dashboard failed:', await res.text())
      return { statusCode: 500, body: JSON.stringify({ error: 'Could not load your dashboard.' }) }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify(await res.json()),
    }
  } catch (error: any) {
    console.error('affiliate-stats error:', error?.message || error)
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong.' }) }
  }
}
