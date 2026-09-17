-- Find the correct order for payment BL-19AC8E4511F
-- Search by payment ID, order number, and buyer email

-- Step 1: Search for the order by payment ID BL-19AC8E4511F
SELECT 
    id,
    order_number,
    m_payment_id,
    status,
    payment_status,
    buyer_email,
    total,
    created_at
FROM public.orders 
WHERE m_payment_id = 'BL-19AC8E4511F' 
   OR order_number = 'BL-19AC8E4511F';

-- Step 2: Search by buyer email to find recent orders
SELECT 
    id,
    order_number,
    m_payment_id,
    status,
    payment_status,
    buyer_email,
    total,
    created_at
FROM public.orders 
WHERE buyer_email = 'christiaansteffen12345@gmail.com'
ORDER BY created_at DESC
LIMIT 5;

-- Step 3: Search for any orders with amount around R 5.00
SELECT 
    id,
    order_number,
    m_payment_id,
    status,
    payment_status,
    buyer_email,
    total,
    created_at
FROM public.orders 
WHERE total = 5.00
   OR ABS(total - 5.00) < 0.01
ORDER BY created_at DESC
LIMIT 5;

-- Step 4: If we find the order, show its items
-- (This will be populated once we find the correct order ID)
-- SELECT * FROM get_order_items('FOUND_ORDER_ID');