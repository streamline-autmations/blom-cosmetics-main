-- ================================================
-- COMPLETE COUPON DISCOUNT FIX - MANUAL RUN
-- ================================================
-- Run these SQL statements in your Supabase SQL Editor in order

-- ================================================
-- STEP 1: The Main Fix - Update redeem_coupon function
-- ================================================

CREATE OR REPLACE FUNCTION public.redeem_coupon(
  p_code text,
  p_email text,
  p_order_total_cents integer
)
RETURNS TABLE (
  valid boolean,
  message text,
  discount_cents integer,
  discount_type text,
  discount_value integer,
  min_order_cents integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon record;
  v_discount_cents integer := 0;
  v_discount_type text;
  v_discount_value integer;
  v_min_order integer;
BEGIN
  -- Look up coupon by code
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = p_code
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Coupon not found.', 0, 'none', 0, 0;
    RETURN;
  END IF;

  -- Check if coupon is active
  IF COALESCE(v_coupon.status, 'inactive') <> 'active' THEN
    RETURN QUERY SELECT false, 'Coupon is not active.', 0, 'none', 0, 0;
    RETURN;
  END IF;

  -- Check expiry
  IF v_coupon.valid_until IS NOT NULL AND now() > v_coupon.valid_until THEN
    RETURN QUERY SELECT false, 'Coupon has expired.', 0, 'none', 0, 0;
    RETURN;
  END IF;

  -- Check if used up
  IF COALESCE(v_coupon.used_count, 0) >= COALESCE(v_coupon.max_uses, 1) THEN
    RETURN QUERY SELECT false, 'Coupon already used.', 0, 'none', 0, 0;
    RETURN;
  END IF;

  -- Check email lock
  IF v_coupon.lock_email IS NOT NULL AND lower(v_coupon.lock_email) <> lower(p_email) THEN
    RETURN QUERY SELECT false, 'Coupon locked to another email.', 0, 'none', 0, 0;
    RETURN;
  END IF;

  -- Get minimum order amount
  v_min_order := COALESCE(v_coupon.min_order_cents, 50000); -- Default R500
  v_min_order := COALESCE(v_min_order, 0); -- Handle NULL
  
  IF p_order_total_cents < v_min_order THEN
    RETURN QUERY SELECT false, 
      format('Order must be at least R%s (products only)', v_min_order / 100), 
      0, 'none', 0, v_min_order;
    RETURN;
  END IF;

  -- Determine discount type and calculate
  v_discount_type := COALESCE(v_coupon.type, 'percent'); -- Default to percent if type not set
  v_discount_value := CASE 
    WHEN v_discount_type = 'fixed' THEN COALESCE(v_coupon.value, 0)
    ELSE COALESCE(v_coupon.percent, 0)
  END;

  -- Calculate discount based on type
  IF v_discount_type = 'fixed' THEN
    -- Fixed discount: value is in Rands, convert to cents
    v_discount_cents := (v_discount_value * 100)::integer;
    
    -- Ensure discount doesn't exceed order total
    IF v_discount_cents > p_order_total_cents THEN
      v_discount_cents := p_order_total_cents;
    END IF;
    
    RETURN QUERY SELECT true,
      format('Coupon applied: R%s off', v_discount_value),
      v_discount_cents,
      v_discount_type,
      v_discount_value,
      v_min_order;
      
  ELSIF v_discount_type = 'percent' THEN
    -- Percentage discount: calculate percentage of order total
    v_discount_cents := floor((p_order_total_cents * v_discount_value)::numeric / 100)::integer;
    
    -- Apply max discount cap if exists
    IF v_coupon.max_discount_cents IS NOT NULL AND v_discount_cents > v_coupon.max_discount_cents THEN
      v_discount_cents := v_coupon.max_discount_cents;
    END IF;
    
    RETURN QUERY SELECT true,
      format('Coupon applied: %s%% off', v_discount_value),
      v_discount_cents,
      v_discount_type,
      v_discount_value,
      v_min_order;
      
  ELSE
    -- Unknown discount type
    RETURN QUERY SELECT false, 'Invalid discount type.', 0, 'none', 0, v_min_order;
    RETURN;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, text, integer) TO anon, authenticated, service_role;

