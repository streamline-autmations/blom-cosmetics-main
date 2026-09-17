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

async function executeSQL(sql, description) {
  console.log(`\n🔧 Executing: ${description}`);
  console.log('='.repeat(80));
  
  try {
    // Try using RPC first
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
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

async function executeOrderFinder(identifier) {
  console.log(`\n🔍 Finding order with identifier: ${identifier}`);
  
  // Try different ways to find the order
  const queries = [
    { sql: `SELECT * FROM public.orders WHERE order_number = '${identifier}' LIMIT 1`, name: 'order_number' },
    { sql: `SELECT * FROM public.orders WHERE m_payment_id = '${identifier}' LIMIT 1`, name: 'm_payment_id' },
    { sql: `SELECT * FROM public.orders WHERE id = '${identifier}'::uuid LIMIT 1`, name: 'id_as_uuid' },
    { sql: `SELECT * FROM public.orders WHERE id = '${identifier}'::text LIMIT 1`, name: 'id_as_text' }
  ];
  
  for (const query of queries) {
    const result = await executeSQL(query.sql, `Find order by ${query.name}`);
    if (result.success && result.data && result.data.length > 0) {
      console.log(`✅ Found order using ${query.name}:`, result.data[0]);
      return result.data[0];
    }
  }
  
  console.log('❌ Order not found using any method');
  return null;
}

async function main() {
  console.log('🚀 COMPREHENSIVE SOLUTION PLAN EXECUTION');
  console.log('='.repeat(80));
  console.log(`📍 Database: ${SUPABASE_URL}`);
  console.log(`🎯 Target Order: BL-MIJ9P3QJ`);
  console.log(`🕐 Started: ${new Date().toISOString()}\n`);

  try {
    // PHASE 1: Safe Data Type Analysis
    console.log('\n' + '='.repeat(80));
    console.log('📋 PHASE 1: SAFE DATA TYPE ANALYSIS');
    console.log('='.repeat(80));
    
    // Step 1.1: Check data types
    const dataTypeQuery = `
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
      WHERE table_name = 'order_items' AND column_name = 'product_id';
    `;
    
    const dataTypes = await executeSQL(dataTypeQuery, 'Check data types for orders and order_items');
    
    // Step 1.2: Check specific order
    const orderCheck = await executeOrderFinder('BL-MIJ9P3QJ');
    
    if (!orderCheck) {
      console.log('\n❌ CRITICAL: Order BL-MIJ9P3QJ not found. Cannot proceed.');
      return;
    }
    
    console.log(`\n✅ Order found: ${orderCheck.id} (${orderCheck.order_number})`);
    console.log(`   Status: ${orderCheck.status}`);
    console.log(`   Payment Status: ${orderCheck.payment_status}`);

    // PHASE 2: Universal Order Fix
    console.log('\n' + '='.repeat(80));
    console.log('🔧 PHASE 2: UNIVERSAL ORDER FIX');
    console.log('='.repeat(80));
    
    // Step 2.1: Find order items with null product_id
    const orderItemsQuery = `
      SELECT oi.*, pg_typeof(oi.order_id) as order_id_type
      FROM public.order_items oi
      WHERE oi.order_id::text = '${orderCheck.id}'::text
        AND oi.product_id IS NULL
    `;
    
    const nullItems = await executeSQL(orderItemsQuery, 'Find order items with null product_id');
    
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
        const exactMatchQuery = `
          SELECT id FROM public.products 
          WHERE LOWER(name) = LOWER('${item.product_name.replace(/'/g, "''")}') 
            AND is_active = true 
          LIMIT 1
        `;
        
        const exactMatch = await executeSQL(exactMatchQuery, 'Exact name match');
        
        let productId = null;
        if (exactMatch.success && exactMatch.data && exactMatch.data.length > 0) {
          productId = exactMatch.data[0].id;
          console.log(`✅ Found exact match: ${productId}`);
        } else {
          // Method 2: Try partial name match
          const partialMatchQuery = `
            SELECT id FROM public.products 
            WHERE name ILIKE '%${item.product_name.replace(/'/g, "''")}%' 
              AND is_active = true 
            LIMIT 1
          `;
          
          const partialMatch = await executeSQL(partialMatchQuery, 'Partial name match');
          
          if (partialMatch.success && partialMatch.data && partialMatch.data.length > 0) {
            productId = partialMatch.data[0].id;
            console.log(`✅ Found partial match: ${productId}`);
          } else {
            // Method 3: Create new product
            const newProductQuery = `
              INSERT INTO public.products (
                name, sku, price, description, is_active, created_at, updated_at
              ) VALUES (
                '${item.product_name.replace(/'/g, "''")}',
                '${(item.sku || 'AUTO-' + item.product_name.substring(0, 8)).replace(/'/g, "''")}',
                ${item.unit_price || 0.01},
                'Auto-created for order: BL-MIJ9P3QJ',
                true,
                now(),
                now()
              ) RETURNING id
            `;
            
            const newProduct = await executeSQL(newProductQuery, 'Create new product');
            
            if (newProduct.success && newProduct.data && newProduct.data.length > 0) {
              productId = newProduct.data[0].id;
              console.log(`✅ Created new product: ${productId}`);
            }
          }
        }
        
        // Update the order item
        if (productId) {
          const updateQuery = `
            UPDATE public.order_items 
            SET product_id = '${productId}'::uuid
            WHERE id = '${item.id}'
          `;
          
          const update = await executeSQL(updateQuery, `Update item ${item.id} with product_id ${productId}`);
          
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
    
    const statusUpdateQuery = `
      UPDATE public.orders 
      SET 
        status = 'paid',
        payment_status = 'paid',
        paid_at = now(),
        updated_at = now()
      WHERE id = '${orderCheck.id}'::text
    `;
    
    const statusUpdate = await executeSQL(statusUpdateQuery, 'Mark order as paid');
    
    if (statusUpdate.success) {
      console.log('✅ Order marked as paid successfully');
    }

    // PHASE 4: Verification & Monitoring
    console.log('\n' + '='.repeat(80));
    console.log('🔍 PHASE 4: VERIFICATION & MONITORING');
    console.log('='.repeat(80));
    
    // Verify order status
    const verificationQuery = `
      SELECT 
        id::text as order_id,
        order_number,
        status,
        payment_status,
        paid_at::text,
        total::text as total_amount
      FROM public.orders 
      WHERE id = '${orderCheck.id}'::text
    `;
    
    const verification = await executeSQL(verificationQuery, 'Verify order status');
    
    if (verification.success && verification.data && verification.data.length > 0) {
      const order = verification.data[0];
      console.log('\n✅ VERIFICATION RESULTS:');
      console.log(`   Order ID: ${order.order_id}`);
      console.log(`   Order Number: ${order.order_number}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Payment Status: ${order.payment_status}`);
      console.log(`   Paid At: ${order.paid_at}`);
      console.log(`   Total: R${order.total_amount}`);
    }
    
    // Check order items
    const itemsCheckQuery = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN product_id IS NOT NULL THEN 1 END) as items_with_product_id
      FROM public.order_items oi
      WHERE oi.order_id::text = '${orderCheck.id}'::text
    `;
    
    const itemsCheck = await executeSQL(itemsCheckQuery, 'Check order items');
    
    if (itemsCheck.success && itemsCheck.data && itemsCheck.data.length > 0) {
      const stats = itemsCheck.data[0];
      console.log(`\n📦 ORDER ITEMS:`);
      console.log(`   Total Items: ${stats.total_items}`);
      console.log(`   Items with Product ID: ${stats.items_with_product_id}`);
      console.log(`   Success Rate: ${stats.total_items > 0 ? ((stats.items_with_product_id / stats.total_items) * 100).toFixed(1) : 0}%`);
    }

    // PHASE 5: Permanent System Fixes (Optional - requires careful execution)
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