// Fix the order status to show "packed" in admin interface
// This manually updates the status field that N8N should be updating

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fixOrderStatus() {
    console.log('🔧 FIXING ORDER STATUS FOR ADMIN INTERFACE');
    console.log('==========================================\n');

    try {
        const orderId = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'; // BL-MIJ9P3QJ
        
        console.log('📋 Step 1: Getting current order status...');
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, order_number, status, payment_status, order_packed_at, shipping_status')
            .eq('id', orderId)
            .single();
            
        if (orderError) {
            console.log('❌ Error fetching order:', orderError.message);
            return;
        }
        
        console.log('✅ Current status in database:');
        console.log(`   Order: ${order.order_number}`);
        console.log(`   Status: "${order.status}"`);
        console.log(`   Payment Status: "${order.payment_status}"`);
        console.log(`   Order Packed At: ${order.order_packed_at}`);
        console.log(`   Shipping Status: "${order.shipping_status}"`);
        
        console.log('\n🔧 Step 2: Updating status to "packed"...');
        
        const updateData = {
            status: 'packed',
            shipping_status: 'ready_for_collection',
            updated_at: new Date().toISOString()
        };
        
        console.log('Update data:', updateData);
        
        const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId)
            .select('id, order_number, status, payment_status, shipping_status, updated_at')
            .single();
            
        if (updateError) {
            console.log('❌ Error updating order:', updateError.message);
            return;
        }
        
        console.log('\n✅ Status updated successfully!');
        console.log('   Order: ${updatedOrder.order_number}');
        console.log(`   Status: "${updatedOrder.status}"`);
        console.log(`   Payment Status: "${updatedOrder.payment_status}"`);
        console.log(`   Shipping Status: "${updatedOrder.shipping_status}"`);
        console.log(`   Updated At: ${updatedOrder.updated_at}`);
        
        console.log('\n🎯 Step 3: Testing admin interface...');
        const adminUrl = 'https://blom-cosmetics.co.za/.netlify/functions/admin-orders';
        
        try {
            const testResponse = await fetch(`${adminUrl}?order_id=${orderId}`);
            if (testResponse.ok) {
                const testData = await testResponse.json();
                console.log('✅ Admin endpoint response:');
                console.log(`   Status: "${testData.order?.status}"`);
                console.log(`   Payment Status: "${testData.order?.payment_status}"`);
                
                if (testData.order?.status === 'packed') {
                    console.log('\n🎉 SUCCESS! Admin interface will now show "packed" status');
                } else {
                    console.log('\n⚠️ Warning: Admin interface still shows different status');
                }
            } else {
                console.log('❌ Admin endpoint error:', testResponse.status);
            }
        } catch (error) {
            console.log('❌ Admin endpoint unreachable:', error.message);
        }
        
        console.log('\n💡 N8N WORKFLOW FIX NEEDED:');
        console.log('============================');
        console.log('Your N8N HTTP node should update these fields:');
        console.log('• status: "packed"');
        console.log('• shipping_status: "ready_for_collection"');
        console.log('• updated_at: current_timestamp');
        console.log('\n❌ Currently it only sets:');
        console.log('• order_packed_at: timestamp');
        console.log('\n🔧 Fix your N8N workflow to update the status field as well!');
        
    } catch (error) {
        console.error('❌ Error during fix:', error.message);
    }
}

// Execute the fix
fixOrderStatus();