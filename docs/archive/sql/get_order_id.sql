-- Get the id for order_number BL-C8E4511F
SELECT 
    id,
    order_number,
    status,
    payment_status
FROM public.orders
WHERE order_number = 'BL-C8E4511F';
