-- User ownership and secure real-time conversations.
alter table public.listings add column if not exists owner_id uuid references auth.users(id) on delete cascade;
create index if not exists idx_listings_owner_id on public.listings(owner_id);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  buyer_email text not null,
  seller_email text not null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (listing_id, buyer_id),
  check (buyer_id <> seller_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_conversations_buyer on public.conversations(buyer_id, last_message_at desc);
create index if not exists idx_conversations_seller on public.conversations(seller_id, last_message_at desc);
create index if not exists idx_chat_messages_conversation on public.chat_messages(conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.chat_messages enable row level security;

-- The original demo message table is no longer used by the application.
-- Remove its anonymous access while preserving any existing rows for migration/audit.
drop policy if exists "Anyone can view messages" on public.messages;
drop policy if exists "Anyone can create messages" on public.messages;

drop policy if exists "Anyone can create listings" on public.listings;
drop policy if exists "Users can update their own listings" on public.listings;
create policy "Authenticated users create listings" on public.listings for insert to authenticated with check (owner_id = auth.uid());
create policy "Owners update listings" on public.listings for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Participants view conversations" on public.conversations for select to authenticated using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Buyers start conversations" on public.conversations for insert to authenticated with check (
  auth.uid() = buyer_id and exists (
    select 1 from public.listings l where l.id = listing_id and l.owner_id = seller_id and seller_id <> auth.uid()
  )
);

create policy "Participants view chat messages" on public.chat_messages for select to authenticated using (
  exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id))
);
create policy "Participants send chat messages" on public.chat_messages for insert to authenticated with check (
  sender_id = auth.uid() and exists (
    select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)
  )
);

create or replace function public.touch_conversation_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;
drop trigger if exists chat_messages_touch_conversation on public.chat_messages;
create trigger chat_messages_touch_conversation after insert on public.chat_messages
for each row execute function public.touch_conversation_on_message();

drop policy if exists "Anyone can upload listing images" on storage.objects;
create policy "Users upload listing images" on storage.objects for insert to authenticated with check (
  bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Users delete own listing images" on storage.objects for delete to authenticated using (
  bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text
);

do $$ begin
  alter publication supabase_realtime add table public.chat_messages;
exception when duplicate_object then null;
end $$;
