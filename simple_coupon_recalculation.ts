// Simple coupon recalculation approach
// This provides an alternative if the complex field mapping doesn't work

// Simple coupon store for percentage recalculation
interface CouponData {
  couponCode: string;
  discountType: 'percent' | 'fixed' | null;
  discountValue: number; // For percent: actual percentage (e.g., 10 for 10%), for fixed: amount in Rands
  originalDiscountCents: number;
}

// Simple global store (could be React state in the component)
let simpleCouponStore: CouponData = {
  couponCode: '',
  discountType: null,
  discountValue: 0,
  originalDiscountCents: 0
};

export const setSimpleCoupon = (data: CouponData) => {
  console.log('💾 Setting coupon in simple store:', data);
  simpleCouponStore = data;
};

export const clearSimpleCoupon = () => {
  console.log('🗑️ Clearing coupon from simple store');
  simpleCouponStore = {
    couponCode: '',
    discountType: null,
    discountValue: 0,
    originalDiscountCents: 0
  };
};

export const recalculateSimpleDiscount = (cartSubtotal: number): number => {
  const { discountType, discountValue, originalDiscountCents } = simpleCouponStore;
  
  console.log('🧮 Simple recalculation:', {
    discountType,
    discountValue,
    cartSubtotal
  });

  // If no valid coupon data, return 0
  if (!discountType || discountValue <= 0) {
    return 0;
  }

  // For fixed discounts, always use original
  if (discountType === 'fixed') {
    return originalDiscountCents / 100;
  }

  // For percentage discounts, recalculate
  if (discountType === 'percent') {
    const productSubtotal = cartSubtotal * 100; // Convert to cents
    let newDiscountCents = Math.round(productSubtotal * (discountValue / 100));
    
    // Safety: Discount cannot exceed the product subtotal
    if (newDiscountCents > productSubtotal) {
      newDiscountCents = productSubtotal;
    }
    
    const finalDiscount = newDiscountCents / 100;
    console.log('✅ Simple percentage recalculation:', {
      percent: discountValue,
      cartSubtotal,
      newDiscount: finalDiscount
    });
    
    return finalDiscount;
  }

  return 0;
};

// Helper function to extract coupon data from the complex response
export const extractCouponData = (result: any): CouponData => {
  console.log('🔍 Extracting coupon data from response:', result);
  
  return {
    couponCode: result.code || 'UNKNOWN',
    discountType: result.discount_type === 'fixed' ? 'fixed' : 
                  result.discount_type === 'percent' ? 'percent' : null,
    discountValue: Number(result.discount_value || 0),
    originalDiscountCents: Number(result.discount_cents || 0)
  };
};

// Usage in frontend:
// import { setSimpleCoupon, recalculateSimpleDiscount } from './simple_coupon_recalculation';
// 
// // When coupon is applied:
// const couponData = extractCouponData(result);
// setSimpleCoupon(couponData);
// 
// // When recalculating:
// const newDiscount = recalculateSimpleDiscount(cartState.subtotal);