-- Mark order BL-19ABA0F0B2B as paid
-- Update the payment status from 'unpaid' to 'paid'

UPDATE public.orders 
SET 
  payment_status = 'paid',
  paid_at = now(),
  updated_at = now()
WHERE order_number = 'BL-19ABA0F0B2B';

-- Also update the order status from 'placed' to 'confirmed' or 'processing' 
-- if you want to change the overall order status as well
UPDATE public.orders 
SET 
  status = 'confirmed',
  updated_at = now()
WHERE order_number = 'BL-19ABA0F0B2B' 
  AND status = 'placed';

-- Optional: Add payment reference/method details
-- UPDATE public.orders 
-- SET 
--   payment_method = 'card', -- or 'eft', 'cash', etc.
--   payment_reference = 'PAY-123456', -- payment gateway reference
--   updated_at = now()
-- WHERE order_number = 'BL-19ABA0F0B2B';

-- Check the result
SELECT 
  order_number,
  status,
  payment_status,
  paid_at,
  updated_at
FROM public.orders 
WHERE order_number = 'BL-19ABA0F0B2B';