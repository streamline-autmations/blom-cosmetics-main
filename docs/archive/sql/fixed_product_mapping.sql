-- FIXED VERSION - Handles duplicate product names properly
-- The subquery error means there are duplicate product names

-- STEP 1: Check for duplicate products in your catalog
SELECT name, COUNT(*) as duplicate_count, 
       STRING_AGG(id::text, ', ') as product_ids
FROM public.products 
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- STEP 2: Get unique product IDs for each product name (prefer active products with SKU)
WITH product_mapping AS (
    SELECT DISTINCT name, 
           -- Prefer active products with non-null SKU, fallback to any product
           FIRST_VALUE(id) OVER (PARTITION BY name ORDER BY 
               CASE WHEN is_active = true THEN 1 ELSE 2 END,
               CASE WHEN sku IS NOT NULL THEN 1 ELSE 2 END,
               created_at DESC
           ) as product_id
    FROM public.products 
    WHERE name IN (
        'Prep & Primer Bundle',
        'Core Acrylics - Barely Blooming Nude (070)', 
        'Core Acrylics - Purely White (075)',
        'Core Acrylics',
        'Fairy Dust Top Coat'
    )
)
-- STEP 3: Update order items using the mapped product IDs
UPDATE public.order_items 
SET product_id = pm.product_id
FROM product_mapping pm
WHERE (
    (order_items.product_name = 'Prep & Primer Bundle - Default' AND pm.name = 'Prep & Primer Bundle')
    OR (order_items.product_name = 'Core Acrylics - Default' AND pm.name = 'Core Acrylics')
    OR (order_items.product_name = 'Core Acrylics - Barely Blooming Nude (070)' AND pm.name = 'Core Acrylics - Barely Blooming Nude (070)')
    OR (order_items.product_name = 'Core Acrylics - Purely White (075)' AND pm.name = 'Core Acrylics - Purely White (075)')
    OR (order_items.product_name = 'Fairy Dust Top Coat - Default' AND pm.name = 'Fairy Dust Top Coat')
)
AND order_id IN (
    SELECT id FROM public.orders 
    WHERE order_number = 'BL-19AC4799411' 
       OR m_payment_id = 'BL-19AC4799411'
       OR id = 'BL-19AC4799411'
) 
AND order_items.product_id IS NULL;

-- STEP 4: Show the final mapping results
SELECT 'FINAL MAPPING RESULTS' as info,
       oi.id as order_item_id,
       oi.product_name,
       oi.quantity,
       oi.product_id,
       p.name as mapped_product_name,
       p.sku as product_sku,
       p.price as product_price,
       p.is_active as product_active
FROM public.order_items oi
LEFT JOIN public.products p ON oi.product_id = p.id
WHERE oi.order_id IN (
    SELECT id FROM public.orders 
    WHERE order_number = 'BL-19AC4799411' 
       OR m_payment_id = 'BL-19AC4799411'
       OR id = 'BL-19AC4799411'
)
ORDER BY oi.product_name;