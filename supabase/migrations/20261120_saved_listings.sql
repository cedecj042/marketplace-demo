-- Any authenticated user can save listings without needing a separate buyer or seller account.
create table if not exists public.saved_listings (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index if not exists idx_saved_listings_user_created
on public.saved_listings(user_id, created_at desc);

alter table public.saved_listings enable row level security;

drop policy if exists "Users view their saved listings" on public.saved_listings;
create policy "Users view their saved listings"
on public.saved_listings for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Users save listings" on public.saved_listings;
create policy "Users save listings"
on public.saved_listings for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users remove saved listings" on public.saved_listings;
create policy "Users remove saved listings"
on public.saved_listings for delete to authenticated
using (user_id = auth.uid());
