-- Step 1: First, let's see what products actually exist in your catalog
SELECT id, name, sku, price 
FROM public.products 
WHERE name ILIKE '%prep%' 
   OR name ILIKE '%primer%'
   OR name ILIKE '%bundle%'
ORDER BY name;

-- Step 2: Find acrylic products
SELECT id, name, sku, price 
FROM public.products 
WHERE name ILIKE '%acrylic%'
   OR name ILIKE '%white%'
   OR name ILIKE '%nude%'
ORDER BY name;

-- Step 3: Find top coat products
SELECT id, name, sku, price 
FROM public.products 
WHERE name ILIKE '%top%coat%'
   OR name ILIKE '%fairy%dust%'
ORDER BY name;

-- Step 4: Manual mapping based on product names
-- Update each order item with the correct product_id
-- You'll need to replace the product_id values with the actual IDs from steps 1-3 above

-- Example mappings (replace with actual IDs from your products table):
-- Prep & Primer Bundle - Default -> [Find actual bundle product ID]
-- Core Acrylics - Default -> [Find actual core acrylics product ID] 
-- Core Acrylics - Barely Blooming Nude (070) -> [Find actual nude acrylic product ID]
-- Core Acrylics - Purely White (075) -> [Find actual white acrylic product ID]
-- Fairy Dust Top Coat - Default -> [Find actual top coat product ID]

-- Once you have the actual product IDs, use these UPDATE statements:
-- UPDATE public.order_items 
-- SET product_id = 'actual-product-id-here'
-- WHERE id = '8e892475-516d-45b3-8b81-91584c9e3d92'; -- Prep & Primer Bundle

-- UPDATE public.order_items 
-- SET product_id = 'actual-product-id-here'
-- WHERE id = 'f8dabfb3-1513-4d7b-b784-3d7ef0dfec0a'; -- Core Acrylics - Default

-- UPDATE public.order_items 
-- SET product_id = 'actual-product-id-here'
-- WHERE id = 'b1628314-caba-4be6-8284-5893a012279e'; -- Core Acrylics - Barely Blooming Nude (070)

-- UPDATE public.order_items 
-- SET product_id = 'actual-product-id-here'
-- WHERE id = '816bf409-a54b-4cbd-8d66-a194bccde3e6'; -- Core Acrylics - Purely White (075)

-- UPDATE public.order_items 
-- SET product_id = 'actual-product-id-here'
-- WHERE id = 'a07280e5-c238-4d38-8f3d-40c810d1eba2'; -- Fairy Dust Top Coat - Default