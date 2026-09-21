import type { Handler } from '@netlify/functions'
import crypto from 'crypto'

const encodeVal = (v: any) => encodeURIComponent(String(v)).replace(/%20/g, '+')

// ITN signature: build from FIELDS (excluding signature) in **sorted key order**
function signITN(fields: Record<string, any>, passphrase?: string): string {
  const keys = Object.keys(fields).filter((k) => fields[k] !== undefined && fields[k] !== null && fields[k] !== '')
  keys.sort() // ITN requires alpha sort
  const base = keys.map((k) => `${k}=${encodeVal(fields[k])}`).join('&')
  const withPP = passphrase ? `${base}&passphrase=${encodeVal(passphrase)}` : base
  return crypto.createHash('md5').update(withPP).digest('hex')
}

export const handler: Handler = async (event) => {
  try {
    // Never in production. This endpoint forges a signed COMPLETE ITN for any order, so it
    // can mark orders paid — which now also creates affiliate commission. TEST_ITN_SECRET
    // alone is not a sufficient guard: it was committed to a public repo and remains in git
    // history. Same block as test-mark-order-paid.ts.
    if (process.env.CONTEXT === 'production') {
      return { statusCode: 404, body: 'Not Found' }
    }

    // Guard: require TEST_ITN_SECRET header for security
    const auth = event.headers['x-test-itn-secret'] || event.headers['X-Test-ITN-Secret']
    if (!auth || auth !== process.env.TEST_ITN_SECRET) {
      return { statusCode: 401, body: 'Unauthorized' }
    }

    const { m_payment_id = `BL-TEST-${Date.now().toString(16).toUpperCase()}`, amount = 8.5, buyer_name = 'Test Buyer', buyer_email = 'test@example.com' } = JSON.parse(event.body || '{}')

    const passphrase = (process.env.PAYFAST_PASSPHRASE || process.env.PF_PASSPHRASE || '').trim() || undefined
    const fields: Record<string, any> = {
      // Typical ITN fields (minimal set)
      merchant_id: process.env.PAYFAST_MERCHANT_ID,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY,
      payment_status: 'COMPLETE',
      pf_payment_id: `PF${Date.now()}`,
      amount_gross: Number(amount).toFixed(2),
      amount_fee: '0.00',
      amount_net: Number(amount).toFixed(2),
      email_address: buyer_email,
      name_first: buyer_name.split(' ')[0] || 'Test',
      name_last: buyer_name.split(' ').slice(1).join(' ') || 'Buyer',
      item_name: `BLOM Order ${m_payment_id}`,
      m_payment_id,
      payment_date: new Date().toISOString()
    }

    const signature = signITN(fields, passphrase)
    const body = new URLSearchParams({ ...fields, signature }).toString()

    console.log('Test ITN signature:', signature)
    console.log('Test ITN m_payment_id:', m_payment_id)

    // Post to your real ITN handler
    const base = process.env.SITE_BASE_URL || process.env.SITE_URL || 'https://blom-cosmetics.co.za'
    const itnUrl = `${base}/.netlify/functions/payfast-itn`

    console.log('Posting to:', itnUrl)

    const res = await fetch(itnUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body
    })

    const text = await res.text()
    console.log('ITN response:', res.status, text)

    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'text/plain' },
      body: text
    }
  } catch (e: any) {
    console.error('Dev ITN error:', e)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message || 'Error' })
    }
  }
}
