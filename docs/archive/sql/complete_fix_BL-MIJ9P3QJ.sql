-- Complete fix for order BL-MIJ9P3QJ
-- This script will map order items to products and allow the order to be marked as paid

-- Step 1: Create or find products and map them to order items
-- First, let's create products if they don't exist and update order items

DO $$
DECLARE
    order_id_var uuid := '4fc6796e-3b62-4890-8d8d-0e645f6599a3';
    
    -- Product variables
    colour_acrylics_005_id uuid;
    colour_acrylics_nude_snowkiss_id uuid;
    core_acrylics_blom_cover_pink_id uuid;
    core_acrylics_crystal_clear_id uuid;
    core_acrylics_milky_white_id uuid;
    glitter_acrylic_56g_id uuid;
    nail_forms_default_id uuid;
    colour_acrylics_general_id uuid;
    hand_files_5pack_id uuid;
    colour_acrylics_064_id uuid;
    colour_acrylics_040_id uuid;
    
BEGIN
    RAISE NOTICE 'Starting order fix for BL-MIJ9P3QJ...';

    -- Create products if they don't exist
    -- 1. Colour Acrylics - 005
    INSERT INTO products (name, sku, price, track_inventory, inventory_quantity, is_active)
    SELECT 'Colour Acrylics - 005', 'COLOUR-005', 15000, true, 100, true
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name ILIKE '%Colour Acrylics%' AND name ILIKE '%005%')
    RETURNING id INTO colour_acrylics_005_id;
    
    IF colour_acrylics_005_id IS NULL THEN
        SELECT id INTO colour_acrylics_005_id FROM products 
        WHERE name ILIKE '%Colour Acrylics%' AND name ILIKE '%005%' LIMIT 1;
    END IF;

    -- 2. Colour Acrylics - Nude Snowkiss(E002)
    INSERT INTO products (name, sku, price, track_inventory, inventory_quantity, is_active)
    SELECT 'Colour Acrylics - Nude Snowkiss(E002)', 'COLOUR-E002', 15000, true, 100, true
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name ILIKE '%Colour Acrylics%' AND (name ILIKE '%Nude%' OR name ILIKE '%Snowkiss%'))
    RETURNING id INTO colour_acrylics_nude_snowkiss_id;
    
    IF colour_acrylics_nude_snowkiss_id IS NULL THEN
        SELECT id INTO colour_acrylics_nude_snowkiss_id FROM products 
        WHERE name ILIKE '%Colour Acrylics%' AND (name ILIKE '%Nude%' OR name ILIKE '%Snowkiss%') LIMIT 1;
    END IF;

    -- 3. Core Acrylics - Blom Cover Pink (072)
    INSERT INTO products (name, sku, price, track_inventory, inventory_quantity, is_active)
    SELECT 'Core Acrylics - Blom Cover Pink (072)', 'CORE-072', 32000, true, 100, true
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name ILIKE '%Core Acrylics%' AND name ILIKE '%Blom Cover Pink%')
    RETURNING id INTO core_acrylics_blom_cover_pink_id;
    
    IF core_acrylics_blom_cover_pink_id IS NULL THEN
        SELECT id INTO core_acrylics_blom_cover_pink_id FROM products 
        WHERE name ILIKE '%Core Acrylics%' AND name ILIKE '%Blom Cover Pink%' LIMIT 1;
    END IF;

    -- 4. Core Acrylics - Crystal Clear (073)
    INSERT INTO products (name, sku, price, track_inventory, inventory_quantity, is_active)
    SELECT 'Core Acrylics - Crystal Clear (073)', 'CORE-073', 32000, true, 100, true
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name ILIKE '%Core Acrylics%' AND name ILIKE '%Crystal Clear%')
    RETURNING id INTO core_acrylics_crystal_clear_id;
    
    IF core_acrylics_crystal_clear_id IS NULL THEN
        SELECT id INTO core_acrylics_crystal_clear_id FROM products 
        WHERE name ILIKE '%Core Acrylics%' AND name ILIKE '%Crystal Clear%' LIMIT 1;
    END IF;

    -- 5. Core Acrylics - The Perfect Milky White (074)
    INSERT INTO products (name, sku, price, track_inventory, inventory_quantity, is_active)
    SELECT 'Core Acrylics - The Perfect Milky White (074)', 'CORE-074', 32000, true, 100, true
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name ILIKE '%Core Acrylics%' AND name ILIKE '%Milky White%')
    RETURNING id INTO core_acrylics_milky_white_id;
    
    IF core_acrylics_milky_white_id IS NULL THEN
        SELECT id INTO core_acrylics_milky_white_id FROM products 
        WHERE name ILIKE '%Core Acrylics%' AND name ILIKE '%Milky White%' LIMIT 1;
    END IF;

    -- 6. Glitter Acrylic - 56g
    INSERT INTO products (name, sku, price, track_inventory, inventory_quantity, is_active)
    SELECT 'Glitter Acrylic - 56g', 'GLITTER-56G', 15000, true, 100, true
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name ILIKE '%Glitter%' AND name ILIKE '%56g%')
    RETURNING id INTO glitter_acrylic_56g_id;
    
    IF glitter_acrylic_56g_id IS NULL THEN
        SELECT id INTO glitter_acrylic_56g_id FROM products 
        WHERE name ILIKE '%Glitter%' AND name ILIKE '%56g%' LIMIT 1;
    END IF;

    -- 7. Nail Forms - Default
    INSERT INTO products (name, sku, price, track_inventory, inventory_quantity, is_active)
    SELECT 'Nail Forms - Default', 'NAIL-FORMS-DEF', 29000, true, 100, true
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name ILIKE '%Nail Forms%')
    RETURNING id INTO nail_forms_default_id;
    
    IF nail_forms_default_id IS NULL THEN
        SELECT id INTO nail_forms_default_id FROM products 
        WHERE name ILIKE '%Nail Forms%' LIMIT 1;
    END IF;

    -- 8. Colour Acrylics (general)
    INSERT INTO products (name, sku, price, track_inventory, inventory_quantity, is_active)
    SELECT 'Colour Acrylics', 'COLOUR-GENERAL', 15000, true, 100, true
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Colour Acrylics')
    RETURNING id INTO colour_acrylics_general_id;
    
    IF colour_acrylics_general_id IS NULL THEN
        SELECT id INTO colour_acrylics_general_id FROM products 
        WHERE name = 'Colour Acrylics' LIMIT 1;
    END IF;

    -- 9. Hand Files - 5-Pack Bundle
    INSERT INTO products (name, sku, price, track_inventory, inventory_quantity, is_active)
    SELECT 'Hand Files - 5-Pack Bundle', 'HAND-FILES-5PK', 3500, true, 50, true
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name ILIKE '%Hand Files%' AND name ILIKE '%5-Pack%')
    RETURNING id INTO hand_files_5pack_id;
    
    IF hand_files_5pack_id IS NULL THEN
        SELECT id INTO hand_files_5pack_id FROM products 
        WHERE name ILIKE '%Hand Files%' AND name ILIKE '%5-Pack%' LIMIT 1;
    END IF;

    -- 10. Colour Acrylics - 064
    INSERT INTO products (name, sku, price, track_inventory, inventory_quantity, is_active)
    SELECT 'Colour Acrylics - 064', 'COLOUR-064', 15000, true, 100, true
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name ILIKE '%Colour Acrylics%' AND name ILIKE '%064%')
    RETURNING id INTO colour_acrylics_064_id;
    
    IF colour_acrylics_064_id IS NULL THEN
        SELECT id INTO colour_acrylics_064_id FROM products 
        WHERE name ILIKE '%Colour Acrylics%' AND name ILIKE '%064%' LIMIT 1;
    END IF;

    -- 11. Colour Acrylics - 040
    INSERT INTO products (name, sku, price, track_inventory, inventory_quantity, is_active)
    SELECT 'Colour Acrylics - 040', 'COLOUR-040', 15000, true, 100, true
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name ILIKE '%Colour Acrylics%' AND name ILIKE '%040%')
    RETURNING id INTO colour_acrylics_040_id;
    
    IF colour_acrylics_040_id IS NULL THEN
        SELECT id INTO colour_acrylics_040_id FROM products 
        WHERE name ILIKE '%Colour Acrylics%' AND name ILIKE '%040%' LIMIT 1;
    END IF;

    RAISE NOTICE 'Products created/found successfully';

    -- Step 2: Update order items with correct product IDs
    -- Update each order item based on product name matching
    
    -- Colour Acrylics - 005
    UPDATE order_items 
    SET product_id = colour_acrylics_005_id 
    WHERE order_id = order_id_var 
    AND product_name = 'Colour Acrylics - 005';
    
    -- Colour Acrylics - Nude Snowkiss(E002)
    UPDATE order_items 
    SET product_id = colour_acrylics_nude_snowkiss_id 
    WHERE order_id = order_id_var 
    AND product_name = 'Colour Acrylics - Nude Snowkiss(E002)';
    
    -- Core Acrylics - Blom Cover Pink (072)
    UPDATE order_items 
    SET product_id = core_acrylics_blom_cover_pink_id 
    WHERE order_id = order_id_var 
    AND product_name = 'Core Acrylics - Blom Cover Pink (072)';
    
    -- Core Acrylics - Crystal Clear (073)
    UPDATE order_items 
    SET product_id = core_acrylics_crystal_clear_id 
    WHERE order_id = order_id_var 
    AND product_name = 'Core Acrylics - Crystal Clear (073)';
    
    -- Core Acrylics - The Perfect Milky White (074)
    UPDATE order_items 
    SET product_id = core_acrylics_milky_white_id 
    WHERE order_id = order_id_var 
    AND product_name = 'Core Acrylics - The Perfect Milky White (074)';
    
    -- Glitter Acrylic - 56g
    UPDATE order_items 
    SET product_id = glitter_acrylic_56g_id 
    WHERE order_id = order_id_var 
    AND product_name = 'Glitter Acrylic - 56g';
    
    -- Nail Forms - Default
    UPDATE order_items 
    SET product_id = nail_forms_default_id 
    WHERE order_id = order_id_var 
    AND product_name = 'Nail Forms - Default';
    
    -- Colour Acrylics (general)
    UPDATE order_items 
    SET product_id = colour_acrylics_general_id 
    WHERE order_id = order_id_var 
    AND product_name = 'Colour Acrylics';
    
    -- Hand Files - 5-Pack Bundle
    UPDATE order_items 
    SET product_id = hand_files_5pack_id 
    WHERE order_id = order_id_var 
    AND product_name = 'Hand Files - 5-Pack Bundle';
    
    -- Colour Acrylics - 064
    UPDATE order_items 
    SET product_id = colour_acrylics_064_id 
    WHERE order_id = order_id_var 
    AND product_name = 'Colour Acrylics - 064';
    
    -- Colour Acrylics - 040
    UPDATE order_items 
    SET product_id = colour_acrylics_040_id 
    WHERE order_id = order_id_var 
    AND product_name = 'Colour Acrylics - 040';

    RAISE NOTICE 'Order items updated successfully';

END $$;

-- Step 3: Verify the fix worked
SELECT 
    o.id as order_id,
    o.order_number,
    o.status,
    o.payment_status,
    COUNT(oi.id) as total_items,
    COUNT(CASE WHEN oi.product_id IS NOT NULL THEN 1 END) as items_with_product_id
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'
GROUP BY o.id, o.order_number, o.status, o.payment_status;