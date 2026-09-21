-- COMPREHENSIVE DEBUGGING AND FIX SCRIPT
-- Run these steps in order to identify and fix the product mapping issue

-- STEP 1: Check what products actually exist in your catalog
SELECT id, name, sku, price, is_active 
FROM public.products 
ORDER BY name 
LIMIT 20;

-- STEP 2: Look for products that contain "prep", "primer", "bundle"
SELECT id, name, sku, price 
FROM public.products 
WHERE name ILIKE '%prep%' 
   OR name ILIKE '%primer%'
   OR name ILIKE '%bundle%';

-- STEP 3: Look for acrylic products
SELECT id, name, sku, price 
FROM public.products 
WHERE name ILIKE '%acrylic%'
ORDER BY name;

-- STEP 4: Look for top coat products
SELECT id, name, sku, price 
FROM public.products 
WHERE name ILIKE '%top%coat%'
   OR name ILIKE '%fairy%dust%'
ORDER BY name;

-- STEP 5: If products don't exist, let's create them from the order data
-- This will create the missing products based on your order items

INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Prep & Primer Bundle',
    'PREP-BUNDLE-001',
    370.00,
    'Prep & Primer Bundle product created from order data',
    true,
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.products WHERE name ILIKE '%prep%bundle%'
);

INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Core Acrylics',
    'CORE-ACRYLIC-001',
    185.00,
    'Core Acrylics product created from order data',
    true,
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.products WHERE name ILIKE '%core%acrylic%'
);

INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Core Acrylics - Barely Blooming Nude (070)',
    'CORE-070-NUDE',
    185.00,
    'Core Acrylics Barely Blooming Nude created from order data',
    true,
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.products WHERE name ILIKE '%nude%070%'
);

INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Core Acrylics - Purely White (075)',
    'CORE-075-WHITE',
    185.00,
    'Core Acrylics Purely White created from order data',
    true,
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.products WHERE name ILIKE '%white%075%'
);

INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Fairy Dust Top Coat',
    'FAIRY-TOP-COAT',
    125.00,
    'Fairy Dust Top Coat product created from order data',
    true,
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.products WHERE name ILIKE '%fairy%dust%'
);

-- STEP 6: Now map the order items to the products
UPDATE public.order_items 
SET product_id = p.id
FROM public.products p
WHERE (
    (order_items.product_name = 'Prep & Primer Bundle - Default' AND p.name ILIKE '%prep%bundle%')
    OR (order_items.product_name = 'Core Acrylics - Default' AND p.name = 'Core Acrylics')
    OR (order_items.product_name = 'Core Acrylics - Barely Blooming Nude (070)' AND p.name ILIKE '%nude%070%')
    OR (order_items.product_name = 'Core Acrylics - Purely White (075)' AND p.name ILIKE '%white%075%')
    OR (order_items.product_name = 'Fairy Dust Top Coat - Default' AND p.name ILIKE '%fairy%dust%')
)
AND order_items.product_id IS NULL
AND order_items.order_id IN (
    SELECT id FROM public.orders 
    WHERE order_number = 'BL-19AC4799411' 
       OR m_payment_id = 'BL-19AC4799411'
       OR id = 'BL-19AC4799411'
);

-- STEP 7: Verify the mapping worked
SELECT 
    oi.id,
    oi.product_name,
    oi.product_id,
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