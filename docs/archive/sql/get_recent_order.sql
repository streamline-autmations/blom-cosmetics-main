-- Query to find and display your most recent order
-- This will show the order details, items, and customer information

-- Step 1: Find the most recent orders (you can adjust the time filter as needed)
SELECT 
    'ORDER HEADER' as section,
    o.id as order_id,
    o.order_number,
    o.m_payment_id,
    o.status,
    o.payment_status,
    o.total,
    o.currency,
    o.buyer_email,
    o.buyer_name,
    o.buyer_phone,
    o.created_at,
    o.paid_at,
    o.channel,
    o.coupon_code
FROM public.orders o
WHERE o.created_at >= NOW() - INTERVAL '1 hour'  -- Orders from the last hour
ORDER BY o.created_at DESC
LIMIT 5;

-- Step 2: Get detailed order items for the most recent order
WITH recent_order AS (
    SELECT id, order_number 
    FROM public.orders 
    WHERE created_at >= NOW() - INTERVAL '1 hour'
    ORDER BY created_at DESC 
    LIMIT 1
)
SELECT 
    'ORDER ITEMS' as section,
    oi.id as order_item_id,
    oi.order_id,
    ro.order_number,
    oi.product_name,
    oi.variant_title,
    oi.sku,
    oi.quantity,
    oi.price,
    oi.total_price,
    oi.product_id,
    p.name as actual_product_name,
    p.sku as product_sku,
    p.price as product_price
FROM public.order_items oi
JOIN recent_order ro ON oi.order_id = ro.id
LEFT JOIN public.products p ON oi.product_id = p.id
ORDER BY oi.product_name;

-- Step 3: If you know a specific email or order number, use this instead:
-- Uncomment and replace with your details:
/*
SELECT 
    'ORDER BY EMAIL' as section,
    o.id as order_id,
    o.order_number,
    o.status,
    o.payment_status,
    o.total,
    o.buyer_email,
    o.created_at
FROM public.orders o
WHERE o.buyer_email = 'your-email@example.com'  -- Replace with actual email
ORDER BY o.created_at DESC
LIMIT 5;
*/

-- Step 4: Show order summary with totals
WITH recent_order AS (
    SELECT id, order_number, total
    FROM public.orders 
    WHERE created_at >= NOW() - INTERVAL '1 hour'
    ORDER BY created_at DESC 
    LIMIT 1
)
SELECT 
    'ORDER SUMMARY' as section,
    ro.order_number,
    ro.total as order_total,
    COUNT(oi.id) as total_items,
    SUM(oi.quantity) as total_quantity,
    STRING_AGG(oi.product_name, ', ') as items_list
FROM recent_order ro
JOIN public.order_items oi ON ro.id = oi.order_id
GROUP BY ro.id, ro.order_number, ro.total;