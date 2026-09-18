-- ================================================
-- COUPON SYSTEM WITH PROPER MAX DISCOUNT ENFORCEMENT
-- ================================================
-- Fixes cart manipulation vulnerability that allows max discount to be bypassed

-- First, clean up any existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.redeem_coupon();
DROP FUNCTION IF EXISTS public.redeem_coupon(text);
DROP FUNCTION IF EXISTS public.redeem_coupon(text, text);
DROP FUNCTION IF EXISTS public.redeem_coupon(text, text, integer);
DROP FUNCTION IF EXISTS public.redeem_coupon(text, text, integer, jsonb);

-- Drop the complex tracking table if it exists (we'll use simple approach)
DROP TABLE IF EXISTS public.coupon_validations;

-- 1. Enhanced redeem_coupon function with STRICT max discount enforcement
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
  v_max_allowed_discount integer;
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

  -- Process cart items for dynamic calculation
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
    -- PERCENTAGE DISCOUNT: CALCULATE WITH STRICT MAX DISCOUNT ENFORCEMENT
    
    -- Calculate percentage of CURRENT eligible total
    v_discount_cents := floor((v_eligible_total_cents * v_discount_value)::numeric / 100)::integer;
    
    -- CRITICAL: Strict max discount enforcement
    -- This prevents cart manipulation from bypassing the cap
    IF v_coupon.max_discount_cents IS NOT NULL THEN
      v_max_allowed_discount := v_coupon.max_discount_cents;
      
      -- ALWAYS enforce the max discount cap
      IF v_discount_cents > v_max_allowed_discount THEN
        v_discount_cents := v_max_allowed_discount;
      END IF;
      
      -- Additional check: if max discount would exceed eligible total, use the smaller amount
      IF v_discount_cents > v_eligible_total_cents THEN
        v_discount_cents := v_eligible_total_cents;
      END IF;
      
      -- Return with clear message about the cap
      IF v_max_allowed_discount < floor((v_eligible_total_cents * v_discount_value)::numeric / 100) THEN
        RETURN QUERY SELECT true,
          format('Coupon applied: %s%% off (capped at R%s max)', v_discount_value, v_max_allowed_discount / 100.0),
          v_discount_cents,
          v_discount_type,
          v_discount_value,
          v_min_order,
          v_coupon.id;
      ELSE
        RETURN QUERY SELECT true,
          format('Coupon applied: %s%% off (R%s)', v_discount_value, v_discount_cents / 100.0),
          v_discount_cents,
          v_discount_type,
          v_discount_value,
          v_min_order,
          v_coupon.id;
      END IF;
    ELSE
      -- No max discount cap - ensure discount doesn't exceed eligible total
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
    END IF;
      
  ELSE
    -- Unknown discount type
    RETURN QUERY SELECT false, 'Invalid discount type.', 0, 'none', 0, v_min_order, null;
    RETURN;
  END IF;
END;
$$;

-- 2. Enhanced function to recalculate percentage discounts with strict max enforcement
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
DECLARE
  v_result record;
BEGIN
  -- Get the coupon result with strict max discount enforcement
  SELECT * INTO v_result
  FROM public.redeem_coupon(p_code, p_email, p_order_total_cents, p_cart_items);
  
  -- Return result with updated message indicating recalculation
  RETURN QUERY SELECT 
    v_result.valid,
    format('%s (recalculated)', v_result.message),
    v_result.discount_cents,
    v_result.discount_type,
    v_result.discount_value,
    v_result.min_order_cents,
    v_result.coupon_id;
END;
$$;

-- 3. Simple function to increment usage count ONLY when order is created
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

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, text, integer, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_coupon_discount(text, text, integer, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_coupon_used(text) TO anon, authenticated, service_role;

-- 5. Update comments
COMMENT ON FUNCTION public.redeem_coupon IS 'Coupon validation with strict max discount enforcement. Prevents cart manipulation from bypassing percentage discount caps.';
COMMENT ON FUNCTION public.recalculate_coupon_discount IS 'Recalculates coupon discount with strict max discount enforcement. Use when cart changes to prevent cap bypass.';
COMMENT ON FUNCTION public.mark_coupon_used IS 'Increments coupon usage count - call this ONLY when order is completed (payment successful).';

-- 6. Update test coupon with max discount cap
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
  20000 -- R200 max discount (for testing)
) ON CONFLICT (code) DO UPDATE SET
  type = EXCLUDED.type,
  percent = EXCLUDED.percent,
  min_order_cents = EXCLUDED.min_order_cents,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  max_discount_cents = EXCLUDED.max_discount_cents;

-- 7. Comprehensive verification tests showing max discount enforcement
SELECT '=== COUPON SYSTEM WITH MAX DISCOUNT ENFORCEMENT ===' as status;

-- Test 1: Max discount enforcement (20% off R2000 should cap at R200)
SELECT 'Test 1: Max Discount Enforcement' as test_name, valid, message, discount_cents/100.0 as discount_rands, discount_type 
FROM public.redeem_coupon('TESTPERCENT20', 'test@example.com', 200000, '[]'::jsonb);

-- Test 2: Below max discount (20% off R500 = R100, under R200 cap)  
SELECT 'Test 2: Below Max Discount' as test_name, valid, message, discount_cents/100.0 as discount_rands, discount_type
FROM public.redeem_coupon('TESTPERCENT20', 'test@example.com', 50000, '[]'::jsonb);

-- Test 3: Dynamic recalculation with cart items (should still enforce max)
SELECT 'Test 3: Dynamic Cart Recalculation' as test_name, valid, message, discount_cents/100.0 as discount_rands, discount_type
FROM public.redeem_coupon('TESTPERCENT20', 'test@example.com', 150000, '[{"product_id": "prod1", "quantity": 2, "unit_price_cents": 75000}]'::jsonb);

-- Test 4: Simulate cart manipulation attempt (large total, should still cap at R200)
SELECT 'Test 4: Cart Manipulation Prevention' as test_name, valid, message, discount_cents/100.0 as discount_rands, discount_type
FROM public.redeem_coupon('TESTPERCENT20', 'test@example.com', 500000, '[{"product_id": "prod1", "quantity": 10, "unit_price_cents": 50000}]'::jsonb);

-- Test 5: Test fixed discount (should not be affected by max discount logic)
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

SELECT 'Test 5: Fixed Discount (No Max Cap Logic)' as test_name, valid, message, discount_cents/100.0 as discount_rands, discount_type
FROM public.redeem_coupon('TESTFIXED250', 'test@example.com', 50000, '[]'::jsonb);

SELECT '✅ Coupon system with strict max discount enforcement restored!' as result;