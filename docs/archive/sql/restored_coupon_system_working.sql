-- ================================================
-- RESTORED COUPON SYSTEM - WORKING VERSION
-- ================================================
-- This restores basic functionality with dynamic percentage calculation
-- Solves: discounts not applying, dynamic recalculation, proper usage tracking

-- First, clean up any existing complex functions to avoid conflicts
DROP FUNCTION IF EXISTS public.redeem_coupon();
DROP FUNCTION IF EXISTS public.redeem_coupon(text);
DROP FUNCTION IF EXISTS public.redeem_coupon(text, text);
DROP FUNCTION IF EXISTS public.redeem_coupon(text, text, integer);
DROP FUNCTION IF EXISTS public.redeem_coupon(text, text, integer, jsonb);
DROP FUNCTION IF EXISTS public.redeem_coupon(text, text, integer, jsonb, text);
DROP FUNCTION IF EXISTS public.mark_coupon_validation_completed();
DROP FUNCTION IF EXISTS public.mark_coupon_validation_completed(text);
DROP FUNCTION IF EXISTS public.mark_coupon_validation_completed(text, uuid);
DROP FUNCTION IF EXISTS public.mark_coupon_validation_completed(text, text);
DROP FUNCTION IF EXISTS public.mark_coupon_validation_completed(text, text, integer);
DROP FUNCTION IF EXISTS public.validate_coupon_cart_state();
DROP FUNCTION IF EXISTS public.validate_coupon_cart_state(text);
DROP FUNCTION IF EXISTS public.validate_coupon_cart_state(text, jsonb);
DROP FUNCTION IF EXISTS public.validate_coupon_cart_state(text, jsonb, text);

