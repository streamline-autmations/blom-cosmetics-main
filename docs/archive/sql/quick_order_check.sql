-- QUICK ORDER ID AND DETAILS QUERY
-- Run this in your Supabase SQL Editor

-- Get order details for BL-MIJ9P3QJ
SELECT 
  id as order_id,
  order_number,
  status,
  payment_status,
  paid_at,
  total,
  buyer_name,
  buyer_email,
  created_at,
  updated_at,
  CASE 
    WHEN status = 'placed' THEN '⚠️ Order is placed but not paid'
    WHEN status = 'paid' THEN '✅ Order is paid'
    WHEN status = 'cancelled' THEN '❌ Order is cancelled'
    ELSE '❓ Unknown status'
  END as status_check
FROM public.orders 
WHERE order_number = 'BL-MIJ9P3QJ'
   OR m_payment_id = 'BL-MIJ9P3QJ'
   OR id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'::uuid;

-- Get order items count
SELECT 
  COUNT(*) as total_items,
  COUNT(CASE WHEN product_id IS NOT NULL THEN 1 END) as items_with_product_id
FROM public.order_items 
WHERE order_id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'::uuid;

-- Check if there are any recent orders to verify admin interface is working
SELECT 
  id,
  order_number,
  status,
  payment_status,
  total,
  buyer_email,
  created_at
FROM public.orders 
ORDER BY created_at DESC 
LIMIT 5;