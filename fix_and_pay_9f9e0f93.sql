-- FIX PRODUCT_ID then mark order as paid
-- Order ID: 9f9e0f93-e380-4756-ae78-ff08a22cc7c9

-- STEP 1: Check current order items and their product_id status
SELECT 
    'Order Items Check' as step,
    oi.id as order_item_id,
    oi.product_name,
    oi.variant_title,
    oi.product_id,
    oi.variant_id,
    oi.quantity,
    oi.unit_price
FROM public.order_items oi
WHERE oi.order_id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9';

-- STEP 2: Create a fallback product if needed
INSERT INTO public.products (id, name, sku, price, description, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'Fallback Product', 'FALLBACK-001', 100.00, 'Fallback product for orders', true, now(), now())
ON CONFLICT DO NOTHING;

-- Get the fallback product ID
DO $$
DECLARE
    fallback_product_id uuid;
BEGIN
    SELECT id INTO fallback_product_id FROM public.products WHERE name = 'Fallback Product' LIMIT 1;
    
    -- STEP 3: Fix any null product_id values
    UPDATE public.order_items 
    SET product_id = fallback_product_id
    WHERE order_id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'
      AND product_id IS NULL;
      
    -- STEP 4: Now mark the order as paid
    UPDATE public.orders 
    SET 
        status = 'paid',
        payment_status = 'paid',
        paid_at = NOW()
    WHERE id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9';
    
END $$;

-- STEP 5: Verify the fix
SELECT 
    'Order Status' as check_type,
    id,
    order_number,
    m_payment_id,
    status,
    payment_status,
    paid_at,
    buyer_email,
    total
FROM public.orders 
WHERE id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'

UNION ALL

SELECT 
    'Items Fixed' as check_type,
    oi.id::text,
    oi.product_name,
    oi.variant_title,
    oi.product_id::text,
    oi.variant_id::text,
    oi.quantity::text,
    oi.unit_price::text,
    ''
FROM public.order_items oi
WHERE oi.order_id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9';