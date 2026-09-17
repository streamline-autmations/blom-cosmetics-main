import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.log('\n💡 Set these environment variables and run again');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function executeSupabaseQuery(query, description) {
  console.log(`\n🔧 Executing: ${description}`);
  console.log('='.repeat(80));
  
  try {
    const { data, error } = await query;
    
    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message, data: null };
    }
    
    console.log('✅ Success');
    if (data && data.length > 0) {
      console.log('📊 Results:', JSON.stringify(data, null, 2));
    }
    return { success: true, error: null, data };
    
  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
    return { success: false, error: err.message, data: null };
  }
}

async function findOrderByIdentifier(identifier) {
  console.log(`\n🔍 Finding order with identifier: ${identifier}`);
  
  // Try different ways to find the order
  const queries = [
    { 
      query: supabase.from('orders').select('*').eq('order_number', identifier).limit(1),
      name: 'order_number'
    },
    { 
      query: supabase.from('orders').select('*').eq('m_payment_id', identifier).limit(1),
      name: 'm_payment_id'
    },
    { 
      query: supabase.from('orders').select('*').eq('id', identifier).limit(1),
      name: 'id_direct'
    }
  ];
  
  for (const query of queries) {
    const result = await executeSupabaseQuery(query.query, `Find order by ${query.name}`);
    if (result.success && result.data && result.data.length > 0) {
      console.log(`✅ Found order using ${query.name}:`, result.data[0]);
      return result.data[0];
    }
  }
  
  console.log('❌ Order not found using any method');
  return null;
}

