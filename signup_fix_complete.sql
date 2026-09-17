CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email text NOT NULL UNIQUE,
  full_name text,
  name text NOT NULL,
  phone text,
  message text NOT NULL,  
  status text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'account_creation',
  subscribed boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contacts are viewable by authenticated users for their own data"
  ON public.contacts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service can manage contacts"
  ON public.contacts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users"
  ON public.contacts FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_signup();

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name text;
  v_full_name text;
  v_phone text;
BEGIN
  v_user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'User');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', v_user_name);
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  
  INSERT INTO public.contacts (
    user_id, 
    email, 
    full_name, 
    name,
    phone,
    message,  
    status, 
    source,
    subscribed
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    v_full_name,
    v_user_name,
    v_phone,
    'User signup',  
    'new',
    'account_creation',
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    last_login_at = now(),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

GRANT EXECUTE ON FUNCTION public.handle_new_user_signup() TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

CREATE OR REPLACE FUNCTION public.send_welcome_email(p_user_email text, p_user_name text)
RETURNS boolean AS $$
DECLARE
  v_welcome_coupon record;
  v_success boolean := false;
BEGIN
  SELECT * INTO v_welcome_coupon
  FROM public.get_user_welcome_coupon(p_user_email)
  LIMIT 1;
  
  INSERT INTO public.email_queue (recipient_email, subject, content, status, created_at)
  VALUES (
    p_user_email,
    'Welcome to BLOM Cosmetics - Your R250 Welcome Discount!',
    format('Dear %s,

Welcome to BLOM Cosmetics! 

As a thank you for joining us, here''s your exclusive welcome discount:

🎉 Coupon Code: %s
💰 Discount: R250 off your next order
📝 Minimum order: R500

This coupon is valid for 30 days and can only be used with your email address.

Use this code at checkout to enjoy your welcome discount! 

Start shopping: https://blomcosmetics.com

Welcome to the BLOM family!

Best regards,
The BLOM Team', p_user_name, v_welcome_coupon.code),
    'pending',
    now()
  );
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.error_log (message, details, created_at)
  VALUES ('Failed to send welcome email', format('Email: %s, Error: %s', p_user_email, SQLERRM), now());
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS public.email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  content text,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.error_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage email queue"
  ON public.email_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service can manage error log"
  ON public.error_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

INSERT INTO public.contacts (user_id, email, full_name, name, message, status, source, subscribed)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'User') as full_name,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'User') as name,
  'Existing user' as message,
  'new' as status,
  'account_creation' as source,
  true as subscribed
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.contacts c WHERE c.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;