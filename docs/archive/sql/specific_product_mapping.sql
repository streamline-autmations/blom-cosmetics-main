-- SPECIFIC PRODUCT MAPPING SCRIPT
-- Uses exact product IDs from your current catalog

-- STEP 1: Create missing products that don't exist in your catalog
-- Create "Prep & Primer Bundle" product
INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
VALUES (
    'prep-bundle-id-here',
    'Prep & Primer Bundle',
    'BUNDLE-PREP-PRIMER-001',
    370.00,
    'Prep & Primer Bundle',
    true,
    now(),
    now()
)
ON CONFLICT (name) DO NOTHING;

-- Create "Core Acrylics - Barely Blooming Nude (070)" 
INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
VALUES (
    'core-nude-070-id-here', 
    'Core Acrylics - Barely Blooming Nude (070)',
    'ACR-NUDE-070',
    320.00,
    'Core Acrylics Barely Blooming Nude (070)',
    true,
    now(),
    now()
)
ON CONFLICT (name) DO NOTHING;

-- Create "Core Acrylics - Purely White (075)"
INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
VALUES (
    'core-white-075-id-here',
    'Core Acrylics - Purely White (075)', 
    'ACR-WHITE-075',
    320.00,
    'Core Acrylics Purely White (075)',
    true,
    now(),
    now()
)
ON CONFLICT (name) DO NOTHING;

-- STEP 2: Map your order items to the correct products using actual IDs

-- Map "Prep & Primer Bundle - Default" 
-- (You'll need to create this product or find a suitable one)

-- Map "Core Acrylics - Default" to your existing "Core Acrylics" product
UPDATE public.order_items 
SET product_id = '7bfc85b3-261e-4d21-be09-b55ab2967e56'
WHERE product_name = 'Core Acrylics - Default'
  AND order_id IN (
    SELECT id FROM public.orders 
    WHERE order_number = 'BL-19AC4799411' 
       OR m_payment_id = 'BL-19AC4799411'
       OR id = 'BL-19AC4799411'
  );

-- Map "Core Acrylics - Barely Blooming Nude (070)" 
-- (You'll need to create this product first)
-- UPDATE public.order_items 
-- SET product_id = 'core-nude-070-id-here'
-- WHERE product_name = 'Core Acrylics - Barely Blooming Nude (070)'
--   AND order_id IN (
--     SELECT id FROM public.orders 
--     WHERE order_number = 'BL-19AC4799411' 
--        OR m_payment_id = 'BL-19AC4799411'
--        OR id = 'BL-19AC4799411'
--   );

-- Map "Core Acrylics - Purely White (075)"
-- (You'll need to create this product first)
-- UPDATE public.order_items 
-- SET product_id = 'core-white-075-id-here'
-- WHERE product_name = 'Core Acrylics - Purely White (075)'
--   AND order_id IN (
--     SELECT id FROM public.orders 
--     WHERE order_number = 'BL-19AC4799411' 
--        OR m_payment_id = 'BL-19AC4799411'
--        OR id = 'BL-19AC4799411'
--   );

-- Map "Fairy Dust Top Coat - Default" to your existing "Fairy Dust Top Coat" product
UPDATE public.order_items 
SET product_id = '23277fea-c7dc-4cbe-8efe-7f5b58718f81'
WHERE product_name = 'Fairy Dust Top Coat - Default'
  AND order_id IN (
    SELECT id FROM public.orders 
    WHERE order_number = 'BL-19AC4799411' 
       OR m_payment_id = 'BL-19AC4799411'
       OR id = 'BL-19AC4799411'
  );

-- STEP 3: Verify the mapping
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
)
ORDER BY oi.product_name;