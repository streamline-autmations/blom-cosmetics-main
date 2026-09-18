-- Get complete order information for order BL-MIHIANYT
-- This shows all details including items, customer info, and order summary

-- Order Header Details
SELECT 
    'COMPLETE ORDER HEADER' as section,
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

-- Complete Order Items Details
SELECT 
    'ORDER ITEMS DETAIL' as section,
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
    p.stock_on_hand
FROM public.order_items oi
LEFT JOIN public.products p ON oi.product_id = p.id
WHERE oi.order_id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88'
ORDER BY oi.product_name;

-- Order Summary
SELECT 
    'ORDER SUMMARY' as section,
    COUNT(oi.id) as total_items,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.total_price) as calculated_total,
    STRING_AGG(oi.product_name, ' | ') as items_summary
FROM public.order_items oi
WHERE oi.order_id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88';

-- Customer and Payment Summary
SELECT 
    'CUSTOMER & PAYMENT INFO' as section,
    'Customer: ' || o.buyer_name || ' (' || o.buyer_email || ')' as customer_info,
    'Phone: ' || o.buyer_phone as contact_info,
    'Order Total: R' || o.total as order_total,
    'Status: ' || o.status || ' / ' || o.payment_status as status_info,
    'Created: ' || o.created_at as order_date
FROM public.orders o
WHERE o.id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88';