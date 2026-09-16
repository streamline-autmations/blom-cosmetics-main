-- SIMPLE QUERY: Find your most recent order
-- Run this to see your latest order details

-- Find the most recent order
SELECT 
    o.id as order_id,
    o.order_number,
    o.m_payment_id,
    o.status,
    o.payment_status,
    o.total,
    o.buyer_email,
    o.buyer_name,
    o.created_at,
    o.paid_at
FROM public.orders o
ORDER BY o.created_at DESC
LIMIT 3;

-- Get order items for the most recent order
SELECT 
    oi.product_name,
    oi.variant_title,
    oi.quantity,
    oi.price,
    oi.total_price
FROM public.order_items oi
WHERE oi.order_id = (
    SELECT o.id FROM public.orders o 
    ORDER BY o.created_at DESC 
    LIMIT 1
)
ORDER BY oi.product_name;