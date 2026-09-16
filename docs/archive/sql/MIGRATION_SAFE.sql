-- ============================================================================
-- SAFE MIGRATION SCRIPT - Run this in Supabase SQL Editor
-- ============================================================================
-- This version includes error handling for existing constraints
-- ============================================================================

-- STEP 1: Add NOT NULL constraints to orders table
-- ============================================================================

ALTER TABLE orders ALTER COLUMN buyer_email SET NOT NULL;
ALTER TABLE orders ALTER COLUMN buyer_name SET NOT NULL;
ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;
ALTER TABLE orders ALTER COLUMN payment_status SET DEFAULT 'unpaid';
ALTER TABLE orders ALTER COLUMN payment_status SET NOT NULL;

-- ============================================================================
-- STEP 2: Add CHECK constraints (with IF NOT EXISTS handling)
-- ============================================================================

-- Drop existing constraints first (ignore errors if they don't exist)
DO $$
BEGIN
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_number_unique;
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_valid;
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_valid;
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_total_valid;
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_fulfillment_method_valid;
END $$;

-- Now add them
ALTER TABLE orders ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);
ALTER TABLE orders ADD CONSTRAINT orders_status_valid CHECK (status IN ('pending', 'placed', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'));
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_valid CHECK (payment_status IN ('unpaid', 'paid', 'partially_paid', 'refunded', 'failed'));
ALTER TABLE orders ADD CONSTRAINT orders_total_valid CHECK (total >= 0 OR status = 'cancelled');
ALTER TABLE orders ADD CONSTRAINT orders_fulfillment_method_valid CHECK (fulfillment_method IN ('delivery', 'collection', 'pickup') OR fulfillment_method IS NULL);

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_m_payment_id ON orders(m_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- ============================================================================
-- STEP 4: Create payment status sync trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_order_payment_status() RETURNS TRIGGER AS $$
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
CREATE TRIGGER trigger_sync_payment_status
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_payment_status();

-- ============================================================================
-- STEP 5: Add NOT NULL constraints to product_reviews table
-- ============================================================================

ALTER TABLE product_reviews ALTER COLUMN product_slug SET NOT NULL;
ALTER TABLE product_reviews ALTER COLUMN name SET NOT NULL;
ALTER TABLE product_reviews ALTER COLUMN email SET NOT NULL;
ALTER TABLE product_reviews ALTER COLUMN rating SET NOT NULL;
ALTER TABLE product_reviews ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE product_reviews ALTER COLUMN status SET NOT NULL;

-- ============================================================================
-- STEP 6: Add review CHECK constraints
-- ============================================================================

DO $$
BEGIN
  ALTER TABLE product_reviews DROP CONSTRAINT IF EXISTS reviews_rating_valid;
  ALTER TABLE product_reviews DROP CONSTRAINT IF EXISTS reviews_status_valid;
  ALTER TABLE product_reviews DROP CONSTRAINT IF EXISTS reviews_email_format;
END $$;

ALTER TABLE product_reviews ADD CONSTRAINT reviews_rating_valid CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE product_reviews ADD CONSTRAINT reviews_status_valid CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE product_reviews ADD CONSTRAINT reviews_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- ============================================================================
-- STEP 7: Create review indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_reviews_product_slug ON product_reviews(product_slug);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_email ON product_reviews(email);
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON product_reviews(product_slug, created_at DESC) WHERE status = 'approved';

-- ============================================================================
-- STEP 8: Create review published_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION set_review_published_at() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_published_at ON product_reviews;
CREATE TRIGGER trigger_set_published_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION set_review_published_at();

-- ============================================================================
-- STEP 9: Create fulfillment_type sync trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_fulfillment_type() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fulfillment_method IS NOT NULL THEN
    NEW.fulfillment_type = NEW.fulfillment_method;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_fulfillment_type ON orders;
CREATE TRIGGER trigger_sync_fulfillment_type
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_fulfillment_type();

-- ============================================================================
-- STEP 10: Update api_create_order RPC to set fulfillment_type
-- ============================================================================

CREATE OR REPLACE FUNCTION public.api_create_order(
  p_order_number text,
  p_m_payment_id text,
  p_buyer_email text,
  p_buyer_name text,
  p_buyer_phone text,
  p_channel text,
  p_items jsonb,
  p_subtotal_cents int,
  p_shipping_cents int,
  p_discount_cents int,
  p_tax_cents int,
  p_fulfillment_method text,
  p_delivery_address jsonb,
  p_collection_location text
)
RETURNS TABLE (
  order_id uuid,
  order_number text,
  m_payment_id text,
  total_cents int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_total_cents int;
BEGIN
  v_total_cents := p_subtotal_cents + p_shipping_cents + p_tax_cents - p_discount_cents;

  INSERT INTO public.orders (
    order_number,
    m_payment_id,
    status,
    payment_status,
    channel,
    buyer_email,
    buyer_name,
    buyer_phone,
    fulfillment_method,
    fulfillment_type,
    delivery_address,
    collection_location,
    subtotal_cents,
    shipping_cents,
    discount_cents,
    tax_cents,
    total_cents,
    total,
    placed_at,
    created_at
  ) VALUES (
    p_order_number,
    p_m_payment_id,
    'placed',
    'unpaid',
    p_channel,
    p_buyer_email,
    p_buyer_name,
    p_buyer_phone,
    p_fulfillment_method,
    p_fulfillment_method,  -- Also set fulfillment_type
    p_delivery_address,
    p_collection_location,
    p_subtotal_cents,
    p_shipping_cents,
    p_discount_cents,
    p_tax_cents,
    v_total_cents,
    v_total_cents / 100.0,
    now(),
    now()
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id,
    product_id,
    product_name,
    sku,
    quantity,
    unit_price,
    line_total
  )
  SELECT
    v_order_id,
    CASE
      WHEN item_data->>'product_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN (item_data->>'product_id')::uuid
      ELSE NULL
    END,
    item_data->>'product_name',
    item_data->>'sku',
    (item_data->>'quantity')::int,
    (item_data->>'unit_price')::numeric,
    ((item_data->>'quantity')::int * (item_data->>'unit_price')::numeric)
  FROM jsonb_array_elements(p_items) AS item_data;

  RETURN QUERY SELECT v_order_id, p_order_number, p_m_payment_id, v_total_cents;
END;
$$;

GRANT EXECUTE ON FUNCTION public.api_create_order(text, text, text, text, text, text, jsonb, int, int, int, int, text, jsonb, text) TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================

-- Verify the migration
SELECT 'Migration completed successfully!' as status;
