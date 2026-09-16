-- Complete Test Order Setup for BL-19ABA8EDDDF
-- This creates a full test order and marks it as paid for testing purposes
-- Generated on 2025-11-25

-- Step 1: Create or update the main order record
INSERT INTO public.orders (
    id,
    order_number,
    user_id,
    status,
    payment_status,
    total_amount,
    subtotal,
    shipping_cost,
    tax_amount,
    currency,
    payment_method,
    shipping_address,
    billing_address,
    customer_email,
    customer_name,
    customer_phone,
    created_at,
    updated_at,
    paid_at
) VALUES (
    gen_random_uuid(),
    'BL-19ABA8EDDDF',
    null, -- Can be null for guest orders or set to a test user ID
    'paid', -- Order status as paid
    'paid', -- Payment status as paid
    200.00, -- Total amount
    180.00, -- Subtotal (before tax)
    20.00, -- Shipping cost
    0.00, -- Tax amount
    'ZAR', -- Currency
    'payfast', -- Payment method (simulated)
    '{"street_address": "123 Test Street", "local_area": "Test Area", "city": "Cape Town", "code": "8001", "province": "Western Cape", "country": "South Africa"}'::jsonb,
    '{"street_address": "123 Test Street", "local_area": "Test Area", "city": "Cape Town", "code": "8001", "province": "Western Cape", "country": "South Africa"}'::jsonb,
    'test@example.com',
    'Test Customer',
    '+27123456789',
    now() - interval '1 hour', -- Order placed 1 hour ago
    now(), -- Updated now
    now() -- Paid now
) ON CONFLICT (order_number) 
DO UPDATE SET
    status = EXCLUDED.status,
    payment_status = EXCLUDED.payment_status,
    total_amount = EXCLUDED.total_amount,
    subtotal = EXCLUDED.subtotal,
    shipping_cost = EXCLUDED.shipping_cost,
    tax_amount = EXCLUDED.tax_amount,
    currency = EXCLUDED.currency,
    payment_method = EXCLUDED.payment_method,
    shipping_address = EXCLUDED.shipping_address,
    billing_address = EXCLUDED.billing_address,
    customer_email = EXCLUDED.customer_email,
    customer_name = EXCLUDED.customer_name,
    customer_phone = EXCLUDED.customer_phone,
    updated_at = now(),
    paid_at = now();

-- Step 2: Insert order items (sample products)
INSERT INTO public.order_items (
    id,
    order_id,
    product_id,
    product_name,
    product_sku,
    quantity,
    unit_price,
    total_price,
    product_options
) 
SELECT 
    gen_random_uuid(),
    o.id,
    p.id,
    'Sample Product - Test Item', -- Product name
    'TEST-001', -- SKU
    2, -- Quantity
    90.00, -- Unit price
    180.00, -- Total price (quantity * unit_price)
    '{"size": "50ml", "color": "Clear"}'::jsonb -- Product options
FROM public.orders o
CROSS JOIN (SELECT id FROM public.products WHERE is_active = true LIMIT 1) p
WHERE o.order_number = 'BL-19ABA8EDDDF'
ON CONFLICT DO NOTHING;

-- Step 3: Insert order tracking/history entries
INSERT INTO public.order_tracking (
    id,
    order_id,
    status,
    notes,
    created_at,
    created_by
)
SELECT 
    gen_random_uuid(),
    o.id,
    'paid',
    'Test order marked as paid via SQL - Order paid successfully',
    now(),
    'system'
FROM public.orders o
WHERE o.order_number = 'BL-19ABA8EDDDF'
ON CONFLICT DO NOTHING;

-- Step 4: Insert payment record (simulated)
INSERT INTO public.payments (
    id,
    order_id,
    amount,
    currency,
    payment_method,
    payment_status,
    transaction_id,
    gateway_response,
    processed_at
)
SELECT 
    gen_random_uuid(),
    o.id,
    200.00,
    'ZAR',
    'payfast',
    'completed',
    'TEST_TXN_' || extract(epoch from now()), -- Simulated transaction ID
    '{"status": "success", "message": "Test payment - simulated success", "test_mode": true}'::jsonb,
    now()
FROM public.orders o
WHERE o.order_number = 'BL-19ABA8EDDDF'
ON CONFLICT DO NOTHING;

-- Step 5: Create fulfillment record (ready for shipping)
INSERT INTO public.order_fulfillments (
    id,
    order_id,
    status,
    tracking_number,
    carrier,
    shipped_at,
    estimated_delivery
)
SELECT 
    gen_random_uuid(),
    o.id,
    'ready_to_ship',
    null, -- No tracking number yet
    null, -- No carrier assigned yet
    null, -- Not shipped yet
    now() + interval '3 days' -- Estimated delivery in 3 days
FROM public.orders o
WHERE o.order_number = 'BL-19ABA8EDDDF'
ON CONFLICT DO NOTHING;

-- Verification query to check the order was created correctly
SELECT 
    o.order_number,
    o.status,
    o.payment_status,
    o.total_amount,
    o.customer_email,
    o.paid_at,
    COUNT(oi.id) as item_count
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
WHERE o.order_number = 'BL-19ABA8EDDDF'
GROUP BY o.id, o.order_number, o.status, o.payment_status, o.total_amount, o.customer_email, o.paid_at;