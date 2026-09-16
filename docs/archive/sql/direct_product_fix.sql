-- DIRECT PRODUCT MAPPING USING YOUR ACTUAL CATALOG
-- Map your order items to existing products or create missing ones

-- STEP 1: Create the missing products first
INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
VALUES 
-- Create Prep & Primer Bundle
(gen_random_uuid(), 'Prep & Primer Bundle', 'BUNDLE-PREP-PRIMER-001', 370.00, 'Prep & Primer Bundle', true, now(), now())
-- Create Core Acrylics Barely Blooming Nude (070)  
,(gen_random_uuid(), 'Core Acrylics - Barely Blooming Nude (070)', 'ACR-NUDE-070', 320.00, 'Core Acrylics Barely Blooming Nude', true, now(), now())
-- Create Core Acrylics Purely White (075)
,(gen_random_uuid(), 'Core Acrylics - Purely White (075)', 'ACR-WHITE-075', 320.00, 'Core Acrylics Purely White', true, now(), now())
ON CONFLICT (name) DO NOTHING;

-- STEP 2: Get the newly created product IDs
WITH new_products AS (
    SELECT id, name 
    FROM public.products 
    WHERE name IN (
        'Prep & Primer Bundle',
        'Core Acrylics - Barely Blooming Nude (070)', 
        'Core Acrylics - Purely White (075)'
    )
)
-- STEP 3: Now map all order items to products
UPDATE public.order_items 
SET product_id = CASE 
    -- Map to your existing Core Acrylics product
    WHEN product_name = 'Core Acrylics - Default' THEN '7bfc85b3-261e-4d21-be09-b55ab2967e56'::uuid
    -- Map to newly created Prep & Primer Bundle
    WHEN product_name = 'Prep & Primer Bundle - Default' THEN (SELECT id FROM new_products WHERE name = 'Prep & Primer Bundle')
    -- Map to newly created Core Acrylics Barely Blooming Nude (070)
    WHEN product_name = 'Core Acrylics - Barely Blooming Nude (070)' THEN (SELECT id FROM new_products WHERE name = 'Core Acrylics - Barely Blooming Nude (070)')
    -- Map to newly created Core Acrylics Purely White (075)  
    WHEN product_name = 'Core Acrylics - Purely White (075)' THEN (SELECT id FROM new_products WHERE name = 'Core Acrylics - Purely White (075)')
    -- Map to your existing Fairy Dust Top Coat product
    WHEN product_name = 'Fairy Dust Top Coat - Default' THEN '23277fea-c7dc-4cbe-8efe-7f5b58718f81'::uuid
    ELSE product_id
END
WHERE order_id IN (
    SELECT id FROM public.orders 
    WHERE order_number = 'BL-19AC4799411' 
       OR m_payment_id = 'BL-19AC4799411'
       OR id = 'BL-19AC4799411'
) 
AND product_id IS NULL;

-- STEP 4: Verify the fix worked
SELECT 
    oi.id as order_item_id,
    oi.product_name,
    oi.product_id,
    p.name as mapped_product_name,
    p.sku as mapped_product_sku,
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