-- ================================================
-- STEP 2: Add missing columns to coupons table
-- ================================================

-- Add type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coupons' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.coupons ADD COLUMN type text DEFAULT 'percent' CHECK (type IN ('percent', 'fixed'));
    UPDATE public.coupons SET type = 'percent' WHERE type IS NULL;
  END IF;

  -- Add value column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coupons' AND column_name = 'value'
  ) THEN
    ALTER TABLE public.coupons ADD COLUMN value integer;
  END IF;

  -- Add max_discount_cents column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coupons' AND column_name = 'max_discount_cents'
  ) THEN
    ALTER TABLE public.coupons ADD COLUMN max_discount_cents integer;
  END IF;
END $$;

-- Add comments
COMMENT ON FUNCTION public.redeem_coupon IS 'Validates and calculates coupon discounts. Supports both fixed (Rands) and percentage discount types.';
COMMENT ON COLUMN public.coupons.type IS 'Discount type: "percent" for percentage or "fixed" for fixed amount';
COMMENT ON COLUMN public.coupons.value IS 'For fixed discounts: amount in Rands (e.g., 250 = R250). For percentage: use percent column instead.';
COMMENT ON COLUMN public.coupons.max_discount_cents IS 'Maximum discount amount in cents for percentage discounts (optional)';

-- ================================================
-- STEP 3: Create a test fixed discount coupon
-- ================================================

-- Create a test R250 fixed discount coupon
INSERT INTO public.coupons (
  code, 
  type, 
  value, 
  min_order_cents, 
  max_uses, 
  used_count, 
  valid_from, 
  valid_until, 
  status,
  is_active
) VALUES (
  'R250OFF',
  'fixed',
  250, -- R250 fixed discount
  50000, -- R500 minimum order
  100,
  0,
  now(),
  now() + interval '30 days',
  'active',
  true
) ON CONFLICT (code) DO UPDATE SET
  type = EXCLUDED.type,
  value = EXCLUDED.value,
  min_order_cents = EXCLUDED.min_order_cents,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active;

-- ================================================
-- STEP 4: Test the fixed discount calculation
-- ================================================

-- Test with R1000 order (should give R250 discount)
SELECT 
  'R250 Fixed Discount Test' as test_name,
  valid,
  message,
  discount_cents / 100.0 as discount_rands,
  discount_type,
  discount_value
FROM public.redeem_coupon(
  'R250OFF', 
  'test@example.com', 
  100000 -- R1000 order total in cents
);

-- Test with R200 order (below minimum, should fail)
SELECT 
  'Below Minimum Order Test' as test_name,
  valid,
  message,
  discount_cents / 100.0 as discount_rands,
  discount_type,
  discount_value
FROM public.redeem_coupon(
  'R250OFF', 
  'test@example.com', 
  20000 -- R200 order total in cents (below R500 minimum)
);

-- Test with R100 order (discount capped at R100)
SELECT 
  'Discount Cap Test' as test_name,
  valid,
  message,
  discount_cents / 100.0 as discount_rands,
  discount_type,
  discount_value
FROM public.redeem_coupon(
  'R250OFF', 
  'test@example.com', 
  10000 -- R100 order total in cents (discount capped at R100)
);

-- ================================================
-- INSTRUCTIONS TO USE:
-- ================================================
-- 1. Copy and paste the SQL above into your Supabase SQL Editor
-- 2. Run it step by step (each section)
-- 3. The tests will show if your R250 coupon works correctly
-- 4. Delete the test coupon when done: DELETE FROM public.coupons WHERE code = 'R250OFF';

-- ================================================
-- FOR YOUR ACTUAL COUPON:
-- ================================================
-- In your admin panel, create a coupon with:
-- type = 'fixed'
-- value = 250
-- min_order_cents = 50000 (R500 minimum)
-- This will give R250 off orders over R500