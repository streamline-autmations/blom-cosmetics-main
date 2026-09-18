-- 🛠️ Part 1: The Bundle & Stock Logic (Database)
-- 1. Create a Robust Stock Deduction Function that handles Bundles

CREATE OR REPLACE FUNCTION process_stock_deduction_with_bundles(p_order_id uuid)
RETURNS json AS $$
DECLARE
  item RECORD;
  comp RECORD;
  product_found uuid;
  bundle_components jsonb;
  results json := '[]'::json;
BEGIN
  -- Loop through every item in the order
  FOR item IN SELECT * FROM order_items WHERE order_id = p_order_id LOOP
    
    -- A. Identify the Product (Try ID first, then Fuzzy Name Match)
    product_found := item.product_id;
    
    IF product_found IS NULL THEN
      SELECT id INTO product_found FROM products 
      WHERE LOWER(name) = LOWER(TRIM(item.name)) 
         OR LOWER(name) = LOWER(TRIM(SPLIT_PART(item.name, ' - ', 1))) -- Try Parent Name
      LIMIT 1;
    END IF;

    IF product_found IS NOT NULL THEN
      -- B. Check if it's a Bundle (Look for bundle_products definition)
      SELECT bundle_products INTO bundle_components FROM bundles WHERE id = product_found; -- Check bundles table
      
      -- Fallback: Check if products table has a bundle column (depending on your schema)
      IF bundle_components IS NULL THEN
         SELECT metadata->'bundle_products' INTO bundle_components FROM products WHERE id = product_found;
      END IF;

      -- C. DEDUCT STOCK
      IF bundle_components IS NOT NULL AND jsonb_array_length(bundle_components) > 0 THEN
        -- It IS a Bundle: Deduct the components
        FOR comp IN SELECT * FROM jsonb_to_recordset(bundle_components) AS x(id uuid, qty int) LOOP
           UPDATE products SET stock = stock - (comp.qty * item.quantity) WHERE id = comp.id;
           PERFORM log_stock_movement(comp.id, -(comp.qty * item.quantity), 'Bundle Sale: ' || item.name);
        END LOOP;
        results := results || json_build_object('item', item.name, 'status', 'Bundle Components Deducted')::json;
      ELSE
        -- It is a Normal Product: Deduct directly
        UPDATE products SET stock = stock - item.quantity WHERE id = product_found;
        PERFORM log_stock_movement(product_found, -item.quantity, 'Order Sale: ' || item.order_number);
        results := results || json_build_object('item', item.name, 'status', 'Product Deducted')::json;
      END IF;

      -- D. Link the Item to the Product ID (Self-Repair)
      UPDATE order_items SET product_id = product_found WHERE id = item.id AND product_id IS NULL;
      
    ELSE
      results := results || json_build_object('item', item.name, 'status', 'Failed - Unknown Product')::json;
    END IF;
  END LOOP;

  RETURN results;
END;
$$ LANGUAGE plpgsql;

-- 2. Auto-Link "Unknown" Products for your specific Broken Order (BL-MIPUOEVV)
-- This uses fuzzy matching to find the closest product name
UPDATE order_items
SET product_id = p.id, name = p.name
FROM products p
WHERE order_items.order_id = '85a0609d-1d50-4ace-af1e-39f89e5e9564' -- Your Broken Order ID
  AND order_items.product_id IS NULL
  AND (
      LOWER(p.name) = LOWER(order_items.name) -- Exact match
      OR p.name ILIKE '%' || split_part(order_items.name, ' - ', 1) || '%' -- Partial match
  );

-- 3. Trigger the stock deduction for the broken order manually now
SELECT process_stock_deduction_with_bundles('85a0609d-1d50-4ace-af1e-39f89e5e9564');