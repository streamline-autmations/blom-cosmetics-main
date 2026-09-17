-- Get Complete Order Details for Manual Webhook Processing
-- Use this SQL to get all information needed to create a webhook payload

-- Query 1: Get basic order information
SELECT 
    o.id,
    o.merchant_payment_id as m_payment_id,
    o.order_number,
    o.status,
    o.payment_status,
    o.total,
    o.total_cents,
    o.currency,
    o.buyer_email,
    o.buyer_name,
    o.buyer_phone,
    o.customer_name,
    o.customer_email,
    o.customer_mobile,
    o.coupon_code,
    o.subtotal_cents,
    o.shipping_cents,
    o.tax_cents,
    o.discount_cents,
    o.placed_at,
    o.paid_at,
    o.created_at,
    o.updated_at
FROM orders o 
WHERE o.merchant_payment_id = 'BL-19ACBFB542B';

-- Query 2: Get order items with product details
SELECT 
    oi.id,
    oi.order_id,
    oi.product_id,
    oi.product_name,
    oi.sku,
    oi.quantity,
    oi.unit_price,
    oi.line_total,
    oi.variant_title,
    p.name as product_full_name,
    p.description
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = (
    SELECT id FROM orders WHERE merchant_payment_id = 'BL-19ACBFB542B'
);

-- Query 3: Get shipping/delivery information
SELECT 
    id,
    shipping_method,
    shipping_cost,
    delivery_address,
    collection_location,
    street_address,
    local_area,
    city,
    zone,
    code,
    country,
    lat,
    lng
FROM orders 
WHERE merchant_payment_id = 'BL-19ACBFB542B';

-- Query 4: Get payment history for this order
SELECT 
    p.id,
    p.order_id,
    p.provider,
    p.amount_cents,
    p.amount as amount_decimal,
    p.status,
    p.provider_txn_id,
    p.raw,
    p.created_at
FROM payments p
WHERE p.order_id = (
    SELECT id FROM orders WHERE merchant_payment_id = 'BL-19ACBFB542B'
);

-- Query 5: Complete order summary (all info in one query)
SELECT 
    -- Order Basics
    o.merchant_payment_id as m_payment_id,
    o.order_number,
    o.status as current_status,
    o.payment_status,
    
    -- Amount Information
    o.total as total_amount,
    o.total_cents as total_cents,
    o.currency,
    o.subtotal_cents,
    o.shipping_cents,
    o.discount_cents,
    
    -- Customer Information
    COALESCE(o.buyer_name, o.customer_name) as customer_name,
    COALESCE(o.buyer_email, o.customer_email) as customer_email,
    COALESCE(o.buyer_phone, o.customer_mobile) as customer_phone,
    
    -- Order Items Summary
    (
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
    ) as order_items,
    
    -- Shipping
    o.shipping_method,
    o.shipping_cost,
    
    -- Timestamps
    o.placed_at,
    o.paid_at,
    o.created_at
    
FROM orders o 
WHERE o.merchant_payment_id = 'BL-19ACBFB542B';