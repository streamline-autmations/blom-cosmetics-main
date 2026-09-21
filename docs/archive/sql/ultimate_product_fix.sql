-- COMPREHENSIVE FINAL SOLUTION
-- Creates missing products, handles duplicates, and maps order items
-- This script addresses all issues encountered

-- STEP 1: Create missing products using safe WHERE NOT EXISTS method
-- Create Prep & Primer Bundle if it doesn't exist
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

-- Create Core Acrylics Barely Blooming Nude (070) if it doesn't exist
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

-- Create Core Acrylics Purely White (075) if it doesn't exist  
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

-- STEP 2: Map order items to products using direct UPDATE with CASE
-- This avoids subquery issues by using CASE statements instead
UPDATE public.order_items 
SET product_id = CASE 
    WHEN product_name = 'Prep & Primer Bundle - Default' THEN (
        SELECT p.id FROM public.products p 
        WHERE p.name = 'Prep & Primer Bundle' 
        LIMIT 1
    )
    WHEN product_name = 'Core Acrylics - Default' THEN (
        SELECT p.id FROM public.products p 
        WHERE p.name = 'Core Acrylics' 
        LIMIT 1
    )
    WHEN product_name = 'Core Acrylics - Barely Blooming Nude (070)' THEN (
        SELECT p.id FROM public.products p 
        WHERE p.name = 'Core Acrylics - Barely Blooming Nude (070)' 
        LIMIT 1
    )
    WHEN product_name = 'Core Acrylics - Purely White (075)' THEN (
        SELECT p.id FROM public.products p 
        WHERE p.name = 'Core Acrylics - Purely White (075)' 
        LIMIT 1
    )
    WHEN product_name = 'Fairy Dust Top Coat - Default' THEN (
        -- Use the active Fairy Dust Top Coat with SKU
        SELECT p.id FROM public.products p 
        WHERE p.name = 'Fairy Dust Top Coat' 
        AND p.is_active = true 
        AND p.sku IS NOT NULL
        LIMIT 1
    )
    ELSE product_id
END
WHERE order_id IN (
    SELECT id FROM public.orders 
    WHERE order_number = 'BL-19AC4799411' 
       OR m_payment_id = 'BL-19AC4799411'
       OR id = 'BL-19AC4799411'
) 
AND product_id IS NULL;

-- STEP 3: Verify the fix worked
SELECT 'VERIFICATION: Order Items After Fix' as result,
       oi.id as order_item_id,
       oi.product_name,
       oi.quantity,
       oi.product_id,
       CASE WHEN p.name IS NOT NULL THEN 'SUCCESS' ELSE 'STILL NULL' END as mapping_status,
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