-- Admin app access to the affiliate tables.
--
-- The admin SPA runs on the anon key with a logged-in Supabase session, so its queries
-- execute as role `authenticated` and need both grants and RLS policies.
--
-- Scoped to owner/staff, never blanket `authenticated`: store customers and admins share
-- a single auth pool, so an `authenticated` policy would expose commercial data to every
-- shopper with an account.
--
-- affiliate_users and affiliate_sessions are deliberately excluded — they hold password
-- hashes and live session tokens, and no browser needs to read them.

grant select, insert, update on public.affiliates             to authenticated;
grant select                  on public.affiliate_clicks      to authenticated;
grant select, update          on public.affiliate_commissions to authenticated;
grant select, insert, update  on public.affiliate_payouts     to authenticated;

create policy affiliates_admin_rw on public.affiliates
  for all to authenticated
  using (exists (select 1 from public.profiles pr
                  where pr.id = auth.uid() and pr.app_role = any(array['owner','staff'])))
  with check (exists (select 1 from public.profiles pr
                  where pr.id = auth.uid() and pr.app_role = any(array['owner','staff'])));

create policy affiliate_clicks_admin_read on public.affiliate_clicks
  for select to authenticated
  using (exists (select 1 from public.profiles pr
                  where pr.id = auth.uid() and pr.app_role = any(array['owner','staff'])));

create policy affiliate_commissions_admin_rw on public.affiliate_commissions
  for all to authenticated
  using (exists (select 1 from public.profiles pr
                  where pr.id = auth.uid() and pr.app_role = any(array['owner','staff'])))
  with check (exists (select 1 from public.profiles pr
                  where pr.id = auth.uid() and pr.app_role = any(array['owner','staff'])));

create policy affiliate_payouts_admin_rw on public.affiliate_payouts
  for all to authenticated
  using (exists (select 1 from public.profiles pr
                  where pr.id = auth.uid() and pr.app_role = any(array['owner','staff'])))
  with check (exists (select 1 from public.profiles pr
                  where pr.id = auth.uid() and pr.app_role = any(array['owner','staff'])));
