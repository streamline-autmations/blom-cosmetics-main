-- Test Order Verification and Frontend Testing
-- Use this to verify the test order BL-19ABA8EDDDF works correctly

-- Query 1: Check if order exists and has correct status
SELECT 
    order_number,
    status,
    payment_status,
    total_amount,
    customer_email,
    paid_at,
    created_at
FROM public.orders 
WHERE order_number = 'BL-19ABA8EDDDF';

-- Query 2: Check order items
SELECT 
    oi.product_name,
    oi.quantity,
    oi.unit_price,
    oi.total_price
FROM public.order_items oi
JOIN public.orders o ON oi.order_id = o.id
WHERE o.order_number = 'BL-19ABA8EDDDF';

-- Query 3: Check payment records
SELECT 
    amount,
    payment_method,
    payment_status,
    transaction_id,
    processed_at
FROM public.payments p
JOIN public.orders o ON p.order_id = o.id
WHERE o.order_number = 'BL-19ABA8EDDDF';

-- Query 4: Check fulfillment status
SELECT 
    status,
    tracking_number,
    carrier,
    shipped_at,
    estimated_delivery
FROM public.order_fulfillments of
JOIN public.orders o ON of.order_id = o.id
WHERE o.order_number = 'BL-19ABA8EDDDF';

-- Frontend Testing URLs:
-- Test the order detail page: /order/BL-19ABA8EDDDF
-- Test the invoice viewer: /invoice/BL-19ABA8EDDDF
-- Test checkout success: /checkout/success?order_id=BL-19ABA8EDDDF

-- Admin App Testing:
-- The order should now appear in your admin app with:
-- - Status: "paid"
-- - Payment Status: "paid"
-- - Amount: R200.00
-- - Recent activity showing payment completion