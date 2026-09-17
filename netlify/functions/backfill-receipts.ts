import fetch from 'node-fetch'

const SB_URL = process.env.SUPABASE_URL!
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SITE = (process.env.SITE_BASE_URL || process.env.SITE_URL || 'https://blom-cosmetics.co.za').replace(/\/+$/, '')

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }
    // Optional filter
    const { email } = JSON.parse(event.body || '{}') as { email?: string }

    // 1) Get paid orders missing invoice_url (optionally filter by email)
    const filter = [
      'status=eq.paid',
      'invoice_url=is.null',
      email ? `buyer_email=eq.${encodeURIComponent(email.toLowerCase())}` : ''
    ]
      .filter(Boolean)
      .join('&')

    const res = await fetch(`${SB_URL}/rest/v1/orders?select=id,m_payment_id,order_number,buyer_email&${filter}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    })
    if (!res.ok) return { statusCode: 500, body: await res.text() }
    const orders = (await res.json()) as Array<{ id: string; m_payment_id: string; order_number?: string; buyer_email?: string }>

    let ok = 0
    for (const o of orders) {
      try {
        const url = `${SITE}/.netlify/functions/invoice-generate-pdf?m_payment_id=${encodeURIComponent(o.m_payment_id)}`
        const r = await fetch(url)
        if (r.ok) ok++
      } catch {}
    }

    return { statusCode: 200, body: JSON.stringify({ processed: orders.length, generated: ok }) }
  } catch (e: any) {
    console.error(e)
    return { statusCode: 500, body: e?.message || 'Error' }
  }
}
