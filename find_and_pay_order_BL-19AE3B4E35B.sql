-- Find Order BL-19AE3B4E35B
-- This query finds the order by its order_number and shows all relevant details

SELECT 
    id,
    order_number,
    merchant_payment_id,
    customer_name,
    customer_email,
    customer_phone,
    delivery_method,
    subtotal_cents,
    shipping_cents,
    discount_cents,
    tax_cents,
    total_cents,
    currency,
    status,
    payment_status,
    fulfillment_status,
    placed_at,
    paid_at,
    created_at
FROM orders 
WHERE order_number = 'BL-19AE3B4E35B';

-- Mark Order as Paid
-- This updates the order status to reflect successful payment

UPDATE orders 
SET 
    status = 'paid',
    payment_status = 'paid',
    fulfillment_status = 'processing',
    paid_at = NOW()
WHERE order_number = 'BL-19AE3B4E35B'
RETURNING 
    id,
    order_number,
    status,
    payment_status,
    fulfillment_status,
    paid_at;