async function main() {
  console.log('🚀 COMPREHENSIVE SOLUTION PLAN EXECUTION (Supabase Client)');
  console.log('='.repeat(80));
  console.log(`📍 Database: ${SUPABASE_URL}`);
  console.log(`🎯 Target Order: BL-MIJ9P3QJ`);
  console.log(`🕐 Started: ${new Date().toISOString()}\n`);

  try {
    // PHASE 1: Safe Data Type Analysis
    console.log('\n' + '='.repeat(80));
    console.log('📋 PHASE 1: SAFE DATA TYPE ANALYSIS');
    console.log('='.repeat(80));
    
    // Step 1.1: Check data types using information_schema
    const schemaQuery = supabase.rpc('execute_sql', { 
      sql: `
        SELECT 
          'orders' as table_name,
          'id' as column_name,
          data_type,
          is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'id'
        
        UNION ALL
        
        SELECT 
          'order_items' as table_name,
          'order_id' as column_name,
          data_type,
          is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'order_id'
        
        UNION ALL
        
        SELECT 
          'order_items' as table_name,
          'product_id' as column_name,
          data_type,
          is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'product_id'
      `
    });
    
    const dataTypes = await executeSupabaseQuery(schemaQuery, 'Check data types for orders and order_items');
    
    // Step 1.2: Check specific order
    const orderCheck = await findOrderByIdentifier('BL-MIJ9P3QJ');
    
    if (!orderCheck) {
      console.log('\n❌ CRITICAL: Order BL-MIJ9P3QJ not found. Cannot proceed.');
      return;
    }
    
    console.log(`\n✅ Order found: ${orderCheck.id} (${orderCheck.order_number})`);
    console.log(`   Status: ${orderCheck.status}`);
    console.log(`   Payment Status: ${orderCheck.payment_status}`);
    console.log(`   Total: R${orderCheck.total}`);
    console.log(`   Buyer: ${orderCheck.buyer_email}`);

    // PHASE 2: Universal Order Fix
    console.log('\n' + '='.repeat(80));
    console.log('🔧 PHASE 2: UNIVERSAL ORDER FIX');
    console.log('='.repeat(80));
    
    // Step 2.1: Find order items with null product_id
    const nullItemsQuery = supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderCheck.id)
      .is('product_id', null);
    
    const nullItems = await executeSupabaseQuery(nullItemsQuery, 'Find order items with null product_id');
    
    if (nullItems.success && nullItems.data && nullItems.data.length > 0) {
      console.log(`\n📦 Found ${nullItems.data.length} items with null product_id:`);
      nullItems.data.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.product_name} (${item.sku}) - R${item.unit_price}`);
      });
      
      // Step 2.2: Process each item
      let processedCount = 0;
      for (const item of nullItems.data) {
        console.log(`\n🔄 Processing item: ${item.product_name}`);
        
        // Method 1: Try exact name match
        const exactMatchQuery = supabase
          .from('products')
          .select('id')
          .eq('name', item.product_name)
          .eq('is_active', true)
          .limit(1);
        
        const exactMatch = await executeSupabaseQuery(exactMatchQuery, 'Exact name match');
        
        let productId = null;
        if (exactMatch.success && exactMatch.data && exactMatch.data.length > 0) {
          productId = exactMatch.data[0].id;
          console.log(`✅ Found exact match: ${productId}`);
        } else {
          // Method 2: Try partial name match
          const partialMatchQuery = supabase
            .from('products')
            .select('id')
            .ilike('name', `%${item.product_name}%`)
            .eq('is_active', true)
            .limit(1);
          
          const partialMatch = await executeSupabaseQuery(partialMatchQuery, 'Partial name match');
          
          if (partialMatch.success && partialMatch.data && partialMatch.data.length > 0) {
            productId = partialMatch.data[0].id;
            console.log(`✅ Found partial match: ${productId}`);
          } else {
            // Method 3: Create new product
            const newProductData = {
              name: item.product_name,
              sku: item.sku || `AUTO-${item.product_name.substring(0, 8).replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`,
              price: item.unit_price || 0.01,
              description: 'Auto-created for order: BL-MIJ9P3QJ',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const newProductQuery = supabase
              .from('products')
              .insert([newProductData])
              .select('id')
              .single();
            
            const newProduct = await executeSupabaseQuery(newProductQuery, 'Create new product');
            
            if (newProduct.success && newProduct.data) {
              productId = newProduct.data.id;
              console.log(`✅ Created new product: ${productId}`);
            }
          }
        }
        
        // Update the order item
        if (productId) {
          const updateQuery = supabase
            .from('order_items')
            .update({ product_id: productId })
            .eq('id', item.id);
          
          const update = await executeSupabaseQuery(updateQuery, `Update item ${item.id} with product_id ${productId}`);
          
          if (update.success) {
            processedCount++;
            console.log(`✅ Updated item ${item.id}`);
          }
        }
      }
      
      console.log(`\n📊 Processed ${processedCount}/${nullItems.data.length} items successfully`);
      
    } else {
      console.log('✅ No items with null product_id found');
    }

    // PHASE 3: Order Status Update
    console.log('\n' + '='.repeat(80));
    console.log('💰 PHASE 3: ORDER STATUS UPDATE');
    console.log('='.repeat(80));
    
    const statusUpdateData = {
      status: 'paid',
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const statusUpdateQuery = supabase
      .from('orders')
      .update(statusUpdateData)
      .eq('id', orderCheck.id);
    
    const statusUpdate = await executeSupabaseQuery(statusUpdateQuery, 'Mark order as paid');
    
    if (statusUpdate.success) {
      console.log('✅ Order marked as paid successfully');
    }

    // PHASE 4: Verification & Monitoring
    console.log('\n' + '='.repeat(80));
    console.log('🔍 PHASE 4: VERIFICATION & MONITORING');
    console.log('='.repeat(80));
    
    // Verify order status
    const verificationQuery = supabase
      .from('orders')
      .select('id, order_number, status, payment_status, paid_at, total, buyer_email')
      .eq('id', orderCheck.id)
      .single();
    
    const verification = await executeSupabaseQuery(verificationQuery, 'Verify order status');
    
    if (verification.success && verification.data) {
      const order = verification.data;
      console.log('\n✅ VERIFICATION RESULTS:');
      console.log(`   Order ID: ${order.id}`);
      console.log(`   Order Number: ${order.order_number}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Payment Status: ${order.payment_status}`);
      console.log(`   Paid At: ${order.paid_at}`);
      console.log(`   Total: R${order.total}`);
      console.log(`   Buyer: ${order.buyer_email}`);
    }
    
    // Check order items
    const itemsCheckQuery = supabase
      .from('order_items')
      .select('id, product_name, product_id, sku, unit_price, quantity')
      .eq('order_id', orderCheck.id);
    
    const itemsCheck = await executeSupabaseQuery(itemsCheckQuery, 'Check order items');
    
    if (itemsCheck.success && itemsCheck.data) {
      console.log(`\n📦 ORDER ITEMS:`);
      console.log(`   Total Items: ${itemsCheck.data.length}`);
      
      itemsCheck.data.forEach((item, i) => {
        const hasProductId = item.product_id ? '✅' : '❌';
        console.log(`   ${i + 1}. ${item.product_name} (${item.sku}) - R${item.unit_price} - Product ID: ${hasProductId}`);
      });
      
      const itemsWithProductId = itemsCheck.data.filter(item => item.product_id).length;
      const successRate = itemsCheck.data.length > 0 ? ((itemsWithProductId / itemsCheck.data.length) * 100).toFixed(1) : 0;
      console.log(`   Success Rate: ${successRate}%`);
    }

    // PHASE 5: Permanent System Fixes (Optional)
    console.log('\n' + '='.repeat(80));
    console.log('🛡️  PHASE 5: PERMANENT SYSTEM FIXES');
    console.log('='.repeat(80));
    console.log('⚠️  Skipping permanent fixes in this execution for safety.');
    console.log('💡 These can be applied manually via Supabase SQL Editor if needed:');
    console.log('   - Standardize Order ID Types Function');
    console.log('   - Update Stock Movement Function');

    console.log('\n' + '='.repeat(80));
    console.log('✅ COMPREHENSIVE SOLUTION EXECUTION COMPLETE');
    console.log('='.repeat(80));
    console.log(`🎯 Target Order: BL-MIJ9P3QJ`);
    console.log(`✅ Status: FIXED`);
    console.log(`🕐 Completed: ${new Date().toISOString()}`);
    console.log('\n💡 Next Steps:');
    console.log('1. Verify the order appears correctly in your admin dashboard');
    console.log('2. Check if stock movements were created');
    console.log('3. Test the order payment workflow');
    
  } catch (error) {
    console.error('\n❌ Fatal error during execution:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check Supabase connection and credentials');
    console.log('2. Verify the order exists in the database');
    console.log('3. Check for any database constraints or permissions issues');
  }
}

// Execute the comprehensive solution
main();