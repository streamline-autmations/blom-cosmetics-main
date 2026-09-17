// Check all valid shipping_status values in the database
// This will show you all the status options you can use

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function getShippingStatusValues() {
    console.log('🔍 CHECKING ALL VALID SHIPPING_STATUS VALUES');
    console.log('=============================================\n');

    try {
        console.log('📋 Step 1: Get all shipping_status values from database...');
        
        // Get all distinct shipping_status values
        const { data: statuses, error: statusError } = await supabase
            .from('orders')
            .select('shipping_status')
            .not('shipping_status', 'is', null)
            .order('shipping_status');
            
        if (statusError) {
            console.log('❌ Error fetching statuses:', statusError.message);
            return;
        }
        
        console.log('✅ All shipping_status values found:');
        const uniqueStatuses = [...new Set(statuses.map(order => order.shipping_status))];
        uniqueStatuses.forEach((status, index) => {
            console.log(`   ${index + 1}. "${status}"`);
        });
        
        console.log('\n📊 Step 2: Count orders per shipping_status...');
        const { data: statusCounts, error: countError } = await supabase
            .from('orders')
            .select('shipping_status', { count: 'exact' })
            .not('shipping_status', 'is', null)
            .group('shipping_status');
            
        if (!countError && statusCounts) {
            console.log('Order counts per status:');
            statusCounts.forEach(count => {
                const orderCount = count.count || 0;
                console.log(`   "${count.shipping_status}": ${orderCount} orders`);
            });
        }
        
        console.log('\n🎯 Step 3: Check fulfillment_status values too...');
        const { data: fulfillmentStatuses, error: fulfillmentError } = await supabase
            .from('orders')
            .select('fulfillment_status')
            .not('fulfillment_status', 'is', null)
            .order('fulfillment_status');
            
        if (!fulfillmentError && fulfillmentStatuses) {
            const uniqueFulfillmentStatuses = [...new Set(fulfillmentStatuses.map(order => order.fulfillment_status))];
            console.log('All fulfillment_status values:');
            uniqueFulfillmentStatuses.forEach((status, index) => {
                console.log(`   ${index + 1}. "${status}"`);
            });
        }
        
        console.log('\n📋 Step 4: Sample orders with different statuses...');
        const { data: sampleOrders, error: sampleError } = await supabase
            .from('orders')
            .select('order_number, status, shipping_status, fulfillment_status, payment_status')
            .not('shipping_status', 'is', null)
            .limit(10);
            
        if (!sampleError && sampleOrders) {
            console.log('Sample orders with their status combinations:');
            sampleOrders.forEach(order => {
                console.log(`   ${order.order_number}: status="${order.status}" | shipping="${order.shipping_status}" | fulfillment="${order.fulfillment_status || 'null'}"`);
            });
        }
        
        console.log('\n💡 RECOMMENDED SHIPPING_STATUS VALUES:');
        console.log('=====================================');
        console.log('Based on your current system, you can use:');
        
        // Common shipping status recommendations
        const recommendedStatuses = [
            'pending',
            'processing', 
            'packed',
            'ready_for_collection',
            'ready_for_delivery',
            'shipped',
            'delivered',
            'cancelled'
        ];
        
        recommendedStatuses.forEach((status, index) => {
            const isUsed = uniqueStatuses.includes(status);
            const icon = isUsed ? '✅' : '❓';
            console.log(`   ${index + 1}. "${status}" ${icon} (${isUsed ? 'Currently used' : 'Available for use'})`);
        });
        
        console.log('\n🔧 FOR YOUR N8N WORKFLOW:');
        console.log('==========================');
        console.log('Use this JSON in your HTTP node:');
        console.log('```json');
        console.log('{');
        console.log('  "shipping_status": "ready_for_collection",');
        console.log('  "order_packed_at": "2025-12-01T12:23:23.666+00:00",');
        console.log('  "updated_at": "2025-12-01T13:21:06.121Z"');
        console.log('}');
        console.log('```');
        
        console.log('\n🎯 TO SHOW "PACKED" IN ADMIN INTERFACE:');
        console.log('========================================');
        console.log('Update your admin interface to check:');
        console.log('• If shipping_status = "ready_for_collection" AND');
        console.log('• If order_packed_at is set,');
        console.log('• Then display "Ready for Collection" or "Packed"');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Execute the status check
getShippingStatusValues();