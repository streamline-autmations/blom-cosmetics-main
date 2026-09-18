-- Find orders by order_number
SELECT 
    id,
    order_number,
    status,
    payment_status,
    created_at
FROM public.orders
WHERE order_number IN ('BL-C8E4511F', 'BL-19ACBFB542B')
ORDER BY created_at DESC;

-- If the orders exist, update them directly (simpler than using the function)
UPDATE public.orders
SET 
    status = 'paid',
    payment_status = 'paid',
    paid_at = now(),
    updated_at = now()
WHERE order_number IN ('BL-C8E4511F', 'BL-19ACBFB542B');

-- Verify the update
SELECT 
    id,
    order_number,
    status,
    payment_status,
    paid_at
FROM public.orders
WHERE order_number IN ('BL-C8E4511F', 'BL-19ACBFB542B');

