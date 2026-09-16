-- SAFE PRODUCT CREATION - No ON CONFLICT, uses WHERE NOT EXISTS
-- This script will work regardless of database constraints

-- STEP 1: Check current state of required products
SELECT 'BEFORE CREATION' as status, 
       'Prep & Primer Bundle' as product_name,
       CASE WHEN EXISTS (SELECT 1 FROM public.products WHERE name = 'Prep & Primer Bundle') THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 'BEFORE CREATION' as status, 
       'Core Acrylics - Barely Blooming Nude (070)' as product_name,
       CASE WHEN EXISTS (SELECT 1 FROM public.products WHERE name = 'Core Acrylics - Barely Blooming Nude (070)') THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 'BEFORE CREATION' as status, 
       'Core Acrylics - Purely White (075)' as product_name,
       CASE WHEN EXISTS (SELECT 1 FROM public.products WHERE name = 'Core Acrylics - Purely White (075)') THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 'BEFORE CREATION' as status, 
       'Core Acrylics' as product_name,
       CASE WHEN EXISTS (SELECT 1 FROM public.products WHERE name = 'Core Acrylics') THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 'BEFORE CREATION' as status, 
       'Fairy Dust Top Coat' as product_name,
       CASE WHEN EXISTS (SELECT 1 FROM public.products WHERE name = 'Fairy Dust Top Coat') THEN 'EXISTS' ELSE 'MISSING' END as status;

-- STEP 2: Create missing products using WHERE NOT EXISTS (safer method)
-- Prep & Primer Bundle
INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Prep & Primer Bundle',
    'BUNDLE-PREP-001',
    370.00,
    'Prep & Primer Bundle - Created for order mapping',
    true,
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.products WHERE name = 'Prep & Primer Bundle'
);

-- Core Acrylics Barely Blooming Nude (070)
INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Core Acrylics - Barely Blooming Nude (070)',
    'ACR-NUDE-070',
    320.00,
    'Core Acrylics Barely Blooming Nude (070) - Created for order mapping',
    true,
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.products WHERE name = 'Core Acrylics - Barely Blooming Nude (070)'
);

-- Core Acrylics Purely White (075)
INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Core Acrylics - Purely White (075)',
    'ACR-WHITE-075',
    320.00,
    'Core Acrylics Purely White (075) - Created for order mapping',
    true,
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.products WHERE name = 'Core Acrylics - Purely White (075)'
);

-- STEP 3: Verify all products now exist
SELECT 'AFTER CREATION' as status, name, id, sku, price 
FROM public.products 
WHERE name IN (
    'Prep & Primer Bundle',
    'Core Acrylics - Barely Blooming Nude (070)', 
    'Core Acrylics - Purely White (075)',
    'Core Acrylics',
    'Fairy Dust Top Coat'
)
ORDER BY name;

-- STEP 4: Map order items to the correct products
UPDATE public.order_items 
SET product_id = (
    SELECT p.id FROM public.products p
    WHERE 
        (order_items.product_name = 'Prep & Primer Bundle - Default' AND p.name = 'Prep & Primer Bundle')
        OR (order_items.product_name = 'Core Acrylics - Default' AND p.name = 'Core Acrylics')
        OR (order_items.product_name = 'Core Acrylics - Barely Blooming Nude (070)' AND p.name = 'Core Acrylics - Barely Blooming Nude (070)')
        OR (order_items.product_name = 'Core Acrylics - Purely White (075)' AND p.name = 'Core Acrylics - Purely White (075)')
        OR (order_items.product_name = 'Fairy Dust Top Coat - Default' AND p.name = 'Fairy Dust Top Coat')
)
WHERE order_id IN (
    SELECT id FROM public.orders 
    WHERE order_number = 'BL-19AC4799411' 
       OR m_payment_id = 'BL-19AC4799411'
       OR id = 'BL-19AC4799411'
) 
AND product_id IS NULL;

-- STEP 5: Show final result
SELECT 'FINAL MAPPING' as result,
       oi.id as order_item_id,
       oi.product_name,
       oi.quantity,
       oi.product_id,
       p.name as mapped_product_name,
       p.sku as product_sku,
       p.price as product_price
FROM public.order_items oi
LEFT JOIN public.products p ON oi.product_id = p.id
WHERE oi.order_id IN (
    SELECT id FROM public.orders 
    WHERE order_number = 'BL-19AC4799411' 
       OR m_payment_id = 'BL-19AC4799411'
       OR id = 'BL-19AC4799411'
)
ORDER BY oi.product_name;