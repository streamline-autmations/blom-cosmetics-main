-- These views were created without security_invoker, so they execute as the view owner and
-- ignore RLS. SELECT was granted to anon and/or authenticated, meaning the subscriber email
-- list, daily revenue, contact messages, coupon usage and stock levels were readable by
-- anyone holding the public API key — no account required.
--
-- All eight are referenced by zero application code, so access is simply revoked rather
-- than reworked. Netlify functions and n8n use service_role and are unaffected.
--
-- STILL OPEN: stock_analytics and v_sales_daily have the same bug but ARE used by the admin
-- app, so they need security_invoker plus verification that owner/staff policies cover the
-- base tables. Same treatment as orders_account_v1, done separately with testing.

revoke select on public.v_subscribers            from anon, authenticated;
revoke select on public.v_finance_daily          from anon, authenticated;
revoke select on public.v_top_skus               from anon, authenticated;
revoke select on public.contact_messages_public  from anon, authenticated;
revoke select on public.coupon_stats             from anon, authenticated;
revoke select on public.v_product_inventory      from anon, authenticated;
revoke select on public.best_selling_products    from anon, authenticated;
revoke select on public.sales_summary            from anon, authenticated;
