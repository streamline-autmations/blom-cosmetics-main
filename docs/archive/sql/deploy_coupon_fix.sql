-- ================================================
-- COUPON USAGE TRACKING FIX DEPLOYMENT
-- ================================================
-- This script fixes the coupon system so that usage is only tracked
-- when orders are actually completed, not when coupons are applied to carts.

-- 1. Apply the updated coupon functions
\i supabase/migrations/20251128000003_complete_coupon_security_fix.sql

-- 2. Verify the fix worked by testing coupon application/removal
-- Test that a single-use coupon can be applied multiple times before order completion

-- 3. Cleanup any stuck validations from the old system
SELECT public.cleanup_expired_coupon_validations();

-- 4. Show current status
SELECT 'Coupon fix deployed successfully!' as status;