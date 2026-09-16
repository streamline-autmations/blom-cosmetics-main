-- Fix for order items missing product_id before marking as paid

-- Step 1: Check the problematic order and its items
SELECT 
    o.id as order_id,
    o.order_number,
    oi.id as order_item_id,
    oi.product_id,
    oi.product_name,
    oi.variant_id,
    oi.quantity
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
WHERE o.order_number = 'BL-19AC4799411' 
   OR o.m_payment_id = 'BL-19AC4799411'
   OR o.id = 'BL-19AC4799411';

-- Step 2: Fix missing product_id by looking up from products table
-- This assumes product_name matches products.name
UPDATE public.order_items 
SET product_id = p.id
FROM public.products p
WHERE order_items.product_name = p.name 
  AND order_items.product_id IS NULL
  AND order_items.order_id IN (
    SELECT id FROM public.orders 
    WHERE order_number = 'BL-19AC4799411' 
       OR m_payment_id = 'BL-19AC4799411'
       OR id = 'BL-19AC4799411'
  );

-- Step 3: Alternative fix if product lookup by name fails
-- Try to match by SKU if available
UPDATE public.order_items 
SET product_id = p.id
FROM public.products p
WHERE order_items.sku = p.sku 
  AND order_items.product_id IS NULL
  AND order_items.order_id IN (
    SELECT id FROM public.orders 
    WHERE order_number = 'BL-19AC4799411' 
       OR m_payment_id = 'BL-19AC4799411'
       OR id = 'BL-19AC4799411'
  );

-- Step 4: Verify the fix
SELECT 
    oi.id as order_item_id,
    oi.product_id,
    oi.product_name,
    oi.variant_id,
    oi.quantity,
    p.name as actual_product_name,
    p.sku as actual_product_sku
FROM public.order_items oi
LEFT JOIN public.products p ON oi.product_id = p.id
WHERE oi.order_id IN (
    SELECT id FROM public.orders 
    WHERE order_number = 'BL-19AC4799411' 
       OR m_payment_id = 'BL-19AC4799411'
       OR id = 'BL-19AC4799411'
);