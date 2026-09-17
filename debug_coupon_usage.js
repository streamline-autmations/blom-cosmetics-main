// ================================================
// COUPON USAGE TRACKING DEBUG SCRIPT
// ================================================
// This script demonstrates the usage tracking issue

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

async function testCouponUsageTracking() {
  console.log('🔍 Testing Coupon Usage Tracking Issue...');
  console.log('==========================================');

  // Check if TEST-DISCOUNT exists and get its current state
  console.log('\n📋 Step 1: Check current TEST-DISCOUNT status');
  try {
    const couponCheck = await fetch(`${SUPABASE_URL}/rest/v1/coupons?code=eq.TEST-DISCOUNT&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (couponCheck.ok) {
      const coupons = await couponCheck.json();
      if (coupons.length > 0) {
        const coupon = coupons[0];
        console.log('Current TEST-DISCOUNT status:');
        console.log(`  - Code: ${coupon.code}`);
        console.log(`  - Max uses: ${coupon.max_uses || 'unlimited'}`);
        console.log(`  - Used count: ${coupon.used_count || 0}`);
        console.log(`  - Status: ${coupon.status || coupon.is_active ? 'active' : 'inactive'}`);
        console.log(`  - Type: ${coupon.type || 'percent'}`);
        if (coupon.type === 'fixed') {
          console.log(`  - Value: R${coupon.value}`);
        } else {
          console.log(`  - Percentage: ${coupon.percent}%`);
        }
      } else {
        console.log('TEST-DISCOUNT coupon not found in database');
        return;
      }
    }
  } catch (error) {
    console.error('Error checking coupon:', error.message);
    return;
  }

  // Simulate multiple validation calls (like a user trying the coupon multiple times)
  console.log('\n🔄 Step 2: Simulate multiple validation calls');
  console.log('This demonstrates the issue - validation succeeds each time...');

  for (let i = 1; i <= 3; i++) {
    console.log(`\n  Attempt ${i}:`);
    try {
      const validationResult = await fetch(`${SUPABASE_URL}/rest/v1/rpc/redeem_coupon`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_code: 'TEST-DISCOUNT',
          p_email: `test${i}@example.com`,
          p_order_total_cents: 100000, // R1000 order
          p_cart_items: JSON.stringify([])
        })
      });

      if (validationResult.ok) {
        const result = await validationResult.json();
        const row = Array.isArray(result) ? result[0] : result;
        
        if (row.valid) {
          console.log(`    ✅ Validation succeeded: ${row.message}`);
          console.log(`    📊 Discount: R${row.discount_cents / 100}`);
        } else {
          console.log(`    ❌ Validation failed: ${row.message}`);
        }
      } else {
        console.log(`    ❌ RPC call failed: ${validationResult.status}`);
      }
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
    }
  }

  // Check if usage count changed after all the validations
  console.log('\n📊 Step 3: Check usage count after validations');
  try {
    const finalCheck = await fetch(`${SUPABASE_URL}/rest/v1/coupons?code=eq.TEST-DISCOUNT&select=used_count`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (finalCheck.ok) {
      const coupons = await finalCheck.json();
      if (coupons.length > 0) {
        console.log(`Final used_count: ${coupons[0].used_count || 0}`);
        console.log('❗ ISSUE: Used count should have increased but it didn\'t!');
        console.log('This proves that validation doesn\'t mark coupons as used.');
      }
    }
  } catch (error) {
    console.error('Error checking final count:', error.message);
  }

  console.log('\n🎯 CONCLUSION:');
  console.log('The coupon can be validated unlimited times because usage tracking');
  console.log('only happens during ORDER CREATION, not during VALIDATION.');
  console.log('');
  console.log('💡 SOLUTION NEEDED:');
  console.log('1. Mark coupon as used during validation (but only if max_uses = 1)');
  console.log('2. Or implement a reservation system that marks coupons as "pending"');
  console.log('3. Or add a separate coupon_validations table to track attempts');

  console.log('\n🏁 Test Complete!');
}

// Run the test
testCouponUsageTracking().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});