-- Affiliate portal login.
--
-- Password comparison happens inside Postgres via pgcrypto's crypt(), so the bcrypt hash
-- is never sent out of the database. Lockout state is updated in the same call, which
-- makes brute-forcing cost 5 attempts per 15 minutes regardless of how the caller behaves.
--
-- EXECUTE is granted to service_role only: this is reachable exclusively from the
-- affiliate-auth Netlify function, never from a browser.

create or replace function public.affiliate_verify_login(
  p_email    text,
  p_password text
)
returns table (
  affiliate_user_id uuid,
  affiliate_id      uuid,
  affiliate_code    text,
  affiliate_name    text,
  outcome           text
)
language plpgsql
security definer
-- extensions: pgcrypto (crypt) is installed there on Supabase, not in public.
set search_path = public, extensions
as $$
declare
  v_user   public.affiliate_users%rowtype;
  v_aff    public.affiliates%rowtype;
  v_locked boolean;
begin
  select * into v_user
    from public.affiliate_users
   where lower(email) = lower(trim(p_email))
   limit 1;

  -- Unknown email: same shape and cost of response as a wrong password.
  if v_user.id is null then
    return query select null::uuid, null::uuid, null::text, null::text, 'invalid'::text;
    return;
  end if;

  v_locked := v_user.locked_until is not null and v_user.locked_until > now();
  if v_locked then
    return query select null::uuid, null::uuid, null::text, null::text, 'locked'::text;
    return;
  end if;

  if v_user.password_hash = crypt(p_password, v_user.password_hash) then
    update public.affiliate_users
       set failed_attempts = 0,
           locked_until    = null,
           last_login_at   = now()
     where id = v_user.id;

    select * into v_aff from public.affiliates where id = v_user.affiliate_id;

    if v_aff.id is null or v_aff.status <> 'active' then
      return query select null::uuid, null::uuid, null::text, null::text, 'disabled'::text;
      return;
    end if;

    return query select v_user.id, v_aff.id, v_aff.code, v_aff.name, 'ok'::text;
    return;
  end if;

  update public.affiliate_users
     set failed_attempts = failed_attempts + 1,
         locked_until = case
           when failed_attempts + 1 >= 5 then now() + interval '15 minutes'
           else locked_until
         end
   where id = v_user.id;

  return query select null::uuid, null::uuid, null::text, null::text, 'invalid'::text;
end;
$$;

revoke all on function public.affiliate_verify_login(text, text) from public, anon, authenticated;
grant execute on function public.affiliate_verify_login(text, text) to service_role;
