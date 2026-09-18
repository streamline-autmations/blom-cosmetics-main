-- Generate Webhook Payload for Order BL-19ACBFB542B
-- This creates the exact format you need to trigger notifications

-- Run this query to get the webhook payload for BL-19ACBFB542B
SELECT json_build_object(
    'order_id', o.id,
    'm_payment_id', o.merchant_payment_id,
    'order_number', COALESCE(o.order_number, o.merchant_payment_id),
    'status', 'paid',
    'payment_status', 'paid',
    'total', o.total::text,
    'currency', COALESCE(o.currency, 'ZAR'),
    'buyer_email', COALESCE(o.buyer_email, o.customer_email),
    'buyer_name', COALESCE(o.buyer_name, o.customer_name),
    'amount_paid', o.total::text,
    'payment_date', now()::text,
    'webhookUrl', 'https://cute-stroopwafel-203cac.netlify.app/.netlify/functions/new-order-alert',
    'executionMode', 'production'
) as webhook_payload
FROM orders o 
WHERE o.merchant_payment_id = 'BL-19ACBFB542B';

-- Alternative: Get all order details for customer info
-- This gives you customer details you can use for manual notifications
SELECT 
    o.merchant_payment_id as m_payment_id,
    o.total,
    o.currency,
    COALESCE(o.buyer_email, o.customer_email) as customer_email,
    COALESCE(o.buyer_name, o.customer_name) as customer_name,
    COALESCE(o.buyer_phone, o.customer_mobile) as customer_phone,
    o.shipping_method,
    o.shipping_cost,
    o.coupon_code,
    (
        SELECT json_agg(
            json_build_object(
                'name', oi.product_name,
                'quantity', oi.quantity,
                'price', oi.unit_price,
                'total', oi.line_total
            )
        )
        FROM order_items oi 
        WHERE oi.order_id = o.id
    ) as items
FROM orders o 
WHERE o.merchant_payment_id = 'BL-19ACBFB542B';

-- For WhatsApp/Email notifications - Customer Summary
SELECT 
    'Order ' || o.merchant_payment_id || ' - Payment Confirmed!' as message_title,
    'Dear ' || COALESCE(o.buyer_name, o.customer_name) || ',' as greeting,
    'Your order of R' || o.total || ' has been confirmed and paid.' as payment_message,
    'Items:' as items_header,
    string_agg(oi.quantity || 'x ' || oi.product_name, '; ') as items_list,
    'Total: R' || o.total as total_message,
    'Thank you for your purchase!' as closing
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.merchant_payment_id = 'BL-19ACBFB542B'
GROUP BY o.merchant_payment_id, o.total, o.buyer_name, o.customer_name;