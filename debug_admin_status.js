// Debug admin order status issue
// This script will help identify why the admin interface doesn't show "packed" status

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function debugOrderStatus() {
    console.log('🔍 DEBUGGING ADMIN ORDER STATUS ISSUE');
    console.log('=====================================\n');

    try {
        // Check the order that was marked as packed
        const orderId = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'; // BL-MIJ9P3QJ
        
        console.log('📋 Step 1: Checking current order status in database...');
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
            
        if (orderError) {
            console.log('❌ Error fetching order:', orderError.message);
            return;
        }
        
        console.log('✅ Order found in database:');
        console.log(`   ID: ${order.id}`);
        console.log(`   Order Number: ${order.order_number}`);
        console.log(`   Payment ID: ${order.m_payment_id}`);
        console.log(`   Status: "${order.status}"`);
        console.log(`   Payment Status: "${order.payment_status}"`);
        console.log(`   Updated At: ${order.updated_at}`);
        console.log(`   Packed At: ${order.order_packed_at || 'NOT SET'}`);
        
        // Check what status the admin interface would show
        console.log('\n📱 Step 2: Simulating admin interface response...');
        const adminResponse = {
            id: order.id,
            order_number: order.order_number,
            m_payment_id: order.m_payment_id,
            status: order.status,
            payment_status: order.payment_status,
            total: order.total,
            currency: order.currency,
            created_at: order.created_at,
            paid_at: order.paid_at,
            invoice_url: order.invoice_url,
            buyer_name: order.buyer_name,
            buyer_email: order.buyer_email,
            buyer_phone: order.buyer_phone,
            shipping_method: order.shipping_method,
            fulfillment_method: order.fulfillment_method,
            fulfillment_type: order.fulfillment_type,
            delivery_address: order.delivery_address,
            collection_location: order.collection_location,
            subtotal_cents: order.subtotal_cents,
            shipping_cents: order.shipping_cents,
            discount_cents: order.discount_cents
        };
        
        console.log('🎯 Admin Interface would show:');
        console.log(`   Status: "${adminResponse.status}"`);
        console.log(`   Payment Status: "${adminResponse.payment_status}"`);
        
        // Get order items
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('product_name, sku, quantity, unit_price')
            .eq('order_id', orderId);
            
        if (!itemsError && items) {
            console.log('\n🛍️ Order Items:');
            items.forEach(item => {
                console.log(`   • ${item.product_name} (${item.sku}) - R${item.unit_price} x ${item.quantity}`);
            });
        }
        
        // Check if there are any additional status fields
        console.log('\n🔍 Step 3: Checking all status-related fields...');
        const statusFields = ['status', 'payment_status', 'fulfillment_status', 'shipping_status', 'order_status'];
        statusFields.forEach(field => {
            if (order[field]) {
                console.log(`   ${field}: "${order[field]}"`);
            }
        });
        
        // Check for packed-specific fields
        if (order.order_packed_at) {
            console.log(`   order_packed_at: ${order.order_packed_at}`);
        }
        
        // Provide recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('===================');
        
        if (order.status === 'packed') {
            console.log('✅ Status is correctly set to "packed" in database');
            console.log('🔧 Issue is likely frontend caching or refresh problem');
            console.log('💡 Solutions:');
            console.log('   1. Admin interface needs hard refresh (Ctrl+F5)');
            console.log('   2. Check if admin interface polls for updates');
            console.log('   3. Clear browser cache');
            console.log('   4. Add auto-refresh to admin interface');
        } else {
            console.log('❌ Status is NOT "packed" in database');
            console.log('🔧 Issue is N8N workflow not updating correctly');
            console.log('💡 Solutions:');
            console.log('   1. Check N8N HTTP node is updating the "status" field');
            console.log('   2. Verify N8N is hitting the correct Supabase endpoint');
            console.log('   3. Check N8N workflow authentication');
        }
        
        // Test the admin interface endpoint
        console.log('\n🧪 Step 4: Testing admin interface endpoint...');
        const adminUrl = 'https://blom-cosmetics.co.za/.netlify/functions/admin-orders';
        
        try {
            const testResponse = await fetch(`${adminUrl}?order_id=${orderId}`);
            if (testResponse.ok) {
                const testData = await testResponse.json();
                console.log('✅ Admin endpoint working - Status shown:', testData.order?.status);
            } else {
                console.log('❌ Admin endpoint error:', testResponse.status);
            }
        } catch (error) {
            console.log('❌ Admin endpoint unreachable:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Error during debug:', error.message);
    }
}

// Execute the debug
debugOrderStatus();