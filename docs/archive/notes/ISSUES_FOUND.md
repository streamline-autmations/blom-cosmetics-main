# 🐛 ISSUES FOUND & FIXES

## Issue #1: Delivery Addresses Are Empty ❌

### Root Cause:
In `netlify/functions/create-order.ts` lines 37-62, there's a logic bug:

```javascript
if (body.shipping || body.deliveryAddress || body.shippingMethod) {
  // First: Set fulfillment from body.shipping (CORRECT)
  if (body.shipping) {
    fulfillment = {
      method: body.shipping.method,
      delivery_address: body.shipping.address || null,  // ✅ This has the address!
      collection_location: body.shipping.method === 'store-pickup' ? 'BLOM HQ, Randfontein' : null
    }
  }

  // Then: OVERWRITE with legacy format (BUG!)
  const method = body.shippingMethod || 'door-to-door'
  const deliveryAddr = body.deliveryAddress || {}  // ❌ body.deliveryAddress doesn't exist!

  fulfillment = {  // ❌ This OVERWRITES the correct data above!
    method: method,
    delivery_address: method === 'door-to-door' ? {
      street_address: deliveryAddr.street_address || '',  // All empty strings!
      local_area: deliveryAddr.local_area || '',
      city: deliveryAddr.city || '',
      zone: deliveryAddr.zone || '',
      code: deliveryAddr.code || '',
      country: deliveryAddr.country || 'ZA'
    } : null,
    collection_location: method === 'store-pickup' ? 'BLOM HQ, Randfontein' : null
  }
}
```

**The Problem:**
1. Checkout page sends `body.shipping.address` with the delivery address
2. Code correctly sets `fulfillment.delivery_address` from `body.shipping.address`
3. **BUT THEN** it unconditionally overwrites it with `body.deliveryAddress` (which doesn't exist!)
4. Result: Empty address object `{street_address: '', city: '', ...}`

### Fix:
Only use legacy format if new format wasn't provided:

```javascript
if (body.shipping || body.deliveryAddress || body.shippingMethod) {
  // Preferred new shape
  if (body.shipping) {
    fulfillment = {
      method: body.shipping.method,
      delivery_address: body.shipping.address || null,
      collection_location: body.shipping.method === 'store-pickup' ? 'BLOM HQ, Randfontein' : null
    }
  }
  // Legacy format - ONLY if body.shipping wasn't provided
  else if (body.shippingMethod || body.deliveryAddress) {
    const method = body.shippingMethod || 'door-to-door'
    const deliveryAddr = body.deliveryAddress || {}

    fulfillment = {
      method: method,
      delivery_address: method === 'door-to-door' ? {
        street_address: deliveryAddr.street_address || '',
        local_area: deliveryAddr.local_area || '',
        city: deliveryAddr.city || '',
        zone: deliveryAddr.zone || '',
        code: deliveryAddr.code || '',
        country: deliveryAddr.country || 'ZA'
      } : null,
      collection_location: method === 'store-pickup' ? 'BLOM HQ, Randfontein' : null
    }
  }
}
```

---

## Issue #2: fulfillment_type is Always NULL ❌

### Root Cause:
The `orders` table has TWO fields:
- `fulfillment_method` (being set correctly: "delivery", "collection")
- `fulfillment_type` (always NULL - never set!)

The RPC function `api_create_order` only sets `fulfillment_method`:
```sql
INSERT INTO public.orders (
  ...
  fulfillment_method,  -- ✅ This is set
  ...
) VALUES (
  ...
  p_fulfillment_method,  -- ✅ 'delivery' or 'collection'
  ...
)
```

But there's NO parameter or logic to set `fulfillment_type`.

**The admin app is likely querying `fulfillment_type` instead of `fulfillment_method`!**

### Fix Options:

**Option A: Set fulfillment_type = fulfillment_method (Quick Fix)**
Add this to the RPC:
```sql
fulfillment_type,
```
and
```sql
p_fulfillment_method,  -- Use same value for both
```

**Option B: Remove fulfillment_type column (Better - Remove Redundancy)**
```sql
ALTER TABLE orders DROP COLUMN fulfillment_type;
```
Then update admin app to query `fulfillment_method` instead.

**Option C: Give them different meanings**
- `fulfillment_method`: How? (delivery, collection)
- `fulfillment_type`: Who? (courier, own-vehicle, pudo, etc.)

---

## Issue #3: No Product Reviews ⚠️

### Root Cause:
Need to check review submission code. The table exists but has 0 reviews.

Possible causes:
1. Review form not submitting correctly
2. Validation errors blocking submissions
3. Reviews not showing on product pages (so customers don't know they can leave reviews)

### Next Steps:
- Find and test review submission form
- Check for JavaScript errors
- Verify review approval workflow

---

## Summary of Fixes Needed:

| Issue | File | Fix Priority | Impact |
|-------|------|--------------|--------|
| Empty delivery addresses | `netlify/functions/create-order.ts` | 🔴 HIGH | All new orders have no address |
| fulfillment_type NULL | `supabase/migrations/*.sql` + RPC | 🔴 HIGH | Admin app can't see fulfillment type |
| No reviews | Review form code | 🟡 MEDIUM | No social proof for products |

---

## Testing Plan:

1. **After fixing delivery address bug:**
   - Place test order with delivery
   - Verify `delivery_address` has all fields populated
   - Check in admin app

2. **After fixing fulfillment_type:**
   - Place test order
   - Verify `fulfillment_type` is set
   - Check admin app shows fulfillment type

3. **After fixing reviews:**
   - Submit test review
   - Verify it appears in database
   - Check approval workflow
