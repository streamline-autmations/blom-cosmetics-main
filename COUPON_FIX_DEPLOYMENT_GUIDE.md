# Coupon System Fix - Deployment Guide

## Problem Summary
The coupon system was failing with the PostgreSQL error:
```
column reference "coupon_id" is ambiguous
```

This error occurred when users tried to apply coupons, preventing them from completing checkout.

## Root Cause
The error was caused by ambiguous column references in the `redeem_coupon` function. Specifically, in the usage tracking logic (lines 298-302), there was a query that referenced `coupon_id` without proper table qualification, causing PostgreSQL to be unable to determine which table's `coupon_id` column was being referenced.

## Solution
Created a fixed version of the `redeem_coupon` function that:
1. **Properly qualifies column references** using table aliases (`cv.coupon_id`)
2. **Maintains all existing functionality** including cart manipulation prevention
3. **Preserves security features** like usage tracking and validation tokens
4. **Includes test functions** for verification

## Deployment Steps

### Step 1: Apply the Fix
Run the SQL fix file against your Supabase database:

```sql
-- Execute the contents of fix_coupon_ambiguous_column.sql
```

### Step 2: Verify the Fix
Test the fix with a simple coupon redemption:

```sql
-- Test basic coupon functionality
SELECT * FROM public.redeem_coupon('TEST-DISCOUNT', 'test@example.com', 100000, '[]'::jsonb);
```

### Step 3: Run Comprehensive Tests
Execute the test function to verify all functionality:

```sql
-- Run comprehensive tests
SELECT * FROM public.test_coupon_fix();
```

### Step 4: Monitor Production
After deployment, monitor:
- Coupon application success rate
- Error logs for any remaining issues
- User feedback on checkout flow

## Key Changes Made

### Before (Problematic Code):
```sql
SELECT COUNT(*) + COALESCE(v_coupon.used_count, 0) INTO v_pending_count
FROM public.coupon_validations 
WHERE coupon_id = v_coupon.id  -- ❌ Ambiguous column reference
AND used_for_order = false 
AND cleanup_at > now();
```

### After (Fixed Code):
```sql
SELECT COUNT(*) + COALESCE(v_coupon.used_count, 0) INTO v_pending_validations
FROM public.coupon_validations AS cv
WHERE cv.coupon_id = v_coupon.id  -- ✅ Properly qualified column reference
AND cv.used_for_order = false 
AND cv.cleanup_at > now();
```

## Testing Checklist
- [ ] Coupon redemption works without errors
- [ ] TEST-DISCOUNT coupon applies successfully
- [ ] Cart manipulation prevention still functions
- [ ] Usage tracking works correctly
- [ ] Email validation works
- [ ] Expiration checking works
- [ ] Percentage and fixed discounts calculate correctly

## Rollback Plan
If issues occur, you can revert by re-running the original migration:
```sql
-- Run the original complete_coupon_security_fix migration
-- This will overwrite the function with the previous version
```

## Expected Results
After applying this fix:
1. Users will be able to apply coupons successfully
2. The ambiguous column reference error will be eliminated
3. All existing security features will remain intact
4. Checkout flow will work normally

## Support
If you encounter any issues after deployment:
1. Check the error logs in Supabase dashboard
2. Run the test functions to verify functionality
3. Monitor the coupon_validations table for any anomalies

---
**Fix Applied:** 2025-11-28 13:02 UTC  
**Status:** Ready for deployment  
**Impact:** Critical - Resolves checkout blocking issue