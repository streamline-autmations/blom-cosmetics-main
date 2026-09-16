-- FINAL: Mark order as paid and test webhook
-- This will trigger the new order alert webhook automatically

-- Mark order BL-19AC4799411 as paid
UPDATE public.orders 
SET 
    status = 'paid',
    payment_status = 'paid',
    paid_at = NOW()
WHERE order_number = 'BL-19AC4799411' 
   OR m_payment_id = 'BL-19AC4799411'
   OR id = 'BL-19AC4799411';

-- Verify the update worked
SELECT 
    order_number,
    status,
    payment_status,
    paid_at,
    buyer_email,
    total
FROM public.orders 
WHERE order_number = 'BL-19AC4799411' 
   OR m_payment_id = 'BL-19AC4799411'
   OR id = 'BL-19AC4799411';