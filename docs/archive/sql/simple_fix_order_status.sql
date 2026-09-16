-- ================================================
-- SIMPLE FIX: update_order_status Function
-- Fixes text = uuid type mismatch error
-- ================================================

-- Step 1: Check orders.id type
SELECT 
    'orders.id type' as check_name,
    data_type,
    CASE 
        WHEN data_type = 'text' THEN '✅ TEXT - Function will use TEXT parameter'
        WHEN data_type = 'uuid' THEN '✅ UUID - Function will use UUID parameter'
        ELSE '⚠️ ' || data_type
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'orders' 
  AND column_name = 'id';

-- Step 2: Drop any existing update_order_status functions
DO $$
DECLARE
    func_record record;
BEGIN
    FOR func_record IN 
        SELECT oid, pg_get_function_identity_arguments(oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.proname = 'update_order_status'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.update_order_status(%s) CASCADE', func_record.args);
    END LOOP;
END $$;

-- Step 3: Create function with TEXT parameter (most common case)
CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id TEXT,
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
        format('Order %s: %s → %s', v_order.order_number, v_old_status, p_status);
END;
$$;

-- Step 4: Create UUID overload (for backward compatibility)
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
    -- Convert UUID to TEXT and call main function
    RETURN QUERY
    SELECT * FROM public.update_order_status(p_order_id::text, p_status, p_updated_at);
END;
$$;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION public.update_order_status(TEXT, TEXT, TIMESTAMPTZ) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT, TIMESTAMPTZ) TO service_role, authenticated;

-- Step 6: Verify
SELECT 
    '✅ Function created' as status,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as signature
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'update_order_status'
ORDER BY signature;

