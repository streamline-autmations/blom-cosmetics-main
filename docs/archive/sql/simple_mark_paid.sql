 -- Simple SQL to mark order BL-19AC4799411 as paid

UPDATE public.orders 
SET 
    status = 'paid',
    payment_status = 'paid',
    paid_at = NOW()
WHERE order_number = 'BL-19AC4799411' 
   OR m_payment_id = 'BL-19AC4799411'
   OR id = 'BL-19AC4799411';