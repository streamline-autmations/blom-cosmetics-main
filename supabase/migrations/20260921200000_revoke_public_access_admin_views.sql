-- The last two views carrying the security_invoker bug (created without it, so they run as
-- the view owner and ignore RLS) while granting SELECT to anon.
--
-- stock_analytics exposed stock levels and product data; v_sales_daily exposed daily
-- revenue. Both are read exclusively by service-role Netlify functions — the store's
-- admin-stock.ts and the admin app's admin-finance-daily.ts — which bypass RLS anyway, so
-- revoking public access breaks nothing.
--
-- After this migration no RLS-bypassing view in `public` is readable by anon or
-- authenticated.

revoke select on public.stock_analytics from anon, authenticated;
revoke select on public.v_sales_daily   from anon, authenticated;
