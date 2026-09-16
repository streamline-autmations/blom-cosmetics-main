-- COMPLETE FIX: Fix order BL-MIJ9P3QJ step by step
-- This handles the product_id null issue before marking as paid

DO $$
DECLARE
    order_id_var uuid := '4fc6796e-3b62-4890-8d8d-0e645f6599a3';
    order_number_var text := 'BL-MIJ9P3QJ';
    fallback_product_id uuid;
    order_item_id_var uuid;
    product_name_var text;
    mapped_product_id uuid;
    items_fixed integer := 0;
BEGIN
    RAISE NOTICE 'Starting comprehensive fix for order: % (%)', order_number_var, order_id_var;

    -- STEP 1: Get or create fallback product
    SELECT id INTO fallback_product_id 
    FROM public.products 
    WHERE name = 'System Fallback Product' LIMIT 1;
    
    IF fallback_product_id IS NULL THEN
        INSERT INTO public.products (name, sku, price, is_active, created_at, updated_at)
        VALUES ('System Fallback Product', 'SYS-FALLBACK-001', 0.01, true, now(), now())
        RETURNING id INTO fallback_product_id;
        RAISE NOTICE 'Created fallback product: %', fallback_product_id;
    END IF;

    -- STEP 2: Find and fix order items with null product_id
    -- First try to map them to existing products
    FOR order_item_id_var, product_name_var IN
        SELECT oi.id, oi.product_name
        FROM public.order_items oi
        WHERE oi.order_id = order_id_var
          AND oi.product_id IS NULL
    LOOP
        -- Try to find matching product by name
        SELECT id INTO mapped_product_id 
        FROM public.products 
        WHERE LOWER(name) = LOWER(product_name_var)
          AND is_active = true
        LIMIT 1;
        
        -- If exact match not found, try partial match
        IF mapped_product_id IS NULL THEN
            SELECT id INTO mapped_product_id 
            FROM public.products 
            WHERE name ILIKE '%' || product_name_var || '%'
              AND is_active = true
            LIMIT 1;
        END IF;
        
        -- If still no match, try SKU match (using product_name as fallback for SKU)
        IF mapped_product_id IS NULL THEN
            SELECT id INTO mapped_product_id 
            FROM public.products 
            WHERE LOWER(sku) = LOWER(product_name_var)
              AND is_active = true
            LIMIT 1;
        END IF;
        
        -- If no product found, create one
        IF mapped_product_id IS NULL THEN
            INSERT INTO public.products (
                name, 
                sku, 
                price, 
                description, 
                is_active, 
                created_at, 
                updated_at
            )
            VALUES (
                product_name_var,
                'AUTO-' || substr(md5(product_name_var), 1, 8),
                0.01,
                'Auto-created for order: ' || order_number_var,
                true,
                now(),
                now()
            )
            RETURNING id INTO mapped_product_id;
            
            RAISE NOTICE 'Auto-created product: % (%)', product_name_var, mapped_product_id;
        END IF;
        
        -- Update the order item with the product_id
        UPDATE public.order_items 
        SET product_id = COALESCE(mapped_product_id, fallback_product_id)
        WHERE id = order_item_id_var;
        
        items_fixed := items_fixed + 1;
        RAISE NOTICE 'Fixed order item %: % -> %', items_fixed, product_name_var, mapped_product_id;
        
    END LOOP;

    -- STEP 3: Verify all items now have product_id
    DECLARE
        null_count integer;
    BEGIN
        SELECT COUNT(*) INTO null_count
        FROM public.order_items
        WHERE order_id = order_id_var
          AND product_id IS NULL;
          
        IF null_count > 0 THEN
            RAISE EXCEPTION 'Still have % order items with null product_id after mapping', null_count;
        END IF;
        
        RAISE NOTICE 'All % order items have valid product_id. Proceeding to mark as paid...', items_fixed;
    END;

    -- STEP 4: Now mark the order as paid (this should work now)
    UPDATE public.orders 
    SET 
        status = 'paid',
        payment_status = 'paid',
        paid_at = now(),
        updated_at = now()
    WHERE id = order_id_var;

    RAISE NOTICE 'Order % marked as paid successfully!', order_number_var;

END $$;

-- STEP 5: Final verification
SELECT 
    'ORDER STATUS' as check_type,
    o.id::text as order_id,
    o.order_number,
    o.status,
    o.payment_status,
    o.paid_at::text,
    o.total::text as total_amount,
    o.buyer_email
FROM public.orders o
WHERE o.id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'

UNION ALL

SELECT 
    'ORDER ITEMS' as check_type,
    COUNT(*)::text as order_id,
    'Total Items' as order_number,
    COUNT(CASE WHEN oi.product_id IS NOT NULL THEN 1 END)::text as status,
    'With Product ID' as payment_status,
    '' as paid_at,
    '' as total_amount,
    '' as buyer_email
FROM public.order_items oi
WHERE oi.order_id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'

UNION ALL

SELECT 
    'ITEMS MAPPED' as check_type,
    oi.product_name as order_id,
    COALESCE(p.name, 'NO PRODUCT') as order_number,
    COALESCE(p.id::text, 'NULL') as status,
    COALESCE(p.sku, 'NO SKU') as payment_status,
    oi.quantity::text as paid_at,
    oi.unit_price::text as total_amount,
    oi.variant_title as buyer_email
FROM public.order_items oi
LEFT JOIN public.products p ON p.id = oi.product_id
WHERE oi.order_id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'
ORDER BY check_type, order_id;