-- Listing analytics, customer support and category administration.
alter table public.listings add column if not exists view_count bigint not null default 0;

create or replace function public.increment_listing_view(target_listing uuid)
returns void language sql security definer set search_path=public as $$
  update public.listings set view_count=view_count+1 where id=target_listing and status='active'
$$;
revoke all on function public.increment_listing_view(uuid) from public;
grant execute on function public.increment_listing_view(uuid) to anon,authenticated;

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null check(char_length(subject) between 3 and 120),
  message text not null check(char_length(message) between 10 and 3000),
  status text not null default 'open' check(status in ('open','in_progress','resolved','closed')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.support_requests enable row level security;
create policy "support_own_read" on public.support_requests for select to authenticated using(user_id=auth.uid());
create policy "support_own_insert" on public.support_requests for insert to authenticated with check(user_id=auth.uid());
create policy "support_admin_read" on public.support_requests for select to authenticated using(public.current_user_is_admin());
create policy "support_admin_update" on public.support_requests for update to authenticated using(public.current_user_is_admin()) with check(public.current_user_is_admin());
create policy "categories_admin_update" on public.categories for update to authenticated using(public.current_user_is_admin()) with check(public.current_user_is_admin());

drop trigger if exists support_requests_updated_at on public.support_requests;
create trigger support_requests_updated_at before update on public.support_requests for each row execute procedure public.set_updated_at();
create index if not exists support_requests_status_created_idx on public.support_requests(status,created_at desc);
