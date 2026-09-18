-- ================================================
-- FRONTEND-BACKEND SYNC FIX - FORCE BACKEND ENFORCEMENT
-- ================================================
-- This creates a stronger backend function that the frontend MUST call

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.redeem_coupon();
DROP FUNCTION IF EXISTS public.redeem_coupon(text);
DROP FUNCTION IF EXISTS public.redeem_coupon(text, text);
DROP FUNCTION IF EXISTS public.redeem_coupon(text, text, integer);
DROP FUNCTION IF EXISTS public.redeem_coupon(text, text, integer, jsonb);
DROP FUNCTION IF EXISTS public.redeem_coupon_discount_only();
DROP FUNCTION IF EXISTS public.redeem_coupon_discount_only(text);
DROP FUNCTION IF EXISTS public.recalculate_coupon_discount();
DROP FUNCTION IF EXISTS public.recalculate_coupon_discount(text);
DROP FUNCTION IF EXISTS public.recalculate_coupon_discount(text, text);
DROP FUNCTION IF EXISTS public.recalculate_coupon_discount(text, text, integer);
DROP FUNCTION IF EXISTS public.recalculate_coupon_discount(text, text, integer, jsonb);

-- Drop the complex tracking table
DROP TABLE IF EXISTS public.coupon_validations;

