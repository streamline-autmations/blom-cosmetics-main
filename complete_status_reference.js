// Simple check for all shipping_status values and sample orders
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function getAllStatuses() {
    console.log('📊 COMPLETE SHIPPING_STATUS REFERENCE');
    console.log('=====================================\n');

    try {
        // Get all orders with their status information
        const { data: orders, error } = await supabase
            .from('orders')
            .select('order_number, status, shipping_status, fulfillment_status, payment_status, order_packed_at')
            .order('created_at', { ascending: false })
            .limit(20);
            
        if (error) {
            console.log('❌ Error:', error.message);
            return;
        }
        
        console.log('📋 Current Database Status Values:');
        console.log('==================================');
        
        const shippingStatuses = new Set();
        const fulfillmentStatuses = new Set();
        const mainStatuses = new Set();
        
        orders.forEach(order => {
            if (order.shipping_status) shippingStatuses.add(order.shipping_status);
            if (order.fulfillment_status) fulfillmentStatuses.add(order.fulfillment_status);
            if (order.status) mainStatuses.add(order.status);
        });
        
        console.log('\n🎯 Valid shipping_status values:');
        shippingStatuses.forEach((status, index) => {
            console.log(`   ${index + 1}. "${status}"`);
        });
        
        console.log('\n📦 Valid fulfillment_status values:');
        if (fulfillmentStatuses.size > 0) {
            fulfillmentStatuses.forEach((status, index) => {
                console.log(`   ${index + 1}. "${status}"`);
            });
        } else {
            console.log('   (Currently not used)');
        }
        
        console.log('\n💰 Valid main status values:');
        mainStatuses.forEach((status, index) => {
            console.log(`   ${index + 1}. "${status}"`);
        });
        
        console.log('\n📋 Sample Orders:');
        console.log('==================');
        orders.slice(0, 5).forEach(order => {
            console.log(`${order.order_number}:`);
            console.log(`   Main Status: "${order.status}"`);
            console.log(`   Shipping Status: "${order.shipping_status || 'null'}"`);
            console.log(`   Fulfillment Status: "${order.fulfillment_status || 'null'}"`);
            console.log(`   Payment Status: "${order.payment_status}"`);
            console.log(`   Order Packed At: ${order.order_packed_at || 'not set'}`);
            console.log('');
        });
        
        console.log('💡 RECOMMENDED SHIPPING_STATUS VALUES FOR YOUR N8N:');
        console.log('==================================================');
        const recommendedValues = [
            'pending',               // Order received, not processed yet
            'ready_for_collection',  // Order is packed and ready for customer pickup
            'ready_for_delivery',    // Order is packed and ready for delivery
            'shipped',               // Order has been shipped
            'delivered',             // Order has been delivered
            'cancelled'              // Order was cancelled
        ];
        
        recommendedValues.forEach((value, index) => {
            const exists = Array.from(shippingStatuses).includes(value);
            console.log(`   ${index + 1}. "${value}" ${exists ? '✅' : '❓ (Available)'}`);
        });
        
        console.log('\n🔧 FOR YOUR CURRENT "PACKED" STATUS:');
        console.log('===================================');
        console.log('Use this in your N8N HTTP node:');
        console.log('');
        console.log('{');
        console.log('  "shipping_status": "ready_for_collection",');
        console.log('  "order_packed_at": "2025-12-01T13:22:12.561Z",');
        console.log('  "updated_at": "2025-12-01T13:22:12.561Z"');
        console.log('}');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

getAllStatuses();