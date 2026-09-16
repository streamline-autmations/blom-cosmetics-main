-- COMPREHENSIVE PRODUCT CREATION AND MAPPING SCRIPT
-- Fixes missing products and maps order items properly

-- STEP 1: First, let's see what products already exist
SELECT 'EXISTING PRODUCTS' as info, name, id FROM public.products WHERE name IN (
    'Prep & Primer Bundle',
    'Core Acrylics - Barely Blooming Nude (070)', 
    'Core Acrylics - Purely White (075)'
)
UNION ALL
SELECT 'MISSING PRODUCTS' as info, name, id FROM (
    VALUES 
        ('Prep & Primer Bundle'::text),
        ('Core Acrylics - Barely Blooming Nude (070)'::text),
        ('Core Acrylics - Purely White (075)'::text)
) AS t(name)
WHERE NOT EXISTS (
    SELECT 1 FROM public.products p WHERE p.name = t.name
);

-- STEP 2: Create missing products one by one (no ON CONFLICT needed)
-- Create Prep & Primer Bundle if it doesn't exist
INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Prep & Primer Bundle',
    'BUNDLE-PREP-001',
    370.00,
    'Prep & Primer Bundle product',
    true,
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.products WHERE name = 'Prep & Primer Bundle'
);

-- Create Core Acrylics Barely Blooming Nude (070) if it doesn't exist
INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Core Acrylics - Barely Blooming Nude (070)',
    'ACR-NUDE-070',
    320.00,
    'Core Acrylics Barely Blooming Nude (070)',
    true,
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.products WHERE name = 'Core Acrylics - Barely Blooming Nude (070)'
);

-- Create Core Acrylics Purely White (075) if it doesn't exist  
INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Core Acrylics - Purely White (075)',
    'ACR-WHITE-075',
    320.00,
    'Core Acrylics Purely White (075)',
    true,
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.products WHERE name = 'Core Acrylics - Purely White (075)'
);

-- STEP 3: Now verify all products exist and get their IDs
SELECT 'ALL REQUIRED PRODUCTS' as status, name, id, sku, price FROM public.products 
WHERE name IN (
    'Prep & Primer Bundle',
    'Core Acrylics - Barely Blooming Nude (070)', 
    'Core Acrylics - Purely White (075)',
    'Core Acrylics',
    'Fairy Dust Top Coat'
)
ORDER BY name;

-- STEP 4: Map order items to products using their names
UPDATE public.order_items 
SET product_id = (
    SELECT p.id FROM public.products p
    WHERE (
        (order_items.product_name = 'Prep & Primer Bundle - Default' AND p.name = 'Prep & Primer Bundle')
        OR (order_items.product_name = 'Core Acrylics - Default' AND p.name = 'Core Acrylics')
        OR (order_items.product_name = 'Core Acrylics - Barely Blooming Nude (070)' AND p.name = 'Core Acrylics - Barely Blooming Nude (070)')
        OR (order_items.product_name = 'Core Acrylics - Purely White (075)' AND p.name = 'Core Acrylics - Purely White (075)')
        OR (order_items.product_name = 'Fairy Dust Top Coat - Default' AND p.name = 'Fairy Dust Top Coat')
    )
    LIMIT 1
)
WHERE order_id IN (
    SELECT id FROM public.orders 
    WHERE order_number = 'BL-19AC4799411' 
       OR m_payment_id = 'BL-19AC4799411'
       OR id = 'BL-19AC4799411'
) 
AND product_id IS NULL;

-- STEP 5: Final verification - show before and after state
SELECT 'AFTER FIX: Order Items with Product IDs' as result,
    oi.id as order_item_id,
    oi.product_name,
    oi.quantity,
    p.id as product_id,
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