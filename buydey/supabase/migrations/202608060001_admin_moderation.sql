-- BuyDey trust and safety administration.
alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists account_status text not null default 'active'
    check (account_status in ('active','suspended'));

create or replace function public.current_user_is_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select coalesce((select is_admin from public.profiles where id=auth.uid()),false) $$;

create or replace function public.protect_profile_security_fields()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if (new.is_admin is distinct from old.is_admin or new.account_status is distinct from old.account_status)
     and not public.current_user_is_admin() then
    raise exception 'Only administrators may change account security fields';
  end if;
  return new;
end $$;
drop trigger if exists protect_profile_security_fields on public.profiles;
create trigger protect_profile_security_fields before update on public.profiles
for each row execute procedure public.protect_profile_security_fields();

create policy "profiles_admin_update" on public.profiles for update to authenticated
using (public.current_user_is_admin()) with check (public.current_user_is_admin());
create policy "listings_admin_update" on public.listings for update to authenticated
using (public.current_user_is_admin()) with check (public.current_user_is_admin());
create policy "listings_admin_delete" on public.listings for delete to authenticated
using (public.current_user_is_admin());
create policy "reports_admin_read" on public.reports for select to authenticated
using (public.current_user_is_admin());
create policy "reports_admin_update" on public.reports for update to authenticated
using (public.current_user_is_admin()) with check (public.current_user_is_admin());
create policy "verification_admin_read" on public.verification_requests for select to authenticated
using (public.current_user_is_admin());
create policy "verification_admin_update" on public.verification_requests for update to authenticated
using (public.current_user_is_admin()) with check (public.current_user_is_admin());
create policy "verification_documents_admin_read" on storage.objects for select to authenticated
using (bucket_id='verification-documents' and public.current_user_is_admin());

-- Suspended accounts cannot publish or change ads. Administrators retain moderation access.
drop policy if exists "listings_own_insert" on public.listings;
create policy "listings_own_insert" on public.listings for insert to authenticated
with check (seller_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.account_status='active'));
drop policy if exists "listings_own_update" on public.listings;
create policy "listings_own_update" on public.listings for update to authenticated
using (seller_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.account_status='active'))
with check (seller_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.account_status='active'));

create or replace function public.review_verification(request_id uuid, decision text, note text default null)
returns void language plpgsql security definer set search_path=public as $$
declare target_user uuid;
begin
  if not public.current_user_is_admin() then raise exception 'Administrator access required'; end if;
  if decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
  select user_id into target_user from public.verification_requests where id=request_id and status='pending' for update;
  if target_user is null then raise exception 'Pending request not found'; end if;
  update public.verification_requests set status=decision,reviewer_note=note,reviewed_at=now() where id=request_id;
  update public.profiles set verified=(decision='approved'),verification_status=case when decision='approved' then 'verified' else 'rejected' end,updated_at=now() where id=target_user;
end $$;

revoke all on function public.review_verification(uuid,text,text) from public;
grant execute on function public.review_verification(uuid,text,text) to authenticated;
