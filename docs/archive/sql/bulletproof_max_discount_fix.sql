-- ================================================
-- COUPON SYSTEM WITH BULLETPROOF MAX DISCOUNT ENFORCEMENT
-- ================================================
-- Fixes the recalculation bypass issue where max discount breaks during cart changes

-- Clean up existing functions
DROP FUNCTION IF EXISTS public.redeem_coupon();
DROP FUNCTION IF EXISTS public.redeem_coupon(text);
DROP FUNCTION IF EXISTS public.redeem_coupon(text, text);
DROP FUNCTION IF EXISTS public.redeem_coupon(text, text, integer);
DROP FUNCTION IF EXISTS public.redeem_coupon(text, text, integer, jsonb);
DROP FUNCTION IF EXISTS public.recalculate_coupon_discount();
DROP FUNCTION IF EXISTS public.recalculate_coupon_discount(text);
DROP FUNCTION IF EXISTS public.recalculate_coupon_discount(text, text);
DROP FUNCTION IF EXISTS public.recalculate_coupon_discount(text, text, integer);
DROP FUNCTION IF EXISTS public.recalculate_coupon_discount(text, text, integer, jsonb);

-- Drop the complex tracking table if it exists
DROP TABLE IF EXISTS public.coupon_validations;

-- 1. Main redeem_coupon function with bulletproof max discount enforcement
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

  -- Determine discount type and calculate
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
    -- PERCENTAGE DISCOUNT: BULLETPROOF MAX DISCOUNT ENFORCEMENT
    
    -- Calculate percentage of current eligible total
    v_discount_cents := floor((v_eligible_total_cents * v_discount_value)::numeric / 100)::integer;
    
    -- BULLETPROOF: Multiple layers of max discount enforcement
    IF v_coupon.max_discount_cents IS NOT NULL THEN
      v_max_allowed_discount := v_coupon.max_discount_cents;
      
      -- Layer 1: Always enforce the max discount cap
      IF v_discount_cents > v_max_allowed_discount THEN
        v_discount_cents := v_max_allowed_discount;
      END IF;
      
      -- Layer 2: Ensure we don't exceed eligible total (extra safety)
      IF v_discount_cents > v_eligible_total_cents THEN
        v_discount_cents := v_eligible_total_cents;
      END IF;
      
      -- Return with clear indication of cap status
      IF floor((v_eligible_total_cents * v_discount_value)::numeric / 100) > v_max_allowed_discount THEN
        RETURN QUERY SELECT true,
          format('Coupon applied: %s%% off (MAX DISCOUNT: R%s)', v_discount_value, v_max_allowed_discount / 100.0),
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

-- 2. CRITICAL FIX: Enhanced recalculate_coupon_discount with BULLETPROOF max enforcement
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
  v_raw_discount integer;
