-- Manual Order Update Script
-- Use this to mark order BL-19ACBFB542B as paid and trigger notifications

-- Step 1: Update order status to paid
UPDATE orders 
SET 
    status = 'paid',
    payment_status = 'paid',
    paid_at = now(),
    updated_at = now()
WHERE merchant_payment_id = 'BL-19ACBFB542B';

-- Step 2: Record payment (if not exists)
INSERT INTO payments (
    order_id,
    provider,
    amount_cents,
    amount,
    status,
    provider_txn_id,
    raw,
    created_at
)
SELECT 
    o.id,
    'payfast',
    o.total_cents,
    o.total,
    'completed',
    'MANUAL_MARK_PAID_' || extract(epoch from now())::text,
    jsonb_build_object(
        'merchant_payment_id', o.merchant_payment_id,
        'payment_status', 'COMPLETE',
        'amount', o.total,
        'updated_manually', true,
        'updated_at', now()::text
    ),
    now()
FROM orders o 
WHERE o.merchant_payment_id = 'BL-19ACBFB542B'
ON CONFLICT DO NOTHING;

-- Step 3: Get the complete order data for webhook (run this after the update)
-- This will give you the JSON payload you can use for manual webhook trigger
SELECT json_build_object(
    'm_payment_id', o.merchant_payment_id,
    'order_id', o.id,
    'order_number', o.order_number,
    'status', 'paid',
    'payment_status', 'paid',
    'total', o.total,
    'currency', COALESCE(o.currency, 'ZAR'),
    'buyer_email', COALESCE(o.buyer_email, o.customer_email),
    'buyer_name', COALESCE(o.buyer_name, o.customer_name),
    'amount_paid', o.total,
    'payment_date', now()::text,
    'order_items', (
        SELECT json_agg(
            json_build_object(
                'product_name', oi.product_name,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'line_total', oi.line_total,
                'variant', oi.variant_title
            )
        )
        FROM order_items oi 
        WHERE oi.order_id = o.id
    ),
    'shipping_method', o.shipping_method,
    'coupon_code', o.coupon_code
) as webhook_payload
FROM orders o 
WHERE o.merchant_payment_id = 'BL-19ACBFB542B';

-- Step 4: Check the update worked
SELECT 
    merchant_payment_id,
    status,
    payment_status,
    paid_at,
    total,
    buyer_email,
    buyer_name
FROM orders 
WHERE merchant_payment_id = 'BL-19ACBFB542B';