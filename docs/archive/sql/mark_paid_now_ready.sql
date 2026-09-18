-- MARK ORDER AS PAID - Now that product_id is fixed
-- Order ID: 9f9e0f93-e380-4756-ae78-ff08a22cc7c9
-- Payment ID: BL-19AC8E4511F

-- Now that all order items have valid product_id, mark the order as paid
UPDATE public.orders 
SET 
    status = 'paid',
    payment_status = 'paid',
    paid_at = NOW()
WHERE id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9';

-- Verify the order is now marked as paid
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
WHERE id = '9f9e0f93-e380-4756-ae78-ff08a22cc7c9';