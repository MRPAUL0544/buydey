-- Limit public profile data to safe marketplace identity fields.
create or replace view public.seller_public_profiles as
select id,full_name,avatar_url,verified,created_at from public.profiles;
grant select on public.seller_public_profiles to anon,authenticated;

drop policy if exists "profiles_public_read" on public.profiles;
drop policy if exists "profiles_own_or_admin_read" on public.profiles;
create policy "profiles_own_or_admin_read" on public.profiles for select
using(id=auth.uid() or public.current_user_is_admin());
