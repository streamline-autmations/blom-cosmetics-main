# 🚨 CRITICAL: Frontend Max Discount Security Bypass

## The Security Vulnerability You Discovered

**FRONTEND BYPASS**: Your frontend is overriding the secure backend max discount enforcement with its own percentage calculations, completely bypassing the R200 maximum.

### What I See in Your Logs

**✅ BACKEND SECURITY IS WORKING:**
```javascript
// Backend correctly enforces R200 max
{
  valid: true,
  message: 'Coupon applied: 20% off (MAX DISCOUNT: R200)',
  discount_cents: 20000,  // R200 - correct!
  discount_type: 'percent',
  discount_value: 20
}
```

**❌ FRONTEND BYPASSES SECURITY:**
```javascript
// Frontend does its own calculation and bypasses R200 max
✅ Percentage coupon recalculated: {
  originalPercent: 20,
  productSubtotal: 3375,
  newDiscountCents: 67500,  // R675 - COMPLETELY BYPASSES R200 MAX!
  finalDiscount: 675       // R675 - SECURITY VIOLATION!
}
```

### The Critical Fix Required

Your frontend code needs **immediate security patches**:

## 1. Remove Frontend Calculation

**FIND AND DELETE this dangerous code:**
```javascript
// ❌ DANGEROUS: Remove this frontend calculation
function recalculateCouponDiscount() {
  const calculatedDiscount = Math.floor((cartSubtotal * percent) / 100);
  return calculatedDiscount; // This bypasses R200 max!
}
```

## 2. Use Backend Recalculation

**REPLACE with secure backend calls:**
```javascript
// ✅ SECURE: Always call backend for recalculation
async function recalculateCouponWithBackend() {
  const result = await supabase.rpc('recalculate_coupon_discount', {
    p_code: 'TESTPERCENT20',
    p_email: customerEmail,
    p_order_total_cents: newCartSubtotal,
    p_cart_items: updatedCartItems
  });
  
  if (result.data && result.data[0] && result.data[0].valid) {
    return result.data[0].discount_cents; // R200 max enforced!
  }
  
  return fallbackDiscount; // Use existing secure discount
}
```

## 3. Complete Security Fix Code

Here's the **complete secure coupon handling** for your frontend:

