-- Private in-app notifications delivered through Supabase Realtime.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 500),
  href text not null default '/',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
on public.notifications(user_id, created_at desc);

create index if not exists idx_notifications_user_unread
on public.notifications(user_id, created_at desc)
where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "Users view their notifications" on public.notifications;
create policy "Users view their notifications"
on public.notifications for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Users update their notifications" on public.notifications;
create policy "Users update their notifications"
on public.notifications for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- A message creates one notification for the other conversation participant.
create or replace function public.notify_chat_recipient()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chat public.conversations%rowtype;
  recipient_id uuid;
  listing_title text;
begin
  select * into chat
  from public.conversations
  where id = new.conversation_id;

  if not found then
    return new;
  end if;

  if new.sender_id = chat.buyer_id then
    recipient_id := chat.seller_id;
  elsif new.sender_id = chat.seller_id then
    recipient_id := chat.buyer_id;
  else
    return new;
  end if;

  select title into listing_title
  from public.listings
  where id = chat.listing_id;

  insert into public.notifications (user_id, type, title, body, href)
  values (
    recipient_id,
    'message',
    'New message about ' || coalesce(listing_title, 'a listing'),
    left(new.body, 500),
    '/messages/' || chat.id::text
  );

  return new;
end;
$$;

drop trigger if exists chat_message_create_notification on public.chat_messages;
create trigger chat_message_create_notification
after insert on public.chat_messages
for each row execute function public.notify_chat_recipient();

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
