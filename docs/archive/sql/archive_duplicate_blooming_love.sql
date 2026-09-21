/*
  Fix: Archive the duplicate "Blooming Love Acrylic Collection" product
  
  Issue: Cannot delete product due to foreign key constraint (it's in an order).
  Solution: Archive it instead so it doesn't appear on the site.
  
  Target Product ID: 75309f85-b147-4e24-b050-18dc38b48b7e (from user error message)
*/

UPDATE public.products
SET 
  status = 'archived',
  is_active = false
WHERE id = '75309f85-b147-4e24-b050-18dc38b48b7e';
