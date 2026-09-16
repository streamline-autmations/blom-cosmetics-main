-- =============================================================================
-- COMPLETE ORDER INFORMATION FOR BL-MIHIANYT
-- Order ID: c7c88c8d-a961-4692-9ae7-fbfacf151e88
-- =============================================================================

-- Order Header Details
SELECT 
    '=== ORDER HEADER ===' as section,
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
    o.coupon_code,
    o.total_amount,
    o.customer_email,
    o.customer_name,
    o.customer_mobile,
    o.shipping_method,
    o.shipping_cost
FROM public.orders o
WHERE o.order_number = 'BL-MIHIANYT' 
   OR o.m_payment_id = 'BL-19AC5A26DD5'
   OR o.id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88';

-- Order Items with Product Details
SELECT 
    '=== ORDER ITEMS WITH PRODUCT DETAILS ===' as section,
    oi.id as order_item_id,
    oi.order_id,
    oi.product_name,
    oi.variant_title,
    oi.sku,
    oi.quantity,
    oi.price,
    oi.total_price,
    oi.product_id,
    oi.unit_price,
    p.name as actual_product_name,
    p.sku as product_sku,
    p.price as product_price,
    p.stock_on_hand,
    p.product_type,
    p.slug,
    p.description
FROM public.order_items oi
LEFT JOIN public.products p ON oi.product_id = p.id
WHERE oi.order_id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88'
ORDER BY oi.product_name;

-- Order Summary and Totals
SELECT 
    '=== ORDER SUMMARY ===' as section,
    COUNT(oi.id) as total_items,
    SUM(oi.quantity) as total_quantity,
    ROUND(SUM(oi.total_price)::numeric, 2) as calculated_total,
    STRING_AGG(DISTINCT oi.product_name, ' | ' ORDER BY oi.product_name) as items_summary,
    o.shipping_cost,
    (SUM(oi.total_price) + COALESCE(o.shipping_cost, 0)) as final_total
FROM public.order_items oi
LEFT JOIN public.orders o ON oi.order_id = o.id
WHERE oi.order_id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88'
GROUP BY oi.order_id, o.shipping_cost;

-- Customer and Payment Information
SELECT 
    '=== CUSTOMER & PAYMENT INFO ===' as section,
    'Customer: ' || o.buyer_name || ' (' || o.buyer_email || ')' as customer_info,
    'Phone: ' || o.buyer_phone as contact_info,
    'Order Total: R' || o.total as order_total,
    'Status: ' || o.status || ' / ' || o.payment_status as status_info,
    'Created: ' || o.created_at as order_date,
    'Paid: ' || COALESCE(o.paid_at, 'Not paid yet') as payment_date
FROM public.orders o
WHERE o.id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88';

-- Stock Impact Analysis
SELECT 
    '=== STOCK IMPACT ===' as section,
    oi.product_name,
    oi.quantity as ordered_qty,
    COALESCE(p.stock_on_hand, 0) as current_stock,
    (COALESCE(p.stock_on_hand, 0) - oi.quantity) as stock_after_order,
    CASE 
        WHEN (COALESCE(p.stock_on_hand, 0) - oi.quantity) < 0 
        THEN 'STOCK SHORTAGE' 
        ELSE 'OK' 
    END as stock_status
FROM public.order_items oi
LEFT JOIN public.products p ON oi.product_id = p.id
WHERE oi.order_id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88'
ORDER BY oi.product_name;