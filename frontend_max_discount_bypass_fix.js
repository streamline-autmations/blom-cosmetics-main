// ================================================
// FRONTEND COUPON MAX DISCOUNT ENFORCEMENT FIX
// ================================================
// This fixes the frontend bypassing backend max discount security

// CURRENT PROBLEMATIC CODE (what you have now):
function recalculateCouponDiscount(couponCode, cartSubtotal, appliedCoupon) {
  if (appliedCoupon.discount_type === 'percent') {
    // PROBLEMATIC: Frontend does its own calculation
    const percent = appliedCoupon.discount_value; // 20
    const calculatedDiscount = Math.floor((cartSubtotal * percent) / 100);
    return calculatedDiscount; // This bypasses backend R200 max!
  }
  // ...
}

// SECURE SOLUTION: Respect backend max discount enforcement
function recalculateCouponDiscountSecure(couponCode, cartSubtotal, appliedCoupon) {
  // ALWAYS use backend validation for security
  // The backend already enforces max discount - don't bypass it!
  
  // For percentage coupons, check if there's a max discount
  if (appliedCoupon.discount_type === 'percent' && appliedCoupon.discount_value) {
    // Instead of calculating locally, respect the backend's enforcement
    // The backend should already be providing the correct capped discount
    
    // If the backend provides the discount, use it directly
    if (appliedCoupon.discount_cents !== undefined) {
      // Check if this is the max discount scenario
      if (appliedCoupon.message && appliedCoupon.message.includes('MAX DISCOUNT:')) {
        // Backend is enforcing the max - use the backend's capped amount
        return appliedCoupon.discount_cents;
      } else {
        // Backend didn't apply max discount, but still use backend calculation
        return Math.min(
          appliedCoupon.discount_cents,
          Math.floor((cartSubtotal * appliedCoupon.discount_value) / 100)
        );
      }
    }
  }
  
  // For fixed coupons, use the backend amount
  return appliedCoupon.discount_cents || 0;
}

// BEST PRACTICE: Always call backend for recalculation
async function recalculateCouponWithBackend(couponCode, cartSubtotal, appliedCoupon) {
  try {
    // Call the backend function for secure recalculation
    const { data, error } = await supabase.rpc('recalculate_coupon_discount', {
      p_code: couponCode,
      p_email: customerEmail,
      p_order_total_cents: cartSubtotal,
      p_cart_items: cartItems // include cart items for accurate calculation
    });
    
    if (error) {
      console.error('Backend recalculation error:', error);
      return appliedCoupon.discount_cents || 0;
    }
    
    if (data && data[0] && data[0].valid) {
      const backendDiscount = data[0].discount_cents;
      
      // Display the backend's calculation (which includes max discount enforcement)
      console.log('Backend recalculated discount:', backendDiscount);
      console.log('Backend message:', data[0].message);
      
      return backendDiscount;
    }
    
    // Fallback to existing discount if backend fails
    return appliedCoupon.discount_cents || 0;
    
  } catch (error) {
    console.error('Error calling backend recalculation:', error);
    return appliedCoupon.discount_cents || 0;
  }
}