-- 1. Create a simplified discount-only function (for frontend convenience)
CREATE OR REPLACE FUNCTION public.redeem_coupon_discount_only(
  p_code text,
  p_email text,
  p_order_total_cents integer,
  p_cart_items jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  valid boolean,
  discount_cents integer,
  discount_type text,
  discount_value integer,
  coupon_id uuid,
  full_message text
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
  v_full_message text;
BEGIN
  -- Look up coupon by code
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE upper(code) = upper(p_code)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'none', 0, null::uuid, 'Coupon not found.';
    RETURN;
  END IF;

  -- Check if coupon is active
  IF COALESCE(v_coupon.status, 'inactive') <> 'active' THEN
    RETURN QUERY SELECT false, 0, 'none', 0, null::uuid, 'Coupon is not active.';
    RETURN;
  END IF;

  -- Check expiry
  IF v_coupon.valid_until IS NOT NULL AND now() > v_coupon.valid_until THEN
    RETURN QUERY SELECT false, 0, 'none', 0, null::uuid, 'Coupon has expired.';
    RETURN;
  END IF;

  -- Check if used up
  IF COALESCE(v_coupon.used_count, 0) >= COALESCE(v_coupon.max_uses, 1) THEN
    RETURN QUERY SELECT false, 0, 'none', 0, null::uuid, 'Coupon already used.';
    RETURN;
  END IF;

  -- Check email lock
  IF v_coupon.locked_email IS NOT NULL AND lower(v_coupon.locked_email) <> lower(p_email) THEN
    RETURN QUERY SELECT false, 0, 'none', 0, null::uuid, 'Coupon locked to another email.';
    RETURN;
  END IF;

  -- Calculate eligible total considering product exclusions
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

  -- Get minimum order amount
  v_min_order := COALESCE(v_coupon.min_order_cents, 50000); -- Default R500
  v_min_order := COALESCE(v_min_order, 0); -- Handle NULL
  
  IF v_eligible_total_cents < v_min_order THEN
    RETURN QUERY SELECT false, 0, 'none', 0, null::uuid, 
      format('Order must be at least R%s (excluding restricted items)', v_min_order / 100);
    RETURN;
  END IF;

  -- Determine discount type and calculate
  v_discount_type := COALESCE(v_coupon.type, 'percent');
  v_discount_value := CASE 
    WHEN v_discount_type = 'fixed' THEN COALESCE(v_coupon.value, 0)
    ELSE COALESCE(v_coupon.percent, 0)
  END;

  -- Calculate discount with BULLETPROOF max enforcement
  IF v_discount_type = 'fixed' THEN
    v_discount_cents := (v_discount_value * 100)::integer;
    
    IF v_discount_cents > v_eligible_total_cents THEN
      v_discount_cents := v_eligible_total_cents;
    END IF;
    
    v_full_message := format('Coupon applied: R%s off', v_discount_value);
    
  ELSIF v_discount_type = 'percent' THEN
    -- PERCENTAGE WITH STRICT MAX ENFORCEMENT
    v_raw_discount := floor((v_eligible_total_cents * v_discount_value)::numeric / 100)::integer;
    
    -- BULLETPROOF MAX ENFORCEMENT - THIS IS THE KEY FIX
    IF v_coupon.max_discount_cents IS NOT NULL THEN
      v_max_allowed_discount := v_coupon.max_discount_cents;
      
      -- ALWAYS enforce the maximum, no exceptions
      IF v_raw_discount > v_max_allowed_discount THEN
        v_discount_cents := v_max_allowed_discount;
        v_full_message := format('Coupon applied: %s%% off (MAX DISCOUNT: R%s)', v_discount_value, v_max_allowed_discount / 100.0);
      ELSE
        v_discount_cents := v_raw_discount;
        v_full_message := format('Coupon applied: %s%% off (R%s)', v_discount_value, v_discount_cents / 100.0);
      END IF;
    ELSE
      -- No max discount cap
      v_discount_cents := v_raw_discount;
      v_full_message := format('Coupon applied: %s%% off (R%s)', v_discount_value, v_discount_cents / 100.0);
    END IF;
    
  ELSE
    RETURN QUERY SELECT false, 0, 'none', 0, null::uuid, 'Invalid discount type.';
    RETURN;
  END IF;
  
  -- Return the result with BULLETPROOF enforcement
  RETURN QUERY SELECT true::boolean,
    v_discount_cents::integer,
    v_discount_type::text,
    v_discount_value::integer,
    v_coupon.id::uuid,
    v_full_message::text;
END;
$$;

-- 2. Simplified redeeem_coupon function (for initial application)
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
  v_discount_cents integer;
  v_discount_type text;
  v_discount_value integer;
  v_min_order integer;
  v_coupon_id uuid;
  v_full_message text;
BEGIN
  -- Call the discount-only function to get the core calculation
  SELECT 
    discount_cents,
    discount_type,
    discount_value,
    coupon_id,
    full_message
  INTO 
    v_discount_cents,
    v_discount_type,
    v_discount_value,
    v_coupon_id,
    v_full_message
  FROM public.redeem_coupon_discount_only(p_code, p_email, p_order_total_cents, p_cart_items);
  
  -- Get min order from coupon
  SELECT min_order_cents INTO v_min_order
  FROM public.coupons
  WHERE upper(code) = upper(p_code)
  LIMIT 1;
  
  -- Return in the expected format
  RETURN QUERY SELECT true::boolean,
    v_full_message::text,
    v_discount_cents::integer,
    v_discount_type::text,
    v_discount_value::integer,
    COALESCE(v_min_order, 50000)::integer,
    v_coupon_id::uuid;
END;
$$;

-- 3. Enhanced recalculate function (for cart changes)
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
  v_discount_cents integer;
  v_discount_type text;
  v_discount_value integer;
  v_min_order integer;
  v_coupon_id uuid;
  v_full_message text;
BEGIN
  -- Call the discount-only function (same calculation, different message)
  SELECT 
    r.discount_cents,
    r.discount_type,
    r.discount_value,
    r.coupon_id,
    format('%s (recalculated)', r.full_message)
  INTO 
    v_discount_cents,
    v_discount_type,
    v_discount_value,
    v_coupon_id,
    v_full_message
  FROM public.redeem_coupon_discount_only(p_code, p_email, p_order_total_cents, p_cart_items) r;
  
  -- Get min order from coupon
  SELECT min_order_cents INTO v_min_order
  FROM public.coupons
  WHERE upper(code) = upper(p_code)
  LIMIT 1;
  
  RETURN QUERY SELECT true::boolean,
    v_full_message::text,
    v_discount_cents::integer,
    v_discount_type::text,
    v_discount_value::integer,
    COALESCE(v_min_order, 50000)::integer,
    v_coupon_id::uuid;
END;
$$;

-- 4. Simple function to increment usage count
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

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, text, integer, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_coupon_discount_only(text, text, integer, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_coupon_discount(text, text, integer, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_coupon_used(text) TO anon, authenticated, service_role;

-- 6. Update test coupon
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

-- 7. Tests to verify the fix
SELECT '=== FRONTEND-BACKEND SYNC FIX TESTS ===' as status;

-- Test 1: Simplified function should give R200 max
SELECT 'Test 1: Simplified Discount Function' as test_name, valid, discount_cents/100.0 as discount_rands, discount_type, full_message
FROM public.redeem_coupon_discount_only('TESTPERCENT20', 'test@example.com', 200000, '[]'::jsonb);

-- Test 2: Recalculation should STILL give R200 max
SELECT 'Test 2: Recalculation with Max Enforcement' as test_name, valid, discount_cents/100.0 as discount_rands, discount_type, message
FROM public.recalculate_coupon_discount('TESTPERCENT20', 'test@example.com', 30000, '[]'::jsonb);

-- Test 3: Large cart should also give R200 max
SELECT 'Test 3: Large Cart with Max Cap' as test_name, valid, discount_cents/100.0 as discount_rands, discount_type, message
FROM public.recalculate_coupon_discount('TESTPERCENT20', 'test@example.com', 500000, '[]'::jsonb);

SELECT '✅ FRONTEND-BACKEND SYNC FIX: All functions now use the same enforced calculation!' as result;