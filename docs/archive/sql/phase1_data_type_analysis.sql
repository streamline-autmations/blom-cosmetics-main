-- PHASE 1.1: Check Actual Data Types
SELECT 
  'orders' as table_name,
  'id' as column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'id'

UNION ALL

SELECT 
  'order_items' as table_name,
  'order_id' as column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items' AND column_name = 'order_id'

UNION ALL

SELECT 
  'order_items' as table_name,
  'product_id' as column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items' AND column_name = 'product_id';