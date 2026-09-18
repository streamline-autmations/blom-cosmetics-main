-- SIMPLE DIRECT FIX - Uses your exact product catalog
-- Run this entire script to fix your order items

-- STEP 1: Create missing products first (Prep & Primer Bundle, Nude Acrylic, White Acrylic)
INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'Prep & Primer Bundle', 'BUNDLE-PREP-001', 370.00, 'Prep & Primer Bundle product', true, now(), now()),
    (gen_random_uuid(), 'Core Acrylics - Barely Blooming Nude (070)', 'ACR-NUDE-070', 320.00, 'Core Acrylics Barely Blooming Nude', true, now(), now()),
    (gen_random_uuid(), 'Core Acrylics - Purely White (075)', 'ACR-WHITE-075', 320.00, 'Core Acrylics Purely White', true, now(), now())
ON CONFLICT (name) DO NOTHING;

-- STEP 2: Get the newly created product IDs
WITH created_products AS (
    SELECT id, name FROM public.products 
    WHERE name IN (
        'Prep & Primer Bundle',
        'Core Acrylics - Barely Blooming Nude (070)', 
        'Core Acrylics - Purely White (075)'
    )
),
all_products AS (
    -- Get existing and newly created products
    SELECT id, name FROM public.products 
    WHERE name IN (
        'Prep & Primer Bundle',
        'Core Acrylics - Barely Blooming Nude (070)', 
        'Core Acrylics - Purely White (075)',
        'Core Acrylics',
        'Fairy Dust Top Coat'
    )
)
-- STEP 3: Update order items with correct product IDs
UPDATE public.order_items 
SET product_id = ap.id
FROM all_products ap
WHERE (
    -- Map order items to products using names
    (order_items.product_name = 'Prep & Primer Bundle - Default' AND ap.name = 'Prep & Primer Bundle')
    OR (order_items.product_name = 'Core Acrylics - Default' AND ap.name = 'Core Acrylics')
    OR (order_items.product_name = 'Core Acrylics - Barely Blooming Nude (070)' AND ap.name = 'Core Acrylics - Barely Blooming Nude (070)')
    OR (order_items.product_name = 'Core Acrylics - Purely White (075)' AND ap.name = 'Core Acrylics - Purely White (075)')
    OR (order_items.product_name = 'Fairy Dust Top Coat - Default' AND ap.name = 'Fairy Dust Top Coat')
)
AND order_items.product_id IS NULL
AND order_items.order_id IN (
    SELECT id FROM public.orders 
    WHERE order_number = 'BL-19AC4799411' 
       OR m_payment_id = 'BL-19AC4799411'
       OR id = 'BL-19AC4799411'
);

-- STEP 4: Verify everything worked
SELECT 
    'BEFORE: Order items with missing product_id' as status,
    oi.id as order_item_id,
    oi.product_name,
    oi.product_id,
    oi.quantity
FROM public.order_items oi
WHERE oi.order_id IN (
    SELECT id FROM public.orders 
    WHERE order_number = 'BL-19AC4799411' 
       OR m_payment_id = 'BL-19AC4799411'
       OR id = 'BL-19AC4799411'
) 
AND oi.product_id IS NULL
UNION ALL
SELECT 
    'AFTER: Order items with product_id',
    oi.id as order_item_id,
    oi.product_name,
    oi.product_id::text,
    oi.quantity
FROM public.order_items oi
WHERE oi.order_id IN (
    SELECT id FROM public.orders 
    WHERE order_number = 'BL-19AC4799411' 
       OR m_payment_id = 'BL-19AC4799411'
       OR id = 'BL-19AC4799411'
) 
AND oi.product_id IS NOT NULL
ORDER BY status, product_name;