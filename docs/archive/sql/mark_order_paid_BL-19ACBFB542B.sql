-- Direct fix for order BL-MIJ9P3QJ (4fc6796e-3b62-4890-8d8d-0e645f6599a3)
-- This will mark the order as paid which should enable invoice generation

-- Step 1: Mark order as paid
UPDATE public.orders 
SET 
    status = 'paid',
    payment_status = 'paid',
    paid_at = NOW(),
    updated_at = NOW()
WHERE id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3';

-- Step 2: Verify the update worked
SELECT 
    id,
    m_payment_id,
    order_number,
    status,
    payment_status,
    paid_at,
    invoice_url,
    total
FROM public.orders 
WHERE id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3';