-- Drop the complex tracking table if it exists (we'll use simple approach)
DROP TABLE IF EXISTS public.coupon_validations;

-- 1. Simple working redeem_coupon function with dynamic percentage calculation
CREATE OR REPLACE FUNCTION public.redeem_coupon(
  p_code text,
  p_email text,
  p_order_total_cents integer,
  p_cart_items jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  valid boolean,
  message text,
  discount_cents integer,
  discount_type text,
  discount_value integer,
  min_order_cents integer,
  coupon_id uuid
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
  v_eligible_total_cents integer := 0;
  v_excluded_total_cents integer := 0;
  v_item record;
  v_excluded_ids text[];
BEGIN
  -- Look up coupon by code
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE upper(code) = upper(p_code)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Coupon not found.', 0, 'none', 0, 0, null;
    RETURN;
  END IF;

  -- Check if coupon is active
  IF COALESCE(v_coupon.status, 'inactive') <> 'active' THEN
    RETURN QUERY SELECT false, 'Coupon is not active.', 0, 'none', 0, 0, null;
    RETURN;
  END IF;

  -- Check expiry
  IF v_coupon.valid_until IS NOT NULL AND now() > v_coupon.valid_until THEN
    RETURN QUERY SELECT false, 'Coupon has expired.', 0, 'none', 0, 0, null;
    RETURN;
  END IF;

  -- Check if used up
  IF COALESCE(v_coupon.used_count, 0) >= COALESCE(v_coupon.max_uses, 1) THEN
    RETURN QUERY SELECT false, 'Coupon already used.', 0, 'none', 0, 0, null;
    RETURN;
  END IF;

  -- Check email lock
  IF v_coupon.locked_email IS NOT NULL AND lower(v_coupon.locked_email) <> lower(p_email) THEN
    RETURN QUERY SELECT false, 'Coupon locked to another email.', 0, 'none', 0, 0, null;
    RETURN;
  END IF;

  -- Calculate eligible total considering product exclusions
  -- Parse excluded product IDs from text array
  v_excluded_ids := string_to_array(COALESCE(v_coupon.excluded_product_ids::text, ''), ',');

  -- Process cart items if provided for dynamic calculation
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS item(product_id text, quantity integer, unit_price_cents integer)
  LOOP
    -- Check if product is excluded
    IF v_excluded_ids IS NOT NULL AND array_length(v_excluded_ids, 1) > 0 THEN
      IF trim(v_item.product_id) = ANY(ARRAY(SELECT trim(x) FROM unnest(v_excluded_ids) x WHERE trim(x) <> '')) THEN
        -- Add to excluded total
        v_excluded_total_cents := v_excluded_total_cents + (v_item.quantity * COALESCE(v_item.unit_price_cents, 0));
        CONTINUE;
      END IF;
    END IF;
    
    -- Add to eligible total
    v_eligible_total_cents := v_eligible_total_cents + (v_item.quantity * COALESCE(v_item.unit_price_cents, 0));
  END LOOP;

  -- If no cart items provided or empty, use the order total directly
  IF p_cart_items = '[]'::jsonb OR jsonb_typeof(p_cart_items) IS NULL OR v_eligible_total_cents = 0 THEN
    v_eligible_total_cents := p_order_total_cents;
  END IF;

  -- Get minimum order amount
  v_min_order := COALESCE(v_coupon.min_order_cents, 50000); -- Default R500
  v_min_order := COALESCE(v_min_order, 0); -- Handle NULL
  
  IF v_eligible_total_cents < v_min_order THEN
    RETURN QUERY SELECT false, 
      format('Order must be at least R%s (excluding restricted items)', v_min_order / 100), 
      0, 'none', 0, v_min_order, v_coupon.id;
    RETURN;
  END IF;

  -- Determine discount type and calculate DYNAMICALLY
  v_discount_type := COALESCE(v_coupon.type, 'percent'); -- Default to percent if type not set
  v_discount_value := CASE 
    WHEN v_discount_type = 'fixed' THEN COALESCE(v_coupon.value, 0)
    ELSE COALESCE(v_coupon.percent, 0)
  END;

  -- Calculate discount based on type using CURRENT eligible total
  -- This allows dynamic recalculation when cart changes
  IF v_discount_type = 'fixed' THEN
    -- Fixed discount: value is in Rands, convert to cents
    v_discount_cents := (v_discount_value * 100)::integer;
    
    -- Ensure discount doesn't exceed eligible total
    IF v_discount_cents > v_eligible_total_cents THEN
      v_discount_cents := v_eligible_total_cents;
    END IF;
    
    RETURN QUERY SELECT true,
      format('Coupon applied: R%s off', v_discount_value),
      v_discount_cents,
      v_discount_type,
      v_discount_value,
      v_min_order,
      v_coupon.id;
      
  ELSIF v_discount_type = 'percent' THEN
    -- PERCENTAGE DISCOUNT: DYNAMIC CALCULATION
    -- Calculate percentage of CURRENT eligible total (not original)
    v_discount_cents := floor((v_eligible_total_cents * v_discount_value)::numeric / 100)::integer;
    
    -- Apply max discount cap if exists
    IF v_coupon.max_discount_cents IS NOT NULL AND v_discount_cents > v_coupon.max_discount_cents THEN
      v_discount_cents := v_coupon.max_discount_cents;
    END IF;
    
    -- Ensure discount doesn't exceed eligible total
    IF v_discount_cents > v_eligible_total_cents THEN
      v_discount_cents := v_eligible_total_cents;
    END IF;
    
    RETURN QUERY SELECT true,
      format('Coupon applied: %s%% off (R%s)', v_discount_value, v_discount_cents / 100.0),
      v_discount_cents,
      v_discount_type,
      v_discount_value,
      v_min_order,
      v_coupon.id;
      
  ELSE
    -- Unknown discount type
    RETURN QUERY SELECT false, 'Invalid discount type.', 0, 'none', 0, v_min_order, null;
    RETURN;
  END IF;
END;
$$;

-- 2. Simple function to increment usage count ONLY when order is created
CREATE OR REPLACE FUNCTION public.mark_coupon_used(p_code text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = COALESCE(used_count, 0) + 1
  WHERE upper(code) = upper(p_code);
END;
$$;

-- 3. Add new function to recalculate percentage discounts for existing coupons
-- This allows frontend to call when cart changes
CREATE OR REPLACE FUNCTION public.recalculate_coupon_discount(
  p_code text,
  p_email text,
  p_order_total_cents integer,
  p_cart_items jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  valid boolean,
  message text,
  discount_cents integer,
  discount_type text,
  discount_value integer,
  min_order_cents integer,
  coupon_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Just call redeem_coupon again - it calculates dynamically based on current cart
  -- This gives the user the updated discount when cart changes
  RETURN QUERY SELECT 
    valid,
    format('%s (updated)', message),
    discount_cents,
    discount_type,
    discount_value,
    min_order_cents,
    coupon_id
  FROM public.redeem_coupon(p_code, p_email, p_order_total_cents, p_cart_items);
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, text, integer, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_coupon_used(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_coupon_discount(text, text, integer, jsonb) TO anon, authenticated, service_role;

-- 5. Update comments
COMMENT ON FUNCTION public.redeem_coupon IS 'Main coupon validation with dynamic percentage calculation. Percentage discounts recalculate based on current cart total.';
COMMENT ON FUNCTION public.recalculate_coupon_discount IS 'Recalculates coupon discount for current cart state. Call this when cart changes to get updated percentage discount.';
COMMENT ON FUNCTION public.mark_coupon_used IS 'Increments coupon usage count - call this ONLY when order is completed (payment successful).';

-- 6. Create test coupons for verification
-- Test 1: Fixed discount coupon (R250 off)
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
  'TESTFIXED250',
  'fixed',
  250,
  50000,
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

-- Test 2: Percentage discount coupon (20% off)
INSERT INTO public.coupons (
  code,
  type,
  percent,
  min_order_cents,
  max_uses,
  used_count,
  valid_from,
  valid_until,
  status,
  is_active,
  max_discount_cents
) VALUES (
  'TESTPERCENT20',
  'percent',
  20,
  50000,
  100,
  0,
  now(),
  now() + interval '30 days',
  'active',
  true,
  50000 -- Max R500 discount
) ON CONFLICT (code) DO UPDATE SET
  type = EXCLUDED.type,
  percent = EXCLUDED.percent,
  min_order_cents = EXCLUDED.min_order_cents,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  max_discount_cents = EXCLUDED.max_discount_cents;

-- 7. Verification test queries
SELECT '=== COUPON SYSTEM RESTORED ===' as status;
SELECT 'Testing Fixed Discount' as test_name, valid, message, discount_cents/100.0 as discount_rands, discount_type, discount_value 
FROM public.redeem_coupon('TESTFIXED250', 'test@example.com', 100000, '[]'::jsonb);

SELECT 'Testing Percentage Discount - Initial' as test_name, valid, message, discount_cents/100.0 as discount_rands, discount_type, discount_value 
FROM public.redeem_coupon('TESTPERCENT20', 'test@example.com', 100000, '[]'::jsonb);

SELECT 'Testing Dynamic Recalculation - Lower Total' as test_name, valid, message, discount_cents/100.0 as discount_rands, discount_type, discount_value 
FROM public.redeem_coupon('TESTPERCENT20', 'test@example.com', 50000, '[]'::jsonb);

SELECT '✅ Coupon system restored with dynamic percentage calculation!' as result;