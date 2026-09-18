# 🚨 URGENT FRONTEND FIX: Remove Local Percentage Calculation

## Critical Issue in Your Frontend Code

Your frontend is **still doing local percentage calculations** and bypassing the backend security. From your logs:

```
✅ Initial application: discount: 200 (backend works)
❌ Recalculation: newDiscountCents: 61500 (frontend bypass!)
```

## EXACT Problem Code (Remove This!)

**FIND AND DELETE this dangerous recalculation code:**

```javascript
// ❌ THIS IS THE PROBLEMATIC CODE (remove it entirely!)
function recalculateCouponDiscount() {
  // ... your existing logic ...
  
  🔍 Decision Logic:
  // - Is fixed? false
  // - Is percent? true  
  // - discount_value: 20
  // - percent: undefined
  
  🎯 Percentage calculation: {percent: 20, productSubtotal: 307500}
  ✅ Percentage coupon recalculated: {newDiscountCents: 61500, finalDiscount: 615}
  
  // This local calculation BYPASSES the R200 max discount!
}
```

## CORRECT FRONTEND CODE (Replace With This)

**HERE'S THE SECURE IMPLEMENTATION:**

```javascript
// ✅ SECURE COUPON RECALCULATION (use this instead)
async function recalculateCouponDiscountSecure() {
  console.log('🔄 SECURE RECALCULATION - Calling backend...');
  
  if (!appliedCoupon || !appliedCoupon.code) {
    console.log('No coupon applied, skipping recalculation');
    return 0;
  }

  try {
    // 🚨 CRITICAL: ALWAYS call backend, never calculate locally for percentage coupons
    const { data, error } = await supabase.rpc('recalculate_coupon_discount', {
      p_code: appliedCoupon.code,
      p_email: customerEmail, // your email variable
      p_order_total_cents: cartSubtotal,
      p_cart_items: cartItems // include cart items for accurate calculation
    });

    if (error) {
      console.error('Backend recalculation error:', error);
      // Fallback to existing secure discount
      return appliedCoupon.discount_cents || 0;
    }

    if (data && data[0] && data[0].valid) {
      const newDiscount = data[0].discount_cents;
      const newMessage = data[0].message;
      
      console.log('🔄 Backend recalculated:', {
        newDiscount: newDiscount,
        newMessage: newMessage
      });
      
      // Update with backend's secure calculation
      appliedCoupon.discount_cents = newDiscount;
      appliedCoupon.message = newMessage;
      
      // Verify max discount is enforced
      if (newMessage.includes('MAX DISCOUNT:')) {
        console.log('✅ Max discount enforcement confirmed:', newDiscount);
      }
      
      return newDiscount;
    } else {
      console.warn('Backend returned invalid result, using fallback');
      return appliedCoupon.discount_cents || 0;
    }
  } catch (error) {
    console.error('Error in secure recalculation:', error);
    return appliedCoupon.discount_cents || 0;
  }
}

// 🔄 COMPLETE SECURE CHECKOUT FLOW
async function handleCartChange(newCartSubtotal) {
  setCartSubtotal(newCartSubtotal);
  
  if (appliedCoupon) {
    console.log('🔄 Cart changed, recalculating coupon...');
    
    // ✅ ALWAYS use secure backend recalculation
    const secureDiscount = await recalculateCouponDiscountSecure();
    
    // Update total using the SECURE discount
    const newTotal = newCartSubtotal - secureDiscount;
    setFinalTotal(Math.max(0, newTotal));
    
    console.log('💰 Updated pricing:', {
      subtotal: newCartSubtotal,
      discount: secureDiscount,
      total: newTotal
    });
  } else {
    setFinalTotal(newCartSubtotal);
  }
}
```

## SPECIFIC FIXES FOR YOUR CURRENT CODE

**1. Find your percentage calculation function and REPLACE it entirely:**

**OLD (problematic):**
```javascript
🔍 Decision Logic:
- Is fixed? false
- Is percent? true
- discount_value: 20
🎯 Percentage calculation: {percent: 20, productSubtotal: 307500}
✅ Percentage coupon recalculated: {newDiscountCents: 61500}
```

**NEW (secure):**
```javascript
async function securePercentageRecalculation() {
  console.log('🔄 Calling backend for secure recalculation...');
  
  const backendResult = await supabase.rpc('recalculate_coupon_discount', {
    p_code: 'TESTPERCENT20', // or appliedCoupon.code
    p_email: customerEmail,
    p_order_total_cents: cartSubtotal,
    p_cart_items: cartItems
  });
  
  if (backendResult.data && backendResult.data[0] && backendResult.data[0].valid) {
    const secureDiscount = backendResult.data[0].discount_cents;
    console.log('✅ Backend enforced discount:', secureDiscount); // Should be 20000 (R200)
    return secureDiscount;
  }
  
  return appliedCoupon?.discount_cents || 0; // Fallback to secure amount
}
```

## IMMEDIATE TESTING STEPS

**After applying the fix, test this scenario:**

1. **Apply coupon with large cart (R2000 total)**
   - Expected: `MAX DISCOUNT: R200` → discount_cents: 20000

2. **Remove items to make cart smaller (R500 total)**  
   - Expected: `MAX DISCOUNT: R200` → discount_cents: 20000 (NOT R100!)

3. **Cart manipulation test (add/remove items)**
   - Expected: Always shows `MAX DISCOUNT: R200`

## SUCCESS INDICATORS

**Your console should show:**
```
🔄 SECURE RECALCULATION - Calling backend...
🔄 Backend recalculated: {newDiscount: 20000, newMessage: "Coupon updated: 20% off (MAX DISCOUNT: R200)"}
✅ Max discount enforcement confirmed: 20000
💰 Updated pricing: {subtotal: 307500, discount: 20000, total: 287500}
```

**NOT this (the bypass):**
```
🔍 Decision Logic:
🎯 Percentage calculation: {percent: 20, productSubtotal: 307500}
✅ Percentage coupon recalculated: {newDiscountCents: 61500}
```

## CRITICAL: The SQL Fix is Ready

I've also created **`frontend_backend_sync_fix.sql`** with enhanced backend functions that make it easier for the frontend to call securely.

**Run this SQL first, then update your frontend code.**

## Summary

1. ✅ **Remove ALL local percentage calculations**
2. ✅ **Always call `recalculate_coupon_discount` backend function**  
3. ✅ **Trust the backend's discount_cents value**
4. ✅ **Look for "MAX DISCOUNT: R200" in messages**

**This will completely eliminate the max discount bypass vulnerability!** 🔒