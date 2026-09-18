-- COMPLETE PRODUCT ID FIX for order
-- Order ID: 9f9e0f93-e380-4756-ae78-ff08a22cc7c9

-- Check what products currently exist in your catalog
SELECT 
    'Existing Products' as info,
    id,
    name,
    sku,
    price,
    is_active
FROM public.products 
WHERE is_active = true
ORDER BY name
LIMIT 10;

-- Now map order items to the correct products based on product names
UPDATE public.order_items 
SET product_id = CASE 
    WHEN product_name LIKE '%Core Acrylics%' THEN (SELECT id FROM public.products WHERE name LIKE '%Core Acrylics%' AND is_active = true LIMIT 1)
    WHEN product_name LIKE '%Glitter Acrylic%' THEN (SELECT id FROM public.products WHERE name LIKE '%Glitter%' AND is_active = true LIMIT 1)
    WHEN product_name LIKE '%Colour Acrylics%' THEN (SELECT id FROM public.products WHERE name LIKE '%Colour Acrylics%' AND is_active = true LIMIT 1)
    WHEN product_name LIKE '%Nail Liquid%' THEN (SELECT id FROM public.products WHERE name LIKE '%Nail Liquid%' AND is_active = true LIMIT 1)
    WHEN product_name LIKE '%Prep & Primer%' THEN (SELECT id FROM public.products WHERE name LIKE '%Prep & Primer%' AND is_active = true LIMIT 1)
    WHEN product_name LIKE '%Nail File%' THEN (SELECT id FROM public.products WHERE name LIKE '%Nail File%' AND is_active = true LIMIT 1)
    WHEN product_name LIKE '%Cuticle Oil%' THEN (SELECT id FROM public.products WHERE name LIKE '%Cuticle Oil%' AND is_active = true LIMIT 1)
    WHEN product_name LIKE '%Top Coat%' THEN (SELECT id FROM public.products WHERE name LIKE '%Top Coat%' AND is_active = true LIMIT 1)
    ELSE product_id  -- Keep existing if no match found
END
WHERE order_id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9';

-- Mark the order as paid
UPDATE public.orders 
SET 
    status = 'paid',
    payment_status = 'paid',
    paid_at = NOW()
WHERE id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9';

-- Verify the mapping and payment
SELECT 
    'Order Status' as result,
    id,
    order_number,
    status,
    payment_status,
    paid_at
FROM public.orders 
WHERE id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'

UNION ALL

SELECT 
    'Product Mapping' as result,
    oi.product_id::text,
    oi.product_name,
    'MAPPED TO: ' || p.name,
    '',
    ''
FROM public.order_items oi
LEFT JOIN public.products p ON oi.product_id = p.id
WHERE oi.order_id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9';