-- COMPLETE PRODUCT MAPPING for order and fix sign-up coupon
-- Order ID: 9f9e0f93-e380-4756-ae78-ff08a22cc7c9

-- STEP 1: Complete the current order product mapping
UPDATE public.order_items 
SET product_id = CASE 
    WHEN product_name LIKE '%Core Acrylics%' THEN (SELECT id FROM public.products WHERE name LIKE '%Core Acrylics%' AND is_active = true LIMIT 1)
    WHEN product_name LIKE '%Glitter Acrylic%' THEN (SELECT id FROM public.products WHERE name LIKE '%Glitter%' AND is_active = true LIMIT 1)
    WHEN product_name LIKE '%Colour Acrylics%' THEN (SELECT id FROM public.products WHERE name LIKE '%Colour Acrylics%' AND is_active = true LIMIT 1)
    WHEN product_name LIKE '%Nail Liquid%' THEN (SELECT id FROM public.products WHERE name LIKE '%Nail Liquid%' AND is_active = true LIMIT 1)
    WHEN product_name LIKE '%Prep & Primer%' THEN (SELECT id FROM public.products WHERE name LIKE '%Prep & Primer%' AND is_active = true LIMIT 1)
    WHEN product_name LIKE '%Nail File%' THEN (SELECT id FROM public.products WHERE name LIKE '%Nail File%' AND is_active = true LIMIT 1)
    WHEN product_name LIKE '%Cuticle Oil%' THEN (SELECT id FROM public.products WHERE name LIKE '%Cuticle Oil%' AND is_active = true LIMIT 1)
    WHEN product_name LIKE '%Top Coat%' THEN (SELECT id FROM public.products WHERE name LIKE '%Top Coat%' AND is_active = true LIMIT 1)
    ELSE product_id
END
WHERE order_id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9';

-- STEP 2: Mark the order as paid
UPDATE public.orders 
SET 
    status = 'paid',
    payment_status = 'paid',
    paid_at = NOW()
WHERE id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9';

-- STEP 3: Fix sign-up coupon system with proper product restrictions
-- Create product categories for coupon restrictions
CREATE TABLE IF NOT EXISTS public.coupon_product_restrictions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_code text NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT NOW(),
    UNIQUE(coupon_code, product_id)
);

-- Create the sign-up coupon if it doesn't exist
INSERT INTO public.coupons (code, name, type, value, min_order_amount, max_discount_amount, usage_limit, used_count, is_active, starts_at, expires_at, created_at, updated_at)
VALUES ('SIGNUP10', 'Sign Up Discount', 'percentage', 10.00, 0.00, 100.00, 1, 0, true, NOW(), NOW() + INTERVAL '30 days', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Get product IDs for the restricted categories
WITH restricted_products AS (
    SELECT id, name 
    FROM public.products 
    WHERE is_active = true
    AND (
        -- ACRYLICS: All products with "Acrylic" in name (but not bundles)
        name ILIKE '%acrylic%' 
        AND name NOT ILIKE '%bundle%'
        -- BRUSHES: Nail files and brushes  
        OR name ILIKE '%file%' OR name ILIKE '%brush%'
        -- PREP & PRIMER: But exclude bundles
        OR (name ILIKE '%prep%' OR name ILIKE '%primer%') AND name NOT ILIKE '%bundle%'
    )
)
-- Insert restrictions for sign-up coupon
INSERT INTO public.coupon_product_restrictions (coupon_code, product_id)
SELECT 'SIGNUP10', id 
FROM restricted_products
ON CONFLICT (coupon_code, product_id) DO NOTHING;

-- STEP 4: Update the apply-coupon function to check restrictions
CREATE OR REPLACE FUNCTION apply_signup_coupon_with_restrictions(
    coupon_code_param text,
    cart_items_param jsonb,
    cart_total_param numeric
)
RETURNS jsonb AS $$
DECLARE
    discount_amount numeric := 0;
    valid_items jsonb := '[]'::jsonb;
    coupon_record record;
    restricted_products text[];
    item record;
BEGIN
    -- Get coupon details
    SELECT * INTO coupon_record 
    FROM public.coupons 
    WHERE code = coupon_code_param AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid coupon code');
    END IF;
    
    -- Get restricted product IDs for this coupon
    SELECT array_agg(product_id::text) INTO restricted_products
    FROM public.coupon_product_restrictions 
    WHERE coupon_code = coupon_code_param;
    
    -- Process each cart item
    FOR item IN SELECT * FROM jsonb_populate_recordset(null::record, cart_items_param) LOOP
        -- Check if this product is allowed for the coupon
        IF item.product_id::text = ANY(restricted_products) THEN
            -- Add to valid items for discount
            valid_items := valid_items || jsonb_build_object(
                'product_id', item.product_id,
                'name', item.name,
                'price', item.price,
                'quantity', item.quantity,
                'discounted_price', item.price * (100 - coupon_record.value) / 100
            );
            
            -- Calculate discount for this item
            discount_amount := discount_amount + (item.price * item.quantity * coupon_record.value / 100);
        END IF;
    END LOOP;
    
    -- Ensure discount doesn't exceed max_discount_amount
    IF coupon_record.max_discount_amount IS NOT NULL THEN
        discount_amount := LEAST(discount_amount, coupon_record.max_discount_amount);
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'discount_amount', discount_amount,
        'coupon_code', coupon_code_param,
        'valid_items', valid_items,
        'original_total', cart_total_param,
        'final_total', cart_total_param - discount_amount
    );
END;
$$ LANGUAGE plpgsql;