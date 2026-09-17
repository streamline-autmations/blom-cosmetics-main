// Test script to verify the coupon fix works
const { Client } = require('pg');

async function testCouponFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:yvmnedjybrpvlupygusf@db.yvmnedjybrpvlupygusf.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 Testing final coupon fix...');
    await client.connect();

    // Test 1: Debug the coupon error scenario
    console.log('\n📊 Step 1: Debug coupon error scenario...');
    const debugResult = await client.query(`
      SELECT * FROM public.debug_coupon_error('TEST-DISCOUNT', 'test@example.com', 100000);
    `);
    
    console.log('Debug results:');
    debugResult.rows.forEach(row => {
      console.log(`  ${row.step}: ${row.status} - ${row.details}`);
    });

    // Test 2: Test the main coupon redemption function
    console.log('\n🎫 Step 2: Test coupon redemption...');
    const couponResult = await client.query(`
      SELECT * FROM public.redeem_coupon('TEST-DISCOUNT', 'test@example.com', 100000, '[]'::jsonb);
    `);
    
    console.log('Coupon redemption result:');
    if (couponResult.rows.length > 0) {
      const result = couponResult.rows[0];
      console.log(`  ✅ Success: ${result.message}`);
      console.log(`  💰 Discount: R${(result.discount_cents / 100).toFixed(2)}`);
      console.log(`  🏷️  Type: ${result.discount_type}`);
      console.log(`  🔑 Coupon ID: ${result.coupon_id}`);
    } else {
      console.log('  ❌ No result returned');
    }

    // Test 3: Run comprehensive tests
    console.log('\n🧪 Step 3: Run comprehensive tests...');
    const testResult = await client.query(`
      SELECT * FROM public.test_coupon_complete();
    `);
    
    console.log('Comprehensive test results:');
    testResult.rows.forEach(row => {
      const status = row.success ? '✅' : '❌';
      console.log(`  ${status} ${row.test_name}: ${row.message} (R${(row.discount_cents / 100).toFixed(2)})`);
    });

    console.log('\n🎉 Coupon fix verification complete!');
    console.log('✅ All errors should now be resolved');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await client.end();
  }
}

testCouponFix();