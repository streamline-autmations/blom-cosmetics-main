-- STEP 2: Mark order as paid after fixing product_id
-- Run this AFTER step1_fix_null_product_id.sql has completed

UPDATE public.orders 
SET 
    status = 'paid',
    payment_status = 'paid',
    paid_at = now(),
    updated_at = now()
WHERE id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3';

-- Verify the result
SELECT 
    id,
    order_number,
    status,
    payment_status,
    paid_at,
    total,
    buyer_email
FROM public.orders 
WHERE id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3';

-- Check that stock movements were created successfully
SELECT 
    sm.product_id,
    p.name as product_name,
    sm.delta,
    sm.reason,
    sm.created_at
FROM public.stock_movements sm
LEFT JOIN public.products p ON p.id = sm.product_id
WHERE sm.order_id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'
ORDER BY sm.created_at;