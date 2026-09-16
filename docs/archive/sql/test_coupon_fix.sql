-- ================================================
-- TEST COUPON FIX - VERIFICATION SCRIPT
-- ================================================
-- This script tests that the coupon system allows reapplication
-- while properly tracking usage only when orders are completed.

-- 1. Clean up any existing test data
SELECT public.cleanup_expired_coupon_validations();

-- 2. Test coupon application (should work)
SELECT 'Test 1: First coupon application' as test_name, 
       valid, 
       message, 
       discount_cents/100.0 as discount_rands,
       validation_token IS NOT NULL as has_token
FROM public.redeem_coupon('TEST-DISCOUNT', 'test@example.com', 100000, '[]'::jsonb);

-- 3. Get the validation token from test 1
-- (You'll need to manually extract this or run the query above and copy the token)
-- Let's simulate by using a new token for test 2

-- 4. Test reapplication with same email (should work now - old validation gets cleaned up)
SELECT 'Test 2: Reapply same coupon' as test_name, 
       valid, 
       message, 
       discount_cents/100.0 as discount_rands,
       'Should work - old validation cleaned up' as expected
FROM public.redeem_coupon('TEST-DISCOUNT', 'test@example.com', 100000, '[]'::jsonb);

-- 5. Check that no usage count increment happened yet
SELECT 'Test 3: Check used_count before completion' as test_name,
       used_count,
       'Should be 0 or unchanged' as expected
FROM public.coupons 
WHERE code = 'TEST-DISCOUNT';

-- 6. Simulate order completion
-- (In real flow, this happens when create-order function is called)
-- Use the validation token from test 2
-- SELECT public.mark_coupon_validation_completed('your-validation-token-here', gen_random_uuid());

-- 7. Check that usage count incremented after completion
-- SELECT 'Test 4: Check used_count after completion' as test_name,
--        used_count,
--        'Should be incremented by 1' as expected
-- FROM public.coupons 
-- WHERE code = 'TEST-DISCOUNT';

-- 8. Try to apply again (should fail now)
-- SELECT 'Test 5: Try to apply after completion' as test_name,
--        valid,
--        message,
--        'Should fail - already used' as expected
-- FROM public.redeem_coupon('TEST-DISCOUNT', 'test@example.com', 100000, '[]'::jsonb);

-- Clean up test data
-- DELETE FROM public.coupon_validations WHERE email = 'test@example.com';
-- UPDATE public.coupons SET used_count = 0 WHERE code = 'TEST-DISCOUNT';

SELECT 'Coupon fix test completed!' as status;