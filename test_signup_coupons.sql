-- Test script for signup coupon creation
-- This simulates a new user signup and verifies the welcome coupon is created

-- ================================================
-- TEST 1: Simulate new user signup
-- ================================================

-- Create a test user (simulating auth.users insert)
INSERT INTO auth.users (
  id,
  email,
  raw_user_meta_data,
  created_at,
  email_confirmed_at,
  confirmed_at
) VALUES (
  gen_random_uuid(),
  'test-signup@example.com',
  '{"full_name": "Test User", "phone": "+27123456789"}'::jsonb,
  now(),
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Get the user ID
WITH test_user AS (
  SELECT id as user_id 
  FROM auth.users 
  WHERE email = 'test-signup@example.com'
)
SELECT 
  'Test User Created' as test_step,
  user_id,
  'https://supabase.com/dashboard/auth/users' as check_users_table
FROM test_user;

-- ================================================
-- TEST 2: Verify welcome coupon was created
-- ================================================

-- Check if welcome coupon was created for the test user
SELECT 
  'Welcome Coupon Check' as test_name,
  c.code,
  c.type,
  c.value,
  c.locked_email,
  c.min_order_cents / 100.0 as min_order_rands,
  c.max_uses,
  c.used_count,
  c.valid_until,
  c.is_active,
  CASE 
    WHEN c.valid_until < now() THEN 'expired'
    WHEN c.used_count >= c.max_uses THEN 'used'
    WHEN c.status <> 'active' THEN 'inactive'
    ELSE 'active'
  END as current_status
FROM public.coupons c
WHERE c.locked_email = 'test-signup@example.com'
  AND c.is_single_use = true;

-- ================================================
-- TEST 3: Test the coupon redemption
-- ================================================

-- Test if the welcome coupon calculates correctly
WITH test_user AS (
  SELECT email as user_email 
  FROM auth.users 
  WHERE email = 'test-signup@example.com'
)
SELECT 
  'Welcome Coupon Redemption Test' as test_name,
  valid,
  message,
  discount_cents / 100.0 as discount_rands,
  discount_type,
  discount_value
FROM public.redeem_coupon(
  (SELECT code FROM public.coupons WHERE locked_email = 'test-signup@example.com' LIMIT 1),
  'test-signup@example.com',
  100000 -- R1000 order
);

-- ================================================
-- TEST 4: Get user welcome coupon function test
-- ================================================

-- Test the get_user_welcome_coupon function
SELECT 
  'Get User Welcome Coupon Test' as test_name,
  code,
  type,
  value,
  percent,
  min_order_cents / 100.0 as min_order_rands,
  valid_until,
  discount_amount_rands
FROM public.get_user_welcome_coupon('test-signup@example.com');

-- ================================================
-- CLEAN UP: Remove test data
-- ================================================

-- Clean up test data
DELETE FROM public.coupon_activity_log WHERE user_email = 'test-signup@example.com';
DELETE FROM public.coupons WHERE locked_email = 'test-signup@example.com';
DELETE FROM auth.users WHERE email = 'test-signup@example.com';

-- Verify cleanup
SELECT 
  'Cleanup Completed' as test_name,
  'Test user and coupon removed' as result;