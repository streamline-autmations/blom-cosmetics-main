-- A refund after payout previously left the commission intact, because the reversal
-- excluded status='paid'. That allowed: self-refer a large order -> wait for the payout ->
-- refund the order -> keep the 5% and the goods' value.
--
-- Paid commissions are now reversed too, flagged so the amount can be recovered against
-- the next payout. Note that `orders.status` has no 'refunded' value in this schema —
-- refunds are recorded as 'cancelled' — so that is the branch that actually fires.

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
             reversal_reason = coalesce(
               reversal_reason,
               case when status = 'paid'
                    then 'order ' || new.status || ' AFTER payout - recover from next payout'
                    else 'order ' || new.status
               end)
       where order_id = new.id;
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
    -- resurrect one that was already paid out.
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
