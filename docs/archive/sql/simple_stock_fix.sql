-- SIMPLE SOLUTION: Fix stock constraint and mark order as paid
-- Run this step by step in Supabase SQL Editor

-- =============================================================================
-- STEP 1: Just fix the stock constraint violation first
-- =============================================================================
UPDATE public.products 
SET 
  stock_on_hand = 100,
  updated_at = now()
WHERE id IN (
  SELECT DISTINCT product_id 
  FROM public.order_items 
  WHERE order_id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'::uuid 
    AND product_id IS NOT NULL
) AND stock_on_hand < 0;

-- =============================================================================
-- STEP 2: Now safely mark order as paid
-- =============================================================================
UPDATE public.orders 
SET 
  status = 'paid',
  payment_status = 'paid',
  paid_at = now(),
  updated_at = now()
WHERE id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'::uuid;

-- =============================================================================
-- STEP 3: Verify the fix worked
-- =============================================================================
SELECT 
  o.order_number,
  o.status,
  o.payment_status,
  o.paid_at,
  p.product_name,
  p.stock_on_hand
FROM public.orders o
JOIN public.order_items oi ON o.id = oi.order_id
LEFT JOIN public.products p ON oi.product_id = p.id
WHERE o.order_number = 'BL-MIJ9P3QJ'
ORDER BY p.product_name;