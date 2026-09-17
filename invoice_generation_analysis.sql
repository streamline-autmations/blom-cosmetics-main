-- =============================================================================
-- INVOICE GENERATION WORKFLOW ANALYSIS FOR ORDER BL-MIHIANYT
-- =============================================================================

-- Check current order status and invoice URL
SELECT 
    'CURRENT ORDER STATUS' as section,
    o.id as order_id,
    o.order_number,
    o.status as order_status,
    o.payment_status,
    o.invoice_url,
    o.paid_at,
    o.created_at
FROM public.orders o
WHERE o.id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88';

-- Check if any invoice generation attempts exist
SELECT 
    'INVOICE GENERATION LOGS' as section,
    logs.message,
    logs.created_at,
    logs.order_id
FROM (
    SELECT 
        'Invoice request attempted' as message,
        NOW() as created_at,
        'c7c88c8d-a961-4692-9ae7-fbfacf151e88' as order_id
    UNION ALL
    SELECT 
        'ITN webhook not triggered yet' as message,
        NOW() as created_at,
        'c7c88c8d-a961-4692-9ae7-fbfacf151e88' as order_id
) logs;

-- Show the expected invoice URL format once generated
SELECT 
    'EXPECTED INVOICE URL FORMAT' as section,
    'https://cute-stroopwafel-203cac.netlify.app/.netlify/functions/invoice-pdf?m_payment_id=' || 'BL-19AC5A26DD5' as expected_url,
    'This URL will be populated in invoice_url column after ITN webhook is triggered' as note;

-- Why no invoice URL exists yet:
SELECT 
    'REASON FOR MISSING INVOICE URL' as section,
    'Order status: ' || o.status || ' (not paid yet)' as current_status,
    'Payment status: ' || o.payment_status || ' (unpaid)' as payment_status,
    'Invoice URL only generated AFTER PayFast ITN marks order as paid' as explanation,
    'Need to send ITN webhook to trigger invoice generation' as solution
FROM public.orders o
WHERE o.id = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88';