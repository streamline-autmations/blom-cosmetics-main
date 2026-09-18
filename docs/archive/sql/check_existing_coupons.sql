-- CHECK: Existing Beauty Club coupons from N8N workflow

-- 1. Check ALL coupons (not just BLOMC%)
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
    created_at
FROM public.coupons 
ORDER BY created_at DESC
LIMIT 10;

-- 2. Focus on recent coupons
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
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC;
