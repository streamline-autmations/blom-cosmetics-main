-- TEST: Manually create a Beauty Club coupon to debug the process

-- 1. First, test the function directly
SELECT public.create_beauty_club_welcome_coupon('test@example.com');

-- 2. If that works, check what was created
SELECT 
    code,
    type,
    value,
    percent,
    locked_email,
    CASE 
        WHEN excluded_product_ids IS NULL THEN 'NO EXCLUSIONS'
        WHEN cardinality(excluded_product_ids) = 0 THEN 'EMPTY EXCLUSIONS'
        ELSE 'HAS ' || cardinality(excluded_product_ids) || ' EXCLUSIONS'
    END as exclusion_status
FROM public.coupons 
WHERE code LIKE 'BLOMC%'
ORDER BY created_at DESC
LIMIT 3;

-- 3. If exclusions were created, let's see the actual product count
SELECT cardinality(excluded_product_ids) as excluded_count
FROM public.coupons 
WHERE code LIKE 'BLOMC%'
ORDER BY created_at DESC
LIMIT 1;
