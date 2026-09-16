-- STEP 1: Fix order items with null product_id before marking as paid
-- This ensures all items have valid product_id values

DO $$
DECLARE
    order_id_var uuid := '4fc6796e-3b62-4890-8d8d-0e645f6599a3';
    fallback_product_id uuid;
    order_item_record record;
    mapped_product_id uuid;
    items_processed integer := 0;
BEGIN
    RAISE NOTICE 'Starting order item fix for %', order_id_var;

    -- Get or create fallback product
    SELECT id INTO fallback_product_id 
    FROM public.products 
    WHERE name = 'System Fallback Product' LIMIT 1;
    
    IF fallback_product_id IS NULL THEN
        INSERT INTO public.products (name, sku, price, is_active, created_at, updated_at)
        VALUES ('System Fallback Product', 'SYS-FALLBACK-001', 0.01, true, now(), now())
        RETURNING id INTO fallback_product_id;
        RAISE NOTICE 'Created fallback product: %', fallback_product_id;
    END IF;

    -- Process each order item with null product_id
    FOR order_item_record IN
        SELECT oi.id, oi.product_name, oi.sku, oi.unit_price
        FROM public.order_items oi
        WHERE oi.order_id = order_id_var
          AND oi.product_id IS NULL
    LOOP
        mapped_product_id := NULL;
        
        -- Method 1: Try exact name match
        IF mapped_product_id IS NULL THEN
            SELECT id INTO mapped_product_id 
            FROM public.products 
            WHERE LOWER(name) = LOWER(order_item_record.product_name)
              AND is_active = true
            LIMIT 1;
        END IF;
        
        -- Method 2: Try partial name match
        IF mapped_product_id IS NULL THEN
            SELECT id INTO mapped_product_id 
            FROM public.products 
            WHERE name ILIKE '%' || order_item_record.product_name || '%'
              AND is_active = true
            LIMIT 1;
        END IF;
        
        -- Method 3: Try SKU match
        IF mapped_product_id IS NULL AND order_item_record.sku IS NOT NULL THEN
            SELECT id INTO mapped_product_id 
            FROM public.products 
            WHERE LOWER(sku) = LOWER(order_item_record.sku)
              AND is_active = true
            LIMIT 1;
        END IF;
        
        -- Method 4: Create product if not found
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
                order_item_record.product_name,
                COALESCE(order_item_record.sku, 'AUTO-' || substr(md5(order_item_record.product_name), 1, 8)),
                COALESCE(order_item_record.unit_price, 0.01),
                'Auto-created for order mapping',
                true,
                now(),
                now()
            )
            RETURNING id INTO mapped_product_id;
            
            RAISE NOTICE 'Auto-created product: % (%)', order_item_record.product_name, mapped_product_id;
        END IF;
        
        -- Update the order item with resolved product_id
        UPDATE public.order_items 
        SET product_id = COALESCE(mapped_product_id, fallback_product_id)
        WHERE id = order_item_record.id;
        
        items_processed := items_processed + 1;
        RAISE NOTICE 'Fixed item %: % -> %', items_processed, order_item_record.product_name, mapped_product_id;
        
    END LOOP;

    RAISE NOTICE 'Successfully processed % order items', items_processed;

END $$;

-- Verify the fix worked
SELECT 
    'AFTER MAPPING' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN product_id IS NOT NULL THEN 1 END) as items_with_product_id,
    COUNT(CASE WHEN product_id IS NULL THEN 1 END) as items_still_null
FROM public.order_items 
WHERE order_id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3';

-- Show detailed mapping results
SELECT 
    oi.product_name,
    oi.product_id,
    p.name as mapped_product_name,
    p.sku as product_sku,
    oi.unit_price,
    oi.quantity
FROM public.order_items oi
LEFT JOIN public.products p ON p.id = oi.product_id
WHERE oi.order_id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'
ORDER BY oi.product_name;