// COMPLETE SECURE CHECKOUT FLOW
async function handleCouponRecalculation() {
  // 1. Apply coupon initially (backend enforces max discount)
  const initialResult = await supabase.rpc('redeem_coupon', {
    p_code: 'TESTPERCENT20',
    p_email: customerEmail,
    p_order_total_cents: cartSubtotal,
    p_cart_items: cartItems
  });
  
  if (initialResult.data && initialResult.data[0]) {
    const initialDiscount = initialResult.data[0].discount_cents;
    console.log('Initial discount:', initialDiscount);
    console.log('Initial message:', initialResult.data[0].message);
    
    // Store the initial coupon details with max discount info
    setAppliedCoupon({
      id: initialResult.data[0].coupon_id,
      code: 'TESTPERCENT20',
      discount_cents: initialDiscount, // This is R200 (capped)
      discount_type: 'percent',
      discount_value: 20,
      message: initialResult.data[0].message
    });
  }
  
  // 2. When cart changes, ALWAYS recalculate with backend (don't do it locally!)
  async function onCartChange(newCartSubtotal) {
    // Don't do frontend calculation - call backend for secure recalculation
    
    const backendResult = await supabase.rpc('recalculate_coupon_discount', {
      p_code: 'TESTPERCENT20',
      p_email: customerEmail,
      p_order_total_cents: newCartSubtotal,
      p_cart_items: updatedCartItems
    });
    
    if (backendResult.data && backendResult.data[0] && backendResult.data[0].valid) {
      const newDiscount = backendResult.data[0].discount_cents;
      const newMessage = backendResult.data[0].message;
      
      console.log('Backend recalculated discount:', newDiscount);
      console.log('Backend message:', newMessage);
      
      // Update with backend's calculation (which includes max discount enforcement)
      updateAppliedCoupon({
        ...appliedCoupon,
        discount_cents: newDiscount,
        message: newMessage
      });
      
      // The new discount should still be R200 (respecting max discount)
      return newDiscount;
    }
    
    // Fallback to initial discount if recalculation fails
    return appliedCoupon.discount_cents || 0;
  }
  
  // 3. Calculate final price using the backend-enforced discount
  function calculateFinalPrice() {
    const subtotal = cartSubtotal;
    const couponDiscount = appliedCoupon.discount_cents || 0;
    
    console.log('Subtotal:', subtotal);
    console.log('Coupon discount (backend enforced):', couponDiscount);
    
    const finalTotal = Math.max(0, subtotal - couponDiscount);
    console.log('Final total:', finalTotal);
    
    return finalTotal;
  }
}

// PROPER USAGE IN REACT COMPONENT
function CheckoutComponent() {
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  
  // Apply coupon function
  const applyCoupon = async (couponCode) => {
    const result = await supabase.rpc('redeem_coupon', {
      p_code: couponCode,
      p_email: customerEmail,
      p_order_total_cents: cartSubtotal,
      p_cart_items: cartItems
    });
    
    if (result.data && result.data[0]) {
      // Set coupon with backend's secure calculation
      setAppliedCoupon({
        id: result.data[0].coupon_id,
        code: couponCode,
        discount_cents: result.data[0].discount_cents, // Backend enforced R200 max
        discount_type: result.data[0].discount_type,
        discount_value: result.data[0].discount_value,
        message: result.data[0].message
      });
    }
  };
  
  // CRITICAL: When cart changes, recalculate with backend (don't do locally!)
  const onCartChange = async (newCartSubtotal, newCartItems) => {
    if (appliedCoupon && appliedCoupon.code) {
      const result = await supabase.rpc('recalculate_coupon_discount', {
        p_code: appliedCoupon.code,
        p_email: customerEmail,
        p_order_total_cents: newCartSubtotal,
        p_cart_items: newCartItems
      });
      
      if (result.data && result.data[0] && result.data[0].valid) {
        // Update with backend's recalculation (still respects max discount)
        setAppliedCoupon(prev => ({
          ...prev,
          discount_cents: result.data[0].discount_cents,
          message: result.data[0].message
        }));
      }
    }
  };
  
  // Calculate final price using backend-enforced discount
  const finalPrice = cartSubtotal - (appliedCoupon?.discount_cents || 0);
  
  return (
    <div>
      <div>Cart Subtotal: R{cartSubtotal / 100}</div>
      {appliedCoupon && (
        <div>
          <div>Coupon: {appliedCoupon.message}</div>
          <div>Discount: R{(appliedCoupon.discount_cents || 0) / 100}</div>
        </div>
      )}
      <div>Final Total: R{finalPrice / 100}</div>
    </div>
  );
}

// KEY FIXES NEEDED IN YOUR CODE:
/*
1. REMOVE frontend percentage calculation:
   - Delete: Math.floor((cartSubtotal * percent) / 100)
   - Replace with: Call backend recalculation

2. ALWAYS call backend for recalculation:
   - Use: recalculate_coupon_discount function
   - Never trust frontend math for percentage discounts

3. Respect backend max discount:
   - Use: appliedCoupon.discount_cents from backend
   - Don't recalculate locally

4. Display backend's message:
   - Shows when max discount is active
   - "MAX DISCOUNT: R200" indicates cap is enforced
*/