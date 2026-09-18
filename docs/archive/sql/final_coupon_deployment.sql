-- ================================================
-- FINAL COUPON SYSTEM DEPLOYMENT - WORKING VERSION
-- ================================================

-- 1. Run the restore script to get working functions
\i restore_working_coupon_system.sql

-- 2. Quick verification test
SELECT 'Testing coupon validation...' as test_step;

-- Test with a simple coupon (should work without errors)
SELECT valid, 
       message, 
       discount_cents/100.0 as discount_rands,
       discount_type
FROM public.redeem_coupon('TEST', 'test@example.com', 100000)
LIMIT 1;

-- 3. Check function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('redeem_coupon', 'mark_coupon_used');

SELECT '✅ Coupon system restored and ready for testing!' as status;