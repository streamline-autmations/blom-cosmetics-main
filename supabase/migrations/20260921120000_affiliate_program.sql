-- Affiliate / referral program (first partner: NailRanks)
--
-- Attribution is layered so it survives cookie loss: URL+memory, sessionStorage,
-- first-party cookie, account stamp, and server-side IP+UA click matching.
--
-- NOTE: affiliate accounts and password hashes are seeded out-of-band (never in a
-- migration file or the repo — this repo is public).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Affiliates
-- ---------------------------------------------------------------------------
create table if not exists public.affiliates (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  name              text not null,
  company           text,
  contact_email     text not null,
  commission_rate   numeric(5,4) not null default 0.05 check (commission_rate >= 0 and commission_rate <= 1),
  attribution_days  integer not null default 30 check (attribution_days > 0),
  status            text not null default 'active' check (status in ('active','disabled')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists affiliates_code_idx on public.affiliates (lower(code));

-- ---------------------------------------------------------------------------
-- Portal login
--
-- Deliberately NOT Supabase Auth: the store's `orders` table currently carries
-- permissive RLS policies, so any authenticated Supabase user can read all orders.
-- Affiliates therefore get their own credential store and never receive a Supabase
-- session or key. All portal data is served by Netlify functions using the service
-- key, scoped server-side to a single affiliate_id.
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_users (
  id               uuid primary key default gen_random_uuid(),
  affiliate_id     uuid not null references public.affiliates(id) on delete cascade,
  email            text not null unique,
  password_hash    text not null,
  failed_attempts  integer not null default 0,
  locked_until     timestamptz,
  last_login_at    timestamptz,
  created_at       timestamptz not null default now()
);

create table if not exists public.affiliate_sessions (
  id                 uuid primary key default gen_random_uuid(),
  affiliate_user_id  uuid not null references public.affiliate_users(id) on delete cascade,
  token_hash         text not null unique,
  expires_at         timestamptz not null,
  revoked_at         timestamptz,
  ip_hash            text,
  user_agent         text,
  created_at         timestamptz not null default now()
);

create index if not exists affiliate_sessions_lookup_idx
  on public.affiliate_sessions (token_hash) where revoked_at is null;

-- ---------------------------------------------------------------------------
-- Click log. IPs and user agents are stored hashed (POPIA): enough to dedupe and
-- to match an order back to a click, never enough to identify a person.
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_clicks (
  id            uuid primary key default gen_random_uuid(),
  affiliate_id  uuid not null references public.affiliates(id) on delete cascade,
  occurred_at   timestamptz not null default now(),
  landing_path  text,
  referrer      text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  ip_hash       text,
  ua_hash       text,
  is_unique     boolean not null default true
);

create index if not exists affiliate_clicks_affiliate_time_idx
  on public.affiliate_clicks (affiliate_id, occurred_at desc);

-- Supports the cookieless fallback: find a recent click from the same device.
create index if not exists affiliate_clicks_fingerprint_idx
  on public.affiliate_clicks (ip_hash, ua_hash, occurred_at desc);

-- ---------------------------------------------------------------------------
-- Payouts (created before commissions for the FK)
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_payouts (
  id                uuid primary key default gen_random_uuid(),
  affiliate_id      uuid not null references public.affiliates(id),
  period_start      date not null,
  period_end        date not null,
  commission_count  integer not null default 0,
  total_cents       integer not null default 0,
  status            text not null default 'draft' check (status in ('draft','paid')),
  paid_at           timestamptz,
  reference         text,
  notes             text,
  created_at        timestamptz not null default now()
);

create index if not exists affiliate_payouts_affiliate_idx
  on public.affiliate_payouts (affiliate_id, period_start desc);

-- ---------------------------------------------------------------------------
-- Commissions — one row per attributed paid order
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_commissions (
  id                 uuid primary key default gen_random_uuid(),
  affiliate_id       uuid not null references public.affiliates(id),
  order_id           text not null unique references public.orders(id) on delete cascade,
  order_number       text,
  order_kind         text,
  base_cents         integer not null check (base_cents >= 0),
  rate               numeric(5,4) not null,
  commission_cents   integer not null check (commission_cents >= 0),
  status             text not null default 'approved'
                       check (status in ('pending','approved','reversed','paid')),
  attribution_method text,
  reversal_reason    text,
  approved_at        timestamptz,
  paid_at            timestamptz,
  payout_id          uuid references public.affiliate_payouts(id),
  created_at         timestamptz not null default now()
);

create index if not exists affiliate_commissions_affiliate_idx
  on public.affiliate_commissions (affiliate_id, created_at desc);

create index if not exists affiliate_commissions_status_idx
  on public.affiliate_commissions (affiliate_id, status);

-- ---------------------------------------------------------------------------
-- Attribution stamped onto orders and (for cross-device) onto profiles
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists affiliate_id uuid references public.affiliates(id),
  add column if not exists affiliate_code text,
  add column if not exists affiliate_click_id uuid,
  add column if not exists affiliate_attribution_method text,
  add column if not exists affiliate_attributed_at timestamptz;

create index if not exists orders_affiliate_idx
  on public.orders (affiliate_id, paid_at desc) where affiliate_id is not null;

alter table public.profiles
  add column if not exists referred_by_affiliate_id uuid references public.affiliates(id),
  add column if not exists referred_at timestamptz;

-- ---------------------------------------------------------------------------
-- Commission creation
--
-- Base = subtotal - discount, excluding shipping (verified against live data:
-- total = subtotal - discount + shipping).
--
-- The whole body is exception-guarded. This trigger runs on the live orders table
-- during payment confirmation; if affiliate logic ever fails it must degrade to a
-- warning, never block an order from being marked paid.
-- ---------------------------------------------------------------------------
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
    -- Reverse a commission if a paid order is later cancelled or refunded.
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

    -- Only on the transition into paid.
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

    v_base := greatest(
      0,
      coalesce(new.subtotal_cents, coalesce(new.total_cents,0) - coalesce(new.shipping_cents,0))
        - coalesce(new.discount_cents, 0)
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
    on conflict (order_id) do nothing;

  exception when others then
    raise warning 'affiliate_capture_commission failed for order %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists affiliate_capture_commission_trg on public.orders;
create trigger affiliate_capture_commission_trg
  after insert or update of status on public.orders
  for each row execute function public.affiliate_capture_commission();

-- ---------------------------------------------------------------------------
-- Lockdown. These tables hold commercial and credential data: no client role gets
-- any access. Reads happen exclusively through service-role Netlify functions.
-- ---------------------------------------------------------------------------
alter table public.affiliates            enable row level security;
alter table public.affiliate_users       enable row level security;
alter table public.affiliate_sessions    enable row level security;
alter table public.affiliate_clicks      enable row level security;
alter table public.affiliate_commissions enable row level security;
alter table public.affiliate_payouts     enable row level security;

revoke all on public.affiliates,
              public.affiliate_users,
              public.affiliate_sessions,
              public.affiliate_clicks,
              public.affiliate_commissions,
              public.affiliate_payouts
  from anon, authenticated, public;

grant all on public.affiliates,
             public.affiliate_users,
             public.affiliate_sessions,
             public.affiliate_clicks,
             public.affiliate_commissions,
             public.affiliate_payouts
  to service_role;
