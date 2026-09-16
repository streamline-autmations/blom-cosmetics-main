-- SIMPLE DIAGNOSTIC: Focus on coupons table
-- Run each query separately in Supabase SQL Editor

-- QUERY 1: Just check the Beauty Club coupons
SELECT 
    code,
    locked_email,
    type,
    value,
    percent,
    CASE 
        WHEN excluded_product_ids IS NULL THEN 'NO EXCLUSIONS'
        WHEN cardinality(excluded_product_ids) = 0 THEN 'EMPTY EXCLUSIONS'
        ELSE 'HAS ' || cardinality(excluded_product_ids) || ' EXCLUSIONS'
    END as exclusion_status,
    CASE 
        WHEN included_product_ids IS NULL THEN 'NO INCLUSIONS'
        WHEN cardinality(included_product_ids) = 0 THEN 'EMPTY INCLUSIONS'
        ELSE 'HAS ' || cardinality(included_product_ids) || ' INCLUSIONS'
    END as inclusion_status
FROM public.coupons 
WHERE code LIKE 'BLOMC%'
ORDER BY created_at DESC
LIMIT 3;

-- QUERY 2: Check what columns actually exist in coupons table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'coupons' 
ORDER BY ordinal_position;

-- QUERY 3: Count products by category
SELECT 
    'Total Active Products' as category,
    COUNT(*) as count
FROM public.products 
WHERE is_active = true

UNION ALL

SELECT 
    'Acrylics/Brushes/Prep Products' as category,
    COUNT(*) as count
FROM public.products 
WHERE is_active = true 
    AND (
         name ILIKE '%Acrylic%' 
      OR name ILIKE '%Primer%'
      OR name ILIKE '%Prep%'
      OR name ILIKE '%Brush%'
      OR name ILIKE '%Top Coat%'
      OR name ILIKE '%Fairy Dust%'
    )

UNION ALL

SELECT 
    'Other Products (should be excluded)' as category,
    COUNT(*) as count
FROM public.products 
WHERE is_active = true 
    AND NOT (
         name ILIKE '%Acrylic%' 
      OR name ILIKE '%Primer%'
      OR name ILIKE '%Prep%'
      OR name ILIKE '%Brush%'
      OR name ILIKE '%Top Coat%'
      OR name ILIKE '%Fairy Dust%'
    );