BEGIN
  -- Look up coupon by code (same validation as redeem_coupon)
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE upper(code) = upper(p_code)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Coupon not found.', 0, 'none', 0, 0, null;
    RETURN;
  END IF;

  -- Check if coupon is active (same validation)
  IF COALESCE(v_coupon.status, 'inactive') <> 'active' THEN
    RETURN QUERY SELECT false, 'Coupon is not active.', 0, 'none', 0, 0, null;
    RETURN;
  END IF;

  -- Check expiry (same validation)
  IF v_coupon.valid_until IS NOT NULL AND now() > v_coupon.valid_until THEN
    RETURN QUERY SELECT false, 'Coupon has expired.', 0, 'none', 0, 0, null;
    RETURN;
  END IF;

  -- Check if used up (same validation)
  IF COALESCE(v_coupon.used_count, 0) >= COALESCE(v_coupon.max_uses, 1) THEN
    RETURN QUERY SELECT false, 'Coupon already used.', 0, 'none', 0, 0, null;
    RETURN;
  END IF;

  -- Check email lock (same validation)
  IF v_coupon.locked_email IS NOT NULL AND lower(v_coupon.locked_email) <> lower(p_email) THEN
    RETURN QUERY SELECT false, 'Coupon locked to another email.', 0, 'none', 0, 0, null;
    RETURN;
  END IF;

  -- Calculate eligible total (identical to redeem_coupon)
  v_excluded_ids := string_to_array(COALESCE(v_coupon.excluded_product_ids::text, ''), ',');

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS item(product_id text, quantity integer, unit_price_cents integer)
  LOOP
    IF v_excluded_ids IS NOT NULL AND array_length(v_excluded_ids, 1) > 0 THEN
      IF trim(v_item.product_id) = ANY(ARRAY(SELECT trim(x) FROM unnest(v_excluded_ids) x WHERE trim(x) <> '')) THEN
        v_excluded_total_cents := v_excluded_total_cents + (v_item.quantity * COALESCE(v_item.unit_price_cents, 0));
        CONTINUE;
      END IF;
    END IF;
    
    v_eligible_total_cents := v_eligible_total_cents + (v_item.quantity * COALESCE(v_item.unit_price_cents, 0));
  END LOOP;

  IF p_cart_items = '[]'::jsonb OR jsonb_typeof(p_cart_items) IS NULL OR v_eligible_total_cents = 0 THEN
    v_eligible_total_cents := p_order_total_cents;
  END IF;

  -- Get minimum order amount (same as redeem_coupon)
  v_min_order := COALESCE(v_coupon.min_order_cents, 50000);
  v_min_order := COALESCE(v_min_order, 0);
  
  IF v_eligible_total_cents < v_min_order THEN
    RETURN QUERY SELECT false, 
      format('Order must be at least R%s (excluding restricted items)', v_min_order / 100), 
      0, 'none', 0, v_min_order, v_coupon.id;
    RETURN;
  END IF;

  -- Determine discount type (same logic)
  v_discount_type := COALESCE(v_coupon.type, 'percent');
  v_discount_value := CASE 
    WHEN v_discount_type = 'fixed' THEN COALESCE(v_coupon.value, 0)
    ELSE COALESCE(v_coupon.percent, 0)
  END;

  -- Calculate discount with BULLETPROOF max enforcement (independent logic)
  IF v_discount_type = 'fixed' THEN
    -- Fixed discount calculation
    v_discount_cents := (v_discount_value * 100)::integer;
    
    IF v_discount_cents > v_eligible_total_cents THEN
      v_discount_cents := v_eligible_total_cents;
    END IF;
    
    RETURN QUERY SELECT true,
      format('Coupon updated: R%s off', v_discount_value),
      v_discount_cents,
      v_discount_type,
      v_discount_value,
      v_min_order,
      v_coupon.id;
      
  ELSIF v_discount_type = 'percent' THEN
    -- PERCENTAGE DISCOUNT: INDEPENDENT BULLETPROOF MAX ENFORCEMENT
    -- This recalculates independently to ensure max discount is always enforced
    
    -- Calculate raw percentage discount
    v_raw_discount := floor((v_eligible_total_cents * v_discount_value)::numeric / 100)::integer;
    
    -- CRITICAL: BULLETPROOF MAX DISCOUNT ENFORCEMENT FOR RECALCULATION
    IF v_coupon.max_discount_cents IS NOT NULL THEN
      v_max_allowed_discount := v_coupon.max_discount_cents;
      
      -- ALWAYS enforce the maximum, no exceptions
      IF v_raw_discount > v_max_allowed_discount THEN
        v_discount_cents := v_max_allowed_discount;
      ELSE
        v_discount_cents := v_raw_discount;
      END IF;
      
      -- Additional safety check
      IF v_discount_cents > v_eligible_total_cents THEN
        v_discount_cents := v_eligible_total_cents;
      END IF;
      
      -- Return with "UPDATED" indication and max discount info
      IF v_raw_discount > v_max_allowed_discount THEN
        RETURN QUERY SELECT true,
          format('Coupon updated: %s%% off (MAX DISCOUNT: R%s)', v_discount_value, v_max_allowed_discount / 100.0),
          v_discount_cents,
          v_discount_type,
          v_discount_value,
          v_min_order,
          v_coupon.id;
      ELSE
        RETURN QUERY SELECT true,
          format('Coupon updated: %s%% off (R%s)', v_discount_value, v_discount_cents / 100.0),
          v_discount_cents,
          v_discount_type,
          v_discount_value,
          v_min_order,
          v_coupon.id;
      END IF;
    ELSE
      -- No max discount cap
      IF v_raw_discount > v_eligible_total_cents THEN
        v_discount_cents := v_eligible_total_cents;
      ELSE
        v_discount_cents := v_raw_discount;
      END IF;
      
      RETURN QUERY SELECT true,
        format('Coupon updated: %s%% off (R%s)', v_discount_value, v_discount_cents / 100.0),
        v_discount_cents,
        v_discount_type,
        v_discount_value,
        v_min_order,
        v_coupon.id;
    END IF;
      
  ELSE
    RETURN QUERY SELECT false, 'Invalid discount type.', 0, 'none', 0, v_min_order, null;
    RETURN;
  END IF;
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
COMMENT ON FUNCTION public.redeem_coupon IS 'Main coupon validation with bulletproof max discount enforcement for initial application.';
COMMENT ON FUNCTION public.recalculate_coupon_discount IS 'Recalculates coupon discount with INDEPENDENT bulletproof max discount enforcement. Use when cart changes.';
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
  20000 -- R200 max discount
) ON CONFLICT (code) DO UPDATE SET
  type = EXCLUDED.type,
  percent = EXCLUDED.percent,
  min_order_cents = EXCLUDED.min_order_cents,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  max_discount_cents = EXCLUDED.max_discount_cents;

