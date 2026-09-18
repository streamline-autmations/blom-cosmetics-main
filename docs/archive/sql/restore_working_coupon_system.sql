-- ================================================
-- RESTORE WORKING COUPON SYSTEM - SIMPLE VERSION
-- ================================================
-- This restores the last working version and adds a simple fix
-- for the reapplication issue without breaking functionality

-- 1. Restore the working redeem_coupon function from the last stable version
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
  WHERE upper(code) = upper(p_code)
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
  IF v_coupon.locked_email IS NOT NULL AND lower(v_coupon.locked_email) <> lower(p_email) THEN
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

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, text, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_coupon_used(text) TO anon, authenticated, service_role;

-- 4. Update comments
COMMENT ON FUNCTION public.redeem_coupon IS 'Simple coupon validation that allows reapplication before order completion.';
COMMENT ON FUNCTION public.mark_coupon_used IS 'Increments coupon usage count - call this ONLY when order is completed.';

SELECT 'Working coupon system restored!' as status;