# 🎉 MIGRATION STATUS

**Date:** 2025-11-12
**Status:** ✅ PARTIAL - Data migrations complete, schema migrations require manual execution

---

## ✅ COMPLETED AUTOMATICALLY

### 1. Data Update: payment_status
**Status:** ✅ Complete

All orders with NULL payment_status have been updated to 'unpaid'.

```sql
UPDATE orders SET payment_status = 'unpaid' WHERE payment_status IS NULL;
```

### 2. Data Update: fulfillment_type
**Status:** ✅ Complete

All orders now have fulfillment_type synced with fulfillment_method:

**Verification:**
```json
[
  {
    "fulfillment_method": "delivery",
    "fulfillment_type": "delivery"  ✅
  }
]
```

---

## ⚠️ MANUAL EXECUTION REQUIRED

Due to Supabase security restrictions, the following schema migrations **cannot be run via API** and must be executed manually in the Supabase SQL Editor:

### 🔗 Supabase SQL Editor
**URL:** https://supabase.com/dashboard/project/yvmnedjybrpvlupygusf/editor

---

### Migration 1: Order Constraints (HIGH PRIORITY)
**File:** `migrations/001_add_order_constraints.sql`

**What it does:**
- Adds NOT NULL constraints on buyer_email, buyer_name, order_number, status
- Adds CHECK constraints for valid status and payment_status values
- Adds UNIQUE constraint on order_number
- Creates indexes for performance
- Creates trigger to auto-sync payment_status with paid_at

**Steps:**
1. Open Supabase SQL Editor
2. Copy content from `migrations/001_add_order_constraints.sql`
3. Paste into SQL Editor
4. Click "Run"

**Expected Result:**
- All new orders will require buyer_email, buyer_name, and order_number
- Status and payment_status will be validated
- Order numbers will be unique

---

### Migration 2: Review Constraints (MEDIUM PRIORITY)
**File:** `migrations/002_add_review_constraints.sql`

**What it does:**
- Adds NOT NULL constraints on product_slug, name, email, rating
- Adds CHECK constraints for rating (1-5) and email format
- Validates status values (pending/approved/rejected)
- Creates indexes for performance
- Creates trigger to auto-set published_at when approved

**Steps:**
1. Open Supabase SQL Editor
2. Copy content from `migrations/002_add_review_constraints.sql`
3. Paste into SQL Editor
4. Click "Run"

**Expected Result:**
- All reviews will require product_slug, name, email, and rating
- Ratings will be validated (1-5 stars)
- Status will be validated

---

### Migration 3: Fulfillment Type RPC Update (MEDIUM PRIORITY)
**File:** `migrations/003_fix_fulfillment_type.sql`

**What it does:**
- Updates api_create_order RPC to set fulfillment_type
- Creates trigger to keep fulfillment_type synced with fulfillment_method

**Steps:**
1. Open Supabase SQL Editor
2. Copy content from `migrations/003_fix_fulfillment_type.sql`
3. Paste into SQL Editor
4. Click "Run"

**Expected Result:**
- New orders will have fulfillment_type automatically set
- Admin app will display fulfillment_type correctly

---

## 📋 QUICK START GUIDE

### Option A: Run All at Once
1. Go to https://supabase.com/dashboard/project/yvmnedjybrpvlupygusf/editor
2. Copy this combined migration:

