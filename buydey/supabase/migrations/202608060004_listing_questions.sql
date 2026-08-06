-- Public product questions and official seller replies.
create table if not exists public.listing_questions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.listing_questions(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 1000),
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now()
);
alter table public.listing_questions enable row level security;
create policy "questions_public_read" on public.listing_questions for select using(status='published' or user_id=auth.uid() or public.current_user_is_admin());
create policy "questions_authenticated_insert" on public.listing_questions for insert to authenticated
with check(user_id=auth.uid() and (
  (parent_id is null and exists(select 1 from public.listings l where l.id=listing_id and l.seller_id<>auth.uid()))
  or
  (parent_id is not null and exists(select 1 from public.listings l join public.listing_questions q on q.id=parent_id where l.id=listing_id and q.listing_id=listing_id and l.seller_id=auth.uid()))
));
create policy "questions_admin_update" on public.listing_questions for update to authenticated
using(public.current_user_is_admin()) with check(public.current_user_is_admin());

create or replace function public.notify_listing_question() returns trigger language plpgsql security definer set search_path=public as $$
declare recipient uuid; listing_title text; question_author uuid;
begin
  select seller_id,title into recipient,listing_title from public.listings where id=new.listing_id;
  if new.parent_id is not null then
    select user_id into question_author from public.listing_questions where id=new.parent_id;
    recipient=question_author;
  end if;
  if recipient<>new.user_id then
    insert into public.notifications(user_id,type,title,body,listing_id)
    values(recipient,'question',case when new.parent_id is null then 'New product question' else 'Seller replied to your question' end,left(new.body,160),new.listing_id);
  end if;
  return new;
end $$;
drop trigger if exists listing_question_notification on public.listing_questions;
create trigger listing_question_notification after insert on public.listing_questions for each row execute procedure public.notify_listing_question();
create index if not exists listing_questions_listing_created_idx on public.listing_questions(listing_id,created_at);
