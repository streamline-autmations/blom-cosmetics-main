# Coupon System SQL Guide

## How Coupons Work

### 1. Coupon Creation
Coupons are created in the `coupons` table. Each coupon can be:
- **Single-use** (`max_uses = 1`) - for signup welcome codes
- **Email-locked** (`locked_email`) - tied to a specific user
- **General** - anyone can use it (until max_uses reached)

### 2. Creating a Single-Use Coupon for a New User

#### Option A: Create directly in SQL

```sql
-- Create a single-use 10% coupon for a new user signup
INSERT INTO public.coupons (
  code,
  email,                    -- Lock to this email (optional)
  percent,
  min_order_cents,
  max_uses,
  used_count,
  valid_from,
  valid_until,
  is_active,
  is_single_use,
  locked_email,
  status
) VALUES (
  'BLOM' || to_char(now(), 'MMDD') || '-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,6)),  -- e.g., BLOM0103-A1B2C3
  'user@example.com',      -- User's email (optional - locks coupon to this email)
  10,                        -- 10% discount
  50000,                     -- R500 minimum (in cents)
  1,                         -- Single use only
  0,                         -- Not used yet
  now(),                     -- Valid from now
  now() + interval '14 days', -- Valid for 14 days
  true,                      -- Active
  true,                      -- Single-use flag
  'user@example.com',        -- Lock to this email
  'active'                   -- Status
)
RETURNING code, percent, valid_until;
```

#### Option B: Use RPC Function (if you create it)

```sql
-- Create the function first (run this once)
CREATE OR REPLACE FUNCTION public.create_single_use_coupon(
  p_email text,
  p_percent int default 10,
  p_days_valid int default 14
)
RETURNS TABLE(code text, percent int, valid_until timestamptz)
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
BEGIN
  -- Generate unique code: BLOM + MMDD + random 6 chars
  v_code := 'BLOM' || to_char(now(), 'MMDD') || '-' ||
            upper(substr(encode(gen_random_bytes(4),'hex'),1,6));
  
  -- Insert coupon
  INSERT INTO public.coupons (
    code, 
    email, 
    type, 
    percent, 
    min_order_cents, 
    max_uses, 
    used_count, 
    valid_from, 
    valid_until, 
    status,
    is_active,
    is_single_use,
    locked_email
  ) VALUES (
    v_code, 
    p_email, 
    'percent', 
    p_percent, 
    50000,    -- R500 minimum
    1,        -- Single use
    0,        -- Not used
    now(), 
    now() + make_interval(days => p_days_valid), 
    'active',
    true,
    true,
    p_email    -- Lock to email
  )
  RETURNING coupons.code, coupons.percent, coupons.valid_until
  INTO code, percent, valid_until;
  
  RETURN;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_single_use_coupon(text, int, int) TO authenticated, service_role;

-- Then use it:
SELECT * FROM public.create_single_use_coupon('user@example.com', 10, 14);
-- Returns: code, percent, valid_until
```

### 3. Manual Coupon Creation (Admin)

```sql
-- Create a general coupon (multiple users can use)
INSERT INTO public.coupons (
  code,
  percent,
  min_order_cents,
  max_uses,
  used_count,
  valid_from,
  valid_until,
  is_active,
  status
) VALUES (
  'WELCOME10',
  10,
  50000,      -- R500 minimum
  100,        -- 100 users can use it
  0,          -- Not used yet
  now(),
  now() + interval '30 days',
  true,
  'active'
);
```

### 4. Checking Coupon Status

```sql
-- View all active coupons
SELECT 
  code,
  email,
  percent,
  min_order_cents / 100.0 as min_order_rands,
  used_count,
  max_uses,
  valid_from,
  valid_until,
  is_active,
  status
FROM public.coupons
WHERE is_active = true
  AND status = 'active'
ORDER BY created_at DESC;

-- Check a specific coupon
SELECT * FROM public.coupons WHERE code = 'BLOM0103-A1B2C3';

-- See which coupons a user can use
SELECT 
  code,
  percent,
  min_order_cents / 100.0 as min_order_rands,
  valid_until
FROM public.coupons
WHERE (email IS NULL OR email = 'user@example.com')
  AND is_active = true
  AND status = 'active'
  AND (valid_until IS NULL OR valid_until > now())
  AND (max_uses IS NULL OR used_count < max_uses);
```

### 5. Testing Coupon Redemption

```sql
-- Test if coupon is valid (returns valid, message, discount_cents)
SELECT * FROM public.redeem_coupon(
  'BLOM0103-A1B2C3',  -- coupon code
  'user@example.com',  -- user email
  75000                -- product subtotal in cents (R750)
);

-- Expected result if valid:
-- valid: true
-- message: 'Coupon applied.'
-- discount_cents: 7500 (10% of R750 = R75)
-- percent: 10
-- min_order_cents: 50000
```

### 6. Auto-Create Coupon on User Signup (Trigger)

If you want coupons created automatically when users sign up:

```sql
-- Create trigger function
CREATE OR REPLACE FUNCTION public.auto_create_signup_coupon()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
BEGIN
  -- Only create coupon for new signups (not email updates)
  IF TG_OP = 'INSERT' AND NEW.email IS NOT NULL THEN
    -- Generate code
    v_code := 'BLOM' || to_char(now(), 'MMDD') || '-' ||
              upper(substr(encode(gen_random_bytes(4),'hex'),1,6));
    
    -- Create coupon
    INSERT INTO public.coupons (
      code,
      email,
      percent,
      min_order_cents,
      max_uses,
      used_count,
      valid_from,
      valid_until,
      is_active,
      is_single_use,
      locked_email,
      status
    ) VALUES (
      v_code,
      NEW.email,
      10,
      50000,
      1,
      0,
      now(),
      now() + interval '14 days',
      true,
      true,
      NEW.email,
      'active'
    );
    
    -- You could also send email here via n8n webhook
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users (requires service_role permissions)
CREATE TRIGGER trg_create_signup_coupon
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_signup_coupon();
```

### 7. Viewing Used Coupons

```sql
-- See which coupons have been used
SELECT 
  code,
  email,
  percent,
  used_count,
  max_uses,
  created_at,
  valid_until
FROM public.coupons
WHERE used_count > 0
ORDER BY used_count DESC;
```

## Typical Workflow

1. **User signs up** → Create coupon using `create_single_use_coupon()` or trigger
2. **Send email** → Include coupon code in welcome email
3. **User adds items** → Must have R500+ product total (shipping excluded)
4. **User applies coupon** → Frontend calls `redeem_coupon()` RPC
5. **User completes payment** → `payfast-itn.ts` automatically calls `mark_coupon_used()`
6. **Coupon marked as used** → `used_count` increments, can't be used again

## Important Notes

- **Minimum order**: R500 (50000 cents) - product subtotal only, shipping excluded
- **Single-use**: `max_uses = 1` and `used_count` tracks usage
- **Email locking**: `locked_email` ensures only that email can use it
- **Auto-mark**: Coupon is automatically marked as used when payment succeeds
- **Expiry**: Default 14 days, but can be customized

