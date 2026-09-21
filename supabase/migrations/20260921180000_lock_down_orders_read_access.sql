-- Close the customer-data exposure on orders.
--
-- Before this migration any logged-in customer could read all 1113 orders — names, emails,
-- phones, addresses — and an anonymous visitor could read them through a view. After it, a
-- customer sees only their own orders and anon sees none.
--
-- Three separate problems:
--
-- 1. VIEWS. orders_account_v1 and friends were created without security_invoker, so they
--    execute as the view owner and bypass RLS entirely, while granting SELECT to `anon`.
--    No account was needed at all. security_invoker = true makes them run with the
--    caller's permissions so the table policies apply.
--
-- 2. BLANKET TABLE POLICIES. `orders` and `order_items` each carried `USING (true)` SELECT
--    policies. Ownership-scoped policies already existed alongside them and remain.
--
-- 3. orders_select_self read auth.users, which `authenticated` cannot access. The blanket
--    policy had been masking the resulting error; removing the blanket policy without also
--    removing this one breaks every customer's order list. Its intent is already covered by
--    orders_select_mine / orders_read_own, which take the email from the JWT.
--
-- Verified after applying: anon = denied, customer = own orders only, owner = all orders.

alter view public.orders_account_v1       set (security_invoker = true);
alter view public.order_items_account_v1  set (security_invoker = true);
alter view public.v_orders_finance        set (security_invoker = true);
alter view public.v_order_items_finance   set (security_invoker = true);

-- Unused by any application code; no reason for public roles to hold them.
revoke select on public.order_items_account_v1 from anon, authenticated;
revoke select on public.v_orders_finance       from anon, authenticated;
revoke select on public.v_order_items_finance  from anon, authenticated;

drop policy if exists "Anon can view own orders by email"    on public.orders;
drop policy if exists "authenticated read orders"            on public.orders;
drop policy if exists "orders_read_all"                      on public.orders;
drop policy if exists "orders_select_self"                   on public.orders;

drop policy if exists "order_items_read_all"                 on public.order_items;
drop policy if exists "Users can view items from own orders" on public.order_items;
