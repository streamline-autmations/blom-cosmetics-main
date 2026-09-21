-- SIMPLE ORDER FINDER for payment BL-19AC8E4511F
-- Run this first to identify the correct order ID

-- Search for order by payment ID BL-19AC8E4511F
SELECT 'Search by Payment ID' as search_type,
       id, order_number, m_payment_id, status, payment_status, buyer_email, total, created_at
FROM public.orders 
WHERE m_payment_id = 'BL-19AC8E4511F' 
   OR order_number = 'BL-19AC8E4511F'

UNION ALL

-- Search by email
SELECT 'Search by Email' as search_type,
       id, order_number, m_payment_id, status, payment_status, buyer_email, total, created_at
FROM public.orders 
WHERE buyer_email = 'christiaansteffen12345@gmail.com'
   AND created_at >= NOW() - INTERVAL '7 days'

UNION ALL

-- Search by amount R 5.00
SELECT 'Search by Amount' as search_type,
       id, order_number, m_payment_id, status, payment_status, buyer_email, total, created_at
FROM public.orders 
WHERE total = 5.00
   AND created_at >= NOW() - INTERVAL '7 days'

ORDER BY search_type, created_at DESC;