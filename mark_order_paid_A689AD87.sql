-- SQL to mark order A689AD87 as paid
-- This will update the payment_status, status, and paid_at fields
-- The trigger will automatically sync status to 'paid' when payment_status is set to 'paid'

UPDATE orders
SET 
  payment_status = 'paid',
  status = 'paid',
  paid_at = NOW()
WHERE order_number = 'A689AD87';

-- Verify the update
SELECT 
  order_number,
  status,
  payment_status,
  paid_at,
  buyer_email,
  buyer_name,
  total,
  created_at
FROM orders
WHERE order_number = 'A689AD87';