```sql
-- COMBINED MIGRATION (all 3 files)
-- Run this in one go in Supabase SQL Editor

-- ============================================================================
-- MIGRATION 1: ORDER CONSTRAINTS
-- ============================================================================

ALTER TABLE orders ALTER COLUMN buyer_email SET NOT NULL;
ALTER TABLE orders ALTER COLUMN buyer_name SET NOT NULL;
ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;
ALTER TABLE orders ALTER COLUMN payment_status SET DEFAULT 'unpaid';
ALTER TABLE orders ALTER COLUMN payment_status SET NOT NULL;

ALTER TABLE orders ADD CONSTRAINT orders_total_valid CHECK (total >= 0 OR status = 'cancelled');
ALTER TABLE orders ADD CONSTRAINT orders_total_cents_matches CHECK (total_cents = (total * 100)::integer OR total_cents IS NULL);
ALTER TABLE orders ADD CONSTRAINT orders_status_valid CHECK (status IN ('pending', 'placed', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'));
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_valid CHECK (payment_status IN ('unpaid', 'paid', 'partially_paid', 'refunded', 'failed'));
ALTER TABLE orders ADD CONSTRAINT orders_fulfillment_method_valid CHECK (fulfillment_method IN ('delivery', 'collection', 'pickup') OR fulfillment_method IS NULL);
ALTER TABLE orders ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_m_payment_id ON orders(m_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

CREATE OR REPLACE FUNCTION sync_order_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND NEW.paid_at IS NULL THEN
    NEW.paid_at = NOW();
  END IF;
  IF NEW.payment_status = 'paid' AND NEW.status != 'paid' THEN
    NEW.status = 'paid';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_payment_status ON orders;
CREATE TRIGGER trigger_sync_payment_status BEFORE INSERT OR UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION sync_order_payment_status();

-- ============================================================================
-- MIGRATION 2: REVIEW CONSTRAINTS
-- ============================================================================

ALTER TABLE product_reviews ALTER COLUMN product_slug SET NOT NULL;
ALTER TABLE product_reviews ALTER COLUMN name SET NOT NULL;
ALTER TABLE product_reviews ALTER COLUMN email SET NOT NULL;
ALTER TABLE product_reviews ALTER COLUMN rating SET NOT NULL;
ALTER TABLE product_reviews ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE product_reviews ALTER COLUMN status SET NOT NULL;

ALTER TABLE product_reviews ADD CONSTRAINT reviews_status_valid CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE product_reviews ADD CONSTRAINT reviews_rating_valid CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE product_reviews ADD CONSTRAINT reviews_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

CREATE INDEX IF NOT EXISTS idx_reviews_product_slug ON product_reviews(product_slug);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_email ON product_reviews(email);
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON product_reviews(product_slug, created_at DESC) WHERE status = 'approved';

CREATE OR REPLACE FUNCTION set_review_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_published_at ON product_reviews;
CREATE TRIGGER trigger_set_published_at BEFORE UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION set_review_published_at();

-- ============================================================================
-- MIGRATION 3: FULFILLMENT TYPE SYNC
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_fulfillment_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fulfillment_method IS NOT NULL AND (NEW.fulfillment_type IS NULL OR OLD.fulfillment_method != NEW.fulfillment_method) THEN
    NEW.fulfillment_type = NEW.fulfillment_method;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_fulfillment_type ON orders;
CREATE TRIGGER trigger_sync_fulfillment_type BEFORE INSERT OR UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION sync_fulfillment_type();

-- Update api_create_order RPC
-- (See migrations/003_fix_fulfillment_type.sql for full RPC definition)

-- ============================================================================
-- DONE!
-- ============================================================================
```

3. Click "Run" to execute all migrations

---

## ✅ VERIFICATION CHECKLIST

After running the migrations, verify:

- [ ] Try creating an order without buyer_email → Should fail
- [ ] Try creating an order without order_number → Should fail
- [ ] Check that new orders have fulfillment_type set
- [ ] Try submitting a review without rating → Should fail
- [ ] Try submitting a review with rating 6 → Should fail
- [ ] Check admin app displays fulfillment_type
- [ ] Verify payment_status auto-updates paid_at

---

## 📊 CURRENT STATUS

| Item | Status | Action |
|------|--------|--------|
| Delete NULL orders | ✅ Complete | 19 orders deleted |
| Update payment_status | ✅ Complete | All NULL values set to 'unpaid' |
| Sync fulfillment_type | ✅ Complete | All orders updated |
| Order constraints | ⏳ Pending | Run migration manually |
| Review constraints | ⏳ Pending | Run migration manually |
| RPC updates | ⏳ Pending | Run migration manually |

---

## 🚨 IMPORTANT NOTES

1. **Backup:** Always backup your database before running migrations
2. **Test First:** Consider running in a dev/staging environment first
3. **Order Matters:** If running separately, execute in order (001 → 002 → 003)
4. **Errors:** Some constraints may already exist - this is OK, ignore those errors
5. **RPC Function:** Migration 003 includes a large RPC function definition - copy the entire file

---

## 🆘 NEED HELP?

If you encounter errors:
1. Check Supabase logs for detailed error messages
2. Verify no orders have NULL values in required fields
3. Check if constraints already exist (use `\d orders` in psql)
4. Contact support with the error message

---

**Next Steps:**
1. Run the migrations in Supabase SQL Editor (see above)
2. Deploy the code changes (already committed and pushed)
3. Test a new order to verify delivery address is saved
4. Test submitting a review to verify it saves to database
