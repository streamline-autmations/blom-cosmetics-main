-- Mark order BL-19ABA8EDDDF as paid
-- Generated on 2025-11-25

UPDATE public.orders 
SET 
  payment_status = 'paid',
  paid_at = now(),
  updated_at = now()
WHERE order_number = 'BL-19ABA8EDDDF';

-- Also update the order status from 'placed' to 'paid' so it shows as paid in admin app
UPDATE public.orders 
SET 
  status = 'paid'
WHERE order_number = 'BL-19ABA8EDDDF';