-- Verification script to check if invoice was generated for order BL-MIJ9P3QJ
-- Run this in your Supabase SQL editor or database client

SELECT 
    id,
    m_payment_id,
    order_number,
    status,
    payment_status,
    paid_at,
    invoice_url,
    total,
    subtotal_cents,
    shipping_cents,
    discount_cents,
    created_at,
    updated_at,
    buyer_name,
    buyer_email
FROM public.orders 
WHERE id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3';

-- If invoice_url is NULL, the invoice generation failed
-- Expected result: invoice_url should contain a public URL to a PDF file