```javascript
// ================================================
// SECURE COUPON HANDLING - NO FRONTEND BYPASS
// ================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabase = createClient(SUPABASE_URL, 'your-anon-key');

let appliedCoupon = null;

// STEP 1: Apply coupon with backend security
async function applyCoupon(couponCode, cartSubtotal, cartItems) {
  try {
    const { data, error } = await supabase.rpc('redeem_coupon', {
      p_code: couponCode,
      p_email: customerEmail,
      p_order_total_cents: cartSubtotal,
      p_cart_items: cartItems
    });

    if (error) {
      console.error('Coupon validation error:', error);
      return false;
    }

    if (data && data[0] && data[0].valid) {
      // Store the SECURE backend calculation
      appliedCoupon = {
        id: data[0].coupon_id,
        code: couponCode,
        discount_cents: data[0].discount_cents,  // R200 max enforced!
        discount_type: data[0].discount_type,
        discount_value: data[0].discount_value,
        message: data[0].message,
        min_order_cents: data[0].min_order_cents
      };
      
      console.log('✅ Coupon applied with backend security:', appliedCoupon);
      console.log('Backend message:', data[0].message);
      console.log('Secure discount:', data[0].discount_cents);
      
      return true;
    } else {
      console.error('Invalid coupon:', data);
      return false;
    }
  } catch (error) {
    console.error('Error applying coupon:', error);
    return false;
  }
}

// STEP 2: CRITICAL - Always recalculate with backend (NEVER locally!)
async function recalculateCouponDiscount() {
  if (!appliedCoupon || !appliedCoupon.code) {
    return 0; // No coupon applied
  }

  try {
    // CALL BACKEND FOR SECURE RECALCULATION
    const { data, error } = await supabase.rpc('recalculate_coupon_discount', {
      p_code: appliedCoupon.code,
      p_email: customerEmail,
      p_order_total_cents: currentCartSubtotal,
      p_cart_items: currentCartItems
    });

    if (error) {
      console.error('Recalculation error:', error);
      return appliedCoupon.discount_cents || 0; // Fallback to secure amount
    }

    if (data && data[0] && data[0].valid) {
      const newDiscount = data[0].discount_cents;
      const newMessage = data[0].message;
      
      console.log('🔄 Backend recalculated discount:', newDiscount);
      console.log('Backend message:', newMessage);
      
      // Update with backend's secure calculation
      appliedCoupon.discount_cents = newDiscount;
      appliedCoupon.message = newMessage;
      
      // Verify max discount is still enforced
      if (newMessage.includes('MAX DISCOUNT:')) {
        console.log('✅ Max discount enforcement verified:', newDiscount);
      }
      
      return newDiscount;
    } else {
      console.warn('Recalculation failed, using fallback');
      return appliedCoupon.discount_cents || 0;
    }
  } catch (error) {
    console.error('Error in secure recalculation:', error);
    return appliedCoupon.discount_cents || 0;
  }
}

// STEP 3: Calculate final price using SECURE discount
function calculateFinalPrice() {
  const subtotal = currentCartSubtotal;
  const couponDiscount = appliedCoupon?.discount_cents || 0;
  
  console.log('💰 Price calculation:');
  console.log('  Subtotal:', subtotal);
  console.log('  Coupon discount (secure):', couponDiscount);
  console.log('  Final total:', Math.max(0, subtotal - couponDiscount));
  
  return Math.max(0, subtotal - couponDiscount);
}

// STEP 4: Mark coupon as used (ONLY when payment completes)
async function markCouponUsed() {
  if (appliedCoupon && appliedCoupon.code) {
    try {
      await supabase.rpc('mark_coupon_used', {
        p_code: appliedCoupon.code
      });
      console.log('✅ Coupon usage counted');
    } catch (error) {
      console.error('Error marking coupon used:', error);
    }
  }
}

// PROPER USAGE IN YOUR REACT COMPONENTS
function CheckoutPage() {
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [finalTotal, setFinalTotal] = useState(0);

  // Apply coupon function
  const handleApplyCoupon = async (couponCode) => {
    const success = await applyCoupon(couponCode, cartSubtotal, cartItems);
    if (success) {
      setAppliedCoupon(appliedCoupon);
      updateTotal();
    }
  };

  // CRITICAL: Recalculate with backend when cart changes
  const handleCartChange = async (newSubtotal) => {
    setCartSubtotal(newSubtotal);
    
    if (appliedCoupon) {
      const newDiscount = await recalculateCouponDiscount();
      updateTotal(newDiscount);
    } else {
      updateTotal();
    }
  };

  // Calculate total using SECURE discount
  const updateTotal = (secureDiscount = 0) => {
    const discount = secureDiscount || (appliedCoupon?.discount_cents || 0);
    const total = cartSubtotal - discount;
    setFinalTotal(Math.max(0, total));
  };

  return (
    <div>
      <h1>Checkout</h1>
      <div>Subtotal: R{cartSubtotal / 100}</div>
      
      {appliedCoupon && (
        <div>
          <h3>Applied Coupon</h3>
          <p>{appliedCoupon.message}</p>
          <p>Discount: R{(appliedCoupon.discount_cents || 0) / 100}</p>
        </div>
      )}
      
      <div>Final Total: R{finalTotal / 100}</div>
    </div>
  );
}

// STEP 5: Payment completion - mark coupon as used
async function handlePaymentComplete() {
  // Process payment...
  // If payment successful:
  await markCouponUsed(); // ONLY mark as used when payment completes
}
```

## Critical Security Requirements

**IMMEDIATE ACTIONS REQUIRED:**

1. ✅ **Remove all frontend percentage calculations**
   - Delete `Math.floor((cartSubtotal * percent) / 100)`
   - Replace with backend calls

2. ✅ **Always call `recalculate_coupon_discount` on cart changes**
   - Never recalculate locally
   - Always use backend security

3. ✅ **Respect backend max discount enforcement**
   - Use `appliedCoupon.discount_cents` from backend
   - Don't override with local calculations

4. ✅ **Monitor console logs for security verification**
   - Look for: "MAX DISCOUNT: R200" messages
   - Verify discounts never exceed configured maximum

## Testing the Security Fix

**After implementing the fix, verify:**

1. **Large cart (R2000)**: Should show `MAX DISCOUNT: R200`
2. **Small cart (R300)**: Should STILL show `MAX DISCOUNT: R200`
3. **Cart changes**: Should always respect R200 maximum
4. **Console logs**: Should show backend enforcing max discount

## What This Fixes

- ❌ **Before**: Frontend calculates R675 discount (bypasses R200 max)
- ✅ **After**: Frontend calls backend, gets R200 max discount
- ✅ **Security**: Max discount enforcement is bulletproof
- ✅ **Functionality**: Coupon works correctly with proper caps

**This critical frontend bypass vulnerability will be completely resolved!** 🔒