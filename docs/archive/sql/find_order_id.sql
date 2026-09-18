-- Find the correct order ID to use with update_order_status function
-- This will show you the actual id column value (not order_number)

-- Option 1: Find order by order_number
SELECT 
    id,
    order_number,
    status,
    payment_status,
    created_at,
    'Use this id value' as instruction
FROM public.orders
WHERE order_number = 'BL-C8E4511F';

-- Option 2: Show recent orders with both id and order_number
SELECT 
    id,
    order_number,
    status,
    payment_status,
    created_at
FROM public.orders
ORDER BY created_at DESC
LIMIT 10;

-- Option 3: Test the function with the correct id (replace with actual id from above)
-- SELECT * FROM public.update_order_status('PUT_ACTUAL_ID_HERE', 'paid');

