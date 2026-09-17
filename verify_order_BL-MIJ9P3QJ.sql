-- Verify the order fix for BL-MIJ9P3QJ
-- This script shows the current state and confirms the fix worked

SELECT 
    'ORDER DETAILS' as section,
    o.id::text as order_id,
    o.order_number,
    o.status,
    o.payment_status,
    o.total_amount,
    o.buyer_email,
    o.created_at::text
FROM orders o
WHERE o.id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'

UNION ALL

SELECT 
    'ORDER ITEMS SUMMARY' as section,
    'Total Items: ' || COUNT(oi.id)::text as order_id,
    'With Product ID: ' || COUNT(CASE WHEN oi.product_id IS NOT NULL THEN 1 END)::text as order_number,
    'Without Product ID: ' || COUNT(CASE WHEN oi.product_id IS NULL THEN 1 END)::text as status,
    'Valid: ' || CASE WHEN COUNT(CASE WHEN oi.product_id IS NULL THEN 1 END) = 0 THEN 'YES' ELSE 'NO' END as payment_status,
    '' as total_amount,
    '' as buyer_email,
    '' as created_at
FROM order_items oi
WHERE oi.order_id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'

UNION ALL

SELECT 
    'ORDER ITEMS DETAIL' as section,
    'Item Name' as order_id,
    'Product ID' as order_number,
    'Qty' as status,
    'Unit Price' as payment_status,
    'Total' as total_amount,
    'SKU' as buyer_email,
    'Created At' as created_at
FROM order_items oi
WHERE oi.order_id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'

UNION ALL

SELECT 
    '' as section,
    oi.product_name as order_id,
    COALESCE(oi.product_id::text, 'NULL') as order_number,
    oi.quantity::text as status,
    oi.unit_price::text as payment_status,
    oi.line_total::text as total_amount,
    COALESCE(p.sku, 'NO SKU') as buyer_email,
    oi.created_at::text
FROM order_items oi
LEFT JOIN products p ON p.id = oi.product_id
WHERE oi.order_id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'
ORDER BY section, order_id;