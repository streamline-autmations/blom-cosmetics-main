// ================================================
// COUPON USAGE TRACKING FLOW TEST
// ================================================
// This demonstrates exactly how coupons get marked as used

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

async function testCouponUsageFlow() {
  console.log('🔍 Testing Coupon Usage Tracking Flow...');
  console.log('==========================================');

  // Step 1: Check initial state of TEST-DISCOUNT
  console.log('\n📋 Step 1: Check TEST-DISCOUNT initial state');
  try {
    const initialCheck = await fetch(`${SUPABASE_URL}/rest/v1/coupons?code=eq.TEST-DISCOUNT&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (initialCheck.ok) {
      const coupons = await initialCheck.json();
      if (coupons.length > 0) {
        const coupon = coupons[0];
        console.log(`Initial state:`);
        console.log(`  - Code: ${coupon.code}`);
        console.log(`  - Used count: ${coupon.used_count || 0}`);
        console.log(`  - Max uses: ${coupon.max_uses || 'unlimited'}`);
        console.log(`  - Status: ${coupon.status || coupon.is_active ? 'active' : 'inactive'}`);
      }
    }
  } catch (error) {
    console.error('Error checking initial state:', error.message);
  }

  // Step 2: Validate coupon (this should mark it as used for single-use coupons)
  console.log('\n🔍 Step 2: Validate TEST-DISCOUNT coupon');
  try {
    const validationToken = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Using validation token: ${validationToken}`);

    const validateResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/redeem_coupon`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_code: 'TEST-DISCOUNT',
        p_email: 'test@example.com',
        p_order_total_cents: 100000, // R1000
        p_cart_items: [],
        p_validation_token: validationToken
      })
    });

    if (validateResponse.ok) {
      const result = await validateResponse.json();
      const row = Array.isArray(result) ? result[0] : result;
      
      console.log(`Validation result:`);
      console.log(`  - Valid: ${row.valid}`);
      console.log(`  - Message: ${row.message}`);
      console.log(`  - Discount: R${(row.discount_cents || 0) / 100}`);
      console.log(`  - Validation token: ${row.validation_token}`);
      
      if (row.valid) {
        console.log('✅ Coupon validation succeeded');
      } else {
        console.log('❌ Coupon validation failed:', row.message);
        return;
      }
    } else {
      console.log('❌ Validation RPC failed:', validateResponse.status);
      return;
    }
  } catch (error) {
    console.error('Error during validation:', error.message);
    return;
  }

  // Step 3: Check if coupon usage count increased immediately
  console.log('\n📊 Step 3: Check if usage count increased after validation');
  try {
    const afterValidationCheck = await fetch(`${SUPABASE_URL}/rest/v1/coupons?code=eq.TEST-DISCOUNT&select=used_count`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (afterValidationCheck.ok) {
      const coupons = await afterValidationCheck.json();
      if (coupons.length > 0) {
        const usedCount = coupons[0].used_count || 0;
        console.log(`After validation - Used count: ${usedCount}`);
        
        if (usedCount > 0) {
          console.log('✅ SUCCESS: Coupon usage count increased immediately after validation!');
          console.log('💡 This means the single-use coupon is now marked as "used"');
        } else {
          console.log('❌ ISSUE: Usage count did not increase after validation');
          console.log('💡 This suggests the enhanced function is not working properly');
        }
      }
    }
  } catch (error) {
    console.error('Error checking after validation:', error.message);
  }

  // Step 4: Try to validate again (should fail)
  console.log('\n🔄 Step 4: Try to validate TEST-DISCOUNT again');
  try {
    const retryValidationToken = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const retryResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/redeem_coupon`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_code: 'TEST-DISCOUNT',
        p_email: 'retry@example.com',
        p_order_total_cents: 100000, // R1000
        p_cart_items: [],
        p_validation_token: retryValidationToken
      })
    });

    if (retryResponse.ok) {
      const result = await retryResponse.json();
      const row = Array.isArray(result) ? result[0] : result;
      
      console.log(`Retry validation result:`);
      console.log(`  - Valid: ${row.valid}`);
      console.log(`  - Message: ${row.message}`);
      
      if (!row.valid && row.message.includes('already used')) {
        console.log('✅ SUCCESS: Second validation correctly rejected!');
        console.log('💡 This proves the usage tracking is working');
      } else if (row.valid) {
        console.log('❌ ISSUE: Second validation was accepted - usage tracking failed');
      } else {
        console.log('❓ Unexpected result:', row.message);
      }
    }
  } catch (error) {
    console.error('Error during retry validation:', error.message);
  }

  // Step 5: Check validation table
  console.log('\n📋 Step 5: Check coupon_validations table');
  try {
    const validationsCheck = await fetch(`${SUPABASE_URL}/rest/v1/coupon_validations?order=created_at.desc&limit=5`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (validationsCheck.ok) {
      const validations = await validationsCheck.json();
      console.log(`Found ${validations.length} validation records:`);
      
      validations.forEach((validation, index) => {
        console.log(`  ${index + 1}. Token: ${validation.validation_token}`);
        console.log(`     Email: ${validation.email}`);
        console.log(`     Used for order: ${validation.used_for_order}`);
        console.log(`     Created: ${validation.created_at}`);
      });
    }
  } catch (error) {
    console.error('Error checking validations:', error.message);
  }

  console.log('\n🎯 SUMMARY:');
  console.log('The coupon usage tracking works in 2 phases:');
  console.log('1. VALIDATION PHASE: Single-use coupons marked as used immediately');
  console.log('2. ORDER COMPLETION PHASE: Validation marked as completed');
  console.log('');
  console.log('This prevents re-use during checkout while handling abandoned orders.');

  console.log('\n🏁 Test Complete!');
}

// Run the test
testCouponUsageFlow().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});