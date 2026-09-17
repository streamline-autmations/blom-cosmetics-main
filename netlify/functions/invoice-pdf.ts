import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import fetch from "node-fetch"
import { FREE_SHIPPING_THRESHOLD, FREE_SHIPPING_THRESHOLD_LABEL } from "../../src/lib/shipping"

const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SITE_URL = (process.env.SITE_URL || "https://blom-cosmetics.co.za/").replace(/\/+$/, "")
const BUCKET = "invoices" 
const LOGO_URL = "https://yvmnedjybrpvlupygusf.supabase.co/storage/v1/object/public/assets/blom_logo.png"

function money(n: any) {
  return "R " + Number(n || 0).toFixed(2)
}

// pdf-lib StandardFonts can only encode WinAnsi (CP1252). Any character outside
// that set (emoji, ⚠, non-Latin scripts, smart punctuation) makes drawText throw
// and 500s the whole invoice. Normalize common punctuation to ASCII, then strip
// anything still unencodable so a stray glyph in a name/address/product title can
// never break invoice generation.
function sanitizeWinAnsi(value: any): string {
  if (value === null || value === undefined) return ""
  return String(value)
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/…/g, "...")
    .replace(/[•●·]/g, "-")
    .replace(/ /g, " ")
    .replace(/[^\x20-\x7E\xA1-\xFF]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const handler = async (event: any) => {
  try {
    const contentType = event.headers['content-type'] || '';
    let body: any = {};

    if (event.httpMethod === 'GET') {
      body = {};
    } else if (contentType.includes('application/json')) {
      body = event.body ? JSON.parse(event.body) : {};
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      body = Object.fromEntries(new URLSearchParams(event.body || ''));
    } else {
      try { body = event.body ? JSON.parse(event.body) : {}; } catch { body = {}; }
    }

    const q = event.queryStringParameters || {};
    let m_payment_id = body.m_payment_id || q.m_payment_id || event.headers['x-m-payment-id'];
    const order_id = body.order_id || q.order_id || event.headers['x-order-id'];

    if (!m_payment_id && order_id) {
      try {
        const orderResponse: any = await fetchJson(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order_id}&select=m_payment_id,merchant_payment_id`);
        if (orderResponse && orderResponse.length > 0) {
          m_payment_id = orderResponse[0].m_payment_id || orderResponse[0].merchant_payment_id;
        }
      } catch (error) { console.error('ID Lookup Error', error); }
    }

    if (!m_payment_id) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'ID required' }) };
    }

    // 1) Load Order Data
    const orParam = encodeURIComponent(`(m_payment_id.eq.${m_payment_id},merchant_payment_id.eq.${m_payment_id})`)
    const orderResponse: any = await fetchJson(
      `${SUPABASE_URL}/rest/v1/orders?or=${orParam}&select=id,buyer_name,buyer_email,buyer_phone,fulfillment_method,delivery_address,collection_location,total,subtotal_cents,shipping_cents,discount_cents,coupon_code,status,created_at`
    )
    const order = Array.isArray(orderResponse) ? orderResponse[0] : orderResponse
    if (!order) return { statusCode: 404, body: "ORDER_NOT_FOUND" }

    const items = await fetchJson(
      `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${order.id}&select=product_name,sku,quantity,unit_price,line_total,variant_title`
    ) as any[]

    // --- Detect Furniture ---
    const furnitureKeywords = ['table', 'station', 'desk', 'dresser', 'bed', 'chair', 'rack'];
    const hasFurniture = items.some((it: any) => {
      const name = (it.product_name || '').toLowerCase();
      return furnitureKeywords.some(k => name.includes(k));
    });

    // Calculate totals
    const itemsSum = items.reduce((s: number, it: any) => s + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0)
    
    // 2) PDF Generation
    const pdf = await PDFDocument.create()
    const page = pdf.addPage([595.28, 841.89]) // A4
    const { width } = page.getSize()
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

    let y = 800
    const left = 40
    const right = width - 40

    const drawText = (text: string, x: number, yPos: number, size = 12, bold = false, color = rgb(0.1, 0.1, 0.15)) => {
      page.drawText(sanitizeWinAnsi(text), { x, y: yPos, size, font: bold ? fontBold : font, color })
    }
    const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 1, color: rgb(0.9, 0.92, 0.95) })
    }
    const drawRightText = (text: string, x: number, yPos: number, size = 12, bold = false, color = rgb(0.1, 0.1, 0.15)) => {
      const safe = sanitizeWinAnsi(text)
      const textWidth = (bold ? fontBold : font).widthOfTextAtSize(safe, size)
      page.drawText(safe, { x: x - textWidth, y: yPos, size, font: bold ? fontBold : font, color })
    }

    // Add Logo
    let logoHeight = 0
    try {
      const logoRes = await fetch(LOGO_URL)
      if (logoRes.ok) {
        const logoBuf = await logoRes.arrayBuffer()
        const logoImg = await pdf.embedPng(logoBuf).catch(() => pdf.embedJpg(logoBuf))
        if (logoImg) {
          const logoW = 140
          logoHeight = (logoImg.height / logoImg.width) * logoW
          page.drawImage(logoImg, { x: right - logoW, y: y - logoHeight, width: logoW, height: logoHeight })
        }
      }
    } catch (e) {}

    // Header Details
    drawText("RECEIPT", left, y, 24, true)
    y -= 10
    drawText(`Receipt #: ${m_payment_id}`, left, (y -= 16), 10, false, rgb(0.35, 0.38, 0.45))
    drawText(`Date: ${new Date(order.created_at).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}`, left, (y -= 14), 10, false, rgb(0.35, 0.38, 0.45))
    
    y = logoHeight > 0 ? Math.min(y, 800 - logoHeight - 15) : y - 8
    y -= 18
    drawLine(left, y, right, y)
    y -= 18

    // Customer Info
    drawText("Customer", left, y, 12, true)
    drawText("Fulfillment", right - 200, y, 12, true)
    y -= 16
    drawText(order.buyer_name || "-", left, y, 11)
    drawText(String(order.fulfillment_method || '-').toUpperCase(), right - 200, y, 11)
    y -= 14
    drawText(order.buyer_email || "-", left, y, 10, false, rgb(0.4, 0.45, 0.52))
    if (order.collection_location) drawText(String(order.collection_location), right - 200, y, 10, false, rgb(0.4, 0.45, 0.52))
    y -= 14
    drawText(order.buyer_phone || "", left, y, 10, false, rgb(0.4, 0.45, 0.52))
    
    if (order.delivery_address && order.fulfillment_method === 'delivery') {
      const addr = order.delivery_address
      const addrLines = [
        addr.line1 || addr.street_address,
        [addr.city, addr.postal_code || addr.code].filter(Boolean).join(' '),
        [addr.province, addr.country].filter(Boolean).join(', ')
      ].filter(Boolean)
      let addrY = y
      addrLines.forEach((line: string) => {
        drawText(line, right - 200, addrY, 9, false, rgb(0.4, 0.45, 0.52)); addrY -= 11
      })
      y = Math.min(y, addrY - 4)
    }
    
    y -= 12; drawLine(left, y, right, y); y -= 20

    // Items Table
    drawText("Item", left, y, 11, true)
    drawRightText("Qty", right - 150, y, 11, true)
    drawRightText("Unit", right - 90, y, 11, true)
    drawRightText("Total", right - 20, y, 11, true)
    y -= 8; drawLine(left, y, right, y); y -= 14

    items.forEach((it: any) => {
      const name = it.product_name || it.sku || "-"
      const variant = it.variant_title ? ` • ${it.variant_title}` : ""
      const qty = Number(it.quantity || 0)
      const unit = Number(it.unit_price || 0)
      const lineTotal = it.line_total ? Number(it.line_total) : (qty * unit)

      drawText(name + variant, left, y, 10)
      drawRightText(String(qty), right - 150, y, 10)
      drawRightText(money(unit), right - 90, y, 10)
      drawRightText(money(lineTotal), right - 20, y, 10)
      y -= 16
    })

    // --- FINANCIALS SECTION ---
    const subtotalAmount = order.subtotal_cents != null ? order.subtotal_cents / 100 : itemsSum
    const shippingAmount = (order.shipping_cents || 0) / 100
    const discountCents = order.discount_cents || 0
    const discountAmount = discountCents / 100

    // Shipping
    const isFreeShipping = subtotalAmount >= FREE_SHIPPING_THRESHOLD && shippingAmount === 0;
    
    if (hasFurniture && shippingAmount === 0) {
      drawText("Shipping (Furniture)", left, y, 10)
      drawRightText("Invoiced Later", right - 20, y, 10)
      y -= 16
    } else if (isFreeShipping) {
      drawText("FREE SHIPPING - Order over " + FREE_SHIPPING_THRESHOLD_LABEL, left, y, 10)
      drawRightText("R 0.00", right - 20, y, 10)
      y -= 16
    } else if (shippingAmount > 0) {
      const label = order.fulfillment_method === 'collection' ? 'Collection Fee' : 'Shipping & Handling';
      drawText(label, left, y, 10)
      drawRightText("1", right - 150, y, 10)
      drawRightText(money(shippingAmount), right - 90, y, 10)
      drawRightText(money(shippingAmount), right - 20, y, 10)
      y -= 16
    }

    // Discount
    if (discountCents > 0) {
      const discountLabel = order.coupon_code === 'WOMENSDAY2026'
        ? "Women's Day Promotion"
        : "Coupon Discount"
      drawText(discountLabel, left, y, 10, false, rgb(0, 0.5, 0.2))
      drawRightText("-" + money(discountAmount), right - 20, y, 10, false, rgb(0, 0.5, 0.2))
      y -= 16
    }

    y -= 8; drawLine(left, y, right, y); y -= 18

    // --- TOTALS (SIMPLIFIED) ---
    const invoiceTotal = Math.max(0, subtotalAmount + shippingAmount - discountAmount);

    // Removed "Subtotal" line
    // Removed "Amount Paid" line
    // Only showing final "Total"
    
    drawText("Total", right - 140, y, 13, true)
    drawRightText(money(invoiceTotal), right - 20, y, 13, true)

    // Footer
    y -= 32; 
    drawLine(left, y, right, y); 
    y -= 16
    drawText("Thank you for your purchase!", left, y, 10, false, rgb(0.35, 0.38, 0.45))
    y -= 12
    drawText("Questions? Contact us: shopblomcosmetics@gmail.com | +27 79 548 3317", left, y, 9, false, rgb(0.4, 0.45, 0.52))
    drawRightText(SITE_URL.replace(/^https?:\/\//, ""), right, y, 9, false, rgb(0.4, 0.45, 0.52))

    const pdfBytes = await pdf.save()
    const version = q.v || Date.now().toString()
    const filename = `${m_payment_id}-${version}.pdf`
    
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(filename)}`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/pdf", "x-upsert": "true" },
      body: Buffer.from(pdfBytes)
    })

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(filename)}`
    
    const upd = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order.id}`, {
      method: "PATCH",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ invoice_url: publicUrl })
    })
    if (!upd.ok) throw new Error(await upd.text())

    const disposition = (q.download === '1' || body.download === true) ? 'attachment' : 'inline'
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="Invoice-${m_payment_id}.pdf"`,
        'Cache-Control': 'public, max-age=3600'
      },
      body: Buffer.from(pdfBytes).toString('base64'),
      isBase64Encoded: true
    }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message ?? "Error" }
  }
}
