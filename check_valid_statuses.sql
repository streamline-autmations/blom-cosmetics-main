-- Check what status values are actually used in your database
SELECT DISTINCT 
    status,
    COUNT(*) as count
FROM public.orders
GROUP BY status
ORDER BY count DESC;

-- Check if there are any constraints on status values
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%status%'
  AND constraint_schema = 'public';

