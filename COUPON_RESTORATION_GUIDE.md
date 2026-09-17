# 🎯 Coupon System Restoration Guide

## What This Fixes

Your restored coupon system now has:

✅ **Basic coupon functionality working** (discounts apply properly)  
✅ **Dynamic percentage calculation** (discounts recalculate when cart changes)  
✅ **Simple usage tracking** (only count as used when payment completes)  
✅ **Product exclusions support** (exclude certain products from discounts)  
✅ **Email locking support** (coupons locked to specific emails)  

## How to Deploy

### Step 1: Run the Restoration Script
```sql
-- In your Supabase SQL editor, run:
\i restored_coupon_system_working.sql
```

Or copy and paste the entire contents of `restored_coupon_system_working.sql` into your Supabase SQL editor and run it.

### Step 2: Test the System
The script includes built-in tests that will show you if everything is working:

```sql
-- These should all return valid=true with proper discount calculations
SELECT 'Testing Fixed Discount' as test_name, valid, message, discount_cents/100.0 as discount_rands 
FROM public.redeem_coupon('TESTFIXED250', 'test@example.com', 100000, '[]'::jsonb);

SELECT 'Testing Percentage Discount - Initial' as test_name, valid, message, discount_cents/100.0 as discount_rands 
FROM public.redeem_coupon('TESTPERCENT20', 'test@example.com', 100000, '[]'::jsonb);

SELECT 'Testing Dynamic Recalculation - Lower Total' as test_name, valid, message, discount_cents/100.0 as discount_rands 
FROM public.redeem_coupon('TESTPERCENT20', 'test@example.com', 50000, '[]'::jsonb);
```

## Key Functions

### `public.redeem_coupon(code, email, order_total_cents, cart_items)`
- **Main function** for validating and calculating coupons
- **Dynamic percentage calculation** - recalculates based on current cart total
- Call this whenever a coupon is applied or cart changes

### `public.recalculate_coupon_discount(code, email, order_total_cents, cart_items)`
- **Helper function** for when cart changes (updates percentage discounts)
- Just calls redeem_coupon with "(updated)" message

### `public.mark_coupon_used(code)`
- **Only call this when payment is successful**
- Increments the usage count
- Don't call during validation, only after completed payment

## Frontend Integration

### When Coupon is Applied
```javascript
const couponResult = await supabase.rpc('redeem_coupon', {
  p_code: 'YOUR_COUPON_CODE',
  p_email: 'customer@example.com',
  p_order_total_cents: 100000, // R1000
  p_cart_items: cartItemsJson // Your cart items array
});

// Apply the discount
if (couponResult.data?.[0]?.valid) {
  const discount = couponResult.data[0].discount_cents;
  // Update your cart total: newTotal = oldTotal - discount
}
```

### When Cart Changes (for percentage coupons)
```javascript
const updatedResult = await supabase.rpc('recalculate_coupon_discount', {
  p_code: 'YOUR_COUPON_CODE',
  p_email: 'customer@example.com',
  p_order_total_cents: newTotalCents,
  p_cart_items: updatedCartItemsJson
});

// Use the new discount amount
if (updatedResult.data?.[0]?.valid) {
  const newDiscount = updatedResult.data[0].discount_cents;
  // Update display: newTotal = cartTotal - newDiscount
}
```

### When Payment Completes Successfully
```javascript
// Only call this AFTER payment is successful
await supabase.rpc('mark_coupon_used', {
  p_code: 'YOUR_COUPON_CODE'
});
```

## Test Coupons Created

The script creates these test coupons you can use:

- `TESTFIXED250` - Fixed R250 discount
- `TESTPERCENT20` - 20% discount (max R500)

## Expected Behavior

1. **Coupon applies**: Returns valid=true with discount calculated
2. **Cart changes**: Percentage discounts recalculate automatically
3. **Payment completes**: Usage count increments only then
4. **Coupon used up**: Returns "Coupon already used" error

## If You Still Have Issues

Run this diagnostic query to see what's happening:

```sql
-- Check current coupon state
SELECT 
  code, 
  type, 
  percent, 
  value, 
  used_count, 
  max_uses, 
  status,
  is_active
FROM public.coupons 
WHERE code IN ('TESTFIXED250', 'TESTPERCENT20', 'YOUR_COUPON_CODE');

-- Check function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('redeem_coupon', 'recalculate_coupon_discount', 'mark_coupon_used');
```

## What Changed from the Complex Version

✅ **Removed complex validation tracking** (was causing conflicts)  
✅ **Simplified to basic but robust functionality**  
✅ **Added dynamic percentage calculation** (your requested feature)  
✅ **Clean usage tracking** (only count on payment completion)  
✅ **Maintained all security features** (email locks, product exclusions)  

Your coupon system should now work exactly as you wanted: discounts apply, percentage recalculates dynamically when cart changes, and usage only counts when payment completes.