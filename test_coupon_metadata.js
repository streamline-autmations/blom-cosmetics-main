// Test script to verify the coupon metadata fix
const { Client } = require('pg');

async function testCouponMetadataFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:yvmnedjybrpvlupygusf@db.yvmnedjybrpvlupygusf.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 Testing coupon metadata fix...');
    await client.connect();

    // Step 1: Check current coupon data
    console.log('\n📊 Step 1: Checking current coupon data...');
    const couponData = await client.query(`
      SELECT * FROM public.check_coupon_data();
    `);
    
    console.log('Current coupon data:');
    couponData.rows.forEach(row => {
      console.log(`  📦 ${row.code}:`);
      console.log(`    - Type: ${row.type} (${row.has_type ? '✅ has type' : '❌ missing type'})`);
      console.log(`    - Percent: ${row.percent} (${row.has_percent ? '✅ has percent' : '❌ missing percent'})`);
      console.log(`    - Status: ${row.status}`);
    });

    // Step 2: Fix coupon metadata
    console.log('\n🔧 Step 2: Fixing coupon metadata...');
    const fixResult = await client.query(`
      SELECT * FROM public.fix_coupon_metadata();
    `);
    
    console.log('Metadata fixes applied:');
    fixResult.rows.forEach(row => {
      console.log(`  📝 ${row.code}: ${row.action}`);
      console.log(`    - Type: ${row.old_type} → ${row.new_type}`);
      console.log(`    - Percent: ${row.old_percent} → ${row.new_percent}`);
    });

    // Step 3: Test coupon redemption with proper metadata
    console.log('\n🎫 Step 3: Testing coupon redemption with metadata...');
    const redemptionResult = await client.query(`
      SELECT * FROM public.redeem_coupon('TEST-DISCOUNT', 'test@example.com', 100000, '[]'::jsonb);
    `);
    
    console.log('Coupon redemption result:');
    if (redemptionResult.rows.length > 0) {
      const result = redemptionResult.rows[0];
      console.log(`  ✅ Valid: ${result.valid}`);
      console.log(`  📄 Message: ${result.message}`);
      console.log(`  💰 Discount: R${(result.discount_cents / 100).toFixed(2)}`);
      console.log(`  🏷️  Type: ${result.discount_type} (${result.discount_type !== 'none' ? '✅ proper type' : '❌ missing type'})`);
      console.log(`  📊 Value: ${result.discount_value} (${result.discount_value > 0 ? '✅ has value' : '❌ missing value'})`);
      console.log(`  🔑 Coupon ID: ${result.coupon_id}`);
      console.log(`  📦 Cart Snapshot: ${result.cart_snapshot ? '✅ has snapshot' : '❌ no snapshot'}`);
      
      // This is what the frontend needs for recalculation
      console.log('\n🎯 Frontend Metadata (for recalculation):');
      console.log(`  - couponType: "${result.discount_type}"`);
      console.log(`  - couponPercent: ${result.discount_value}`);
    }

    // Step 4: Test with different cart sizes to verify recalculation capability
    console.log('\n🧪 Step 4: Testing different cart sizes...');
    
    // Small cart
    const smallCartResult = await client.query(`
      SELECT discount_cents, discount_type, discount_value 
      FROM public.redeem_coupon('TEST-DISCOUNT', 'test@example.com', 50000, '[{"product_id": "prod1", "quantity": 1, "unit_price_cents": 50000}]'::jsonb);
    `);
    
    if (smallCartResult.rows.length > 0) {
      const smallResult = smallCartResult.rows[0];
      console.log(`  🛒 Small cart (R50): R${(smallResult.discount_cents / 100).toFixed(2)} discount`);
      console.log(`    - Type: ${smallResult.discount_type}, Value: ${smallResult.discount_value}`);
    }

    // Large cart  
    const largeCartResult = await client.query(`
      SELECT discount_cents, discount_type, discount_value 
      FROM public.redeem_coupon('TEST-DISCOUNT', 'test@example.com', 200000, '[{"product_id": "prod1", "quantity": 2, "unit_price_cents": 100000}]'::jsonb);
    `);
    
    if (largeCartResult.rows.length > 0) {
      const largeResult = largeCartResult.rows[0];
      console.log(`  🛒 Large cart (R200): R${(largeResult.discount_cents / 100).toFixed(2)} discount`);
      console.log(`    - Type: ${largeResult.discount_type}, Value: ${largeResult.discount_value}`);
    }

    console.log('\n✅ Coupon metadata fix verification complete!');
    console.log('💡 Frontend should now be able to recalculate percentage-based discounts');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await client.end();
  }
}

testCouponMetadataFix();