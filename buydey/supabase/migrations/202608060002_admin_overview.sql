-- Expanded BuyDey administration visibility and audit history.
create policy "listings_admin_read_all" on public.listings for select to authenticated
using (public.current_user_is_admin());

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id),
  action text not null,
  target_type text not null check (target_type in ('user','listing','report','verification')),
  target_id text not null,
  details text,
  created_at timestamptz not null default now()
);
alter table public.moderation_actions enable row level security;
create policy "moderation_admin_read" on public.moderation_actions for select to authenticated
using (public.current_user_is_admin());
create policy "moderation_admin_insert" on public.moderation_actions for insert to authenticated
with check (public.current_user_is_admin() and admin_id=auth.uid());
create index if not exists moderation_actions_created_idx on public.moderation_actions(created_at desc);
