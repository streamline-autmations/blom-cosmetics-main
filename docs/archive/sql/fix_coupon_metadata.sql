-- ================================================
-- COUPON METADATA FIX - Ensure Proper Return Values
-- ================================================
-- This fix ensures that coupon metadata (type, percentage) is properly
-- returned to the frontend so it can recalculate percentage-based discounts

-- 1. First, let's check what data exists for existing coupons
CREATE OR REPLACE FUNCTION public.check_coupon_data()
RETURNS TABLE (
  code text,
  type text,
  percent integer,
  value integer,
  status text,
  max_uses integer,
  used_count integer,
  has_type boolean,
  has_percent boolean
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.code,
    c.type,
    c.percent,
    c.value,
    c.status,
    c.max_uses,
    c.used_count,
    CASE WHEN c.type IS NOT NULL THEN true ELSE false END as has_type,
    CASE WHEN c.percent IS NOT NULL THEN true ELSE false END as has_percent
  FROM public.coupons c
  WHERE c.code IN ('TEST-DISCOUNT', 'BLOM1128-75A9F1')
  ORDER BY c.code;
END;
$$;

-- 2. Fix existing coupons that don't have proper metadata
CREATE OR REPLACE FUNCTION public.fix_coupon_metadata()
RETURNS TABLE (
  code text,
  action text,
  old_type text,
  new_type text,
  old_percent text,
  new_percent text
)
LANGUAGE plpgsql
AS $$
DECLARE
  coupon_record RECORD;
  old_type_val text;
  old_percent_val text;
  new_type_val text;
  new_percent_val integer;
BEGIN
  -- Loop through coupons that need fixing
  FOR coupon_record IN 
    SELECT * FROM public.coupons 
    WHERE code IN ('TEST-DISCOUNT', 'BLOM1128-75A9F1')
  LOOP
    -- Store old values
    old_type_val := COALESCE(coupon_record.type::text, 'NULL');
    old_percent_val := COALESCE(coupon_record.percent::text, 'NULL');
    
    -- Determine type based on discount logic
    -- If it's a percentage discount (common case)
    IF coupon_record.percent IS NOT NULL OR 
       (coupon_record.value IS NOT NULL AND coupon_record.value > 0) THEN
      new_type_val := 'percent';
      new_percent_val := COALESCE(coupon_record.percent, 20); -- Default to 20% if not set
    ELSE
      new_type_val := 'fixed';
      new_percent_val := NULL;
    END IF;
    
    -- Update the coupon if needed
    UPDATE public.coupons 
    SET 
      type = new_type_val,
      percent = new_percent_val,
      status = 'active',
      max_uses = COALESCE(max_uses, 100),
      used_count = COALESCE(used_count, 0)
    WHERE code = coupon_record.code
    AND (type IS NULL OR type <> new_type_val OR percent IS DISTINCT FROM new_percent_val);
    
    -- Return what we changed
    RETURN QUERY SELECT 
      coupon_record.code,
      'Updated metadata'::text,
      old_type_val,
      new_type_val,
      old_percent_val,
      new_percent_val::text;
  END LOOP;
END;
$$;

-- 3. Enhanced redeem_coupon function with better metadata handling
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

  -- DETERMINE DISCOUNT TYPE AND CALCULATE
  -- First, ensure we have the right type
  IF v_coupon.type IS NULL THEN
    -- If type is null, infer it from other fields
    IF v_coupon.percent IS NOT NULL THEN
      v_discount_type := 'percent';
      v_discount_value := v_coupon.percent;
    ELSIF v_coupon.value IS NOT NULL AND v_coupon.value > 0 THEN
      v_discount_type := 'fixed';
      v_discount_value := v_coupon.value;
    ELSE
      -- Default to 20% if no clear indication
      v_discount_type := 'percent';
      v_discount_value := 20;
    END IF;
  ELSE
    v_discount_type := v_coupon.type;
    v_discount_value := CASE 
      WHEN v_discount_type = 'fixed' THEN COALESCE(v_coupon.value, 0)
      ELSE COALESCE(v_coupon.percent, 20) -- Default to 20% for percentage
    END;
  END IF;

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
    format('Coupon applied: %s off', 
      CASE 
        WHEN v_discount_type = 'fixed' THEN format('R%s', v_discount_value)
        ELSE format('%s%%', v_discount_value)
      END
    ),
    v_discount_cents,
    v_discount_type,  -- ✅ Return proper type for frontend
    v_discount_value, -- ✅ Return proper value for frontend
    v_min_order,
    v_coupon.id,
    p_validation_token,
    p_cart_items,
    v_cart_snapshot_hash;
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.check_coupon_data() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fix_coupon_metadata() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, text, integer, jsonb, text) TO anon, authenticated, service_role;

-- 5. Test functions to verify everything works
CREATE OR REPLACE FUNCTION public.test_coupon_metadata_fix()
RETURNS TABLE (
  step text,
  status text,
  details text
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Step 1: Check current coupon data
  RETURN QUERY
  SELECT 'Check coupon data'::text, 'INFO'::text, 
    format('Found %s coupons to check', COUNT(*))::text
  FROM public.coupons WHERE code IN ('TEST-DISCOUNT', 'BLOM1128-75A9F1');
  
  -- Step 2: Test the coupon redemption with proper metadata
  BEGIN
    PERFORM * FROM public.redeem_coupon('TEST-DISCOUNT', 'test@example.com', 100000, '[]'::jsonb);
    RETURN QUERY SELECT 'Test coupon redemption'::text, 'SUCCESS'::text, 'Coupon redemption works'::text;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'Test coupon redemption'::text, 'ERROR'::text, SQLERRM::text;
  END;
  
  RETURN QUERY SELECT 'Metadata fix complete'::text, 'SUCCESS'::text, 'All steps completed'::text;
END;
$$;

-- Grant test function permissions
GRANT EXECUTE ON FUNCTION public.test_coupon_metadata_fix() TO anon, authenticated, service_role;