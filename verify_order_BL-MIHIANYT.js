// =============================================================================
// ORDER STATUS VERIFICATION SCRIPT FOR BL-MIHIANYT
// Run this after sending the PayFast ITN webhook to verify the order was marked as paid
// =============================================================================

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration');
    console.log('💡 Set these environment variables:');
    console.log('   SUPABASE_URL=your_supabase_url');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyOrderStatus() {
    try {
        console.log('🔍 Verifying order status for BL-MIHIANYT...');
        console.log('');

        // Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', 'c7c88c8d-a961-4692-9ae7-fbfacf151e88')
            .single();

        if (orderError) {
            console.error('❌ Error fetching order:', orderError.message);
            return;
        }

        console.log('📋 ORDER HEADER:');
        console.log(`   Order ID: ${order.id}`);
        console.log(`   Order Number: ${order.order_number}`);
        console.log(`   Payment ID: ${order.m_payment_id}`);
        console.log(`   Status: ${order.status} ${order.status === 'paid' ? '✅' : '❌'}`);
        console.log(`   Payment Status: ${order.payment_status} ${order.payment_status === 'paid' ? '✅' : '❌'}`);
        console.log(`   Total: R${order.total}`);
        console.log(`   Customer: ${order.buyer_name} (${order.buyer_email})`);
        console.log(`   Created: ${order.created_at}`);
        console.log(`   Paid At: ${order.paid_at || 'Not paid yet'}`);
        console.log('');

        // Get order items
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

        if (itemsError) {
            console.error('❌ Error fetching order items:', itemsError.message);
            return;
        }

        console.log('🛒 ORDER ITEMS:');
        items.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.product_name} - Qty: ${item.quantity} - Price: R${item.price}`);
        });
        console.log('');

        // Calculate totals
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const calculatedTotal = items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);

        console.log('📊 ORDER SUMMARY:');
        console.log(`   Total Items: ${totalItems}`);
        console.log(`   Calculated Total: R${calculatedTotal.toFixed(2)}`);
        console.log(`   Order Total: R${order.total}`);
        console.log(`   Match: ${Math.abs(calculatedTotal - parseFloat(order.total)) < 0.01 ? '✅' : '❌'}`);
        console.log('');

        // Final status
        const isPaid = order.status === 'paid' && order.payment_status === 'paid';
        console.log('🎯 FINAL STATUS:');
        if (isPaid) {
            console.log('   ✅ ORDER IS SUCCESSFULLY MARKED AS PAID!');
            console.log('   ✅ PayFast ITN webhook worked correctly');
            console.log('   ✅ Order can now proceed to fulfillment');
        } else {
            console.log('   ❌ ORDER IS NOT MARKED AS PAID');
            console.log('   🔍 Check your PayFast ITN webhook response');
            console.log('   🔍 Verify the webhook was sent successfully');
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
    }
}

verifyOrderStatus();