-- Dashboard aggregation for the affiliate portal and the Blom admin page.
--
-- Scoped to a single affiliate_id by argument. Deliberately returns NO customer data:
-- no names, emails, addresses or line items — only order number, date, value and status.
-- That boundary is what lets the partner see their own performance without seeing the
-- rest of the business.
--
-- service_role only: called from Netlify functions after a session check.

create or replace function public.affiliate_dashboard(p_affiliate_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
with aff as (
  select id, code, name, commission_rate, attribution_days, status
    from public.affiliates where id = p_affiliate_id
),
click_totals as (
  select count(*) as clicks,
         count(*) filter (where is_unique) as unique_clicks,
         count(*) filter (where occurred_at >= now() - interval '30 days') as clicks_30d
    from public.affiliate_clicks where affiliate_id = p_affiliate_id
),
commission_totals as (
  select count(*) filter (where status <> 'reversed')                  as orders,
         coalesce(sum(base_cents) filter (where status <> 'reversed'), 0)       as sales_cents,
         coalesce(sum(commission_cents) filter (where status <> 'reversed'), 0) as commission_cents,
         coalesce(sum(commission_cents) filter (where status = 'pending'), 0)   as pending_cents,
         coalesce(sum(commission_cents) filter (where status = 'approved'), 0)  as approved_cents,
         coalesce(sum(commission_cents) filter (where status = 'paid'), 0)      as paid_cents,
         coalesce(sum(commission_cents) filter (where status = 'reversed'), 0)  as reversed_cents
    from public.affiliate_commissions where affiliate_id = p_affiliate_id
),
months as (
  select to_char(d, 'YYYY-MM') as month
    from generate_series(date_trunc('month', now()) - interval '11 months',
                         date_trunc('month', now()), interval '1 month') d
),
monthly_clicks as (
  select to_char(occurred_at, 'YYYY-MM') as month, count(*) as clicks
    from public.affiliate_clicks
   where affiliate_id = p_affiliate_id
   group by 1
),
monthly_sales as (
  select to_char(created_at, 'YYYY-MM') as month,
         count(*) as orders,
         coalesce(sum(base_cents), 0) as sales_cents,
         coalesce(sum(commission_cents), 0) as commission_cents
    from public.affiliate_commissions
   where affiliate_id = p_affiliate_id and status <> 'reversed'
   group by 1
)
select jsonb_build_object(
  'affiliate', (select to_jsonb(aff) from aff),
  'totals', (
    select to_jsonb(click_totals) || to_jsonb(commission_totals)
      from click_totals, commission_totals
  ),
  'monthly', coalesce((
    select jsonb_agg(jsonb_build_object(
             'month', m.month,
             'clicks', coalesce(mc.clicks, 0),
             'orders', coalesce(ms.orders, 0),
             'sales_cents', coalesce(ms.sales_cents, 0),
             'commission_cents', coalesce(ms.commission_cents, 0)
           ) order by m.month desc)
      from months m
      left join monthly_clicks mc on mc.month = m.month
      left join monthly_sales ms on ms.month = m.month
  ), '[]'::jsonb),
  'recent_orders', coalesce((
    select jsonb_agg(jsonb_build_object(
             'order_number', c.order_number,
             'date', c.created_at,
             'kind', c.order_kind,
             'sale_cents', c.base_cents,
             'commission_cents', c.commission_cents,
             'status', c.status,
             'method', c.attribution_method
           ) order by c.created_at desc)
      from (
        select * from public.affiliate_commissions
         where affiliate_id = p_affiliate_id
         order by created_at desc limit 100
      ) c
  ), '[]'::jsonb),
  'payouts', coalesce((
    select jsonb_agg(jsonb_build_object(
             'period_start', p.period_start,
             'period_end', p.period_end,
             'commission_count', p.commission_count,
             'total_cents', p.total_cents,
             'status', p.status,
             'paid_at', p.paid_at,
             'reference', p.reference
           ) order by p.period_start desc)
      from public.affiliate_payouts p where p.affiliate_id = p_affiliate_id
  ), '[]'::jsonb)
);
$$;

revoke all on function public.affiliate_dashboard(uuid) from public, anon, authenticated;
grant execute on function public.affiliate_dashboard(uuid) to service_role;
