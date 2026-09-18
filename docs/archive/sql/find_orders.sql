-- Find All Orders - Simple Query
-- This will show all orders and their basic info

-- Check what orders exist (most recent first)
SELECT 
    id,
    merchant_payment_id,
    order_number,
    status,
    payment_status,
    total,
    buyer_email,
    buyer_name,
    buyer_phone,
    customer_email,
    customer_name,
    customer_mobile,
    created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- If that returns orders, then run this specific query:
-- Replace 'BL-19ACBFB542B' with the actual m_payment_id you find

-- Simple customer info query
SELECT 
    merchant_payment_id as m_payment_id,
    total,
    COALESCE(buyer_email, customer_email) as customer_email,
    COALESCE(buyer_name, customer_name) as customer_name,
    COALESCE(buyer_phone, customer_mobile) as customer_phone,
    status,
    payment_status
FROM orders 
WHERE merchant_payment_id = 'BL-19ACBFB542B' 
   OR order_number = 'BL-19ACBFB542B'
   OR buyer_email = 'ezannenel5@gmail.com';

-- Check if order exists by email
SELECT 
    merchant_payment_id,
    order_number,
    total,
    buyer_email,
    buyer_name,
    status,
    payment_status,
    created_at
FROM orders 
WHERE buyer_email = 'ezannenel5@gmail.com'
   OR customer_email = 'ezannenel5@gmail.com'
ORDER BY created_at DESC;