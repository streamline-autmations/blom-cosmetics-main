-- ================================================
-- QUICK FIX: update_order_status Type Mismatch
-- Based on codebase analysis: orders.id is TEXT, not UUID
-- ================================================

-- Step 1: Verify orders.id type
SELECT 
    'orders.id type check' as check_name,
    data_type,
    udt_name,
    CASE 
        WHEN data_type = 'text' THEN '✅ Confirmed: TEXT type'
        WHEN data_type = 'uuid' THEN '⚠️ Unexpected: UUID type'
        ELSE '❓ Unknown: ' || data_type
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'orders' 
  AND column_name = 'id';

-- Step 2: Drop all existing update_order_status functions (if any exist)
DO $$
DECLARE
    func_record record;
BEGIN
    -- Find and drop all update_order_status functions
    FOR func_record IN 
        SELECT oid, proname, pg_get_function_identity_arguments(oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'update_order_status'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.update_order_status(%s) CASCADE', func_record.args);
        RAISE NOTICE 'Dropped function: update_order_status(%)', func_record.args;
    END LOOP;
END $$;

-- Step 3: Create fixed function with TEXT parameter
CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id TEXT,  -- FIXED: TEXT instead of UUID
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
    -- Get current order (using TEXT comparison)
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
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

    -- Validate status
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

    -- Update order
    UPDATE public.orders
    SET 
        status = p_status,
        updated_at = COALESCE(p_updated_at, now())
    WHERE id = p_order_id;

    -- Auto-update payment_status if status is 'paid'
    IF p_status = 'paid' THEN
        UPDATE public.orders
        SET 
            payment_status = 'paid',
            paid_at = COALESCE(p_updated_at, now())
        WHERE id = p_order_id;
    END IF;

    RETURN QUERY SELECT 
        true,
        p_order_id,
        v_order.order_number,
        v_old_status,
        p_status,
        format('Order %s status updated: %s → %s', v_order.order_number, v_old_status, p_status);
END;
$$;

-- Step 4: Create UUID overload for backward compatibility
CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id UUID,
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
    -- Convert UUID to TEXT and delegate to main function
    RETURN QUERY
    SELECT * FROM public.update_order_status(p_order_id::text, p_status, p_updated_at);
END;
$$;

-- Step 5: Grant permissions (only on full signatures with all parameters)
GRANT EXECUTE ON FUNCTION public.update_order_status(TEXT, TEXT, TIMESTAMPTZ) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT, TIMESTAMPTZ) TO service_role, authenticated;

-- Step 6: Verify function creation
SELECT 
    'Function created' as status,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'update_order_status'
ORDER BY arguments;

-- ================================================
-- TEST (Uncomment and replace with real order ID)
-- ================================================

-- Test with TEXT ID:
-- SELECT * FROM public.update_order_status('9f9e0f93-e380-4756-ae78-ff08a22cc7c9', 'paid');

-- Test with UUID (auto-converts):
-- SELECT * FROM public.update_order_status('9f9e0f93-e380-4756-ae78-ff08a22cc7c9'::uuid, 'paid');

