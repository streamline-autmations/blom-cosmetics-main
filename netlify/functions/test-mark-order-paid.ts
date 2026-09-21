import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
 
const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TEST_SECRET = process.env.TEST_ITN_SECRET || ''
 
const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!)
 
export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Test-ITN-Secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }
 
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }
 
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' }
  }
 
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server config missing' }) }
  }
 
  // Default-deny. Netlify sets CONTEXT at build time and does not expose it to the function
  // runtime, so the previous `CONTEXT === 'production'` check silently passed in production
  // — verified against the live site, where this endpoint accepted the leaked
  // TEST_ITN_SECRET and processed a real request. Opt in explicitly instead.
  if (process.env.ALLOW_TEST_ENDPOINTS !== 'true') {
    return { statusCode: 404, headers, body: 'Not Found' }
  }
 
  const auth = event.headers['x-test-itn-secret'] || event.headers['X-Test-ITN-Secret']
  if (!TEST_SECRET || !auth || auth !== TEST_SECRET) {
    return { statusCode: 401, headers, body: 'Unauthorized' }
  }
 
  const body = JSON.parse(event.body || '{}')
  const raw = String(body.order_id || body.id || body.m_payment_id || body.order_number || '').trim()
  if (!raw) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing order_id' }) }
  }
 
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id,status,payment_status,paid_at')
    .or(`id.eq.${raw},order_number.eq.${raw},m_payment_id.eq.${raw},merchant_payment_id.eq.${raw}`)
    .single()
 
  if (orderErr || !order) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found' }) }
  }
 
  const currentStatus = String(order.status || '').toLowerCase()
  const currentPaymentStatus = String(order.payment_status || '').toLowerCase()
  const isPaid = currentStatus === 'paid' || currentPaymentStatus === 'paid' || currentPaymentStatus === 'complete'
  const paidAt = new Date().toISOString()
 
  if (!isPaid) {
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ status: 'paid', payment_status: 'paid', paid_at: paidAt })
      .eq('id', order.id)
 
    if (updateErr) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to mark paid' }) }
    }
  }
 
  const baseUrl = (process.env.URL || process.env.SITE_URL || process.env.SITE_BASE_URL || 'http://localhost:8888').replace(/\/$/, '')
  const res = await fetch(`${baseUrl}/.netlify/functions/confirm-payment-success`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: order.id })
  })
 
  const text = await res.text()
  return {
    statusCode: res.ok ? 200 : 502,
    headers,
    body: JSON.stringify({
      ok: res.ok,
      confirm_status: res.status,
      confirm_body: text,
      order_id: order.id
    })
  }
}
