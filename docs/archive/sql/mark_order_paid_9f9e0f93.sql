-- MARK ORDER AS PAID - BL-19AC8E4511F
-- Order ID: 9f9e0f93-e380-4756-ae78-ff08a22cc7c9
-- Order Number: BL-MIIETZXB
-- Buyer: christiaansteffen12345@gmail.com
-- Amount: R 2030.00

-- STEP 1: Check the order and its items for product_id issues
SELECT 
    'Order Details' as check_type,
    o.id,
    o.order_number,
    o.m_payment_id,
    o.status,
    o.payment_status,
    o.buyer_email,
    o.total
FROM public.orders o
WHERE o.id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'

UNION ALL

SELECT 
    'Order Items' as check_type,
    oi.id::text,
    oi.product_name,
    oi.variant_title,
    oi.unit_price::text,
    oi.quantity::text,
    oi.product_id::text,
    oi.variant_id::text
FROM public.order_items oi
WHERE oi.order_id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9';

-- STEP 2: Fix any missing product_ids (similar to previous fixes)
-- Create missing products if needed
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
WHERE oi.order_id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'
  AND oi.product_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.name = oi.product_name
  );

-- Map order items to products
UPDATE public.order_items 
SET product_id = p.id
FROM public.products p
WHERE order_items.product_name = p.name 
  AND order_items.product_id IS NULL
  AND order_items.order_id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9';

-- STEP 3: Mark the order as paid
UPDATE public.orders 
SET 
    status = 'paid',
    payment_status = 'paid',
    paid_at = NOW()
WHERE id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9';

-- STEP 4: Verify the order is now marked as paid
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
WHERE id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9';