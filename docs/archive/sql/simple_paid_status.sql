-- SIMPLE: Change order status from unpaid to paid
-- Order ID: 9f9e0f93-e380-4756-ae78-ff08a22cc7c9
-- Payment ID: BL-19AC8E4511F

-- Mark the order as paid
UPDATE public.orders 
SET 
    status = 'paid',
    payment_status = 'paid',
    paid_at = NOW()
WHERE id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'
   OR m_payment_id = 'BL-19AC8E4511F';

-- Verify the update
SELECT 
    id,
    order_number,
    m_payment_id,
    status,
    payment_status,
    paid_at,
    buyer_email,
    total
FROM public.orders 
WHERE id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9'
   OR m_payment_id = 'BL-19AC8E4511F';