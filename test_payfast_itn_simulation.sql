the -- TEST SCRIPT: Simulate PayFast ITN Webhook for Order BL-MIHIANYT
-- This will mark the order as paid and trigger the new-order-alert webhook

-- Step 1: Get the complete order information first
SELECT 
    'COMPLETE ORDER INFO - BEFORE PAYMENT' as status,
    o.id as order_id,
    o.order_number,
    o.m_payment_id,
    o.status,
    o.payment_status,
    o.total,
    o.buyer_email,
    o.buyer_name,
    o.created_at
FROM public.orders o
WHERE o.order_number = 'BL-MIHIANYT';

-- Step 2: Simulate PayFast ITN webhook data
-- This is the data that would normally come from PayFast when payment is completed
DO $$
DECLARE
    test_order_id text := 'c7c88c8d-a961-4692-9ae7-fbfacf151e88';
    test_payment_id text := 'BL-19AC5A26DD5';
    test_amount text := '290.00';
    test_signature text := 'test_signature_123'; -- In real scenario, this would be calculated
    test_pnr text := 'PF-TEST-' || extract(epoch from now())::text;
    current_time timestamptz := now();
BEGIN
    RAISE NOTICE 'SIMULATING PAYFAST ITN WEBHOOK';
    RAISE NOTICE 'Order ID: %', test_order_id;
    RAISE NOTICE 'Payment ID: %', test_payment_id;
    RAISE NOTICE 'Amount: %', test_amount;
    RAISE NOTICE 'PNR: %', test_pnr;
    RAISE NOTICE 'Time: %', current_time;
END $$;

-- Step 3: Mark the order as paid (simulating successful PayFast ITN)
UPDATE public.orders 
SET 
    status = 'paid',
    payment_status = 'paid',
    paid_at = now(),
    provider_txn_id = 'PF-TEST-' || extract(epoch from now())::text
WHERE order_number = 'BL-MIHIANYT' 
   OR m_payment_id = 'BL-19AC5A26DD5'
   OR id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88';

-- Step 4: Verify the order was marked as paid
SELECT 
    'ORDER STATUS - AFTER PAYMENT' as status,
    o.id as order_id,
    o.order_number,
    o.m_payment_id,
    o.status,
    o.payment_status,
    o.paid_at,
    o.provider_txn_id,
    o.total,
    o.buyer_email
FROM public.orders o
WHERE o.order_number = 'BL-MIHIANYT';

-- Step 5: Check if stock movements were created (for stock deduction)
SELECT 
    'STOCK MOVEMENTS CREATED' as status,
    sm.id,
    sm.product_id,
    sm.order_id,
    sm.delta,
    sm.reason,
    sm.reference,
    sm.created_at,
    p.name as product_name
FROM public.stock_movements sm
LEFT JOIN public.products p ON sm.product_id = p.id
WHERE sm.order_id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88'
ORDER BY sm.created_at DESC;

-- Step 6: Test the webhook trigger manually (if needed)
-- This simulates what the payfast-itn function would call
DO $$
DECLARE
    webhook_result text;
BEGIN
    -- This would normally be called by the payfast-itn function
    -- For testing, we'll just note that it would trigger
    RAISE NOTICE 'WEBHOOK TRIGGER SIMULATION:';
    RAISE NOTICE '- new-order-alert webhook would be triggered';
    RAISE NOTICE '- Order data would be sent to: https://dockerfile-1n82.onrender.com/webhook/new-order-alert';
    RAISE NOTICE '- Payload would include: order details, customer info, items, payment info';
    RAISE NOTICE 'In real scenario, this would be done via:';
    RAISE NOTICE 'fetch(webhook_url, { method: ''POST'', headers: {''Content-Type'': ''application/json''}, body: JSON.stringify({order_id: ''%''}) })', 'c7c88c8d-a961-4692-9ae7-fbfacf151e88';
END $$;

-- Step 7: Final verification - show current stock levels for ordered items
SELECT 
    'FINAL STOCK LEVELS' as status,
    p.id,
    p.name,
    p.stock_on_hand,
    oi.quantity as ordered_qty,
    (p.stock_on_hand - COALESCE(oi.quantity, 0)) as remaining_stock
FROM public.products p
LEFT JOIN public.order_items oi ON p.id = oi.product_id
WHERE oi.order_id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88'
ORDER BY p.name;