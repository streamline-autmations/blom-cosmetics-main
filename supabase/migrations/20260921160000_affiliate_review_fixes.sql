-- Fixes from the pre-ship security review of the affiliate feature.
--
-- 1. Commission base double-subtracted the discount on orders with a null subtotal_cents.
--    `total` is already `subtotal - discount + shipping`, so `total - shipping` is net of
--    discount and must not have discount removed again.
-- 2. A paid -> cancelled -> paid lifecycle left the commission permanently 'reversed',
--    because ON CONFLICT DO NOTHING never revived it.
-- 3. Login lockout could be outrun by concurrent requests reading unlocked state before
--    any increment became visible.
-- 4. Unknown emails skipped bcrypt entirely, making account enumeration possible by timing.
-- 5. Nothing stopped two payout rows being recorded for the same affiliate and period.

create or replace function public.affiliate_capture_commission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rate  numeric(5,4);
  v_base  integer;
begin
  begin
    if new.status in ('cancelled','refunded') then
      update public.affiliate_commissions
         set status = 'reversed',
             reversal_reason = coalesce(reversal_reason, 'order ' || new.status)
       where order_id = new.id
         and status <> 'paid';
      return new;
    end if;

    if new.affiliate_id is null then
      return new;
    end if;

    if new.status <> 'paid' then
      return new;
    end if;
    if tg_op = 'UPDATE' and old.status = 'paid' then
      return new;
    end if;

    select commission_rate into v_rate
      from public.affiliates
     where id = new.affiliate_id and status = 'active';

    if v_rate is null then
      return new;
    end if;

    -- Discount is subtracted only in the subtotal branch; the total branch is already net.
    v_base := greatest(
      0,
      coalesce(
        new.subtotal_cents - coalesce(new.discount_cents, 0),
        coalesce(new.total_cents, 0) - coalesce(new.shipping_cents, 0)
      )
    );

    insert into public.affiliate_commissions (
      affiliate_id, order_id, order_number, order_kind,
      base_cents, rate, commission_cents,
      status, attribution_method, approved_at
    ) values (
      new.affiliate_id, new.id, new.order_number, new.order_kind,
      v_base, v_rate, round(v_base * v_rate)::integer,
      'approved', new.affiliate_attribution_method, now()
    )
    -- Revive a reversed commission if the order legitimately returns to paid, but never
    -- touch one that has already been paid out.
    on conflict (order_id) do update
      set status          = 'approved',
          reversal_reason = null,
          approved_at     = now()
      where public.affiliate_commissions.status = 'reversed';

  exception when others then
    raise warning 'affiliate_capture_commission failed for order %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

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
set search_path = public, extensions
as $$
declare
  v_user   public.affiliate_users%rowtype;
  v_aff    public.affiliates%rowtype;
begin
  -- FOR UPDATE serialises concurrent attempts, so a burst of guesses cannot all pass the
  -- lock check before any increment lands.
  select * into v_user
    from public.affiliate_users
   where lower(email) = lower(trim(p_email))
   limit 1
     for update;

  if v_user.id is null then
    -- Spend the same bcrypt time as a real attempt so unknown emails aren't detectable.
    perform crypt(p_password, gen_salt('bf', 12));
    return query select null::uuid, null::uuid, null::text, null::text, 'invalid'::text;
    return;
  end if;

  if v_user.locked_until is not null and v_user.locked_until > now() then
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

create unique index if not exists affiliate_payouts_period_uniq
  on public.affiliate_payouts (affiliate_id, period_start, period_end);
