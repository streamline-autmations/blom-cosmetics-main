-- ================================================
-- DIAGNOSTIC SQL: Analyze Beauty Club Coupon System
-- ================================================

-- 1. Check existing Beauty Club coupons
SELECT 
    code,
    locked_email,
    type,
    value,
    percent,
    min_order_cents,
    valid_from,
    valid_until,
    status,
    is_active,
    is_single_use,
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
LIMIT 10;

-- 2. Check products and their names for matching logic
SELECT 
    id,
    name,
    is_active,
    CASE 
        WHEN name ILIKE '%Acrylic%' THEN 'SHOULD BE ALLOWED (Acrylic)'
        WHEN name ILIKE '%Primer%' THEN 'SHOULD BE ALLOWED (Primer)'
        WHEN name ILIKE '%Prep%' THEN 'SHOULD BE ALLOWED (Prep)'
        WHEN name ILIKE '%Brush%' THEN 'SHOULD BE ALLOWED (Brush)'
        WHEN name ILIKE '%Top Coat%' THEN 'SHOULD BE ALLOWED (Top Coat)'
        WHEN name ILIKE '%Fairy Dust%' THEN 'SHOULD BE ALLOWED (Fairy Dust)'
        ELSE 'SHOULD BE EXCLUDED'
    END as expected_behavior
FROM public.products 
WHERE is_active = true
ORDER BY name
LIMIT 20;

-- 3. Test the exclusion logic - what SHOULD be excluded
SELECT 
    'SHOULD BE EXCLUDED (not in allowlist)' as category,
    COUNT(*) as product_count
FROM public.products 
WHERE is_active = true 
    AND NOT (
         name ILIKE '%Acrylic%' 
      OR name ILIKE '%Primer%'
      OR name ILIKE '%Prep%'
      OR name ILIKE '%Brush%'
      OR name ILIKE '%Top Coat%'
      OR name ILIKE '%Fairy Dust%'
    )

UNION ALL

SELECT 
    'SHOULD BE ALLOWED (in allowlist)' as category,
    COUNT(*) as product_count
FROM public.products 
WHERE is_active = true 
    AND (
         name ILIKE '%Acrylic%' 
      OR name ILIKE '%Primer%'
      OR name ILIKE '%Prep%'
      OR name ILIKE '%Brush%'
      OR name ILIKE '%Top Coat%'
      OR name ILIKE '%Fairy Dust%'
    );

-- 4. Check if coupon validation function considers exclusions
-- Let's see what the redeem_coupon function expects
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'redeem_coupon' 
AND routine_type = 'FUNCTION';

-- 5. Get actual exclusion list from most recent Beauty Club coupon
SELECT 
    code,
    locked_email,
    cardinality(excluded_product_ids) as exclusion_count,
    excluded_product_ids[1:10] as first_10_excluded_ids -- Show first 10 for verification
FROM public.coupons 
WHERE code LIKE 'BLOMC%'
ORDER BY created_at DESC
LIMIT 1;
