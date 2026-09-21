-- Check the order first
SELECT 
    id,
    order_number,
    status,
    payment_status,
    created_at
FROM public.orders
WHERE id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3';

-- Update using the function we created
SELECT * FROM public.update_order_status('4fc6796e-3b62-4890-8d8d-0e645f6599a3', 'paid');

-- Or update directly (simpler)
UPDATE public.orders
SET 
    status = 'paid',
    payment_status = 'paid',
    paid_at = now(),
    updated_at = now()
WHERE id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3';

-- Verify it worked
SELECT 
    id,
    order_number,
    status,
    payment_status,
    paid_at
FROM public.orders
WHERE id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3';

