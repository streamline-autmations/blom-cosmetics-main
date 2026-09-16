-- SIMPLE ORDER VERIFICATION AND ADMIN VISIBILITY CHECK
-- Run this in your Supabase SQL Editor

-- 1. Check current order status
SELECT 
  'ORDER STATUS' as check_type,
  id as order_id,
  order_number,
  status,
  payment_status,
  paid_at,
  total,
  buyer_email,
  created_at
FROM public.orders 
WHERE order_number = 'BL-MIJ9P3QJ';

-- 2. Check if order items are properly fixed
SELECT 
  'ITEMS STATUS' as check_type,
  oi.id,
  oi.product_name,
  oi.product_id,
  oi.unit_price,
  oi.quantity,
  CASE 
    WHEN oi.product_id IS NOT NULL THEN '✅ HAS PRODUCT ID'
    ELSE '❌ NO PRODUCT ID'
  END as status_check
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
WHERE o.order_number = 'BL-MIJ9P3QJ'
ORDER BY oi.product_name;

-- 3. Quick status update (if items are fixed)
-- ONLY RUN THIS IF ALL ITEMS SHOW "HAS PRODUCT ID" ABOVE
UPDATE public.orders 
SET 
  status = 'paid',
  payment_status = 'paid',
  paid_at = now(),
  updated_at = now()
WHERE order_number = 'BL-MIJ9P3QJ';

-- 4. Final verification
SELECT 
  'FINAL CHECK' as check_type,
  id,
  order_number,
  status,
  payment_status,
  paid_at
FROM public.orders 
WHERE order_number = 'BL-MIJ9P3QJ';