-- Mark order BL-19AC8E4511F as paid
-- Payment ID: BL-19AC8E4511F
-- Sender: Christiaan Steffen (christiaansteffen12345@gmail.com)
-- Amount: R 5.00

UPDATE public.orders 
SET 
    status = 'paid',
    payment_status = 'paid',
    paid_at = NOW()
WHERE order_number = 'BL-19AC8E4511F' 
   OR m_payment_id = 'BL-19AC8E4511F'
   OR id = 'BL-19AC8E4511F';

-- Verify the update worked
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
WHERE order_number = 'BL-19AC8E4511F' 
   OR m_payment_id = 'BL-19AC8E4511F'
   OR id = 'BL-19AC8E4511F';