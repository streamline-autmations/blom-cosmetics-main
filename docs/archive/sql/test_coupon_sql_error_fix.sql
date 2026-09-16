-- ================================================
-- TEST SQL ERROR FIX - VERIFY COUPON WORKS
-- ================================================

-- 1. Test the redeem_coupon function with minimal parameters
SELECT 'Testing coupon function...' as test_step;

-- This should work without the "set-returning functions are not allowed in WHERE" error
SELECT valid, 
       message, 
       discount_cents/100.0 as discount_rands,
       discount_type
FROM public.redeem_coupon('TEST', 'test@example.com', 100000, '[]'::jsonb)
LIMIT 1;

-- 2. Test with a specific code that exists in the database
-- Replace 'YOUR_EXISTING_COUPON' with an actual coupon code from your database
-- SELECT valid, message, discount_cents/100.0 as discount_rands
-- FROM public.redeem_coupon('YOUR_EXISTING_COUPON', 'test@example.com', 100000, '[]'::jsonb);

-- 3. Check that no SQL errors occurred
SELECT '✅ If you see valid=true above, the SQL error is fixed!' as result;