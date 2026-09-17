import type { Handler } from '@netlify/functions'

function getWebhookUrl(): string {
  const direct = process.env.N8N_ORDER_STATUS_WEBHOOK
  const base = process.env.N8N_BASE
  if (direct) return direct
  if (base) return `${base.replace(/\/$/, '')}/webhook/notify-order`
  return 'https://dockerfile-1n82.onrender.com/webhook/notify-order'
}

function getPayFastNotifyUrl(): string {
  // Get the base URL from environment or default
  const siteUrl = process.env.SITE_URL || process.env.SITE_BASE_URL || 'https://blom-cosmetics.co.za'
  return `${siteUrl.replace(/\/$/, '')}/.netlify/functions/payfast-itn`
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }

    const body = event.body || '{}'
    let json: any
    try {
      json = JSON.parse(body)
    } catch {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'INVALID_JSON' }) }
    }

    const { m_payment_id, status } = json || {}
    if (!m_payment_id || !status) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'INVALID_PAYLOAD', message: 'm_payment_id and status are required' })
      }
    }

    // Call the external webhook first
    const url = getWebhookUrl()
    const fwd = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    })

    // Don't fail if webhook fails, but log it
    let webhookSuccess = true
    if (!fwd.ok) {
      const text = await fwd.text().catch(() => '')
      console.error('Webhook forward failed:', fwd.status, text)
      webhookSuccess = false
    }

    // If order is paid, automatically generate invoice
    let invoiceGenerated = false
    if (status === 'paid') {
      try {
        console.log('Generating invoice for paid order:', m_payment_id)
        const invoiceResponse = await fetch('/.netlify/functions/invoice-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            m_payment_id,
            site_url: json?.site_url || 'https://blom-cosmetics.co.za'
          })
        })

        if (invoiceResponse.ok) {
          invoiceGenerated = true
          console.log('Invoice generated successfully for:', m_payment_id)
        } else {
          const errorText = await invoiceResponse.text()
          console.error('Invoice generation failed:', invoiceResponse.status, errorText)
        }
      } catch (error) {
        console.error('Invoice generation error:', error)
      }
    }

    console.log('Order status processed:', { 
      m_payment_id, 
      status, 
      webhookSuccess, 
      invoiceGenerated,
      buyer_email: json?.buyer_email, 
      site_url: json?.site_url 
    })

    // Return success even if webhook failed, as long as we processed the request
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        success: true,
        webhook_called: true,
        invoice_generated: invoiceGenerated,
        webhook_success: webhookSuccess
      })
    }
  } catch (e: any) {
    console.error('order-status error:', e?.message)
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'SERVER_ERROR', message: e?.message || 'Server error' }) }
  }
}


