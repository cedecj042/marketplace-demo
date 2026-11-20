-- Stripe Connect seller onboarding, orders, and sold listing state.
alter table public.profiles add column if not exists stripe_account_id text;
alter table public.profiles add column if not exists stripe_details_submitted boolean not null default false;
alter table public.profiles add column if not exists stripe_charges_enabled boolean not null default false;
alter table public.profiles add column if not exists stripe_payouts_enabled boolean not null default false;

create unique index if not exists idx_profiles_stripe_account
on public.profiles(stripe_account_id)
where stripe_account_id is not null;

alter table public.listings add column if not exists status text not null default 'active';
alter table public.listings add column if not exists sold_at timestamptz;

do $$
begin
  alter table public.listings
  add constraint listings_status_check check (status in ('active', 'sold'));
exception when duplicate_object then null;
end $$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete restrict,
  buyer_id uuid references auth.users(id) on delete set null,
  seller_id uuid not null references auth.users(id) on delete restrict,
  buyer_email text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'canceled')),
  currency text not null default 'php',
  amount_total integer not null check (amount_total > 0),
  platform_fee integer not null check (platform_fee >= 0 and platform_fee <= amount_total),
  stripe_account_id text not null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_listing on public.orders(listing_id, created_at desc);
create index if not exists idx_orders_buyer on public.orders(buyer_id, created_at desc);
create index if not exists idx_orders_seller on public.orders(seller_id, created_at desc);

alter table public.orders enable row level security;

drop policy if exists "Order participants view orders" on public.orders;
create policy "Order participants view orders"
on public.orders for select to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid());

create table if not exists public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

-- Webhook idempotency records are server-only. With RLS enabled and no
-- client policies, anon/authenticated API clients cannot read or modify them.
alter table public.stripe_webhook_events enable row level security;

create or replace function public.touch_order_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_orders_updated_at on public.orders;
create trigger touch_orders_updated_at
before update on public.orders
for each row execute function public.touch_order_updated_at();
