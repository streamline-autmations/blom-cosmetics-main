# Coupon Usage Tracking Fix

## Problem Summary
The coupon system was marking coupons as "used" immediately when they were applied to the shopping cart, rather than when the order was actually completed. This caused issues where:
- Users couldn't remove and reapply the same coupon
- Coupons appeared "used" even if the order was abandoned
- The coupon became unavailable if users wanted to change their cart before completing checkout

## Root Cause
In the `redeem_coupon` database function, single-use coupons had their `used_count` incremented immediately during validation, before the order was actually placed.

```sql
-- OLD CODE (problematic)
IF v_is_single_use THEN
  UPDATE public.coupons
  SET used_count = COALESCE(used_count, 0) + 1
  WHERE id = v_coupon.id;
END IF;
```

## Solution
The fix changes the behavior so that:
1. **Coupon application** = Only validates the coupon and stores a temporary validation record
2. **Order completion** = Actually increments the usage count

### Key Changes Made:

#### 1. `redeem_coupon` function
- Removed the immediate `used_count` increment for single-use coupons
- Now only creates a validation record that expires after 30 minutes
- Allows multiple applications/removals before order completion

#### 2. `mark_coupon_validation_completed` function  
- Now actually increments the `used_count` when called during order creation
- This is the proper time to count coupon usage

#### 3. `cleanup_expired_coupon_validations` function
- Simplified to only delete expired validation records
- No longer needs to decrement usage counts (since they weren't incremented during validation)

## How It Works Now

### Before (Problematic Flow):
```
User applies coupon → used_count++ → "Already used" error if reapply
User removes coupon → used_count stays incremented
User re-applies coupon → ERROR: Already used
```

### After (Fixed Flow):
```
User applies coupon → validation record created (no used_count change)
User removes coupon → validation record remains but can be recreated
User re-applies coupon → Same validation works fine
User places order → used_count++ (only now)
```

## Testing the Fix

### Test Scenario:
1. Apply a single-use coupon to cart ✅
2. Remove the coupon from cart ✅  
3. Re-apply the same coupon ✅
4. Complete the order ✅
5. Try to apply again → Should fail (properly used now) ✅

### Manual Test Commands:
```sql
-- Clean up any existing test data
SELECT public.cleanup_expired_coupon_validations();

-- Test coupon validation (should work multiple times)
SELECT * FROM public.redeem_coupon('TEST-DISCOUNT', 'test@example.com', 100000, '[]'::jsonb);

-- Check validation records
SELECT * FROM public.coupon_validations;

-- Simulate order completion
SELECT public.mark_coupon_validation_completed('your-validation-token', gen_random_uuid());

-- Try again (should fail now)
SELECT * FROM public.redeem_coupon('TEST-DISCOUNT', 'test@example.com', 100000, '[]'::jsonb);
```

## Deployment

To apply this fix:

1. **Run the migration:**
   ```bash
   # In your Supabase project SQL editor or via CLI
   \i deploy_coupon_fix.sql
   ```

2. **Or manually execute the migration file:**
   ```sql
   -- Copy and paste the contents of supabase/migrations/20251128000003_complete_coupon_security_fix.sql
   ```

3. **Verify deployment:**
   ```sql
   -- Check that the functions were updated
   SELECT routine_name, routine_definition 
   FROM information_schema.routines 
   WHERE routine_name IN ('redeem_coupon', 'mark_coupon_validation_completed');
   ```

## Benefits

✅ **User Experience:** Customers can now apply/remove/reapply coupons freely before checkout
✅ **Proper Tracking:** Coupons are only counted as "used" when orders are actually completed  
✅ **Abandoned Carts:** No more stuck "used" coupons from abandoned orders
✅ **Flexibility:** Users can change their mind about coupons without penalty
✅ **Security:** Cart manipulation protection still works (validates cart state)

## Database Tables Affected

- `coupons` - No schema changes, only logic changes in functions
- `coupon_validations` - Tracks temporary validation attempts (no changes needed)
- Functions updated: `redeem_coupon`, `mark_coupon_validation_completed`, `cleanup_expired_coupon_validations`

## Frontend Impact

No changes needed in the frontend! The same API calls work, but now behave correctly:
- `apply-coupon` function: Works multiple times before order completion
- `create-order` function: Still calls `mark_coupon_validation_completed` at the right time

## Monitoring

After deployment, watch for:
- Reduced "coupon already used" errors from legitimate users
- Proper coupon usage counting (only completed orders)
- Validation record cleanup (should expire after 30 minutes)

## Rollback Plan

If issues arise, you can rollback by restoring the previous migration, but the current fix should resolve the core user experience problem without breaking existing functionality.