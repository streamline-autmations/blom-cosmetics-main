-- ================================================
-- SUPABASE DATABASE DIAGNOSTIC ANALYSIS
-- Purpose: Identify text = uuid type mismatch error
-- ================================================

-- ================================================
-- 1. SCHEMA ANALYSIS - Orders Table
-- ================================================

-- Check the exact schema of the orders table
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'orders' 
ORDER BY ordinal_position;

-- Specifically check the id column type
SELECT 
    column_name, 
    data_type,
    udt_name,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'orders' 
  AND column_name = 'id';

-- ================================================
-- 2. CURRENT RPC FUNCTION ANALYSIS
-- ================================================

-- Check if update_order_status function exists and its definition
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    p.prosrc as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'update_order_status';

-- Check ALL functions that might update order status
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (p.proname LIKE '%order%status%' OR p.proname LIKE '%update%order%')
ORDER BY p.proname;

-- ================================================
-- 3. SAMPLE DATA VERIFICATION
-- ================================================

-- Check sample orders to understand data types
SELECT 
    id, 
    order_number,
    status, 
    created_at,
    pg_typeof(id) as id_type,
    pg_typeof(status) as status_type,
    length(id::text) as id_length
FROM public.orders 
ORDER BY created_at DESC
LIMIT 5;

-- Check the specific test order mentioned in the error
SELECT 
    id, 
    order_number,
    status,
    payment_status,
    pg_typeof(id) as id_type,
    length(id::text) as id_length,
    CASE 
        WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' 
        THEN 'Valid UUID format'
        ELSE 'Not UUID format'
    END as uuid_format_check
FROM public.orders 
WHERE id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'
   OR id::text = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'
   OR order_number = 'BL-19AC4799411';

-- ================================================
-- 4. FUNCTION PERMISSIONS
-- ================================================

-- Check function permissions and security settings (compatible version)
SELECT 
    p.proname as function_name,
    r.rolname as owner,
    CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type,
    p.proacl::text as permissions_acl
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_roles r ON p.proowner = r.oid
WHERE n.nspname = 'public'
  AND p.proname = 'update_order_status';

-- ================================================
-- 5. TYPE CASTING TEST
-- ================================================

-- Test if the specific UUID casting works
SELECT 
    '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'::UUID as casted_uuid,
    pg_typeof('9f9e0f93-e380-4756-ae78-ff08a22cc7c9'::UUID) as casted_type;

-- Test comparison that should work if id is TEXT
SELECT 
    o.id,
    '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'::text as test_text,
    o.id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'::text as text_comparison_result,
    o.id::text = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'::text as explicit_text_comparison
FROM public.orders o 
WHERE o.id::text = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'
LIMIT 1;

-- Test comparison that should work if id is UUID
SELECT 
    o.id,
    '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'::uuid as test_uuid,
    o.id::uuid = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'::uuid as uuid_comparison_result
FROM public.orders o 
WHERE o.id::text = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'
LIMIT 1;

-- ================================================
-- 6. FUNCTION EXECUTION TEST
-- ================================================

-- Create a simple test function to isolate the issue
CREATE OR REPLACE FUNCTION test_uuid_comparison(
    test_id TEXT
)
RETURNS TABLE (
    found boolean,
    order_id text,
    order_number text,
    status text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS(SELECT 1 FROM public.orders WHERE id = test_id) as found,
        o.id,
        o.order_number,
        o.status
    FROM public.orders o
    WHERE o.id = test_id
    LIMIT 1;
END $$;

-- Test the problematic comparison
SELECT * FROM test_uuid_comparison('9f9e0f93-e380-4756-ae78-ff08a22cc7c9');

-- ================================================
-- 7. DROP AND RECREATE TEST
-- ================================================

-- Drop the current function completely (if it exists)
DROP FUNCTION IF EXISTS public.update_order_status(UUID, TEXT, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS public.update_order_status(TEXT, TEXT, TIMESTAMPTZ) CASCADE;

-- Create a minimal test function to verify the basic pattern works with TEXT
CREATE OR REPLACE FUNCTION test_order_lookup(
    p_order_id TEXT
)
RETURNS TABLE (
    order_id text,
    order_number text,
    status text,
    payment_status text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.order_number,
        o.status,
        o.payment_status
    FROM public.orders o
    WHERE o.id = p_order_id;
END $$;

-- Test with a real order ID
SELECT * FROM test_order_lookup('9f9e0f93-e380-4756-ae78-ff08a22cc7c9');

-- ================================================
-- 8. CHECK ORDER_ITEMS TABLE FOR TYPE MISMATCH
-- ================================================

-- Check order_items.order_id type
SELECT 
    column_name, 
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'order_items' 
  AND column_name = 'order_id';

-- Check if there are any foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND (tc.table_name = 'orders' OR tc.table_name = 'order_items')
ORDER BY tc.table_name, tc.constraint_name;

-- ================================================
-- 9. SUMMARY REPORT
-- ================================================

-- Generate a summary of findings
SELECT 
    'Orders Table ID Type' as check_name,
    data_type as result,
    CASE 
        WHEN data_type = 'text' THEN '✅ Expected for order IDs'
        WHEN data_type = 'uuid' THEN '⚠️ May cause type mismatch'
        ELSE '❓ Unknown type'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'orders' 
  AND column_name = 'id'

UNION ALL

SELECT 
    'Order Items order_id Type' as check_name,
    data_type as result,
    CASE 
        WHEN data_type = 'text' THEN '✅ Matches orders.id'
        WHEN data_type = 'uuid' THEN '⚠️ Type mismatch with orders.id'
        ELSE '❓ Unknown type'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'order_items' 
  AND column_name = 'order_id'

UNION ALL

SELECT 
    'update_order_status Function Exists' as check_name,
    CASE WHEN COUNT(*) > 0 THEN 'Yes' ELSE 'No' END as result,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Function found'
        ELSE '⚠️ Function not found'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'update_order_status';

