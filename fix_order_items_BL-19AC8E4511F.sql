-- Fix order items for BL-19AC8E4511F that have null product_id
-- This will allow the order to be marked as paid without stock movement errors

-- First, let's check the order and its items
SELECT 
    o.id,
    o.order_number,
    o.m_payment_id,
    o.status,
    o.payment_status,
    o.buyer_email,
    oi.id as order_item_id,
    oi.product_name,
    oi.variant_title,
    oi.unit_price,
    oi.quantity,
    oi.product_id,
    oi.variant_id
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
WHERE o.order_number = 'BL-19AC8E4511F' 
   OR o.m_payment_id = 'BL-19AC8E4511F'
   OR o.id = 'BL-19AC8E4511F'
   OR o.id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88';