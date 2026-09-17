import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runQuery(sql, description) {
  console.log(`\n🔍 ${description}`);
  console.log('='.repeat(60));
  
  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    
    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message, data: null };
    }
    
    console.log('✅ Success');
    if (data && data.length > 0) {
      console.log('📊 Results:');
      data.forEach((row, i) => {
        console.log(`${i + 1}.`, JSON.stringify(row, null, 2));
      });
    } else {
      console.log('📊 No results returned');
    }
    return { success: true, error: null, data };
    
  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
    return { success: false, error: err.message, data: null };
  }
}

async function main() {
  console.log('🔍 ADMIN INTERFACE TROUBLESHOOTING');
  console.log('='.repeat(80));
  console.log('Investigating why Order BL-MIJ9P3QJ is not showing in admin');
  console.log(`📍 Database: ${SUPABASE_URL}`);
  console.log(`🕐 Started: ${new Date().toISOString()}\n`);

  try {
    // Query 1: Check order details
    const orderDetailsQuery = `
      SELECT 
        id as order_id,
        order_number,
        status,
        payment_status,
        paid_at,
        total,
        buyer_name,
        buyer_email,
        created_at,
        updated_at,
        CASE 
          WHEN status = 'placed' THEN '⚠️ Order is placed but not paid'
          WHEN status = 'paid' THEN '✅ Order is paid'
          WHEN status = 'cancelled' THEN '❌ Order is cancelled'
          ELSE '❓ Unknown status'
        END as status_check
      FROM public.orders 
      WHERE order_number = 'BL-MIJ9P3QJ'
         OR m_payment_id = 'BL-MIJ9P3QJ'
         OR id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'::uuid
    `;
    
    await runQuery(orderDetailsQuery, '1. ORDER DETAILS CHECK');
    
    // Query 2: Check order items
    const itemsQuery = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN product_id IS NOT NULL THEN 1 END) as items_with_product_id
      FROM public.order_items 
      WHERE order_id = '4fc6796e-3b62-4890-8d8d-0e645f6599a3'::uuid
    `;
    
    await runQuery(itemsQuery, '2. ORDER ITEMS CHECK');
    
    // Query 3: Check recent orders to verify admin interface
    const recentOrdersQuery = `
      SELECT 
        id,
        order_number,
        status,
        payment_status,
        total,
        buyer_email,
        created_at
      FROM public.orders 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    
    await runQuery(recentOrdersQuery, '3. RECENT ORDERS (Last 10)');
    
    // Query 4: Check orders by specific statuses that admin might filter by
    const paidOrdersQuery = `
      SELECT 
        COUNT(*) as total_orders,
        status,
        payment_status
      FROM public.orders 
      WHERE status IN ('placed', 'paid', 'processing')
      GROUP BY status, payment_status
      ORDER BY status, payment_status
    `;
    
    await runQuery(paidOrdersQuery, '4. ORDERS BY STATUS');
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 TROUBLESHOOTING ANALYSIS');
    console.log('='.repeat(80));
    
    console.log('\n💡 POSSIBLE REASONS ORDER ISNT SHOWING:');
    console.log('1. ❌ Order status filtering in admin');
    console.log('   - If admin only shows "paid" orders, yours shows "placed"');
    console.log('   - Solution: Admin filters may need adjustment');
    
    console.log('\n2. ❌ Order visibility rules');
    console.log('   - Admin might filter orders older than X days');
    console.log('   - Solution: Check admin filter settings');
    
    console.log('\n3. ❌ Database sync delay');
    console.log('   - Admin interface might cache data');
    console.log('   - Solution: Refresh admin interface or clear cache');
    
    console.log('\n4. ❌ Admin query filters');
    console.log('   - Admin might filter by specific criteria');
    console.log('   - Solution: Admin interface query needs adjustment');
    
    console.log('\n🚀 IMMEDIATE SOLUTIONS:');
    console.log('1. ✅ Update order status to "paid" (should make it visible)');
    console.log('2. ✅ Check admin interface filters (date range, status)');
    console.log('3. ✅ Refresh browser/cash admin interface');
    console.log('4. ✅ Contact admin interface developer about filtering rules');
    
    console.log('\n⚡ QUICK FIX: Update order status to "paid"');
    console.log('This will likely make it appear in your admin interface immediately.');
    
  } catch (error) {
    console.error('\n❌ Fatal error during troubleshooting:', error);
  }
}

// Execute troubleshooting
main();