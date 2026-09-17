-- First, get the order_id for BL-MIJ9P3QJ
SELECT 
    id as order_id,
    merchant_payment_id,
    order_number,
    total,
    buyer_email,
    buyer_name,
    buyer_phone,
    status,
    payment_status
FROM orders 
WHERE order_number = 'BL-MIJ9P3QJ';