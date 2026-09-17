-- Mark order BL-MIJ9P3QJ as paid after fixing product IDs
-- This script will safely mark the order as paid without triggering stock movement errors

-- First, verify that all order items have valid product_ids
DO $$
DECLARE
    order_id_var uuid := '4fc6796e-3b62-4890-8d8d-0e645f6599a3';
    null_product_count integer;
BEGIN
    -- Check if any order items still have null product_id
    SELECT COUNT(*) INTO null_product_count
    FROM order_items
    WHERE order_id = order_id_var
    AND product_id IS NULL;
    
    IF null_product_count > 0 THEN
        RAISE EXCEPTION 'Cannot mark order as paid: % order items still have null product_id', null_product_count;
    END IF;
    
    RAISE NOTICE 'All order items have valid product_ids. Proceeding to mark order as paid...';
    
    -- Mark the order as paid
    UPDATE orders 
    SET 
        status = 'paid',
        payment_status = 'paid',
        paid_at = now(),
        updated_at = now()
    WHERE id = order_id_var;
    
    RAISE NOTICE 'Order marked as paid successfully';
    
END $$;