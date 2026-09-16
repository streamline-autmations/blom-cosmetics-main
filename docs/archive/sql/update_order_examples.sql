-- Examples: Update order to different statuses
-- Replace '4fc6796e-3b62-4890-8d8d-0e645f6599a3' with your actual order id

-- Option 1: Using the function (recommended)
SELECT * FROM public.update_order_status('4fc6796e-3b62-4890-8d8d-0e645f6599a3', 'packed');
SELECT * FROM public.update_order_status('4fc6796e-3b62-4890-8d8d-0e645f6599a3', 'ready for collection');
SELECT * FROM public.update_order_status('4fc6796e-3b62-4890-8d8d-0e645f6599a3', 'shipped');
SELECT * FROM public.update_order_status('4fc6796e-3b62-4890-8d8d-0e645f6599a3', 'delivered');

-- Option 2: Direct UPDATE (simpler for one-time changes)
UPDATE public.orders
SET 
    status = 'packed',
    updated_at = now()
WHERE id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3';

-- Or for ready for collection:
UPDATE public.orders
SET 
    status = 'ready for collection',
    updated_at = now()
WHERE id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3';

-- Verify the update
SELECT 
    id,
    order_number,
    status,
    payment_status,
    fulfillment_status,
    updated_at
FROM public.orders
WHERE id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3';

