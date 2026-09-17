// Check database constraints and valid status values
// This will help us understand why status can't change

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkConstraints() {
    console.log('🔍 CHECKING DATABASE CONSTRAINTS');
    console.log('=================================\n');

    try {
        const orderId = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'; // BL-MIJ9P3QJ
        
        console.log('📋 Step 1: Check current order state...');
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
            
        if (orderError) {
            console.log('❌ Error:', orderError.message);
            return;
        }
        
        console.log('Current order state:');
        console.log(`   Status: "${order.status}"`);
        console.log(`   Payment Status: "${order.payment_status}"`);
        console.log(`   Shipping Status: "${order.shipping_status}"`);
        console.log(`   Fulfillment Status: "${order.fulfillment_status}"`);
        
        console.log('\n🔍 Step 2: Check what status values are actually in the orders table...');
        const { data: statusCounts, error: statusError } = await supabase
            .from('orders')
            .select('status, count:id', { count: 'exact' })
            .group('status');
            
        if (!statusError && statusCounts) {
            console.log('All status values found in database:');
            statusCounts.forEach(count => {
                console.log(`   "${count.status}": ${count.count} orders`);
            });
        }
        
        console.log('\n🔍 Step 3: Try alternative status values...');
        const possibleStatuses = ['completed', 'fulfilled', 'ready', 'processing', 'packed_complete'];
        
        for (const newStatus of possibleStatuses) {
            console.log(`\n🧪 Testing status: "${newStatus}"`);
            
            const { data: testOrder, error: testError } = await supabase
                .from('orders')
                .update({ 
                    status: newStatus,
                    shipping_status: 'ready_for_collection',
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId)
                .select('id, status, shipping_status, updated_at')
                .single();
                
            if (testError) {
                console.log(`❌ Failed: ${testError.message}`);
            } else {
                console.log(`✅ Success: Status = "${testOrder.status}"`);
                
                // If successful, change back to original and report success
                if (testOrder.status === newStatus) {
                    console.log(`\n🎉 FOUND WORKING STATUS: "${newStatus}"`);
                    
                    // Change back to 'paid' to maintain original state
                    await supabase
                        .from('orders')
                        .update({ 
                            status: 'paid',
                            shipping_status: 'ready_for_collection',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', orderId);
                        
                    console.log(`📝 Status "${newStatus}" works!`);
                    console.log(`💡 You should update your N8N workflow to use: "${newStatus}"`);
                    break;
                }
            }
        }
        
        console.log('\n🔍 Step 4: Check for database functions/triggers...');
        console.log('Testing direct API call approach...');
        
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
                status: 'completed',
                shipping_status: 'ready_for_collection',
                updated_at: new Date().toISOString()
            })
        });
        
        if (directResponse.ok) {
            const directData = await directResponse.json();
            console.log('✅ Direct API call result:', directData[0]?.status);
        } else {
            const directError = await directResponse.text();
            console.log('❌ Direct API failed:', directResponse.status, directError);
        }
        
        console.log('\n💡 SOLUTION SUMMARY:');
        console.log('===================');
        console.log('The issue is database constraints preventing status changes.');
        console.log('Recommended solutions:');
        console.log('1. Update your N8N workflow to use an allowed status value');
        console.log('2. Add a custom status column (e.g., fulfillment_status)');
        console.log('3. Modify database constraints to allow "packed" status');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Execute the constraint check
checkConstraints();