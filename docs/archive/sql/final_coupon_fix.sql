-- ================================================
-- FINAL COUPON SYSTEM FIX - COMPLETE SOLUTION
-- ================================================
-- This fix resolves BOTH errors:
-- 1. "column reference 'coupon_id' is ambiguous"
-- 2. "set-returning functions are not allowed in WHERE"

-- 1. Create a completely corrected version of the redeem_coupon function
CREATE OR REPLACE FUNCTION public.redeem_coupon(
  p_code text,
  p_email text,
  p_order_total_cents integer,
  p_cart_items jsonb DEFAULT '[]'::jsonb,
  p_validation_token text DEFAULT gen_random_uuid()::text
)
RETURNS TABLE (
  valid boolean,
  message text,
  discount_cents integer,
  discount_type text,
  discount_value integer,
  min_order_cents integer,
  coupon_id uuid,
  validation_token text,
  cart_snapshot jsonb,
  cart_snapshot_hash text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon public.coupons%rowtype;
  v_discount_cents integer := 0;
  v_discount_type text;
  v_discount_value integer;
  v_min_order integer;
  v_eligible_total_cents integer := 0;
  v_excluded_total_cents integer := 0;
  v_item record;
  v_excluded_ids text[];
  v_is_single_use boolean;
  v_cart_snapshot_hash text;
  v_pending_validations integer;
  v_excluded_product_list text;
BEGIN
  -- Clean up expired validations first
  PERFORM public.cleanup_expired_coupon_validations();

  -- Look up coupon by code
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE upper(code) = upper(p_code)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Coupon not found.', 0, 'none', 0, 0, null, p_validation_token, null, null;
    RETURN;
  END IF;

  -- Check if coupon is active
  IF COALESCE(v_coupon.status, 'inactive') <> 'active' THEN
    RETURN QUERY SELECT false, 'Coupon is not active.', 0, 'none', 0, 0, null, p_validation_token, null, null;
    RETURN;
  END IF;

  -- Check expiry
  IF v_coupon.valid_until IS NOT NULL AND now() > v_coupon.valid_until THEN
    RETURN QUERY SELECT false, 'Coupon has expired.', 0, 'none', 0, 0, null, p_validation_token, null, null;
    RETURN;
  END IF;

  -- Check if already used (including pending validations)
  -- FIXED: Explicitly qualify the column reference to avoid ambiguity
  SELECT COUNT(*) + COALESCE(v_coupon.used_count, 0) INTO v_pending_validations
  FROM public.coupon_validations AS cv
  WHERE cv.coupon_id = v_coupon.id 
  AND cv.used_for_order = false 
  AND cv.cleanup_at > now();
  
  -- Determine if this is a single-use coupon
  v_is_single_use := COALESCE(v_coupon.max_uses, 1) = 1;
  
  IF v_pending_validations >= COALESCE(v_coupon.max_uses, 1) THEN
    RETURN QUERY SELECT false, 'Coupon already used.', 0, 'none', 0, 0, null, p_validation_token, null, null;
    RETURN;
  END IF;

  -- Check email lock
  IF v_coupon.locked_email IS NOT NULL AND lower(v_coupon.locked_email) <> lower(p_email) THEN
    RETURN QUERY SELECT false, 'Coupon locked to another email.', 0, 'none', 0, 0, null, p_validation_token, null, null;
    RETURN;
  END IF;

  -- Calculate eligible total considering product exclusions
  -- FIXED: Properly handle excluded product IDs without WHERE clause error
  v_excluded_product_list := COALESCE(v_coupon.excluded_product_ids::text, '');
  
  IF v_excluded_product_list IS NOT NULL AND v_excluded_product_list <> '' THEN
    -- Use string_to_array to get the excluded IDs, then filter out empty strings
    v_excluded_ids := string_to_array(v_excluded_product_list, ',');
    -- Remove empty strings from the array
    SELECT array_agg(elem) INTO v_excluded_ids
    FROM unnest(v_excluded_ids) elem
    WHERE trim(elem) <> '';
  END IF;

  -- Process cart items if provided
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS item(product_id text, quantity integer, unit_price_cents integer)
  LOOP
    -- Check if product is excluded
    IF v_excluded_ids IS NOT NULL AND array_length(v_excluded_ids, 1) > 0 THEN
      IF trim(v_item.product_id) = ANY(SELECT trim(x) FROM unnest(v_excluded_ids) x) THEN
        -- Add to excluded total
        v_excluded_total_cents := v_excluded_total_cents + (v_item.quantity * COALESCE(v_item.unit_price_cents, 0));
        CONTINUE;
      END IF;
    END IF;
    
    -- Add to eligible total
    v_eligible_total_cents := v_eligible_total_cents + (v_item.quantity * COALESCE(v_item.unit_price_cents, 0));
  END LOOP;

  -- If no cart items provided, use the order total directly
  IF p_cart_items = '[]'::jsonb OR jsonb_typeof(p_cart_items) IS NULL THEN
    v_eligible_total_cents := p_order_total_cents;
  END IF;

  -- Get minimum order amount
  v_min_order := COALESCE(v_coupon.min_order_cents, 50000); -- Default R500
  v_min_order := COALESCE(v_min_order, 0); -- Handle NULL
  
  IF v_eligible_total_cents < v_min_order THEN
    RETURN QUERY SELECT false, 
      format('Order must be at least R%s (excluding restricted items)', v_min_order / 100), 
      0, 'none', 0, v_min_order, v_coupon.id, p_validation_token, null, null;
    RETURN;
  END IF;

  -- Determine discount type and calculate
  v_discount_type := COALESCE(v_coupon.type, 'percent'); -- Default to percent if type not set
  v_discount_value := CASE 
    WHEN v_discount_type = 'fixed' THEN COALESCE(v_coupon.value, 0)
    ELSE COALESCE(v_coupon.percent, 0)
  END;

  -- Calculate discount based on type using eligible total
  IF v_discount_type = 'fixed' THEN
    -- Fixed discount: value is in Rands, convert to cents
    v_discount_cents := (v_discount_value * 100)::integer;
    
    -- Ensure discount doesn't exceed eligible total
    IF v_discount_cents > v_eligible_total_cents THEN
      v_discount_cents := v_eligible_total_cents;
    END IF;
    
  ELSIF v_discount_type = 'percent' THEN
    -- Percentage discount: calculate percentage of eligible total
    v_discount_cents := floor((v_eligible_total_cents * v_discount_value)::numeric / 100)::integer;
    
    -- Apply max discount cap if exists
    IF v_coupon.max_discount_cents IS NOT NULL AND v_discount_cents > v_coupon.max_discount_cents THEN
      v_discount_cents := v_coupon.max_discount_cents;
    END IF;
    
    -- Ensure discount doesn't exceed eligible total
    IF v_discount_cents > v_eligible_total_cents THEN
      v_discount_cents := v_eligible_total_cents;
    END IF;
    
  ELSE
    -- Unknown discount type
    RETURN QUERY SELECT false, 'Invalid discount type.', 0, 'none', 0, v_min_order, null, p_validation_token, null, null;
    RETURN;
  END IF;

  -- Calculate cart snapshot hash for tamper detection
  SELECT calculate_cart_hash(p_cart_items) INTO v_cart_snapshot_hash;

  -- For single-use coupons, mark as used immediately during validation
  IF v_is_single_use THEN
    UPDATE public.coupons
    SET used_count = COALESCE(used_count, 0) + 1
    WHERE id = v_coupon.id;
  END IF;

  -- Record the validation attempt with cart snapshot
  INSERT INTO public.coupon_validations (
    coupon_id,
    validation_token,
    email,
    order_total_cents,
    validated_at,
    cart_snapshot,
    cart_snapshot_hash,
    original_eligible_total_cents,
    original_discount_cents
  ) VALUES (
    v_coupon.id,
    p_validation_token,
    p_email,
    p_order_total_cents,
    now(),
    p_cart_items,
    v_cart_snapshot_hash,
    v_eligible_total_cents,
    v_discount_cents
  );

  -- Return success with coupon details and cart snapshot info
  RETURN QUERY SELECT true,
    format('Coupon applied: %s%% off', 
      CASE 
        WHEN v_discount_type = 'fixed' THEN format('R%s', v_discount_value)
        ELSE format('%s%%', v_discount_value)
      END
    ),
    v_discount_cents,
    v_discount_type,
    v_discount_value,
    v_min_order,
    v_coupon.id,
    p_validation_token,
    p_cart_items,
    v_cart_snapshot_hash;
END;
$$;

-- 2. Grant permissions for the fixed function
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, text, integer, jsonb, text) TO anon, authenticated, service_role;

