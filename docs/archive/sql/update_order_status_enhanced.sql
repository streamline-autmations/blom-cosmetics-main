-- Enhanced update_order_status function with more status options
-- This replaces the existing function with support for more statuses

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

    -- Update order status (removed strict validation - allows any status)
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

    -- Auto-update fulfillment_status based on status
    IF p_status = 'packed' THEN
        UPDATE public.orders
        SET fulfillment_status = 'packed'
        WHERE id = p_order_id;
    ELSIF p_status = 'shipped' THEN
        UPDATE public.orders
        SET fulfillment_status = 'shipped'
        WHERE id = p_order_id;
    ELSIF p_status IN ('delivered', 'ready for collection', 'collected') THEN
        UPDATE public.orders
        SET fulfillment_status = 'fulfilled'
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_order_status(TEXT, TEXT, TIMESTAMPTZ) TO service_role, authenticated;

-- Test examples:
-- SELECT * FROM public.update_order_status('4fc6796e-3b62-4890-8d8d-0e645f6599a3', 'packed');
-- SELECT * FROM public.update_order_status('4fc6796e-3b62-4890-8d8d-0e645f6599a3', 'ready for collection');
-- SELECT * FROM public.update_order_status('4fc6796e-3b62-4890-8d8d-0e645f6599a3', 'shipped');

