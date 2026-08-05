alter table public.profiles
  add column if not exists verification_status text not null default 'unverified'
    check (verification_status in ('unverified','pending','verified','rejected')),
  add column if not exists region text,
  add column if not exists town text;

alter table public.listings
  add column if not exists region text,
  add column if not exists town text;

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null check (document_type in ('ghana_card','passport','drivers_license')),
  document_number_last4 text not null check (char_length(document_number_last4) = 4),
  front_path text not null,
  back_path text,
  selfie_path text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewer_note text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.verification_requests enable row level security;
create policy "verification_own_read" on public.verification_requests for select to authenticated using (user_id = auth.uid());
create policy "verification_own_submit" on public.verification_requests for insert to authenticated with check (user_id = auth.uid() and status = 'pending');

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('verification-documents','verification-documents',false,8388608,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public=false,file_size_limit=8388608,allowed_mime_types=excluded.allowed_mime_types;

create policy "verification_private_upload" on storage.objects for insert to authenticated
with check (bucket_id='verification-documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "verification_private_read" on storage.objects for select to authenticated
using (bucket_id='verification-documents' and owner_id=auth.uid()::text);
create policy "verification_private_delete" on storage.objects for delete to authenticated
using (bucket_id='verification-documents' and owner_id=auth.uid()::text);

create or replace function public.mark_verification_pending() returns trigger language plpgsql security definer set search_path=public as $$
begin update public.profiles set verification_status='pending',updated_at=now() where id=new.user_id; return new; end $$;
drop trigger if exists verification_submitted on public.verification_requests;
create trigger verification_submitted after insert on public.verification_requests for each row execute procedure public.mark_verification_pending();

create index if not exists verification_user_status_idx on public.verification_requests(user_id,status,submitted_at desc);