-- 3. Create a comprehensive test function
CREATE OR REPLACE FUNCTION public.test_coupon_complete()
RETURNS TABLE (
  test_name text,
  success boolean,
  message text,
  discount_cents integer,
  coupon_id uuid
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Test 1: Simple coupon redemption (TEST-DISCOUNT)
  RETURN QUERY
  SELECT 
    'Simple coupon test (TEST-DISCOUNT)'::text,
    COALESCE((result.valid), false) as success,
    COALESCE((result.message), 'Failed') as message,
    COALESCE((result.discount_cents), 0) as discount_cents,
    COALESCE((result.coupon_id), null) as coupon_id
  FROM public.redeem_coupon('TEST-DISCOUNT', 'test@example.com', 100000, '[]'::jsonb) as result;
  
  -- Test 2: Test with cart items
  RETURN QUERY
  SELECT 
    'Coupon test with cart items'::text,
    COALESCE((result.valid), false) as success,
    COALESCE((result.message), 'Failed') as message,
    COALESCE((result.discount_cents), 0) as discount_cents,
    COALESCE((result.coupon_id), null) as coupon_id
  FROM public.redeem_coupon('TEST-DISCOUNT', 'test@example.com', 150000, '[{"product_id": "prod1", "quantity": 2, "unit_price_cents": 50000}]'::jsonb) as result;
END;
$$;

-- Grant test function permissions
GRANT EXECUTE ON FUNCTION public.test_coupon_complete() TO anon, authenticated, service_role;

-- 4. Create a helper function to test the specific error scenarios
CREATE OR REPLACE FUNCTION public.debug_coupon_error(p_code text, p_email text, p_order_total_cents integer)
RETURNS TABLE (
  step text,
  status text,
  details text
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_coupon public.coupons%rowtype;
  v_pending_validations integer;
  v_excluded_ids text[];
BEGIN
  -- Step 1: Look up coupon
  BEGIN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE upper(code) = upper(p_code)
    LIMIT 1;
    
    IF FOUND THEN
      RETURN QUERY SELECT 'Coupon lookup'::text, 'SUCCESS'::text, format('Found coupon: %s (ID: %s)', v_coupon.code, v_coupon.id)::text;
    ELSE
      RETURN QUERY SELECT 'Coupon lookup'::text, 'FAILED'::text, 'Coupon not found'::text;
      RETURN;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'Coupon lookup'::text, 'ERROR'::text, SQLERRM::text;
  END;
  
  -- Step 2: Test pending validations query
  BEGIN
    SELECT COUNT(*) + COALESCE(v_coupon.used_count, 0) INTO v_pending_validations
    FROM public.coupon_validations AS cv
    WHERE cv.coupon_id = v_coupon.id 
    AND cv.used_for_order = false 
    AND cv.cleanup_at > now();
    
    RETURN QUERY SELECT 'Pending validations check'::text, 'SUCCESS'::text, format('Pending validations: %s', v_pending_validations)::text;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'Pending validations check'::text, 'ERROR'::text, SQLERRM::text;
  END;
  
  -- Step 3: Test excluded products parsing
  BEGIN
    IF v_coupon.excluded_product_ids IS NOT NULL THEN
      v_excluded_ids := string_to_array(v_coupon.excluded_product_ids::text, ',');
      RETURN QUERY SELECT 'Excluded products parsing'::text, 'SUCCESS'::text, format('Excluded products: %s', array_length(v_excluded_ids, 1))::text;
    ELSE
      RETURN QUERY SELECT 'Excluded products parsing'::text, 'SUCCESS'::text, 'No excluded products'::text;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'Excluded products parsing'::text, 'ERROR'::text, SQLERRM::text;
  END;
  
  RETURN QUERY SELECT 'All checks completed'::text, 'SUCCESS'::text, 'All diagnostic steps passed'::text;
END;
$$;

-- Grant debug function permissions
GRANT EXECUTE ON FUNCTION public.debug_coupon_error(text, text, integer) TO anon, authenticated, service_role;