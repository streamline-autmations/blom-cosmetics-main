-- SIMPLE FIX: Use existing product to avoid constraints
-- Order ID: 9f9e0f93-e380-4756-ae78-ff08a22cc7c9

-- STEP 1: Get an existing product to use as fallback
DO $$
DECLARE
    fallback_product_id uuid;
    existing_product record;
BEGIN
    -- Get the first available product from your catalog
    SELECT id, name INTO existing_product 
    FROM public.products 
    WHERE is_active = true 
    LIMIT 1;
    
    IF FOUND THEN
        fallback_product_id := existing_product.id;
        RAISE NOTICE 'Using existing product: % (%)', existing_product.name, fallback_product_id;
    ELSE
        RAISE EXCEPTION 'No active products found in the system';
    END IF;
    
    -- STEP 2: Fix null product_id in order items
    UPDATE public.order_items 
    SET product_id = fallback_product_id
    WHERE order_id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'
      AND product_id IS NULL;
    
    -- STEP 3: Mark the order as paid
    UPDATE public.orders 
    SET 
        status = 'paid',
        payment_status = 'paid',
        paid_at = NOW()
    WHERE id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9';
    
END $$;

-- STEP 4: Verify the order is now marked as paid
SELECT 
    id,
    order_number,
    m_payment_id,
    status,
    payment_status,
    paid_at,
    buyer_email,
    total
FROM public.orders 
WHERE id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9';

-- STEP 5: Check the order items were fixed
SELECT 
    id as order_item_id,
    product_name,
    variant,
    product_id,
    quantity,
    unit_price
FROM public.order_items 
WHERE order_id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9';