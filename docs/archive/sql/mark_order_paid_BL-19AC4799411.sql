-- Update order status from 'placed' to 'paid'
-- This will mark the order as paid and trigger the new order alert webhook

UPDATE public.orders 
SET 
    status = 'paid',
    payment_status = 'paid',
    paid_at = NOW()
WHERE order_number = 'BL-19AC4799411' 
   OR m_payment_id = 'BL-19AC4799411'
   OR id = 'BL-19AC4799411';

-- Verify the update
SELECT 
    id,
    order_number,
    m_payment_id,
    status,
    payment_status,
    paid_at,
    buyer_email,
    total,
    created_at
FROM public.orders 
WHERE order_number = 'BL-19AC4799411' 
   OR m_payment_id = 'BL-19AC4799411'
   OR id = 'BL-19AC4799411';