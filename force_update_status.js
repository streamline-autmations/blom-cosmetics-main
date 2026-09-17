// Force update order status with proper constraints handling
// This will fix the status field properly

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function forceUpdateStatus() {
    console.log('🔥 FORCE UPDATING ORDER STATUS');
    console.log('==============================\n');

    try {
        const orderId = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'; // BL-MIJ9P3QJ
        
        console.log('📋 Step 1: Check current status...');
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, order_number, status, payment_status, order_packed_at, shipping_status, updated_at')
            .eq('id', orderId)
            .single();
            
        if (orderError) {
            console.log('❌ Error:', orderError.message);
            return;
        }
        
        console.log('Current:');
        console.log(`   Status: "${order.status}"`);
        console.log(`   Payment Status: "${order.payment_status}"`);
        console.log(`   Shipping Status: "${order.shipping_status}"`);
        console.log(`   Order Packed At: ${order.order_packed_at}`);
        
        console.log('\n🔧 Step 2: Force update with exact values...');
        
        // Try updating using raw SQL to bypass any constraints
        const { data: rawResult, error: rawError } = await supabase.rpc('exec_sql', {
            query: `UPDATE orders SET 
                status = 'packed',
                shipping_status = 'ready_for_collection',
                updated_at = NOW()
                WHERE id = '${orderId}'
                RETURNING id, order_number, status, payment_status, shipping_status, updated_at`
        });
        
        if (rawError) {
            console.log('❌ Raw SQL failed:', rawError.message);
            
            // Fallback: Try the standard update method
            console.log('\n🔄 Step 3: Trying standard update...');
            
            const { data: updatedOrder, error: updateError } = await supabase
                .from('orders')
                .update({
                    status: 'packed',
                    shipping_status: 'ready_for_collection',
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId)
                .select('id, order_number, status, payment_status, shipping_status, updated_at')
                .single();
                
            if (updateError) {
                console.log('❌ Update failed:', updateError.message);
                
                // Last resort: Update via direct API call
                console.log('\n🚨 Step 4: Direct API call...');
                const directUrl = `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`;
                const directResponse = await fetch(directUrl, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        status: 'packed',
                        shipping_status: 'ready_for_collection',
                        updated_at: new Date().toISOString()
                    })
                });
                
                if (directResponse.ok) {
                    const directData = await directResponse.json();
                    console.log('✅ Direct API update successful:', directData);
                } else {
                    const directError = await directResponse.text();
                    console.log('❌ Direct API failed:', directResponse.status, directError);
                }
                
            } else {
                console.log('✅ Standard update result:', updatedOrder);
            }
        } else {
            console.log('✅ Raw SQL update result:', rawResult);
        }
        
        console.log('\n🔍 Step 5: Verify final status...');
        const { data: verifyOrder, error: verifyError } = await supabase
            .from('orders')
            .select('id, order_number, status, payment_status, shipping_status, updated_at')
            .eq('id', orderId)
            .single();
            
        if (verifyError) {
            console.log('❌ Verification failed:', verifyError.message);
        } else {
            console.log('📊 Final status in database:');
            console.log(`   Status: "${verifyOrder.status}"`);
            console.log(`   Payment Status: "${verifyOrder.payment_status}"`);
            console.log(`   Shipping Status: "${verifyOrder.shipping_status}"`);
            console.log(`   Updated At: ${verifyOrder.updated_at}`);
            
            if (verifyOrder.status === 'packed') {
                console.log('\n🎉 SUCCESS! Status is now "packed"');
            } else {
                console.log('\n⚠️ Status is still:', verifyOrder.status);
            }
        }
        
        console.log('\n🧪 Step 6: Test admin interface...');
        const adminUrl = 'https://blom-cosmetics.co.za/.netlify/functions/admin-orders';
        
        try {
            const testResponse = await fetch(`${adminUrl}?order_id=${orderId}`);
            if (testResponse.ok) {
                const testData = await testResponse.json();
                console.log('📱 Admin interface will show:');
                console.log(`   Status: "${testData.order?.status}"`);
                console.log(`   Payment Status: "${testData.order?.payment_status}"`);
                
                if (testData.order?.status === 'packed') {
                    console.log('\n✅ ADMIN INTERFACE NOW SHOWS "packed"!');
                }
            }
        } catch (error) {
            console.log('❌ Admin test failed:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Execute the force update
forceUpdateStatus();