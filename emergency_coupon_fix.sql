-- ================================================
-- EMERGENCY COUPON FIX - IMMEDIATE DEPLOYMENT
-- ================================================
-- This is the fixed version with ambiguous column references resolved

-- 1. Apply the corrected migration
\i supabase/migrations/20251128000003_complete_coupon_security_fix.sql

-- 2. Quick test to verify it works
SELECT 'Testing coupon application...' as status;

SELECT valid, 
       message, 
       discount_cents/100.0 as discount_rands,
       validation_token IS NOT NULL as has_token
FROM public.redeem_coupon('TEST', 'test@example.com', 100000, '[]'::jsonb)
LIMIT 1;

SELECT 'If you see valid=true above, the fix is working!' as result;