-- INVESTIGATE: Colour Acrylics product without variant code
-- This helps identify the mystery "Colour Acrylics" item

-- 1. Find the specific order item that has "Colour Acrylics" without code
SELECT 
  oi.id as order_item_id,
  oi.product_name,
  oi.product_id,
  oi.sku,
  oi.unit_price,
  oi.quantity,
  o.order_number,
  o.m_payment_id
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
WHERE o.order_number = 'BL-MIJ9P3QJ'
  AND oi.product_name LIKE 'Colour Acrylics'
  AND (oi.sku IS NULL OR oi.sku = '' OR oi.product_name = 'Colour Acrylics')
ORDER BY oi.created_at;

-- 2. Check the actual product that was mapped to this item
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.sku,
  p.description,
  p.stock_on_hand,
  p.is_active,
  p.created_at,
  p.updated_at,
  -- Check if this product has variants
  (SELECT COUNT(*) FROM public.product_variants WHERE product_id = p.id) as variant_count,
  -- Check if it has any variant information
  (SELECT json_agg(
    json_build_object(
      'variant_id', pv.id,
      'title', pv.title,
      'sku', pv.sku,
      'price', pv.price
    )
  ) FROM public.product_variants pv WHERE pv.product_id = p.id) as variants
FROM public.products p
WHERE p.id IN (
  SELECT DISTINCT product_id 
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.order_number = 'BL-MIJ9P3QJ'
    AND oi.product_name LIKE 'Colour Acrylics'
    AND (oi.sku IS NULL OR oi.sku = '' OR oi.product_name = 'Colour Acrylics')
);

-- 3. Find all Colour Acrylics products to compare
SELECT 
  p.id,
  p.name as product_name,
  p.sku,
  p.price,
  p.stock_on_hand,
  p.is_active,
  (SELECT COUNT(*) FROM public.product_variants WHERE product_id = p.id) as variant_count
FROM public.products p
WHERE p.name LIKE '%Colour Acrylics%'
ORDER BY p.name;

-- 4. Check what the original order intended (from order_items that have specific codes)
SELECT 
  DISTINCT 
  LEFT(oi.product_name, 20) as product_base_name,
  COUNT(*) as count
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
WHERE o.order_number = 'BL-MIJ9P3QJ'
  AND oi.product_name LIKE '%Colour Acrylics%'
  AND oi.product_name != 'Colour Acrylics'
GROUP BY LEFT(oi.product_name, 20);