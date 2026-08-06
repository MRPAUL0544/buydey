-- BuyDey reputation and in-app notifications.
create table if not exists public.seller_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 3 and 1000),
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now(),
  unique(listing_id,reviewer_id),
  check(reviewer_id<>seller_id)
);
alter table public.seller_reviews enable row level security;
create policy "reviews_public_read" on public.seller_reviews for select using(status='published' or reviewer_id=auth.uid() or public.current_user_is_admin());
create policy "reviews_buyer_insert" on public.seller_reviews for insert to authenticated
with check(reviewer_id=auth.uid() and seller_id<>(auth.uid()) and exists(
  select 1 from public.conversations c where c.listing_id=seller_reviews.listing_id
  and c.buyer_id=auth.uid() and c.seller_id=seller_reviews.seller_id
));
create policy "reviews_admin_update" on public.seller_reviews for update to authenticated
using(public.current_user_is_admin()) with check(public.current_user_is_admin());

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  listing_id uuid references public.listings(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "notifications_own_read" on public.notifications for select to authenticated using(user_id=auth.uid());
create policy "notifications_own_update" on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

create or replace function public.notify_new_message() returns trigger language plpgsql security definer set search_path=public as $$
declare recipient uuid; listing_target uuid;
begin
  select case when c.buyer_id=new.sender_id then c.seller_id else c.buyer_id end,c.listing_id into recipient,listing_target
  from public.conversations c where c.id=new.conversation_id;
  insert into public.notifications(user_id,type,title,body,listing_id)
  values(recipient,'message','New marketplace message',left(new.body,160),listing_target);
  return new;
end $$;
drop trigger if exists message_notification on public.messages;
create trigger message_notification after insert on public.messages for each row execute procedure public.notify_new_message();

create or replace function public.notify_verification_result() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.status='pending' and new.status in ('approved','rejected') then
    insert into public.notifications(user_id,type,title,body)
    values(new.user_id,'verification',case when new.status='approved' then 'Identity verified' else 'Verification needs attention' end,
      case when new.status='approved' then 'Your trusted seller badge is now active.' else coalesce(new.reviewer_note,'Please review and resubmit your identity documents.') end);
  end if;
  return new;
end $$;
drop trigger if exists verification_result_notification on public.verification_requests;
create trigger verification_result_notification after update on public.verification_requests for each row execute procedure public.notify_verification_result();

create index if not exists reviews_seller_idx on public.seller_reviews(seller_id,status,created_at desc);
create index if not exists notifications_user_created_idx on public.notifications(user_id,created_at desc);