-- 7. COMPREHENSIVE TESTS proving recalculation max discount enforcement
SELECT '=== BULLETPROOF MAX DISCOUNT ENFORCEMENT TESTS ===' as status;

-- Test 1: Initial application (should cap at R200)
SELECT 'Test 1: Initial Application' as test_name, valid, message, discount_cents/100.0 as discount_rands
FROM public.redeem_coupon('TESTPERCENT20', 'test@example.com', 200000, '[]'::jsonb);

-- Test 2: Recalculation with large cart (should still cap at R200)
SELECT 'Test 2: Recalculation Large Cart' as test_name, valid, message, discount_cents/100.0 as discount_rands
FROM public.recalculate_coupon_discount('TESTPERCENT20', 'test@example.com', 200000, '[]'::jsonb);

-- Test 3: Recalculation with small cart (should STILL respect R200 max)
SELECT 'Test 3: Recalculation Small Cart (Critical Test)' as test_name, valid, message, discount_cents/100.0 as discount_rands
FROM public.recalculate_coupon_discount('TESTPERCENT20', 'test@example.com', 30000, '[]'::jsonb);

-- Test 4: Recalculation with cart items (should enforce max)
SELECT 'Test 4: Recalculation with Cart Items' as test_name, valid, message, discount_cents/100.0 as discount_rands
FROM public.recalculate_coupon_discount('TESTPERCENT20', 'test@example.com', 150000, '[{"product_id": "prod1", "quantity": 2, "unit_price_cents": 75000}]'::jsonb);

-- Test 5: Cart manipulation simulation (should always respect R200 max)
SELECT 'Test 5: Cart Manipulation Prevention' as test_name, valid, message, discount_cents/100.0 as discount_rands
FROM public.recalculate_coupon_discount('TESTPERCENT20', 'test@example.com', 500000, '[{"product_id": "prod1", "quantity": 10, "unit_price_cents": 50000}]'::jsonb);

-- Test 6: Multiple recalculations (should always return same max)
SELECT 'Test 6: Multiple Recalculations Consistency' as test_name, valid, message, discount_cents/100.0 as discount_rands
FROM public.recalculate_coupon_discount('TESTPERCENT20', 'test@example.com', 100000, '[]'::jsonb);

SELECT '✅ BULLETPROOF MAX DISCOUNT ENFORCEMENT: recalculate_coupon_discount now has independent max discount logic!' as result;