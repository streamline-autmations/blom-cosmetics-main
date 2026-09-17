-- COMPLETE FIX for order BL-19AC8E4511F (UUID: c7c88c8d-a961-4692-9ae7-fbfacf151e88)
-- This will fix the missing product_id values and then mark the order as paid

-- STEP 1: Check the order and its items with null product_id
SELECT 
    o.id as order_id,
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
WHERE o.id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88'
   OR o.order_number = 'BL-19AC8E4511F' 
   OR o.m_payment_id = 'BL-19AC8E4511F';

-- STEP 2: Create any missing products that don't exist in catalog
-- First, let's see what products we have
INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    DISTINCT oi.product_name,
    UPPER(LEFT(REPLACE(oi.product_name, ' ', '-'), 10)) || '-SKU',
    oi.unit_price,
    oi.product_name,
    true,
    now(),
    now()
FROM public.order_items oi
WHERE oi.order_id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88'
  AND oi.product_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.name = oi.product_name
  );

-- STEP 3: Map order items to products by name
UPDATE public.order_items 
SET product_id = p.id
FROM public.products p
WHERE order_items.product_name = p.name 
  AND order_items.product_id IS NULL
  AND order_items.order_id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88';

-- STEP 4: For any remaining unmapped items, create generic products
UPDATE public.order_items 
SET product_id = (
    SELECT id FROM public.products 
    WHERE name = 'Generic Product' 
    LIMIT 1
)
WHERE product_id IS NULL
  AND order_id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88'
  AND NOT EXISTS (
    SELECT 1 FROM public.products WHERE name = 'Generic Product'
  );

-- If Generic Product doesn't exist, create it
INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'Generic Product', 'GEN-PROD-001', 100.00, 'Generic fallback product', true, now(), now())
ON CONFLICT DO NOTHING;

-- Now update any remaining null product_ids
UPDATE public.order_items 
SET product_id = (SELECT id FROM public.products WHERE name = 'Generic Product' LIMIT 1)
WHERE product_id IS NULL
  AND order_id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88';

-- STEP 5: Verify all order items now have product_id
SELECT 
    oi.id as order_item_id,
    oi.product_name,
    oi.product_id,
    p.name as mapped_product_name,
    p.sku as mapped_product_sku
FROM public.order_items oi
LEFT JOIN public.products p ON oi.product_id = p.id
WHERE oi.order_id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88';

-- STEP 6: Now safely mark the order as paid
UPDATE public.orders 
SET 
    status = 'paid',
    payment_status = 'paid',
    paid_at = NOW()
WHERE id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88'
   OR order_number = 'BL-19AC8E4511F' 
   OR m_payment_id = 'BL-19AC8E4511F';

-- STEP 7: Final verification
SELECT 
    id,
    order_number,
    m_payment_id,
    status,
    payment_status,
    paid_at,
    buyer_email,
    total,
    created_at
FROM public.orders 
WHERE id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88'
   OR order_number = 'BL-19AC8E4511F' 
   OR m_payment_id = 'BL-19AC8E4511F';