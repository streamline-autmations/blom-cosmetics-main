/* eslint-disable no-console */

const url = process.env.LOCAL_ORDER_STATUS_URL || '/.netlify/functions/order-status'

async function main() {
  const payload = {
    m_payment_id: `BL-TEST-${Date.now()}`,
    status: 'paid',
    buyer_name: 'Test Buyer',
    buyer_email: 'test@example.com',
    buyer_phone: '0820000000',
    site_url: 'https://blom-cosmetics.co.za'
  }

  const target = url.startsWith('http') ? url : `http://localhost:8888${url}`
  console.log('POST', target, payload)
  const res = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const text = await res.text()
  console.log('Response', res.status, text)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


