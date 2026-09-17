-- ================================================
-- FIX: update_order_status Function Type Mismatch
-- Problem: Function expects UUID but orders.id is TEXT
-- Solution: Recreate function with TEXT parameter
-- ================================================

-- Step 1: Drop existing function with all possible signatures
DROP FUNCTION IF EXISTS public.update_order_status(UUID, TEXT, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS public.update_order_status(TEXT, TEXT, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS public.update_order_status(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_order_status(TEXT, TEXT) CASCADE;

-- Step 2: Create corrected function with TEXT parameter
CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id TEXT,  -- FIXED: Changed from UUID to TEXT
    p_status TEXT,
    p_updated_at TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
    success boolean,
    order_id text,
    order_number text,
    old_status text,
    new_status text,
    message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order record;
    v_old_status text;
BEGIN
    -- Get current order
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id  -- Direct text comparison
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            false,
            p_order_id,
            NULL::text,
            NULL::text,
            NULL::text,
            format('Order not found: %s', p_order_id);
        RETURN;
    END IF;

    v_old_status := v_order.status;

    -- Validate status value
    IF p_status NOT IN ('pending', 'placed', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded') THEN
        RETURN QUERY SELECT 
            false,
            p_order_id,
            v_order.order_number,
            v_old_status,
            p_status,
            format('Invalid status: %s', p_status);
        RETURN;
    END IF;

    -- Update order status
    UPDATE public.orders
    SET 
        status = p_status,
        updated_at = COALESCE(p_updated_at, now())
    WHERE id = p_order_id;  -- Direct text comparison

    -- If status is 'paid', also update payment_status
    IF p_status = 'paid' THEN
        UPDATE public.orders
        SET 
            payment_status = 'paid',
            paid_at = COALESCE(p_updated_at, now())
        WHERE id = p_order_id;
    END IF;

    -- Return success
    RETURN QUERY SELECT 
        true,
        p_order_id,
        v_order.order_number,
        v_old_status,
        p_status,
        format('Order status updated from %s to %s', v_old_status, p_status);
END;
$$;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.update_order_status(TEXT, TEXT, TIMESTAMPTZ) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_status(TEXT, TEXT) TO service_role, authenticated;

-- Step 4: Test the function
-- Test with a real order ID (replace with actual order ID from your database)
DO $$
DECLARE
    test_order_id text;
    test_result record;
BEGIN
    -- Get a sample order ID
    SELECT id INTO test_order_id
    FROM public.orders
    ORDER BY created_at DESC
    LIMIT 1;

    IF test_order_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with order ID: %', test_order_id;
        
        -- Test the function
        SELECT * INTO test_result
        FROM public.update_order_status(test_order_id, 'paid');
        
        RAISE NOTICE 'Test result: success=%, message=%', test_result.success, test_result.message;
    ELSE
        RAISE NOTICE 'No orders found for testing';
    END IF;
END $$;

-- Step 5: Create alternative function for UUID input (if needed for backward compatibility)
-- This function accepts UUID but converts to TEXT internally
CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id UUID,  -- Accept UUID for backward compatibility
    p_status TEXT,
    p_updated_at TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
    success boolean,
    order_id text,
    order_number text,
    old_status text,
    new_status text,
    message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Convert UUID to TEXT and call the main function
    RETURN QUERY
    SELECT * FROM public.update_order_status(p_order_id::text, p_status, p_updated_at);
END;
$$;

-- Grant permissions for UUID version
GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT, TIMESTAMPTZ) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT) TO service_role, authenticated;

-- ================================================
-- VERIFICATION
-- ================================================

-- Verify function was created
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'update_order_status'
ORDER BY p.proname, arguments;

-- ================================================
-- USAGE EXAMPLES
-- ================================================

-- Example 1: Update order status using TEXT ID
-- SELECT * FROM public.update_order_status('9f9e0f93-e380-4756-ae78-ff08a22cc7c9', 'paid');

-- Example 2: Update order status using UUID (auto-converts to TEXT)
-- SELECT * FROM public.update_order_status('9f9e0f93-e380-4756-ae78-ff08a22cc7c9'::uuid, 'paid');

-- Example 3: Update order status with custom timestamp
-- SELECT * FROM public.update_order_status('9f9e0f93-e380-4756-ae78-ff08a22cc7c9', 'paid', '2025-01-15 10:00:00'::timestamptz);

