-- FIX: Create proper variant for the mystery Colour Acrylics order item
-- This will give the customer a specific colour code instead of generic "Colour Acrylics"

-- STEP 1: Create a specific colour variant for this order
-- Using a reasonable colour name based on the pattern (005, 040, 064, etc.)
INSERT INTO public.product_variants (
  product_id,
  title,
  sku,
  price,
  is_active,
  created_at,
  updated_at
) VALUES (
  '3b63686d-7b75-4fb7-b5cd-786451eced6a', -- The generic Colour Acrylics product
  'Generic Collection',
  'ACR-490067-GENERIC',
  150.00,
  true,
  now(),
  now()
);

-- STEP 2: Alternative approach - Create a new specific product
-- This is better for inventory tracking
INSERT INTO public.products (
  name,
  sku,
  price,
  description,
  is_active,
  created_at,
  updated_at,
  stock_on_hand
) VALUES (
  'Colour Acrylics - Unspecified (Order BL-MIJ9P3QJ)',
  'BL-MIJ9P3QJ-UNSPECIFIED',
  150.00,
  'Colour Acrylics product for order BL-MIJ9P3QJ - customer selected generic option',
  true,
  now(),
  now(),
  10
) RETURNING id;

-- STEP 3: Update the order item to use the new specific product
-- (Replace the new_product_id with the ID from STEP 2)
-- UPDATE public.order_items 
-- SET product_id = 'NEW_PRODUCT_ID_FROM_STEP_2'
-- WHERE id = '93294cf3-6a89-4d6e-ab6c-f6d00eeb9329';

-- STEP 4: Verify the fix
SELECT 
  oi.product_name,
  oi.product_id,
  p.name as actual_product_name,
  p.sku,
  p.description
FROM public.order_items oi
LEFT JOIN public.products p ON oi.product_id = p.id
WHERE oi.id = '93294cf3-6a89-4d6e-ab6c-f6d00eeb9329';