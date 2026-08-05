-- BuyDey backend migration. Run this once in the BuyDey Supabase SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', phone text, avatar_url text, location text,
  verified boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.categories (
  id bigint generated always as identity primary key, name text not null unique, slug text not null unique,
  position integer not null default 0, active boolean not null default true
);
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.profiles(id) on delete cascade,
  category_id bigint not null references public.categories(id), title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 10 and 5000), price numeric(14,2) not null check (price >= 0),
  currency text not null default 'GHS' check (currency = 'GHS'), condition text not null default 'Used', location text not null,
  phone text, status text not null default 'active' check (status in ('draft','active','sold','archived')),
  promoted boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.listing_images (
  id bigint generated always as identity primary key, listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null, position integer not null default 0, created_at timestamptz not null default now(), unique(listing_id,storage_path)
);
create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade, listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id,listing_id)
);
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade, seller_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(listing_id,buyer_id,seller_id), check(buyer_id <> seller_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade, body text not null check(char_length(body) between 1 and 2000),
  read_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade, reason text not null, details text,
  status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')), created_at timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,full_name,phone) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.raw_user_meta_data->>'phone'); return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
drop trigger if exists listings_updated_at on public.listings;
create trigger listings_updated_at before update on public.listings for each row execute procedure public.set_updated_at();
drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at before update on public.conversations for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security; alter table public.categories enable row level security;
alter table public.listings enable row level security; alter table public.listing_images enable row level security;
alter table public.favorites enable row level security; alter table public.conversations enable row level security;
alter table public.messages enable row level security; alter table public.reports enable row level security;

create policy "profiles_public_read" on public.profiles for select using(true);
create policy "profiles_own_update" on public.profiles for update using(auth.uid()=id) with check(auth.uid()=id);
create policy "categories_public_read" on public.categories for select using(active);
create policy "listings_public_read" on public.listings for select using(status='active' or seller_id=auth.uid());
create policy "listings_own_insert" on public.listings for insert to authenticated with check(seller_id=auth.uid());
create policy "listings_own_update" on public.listings for update to authenticated using(seller_id=auth.uid()) with check(seller_id=auth.uid());
create policy "listings_own_delete" on public.listings for delete to authenticated using(seller_id=auth.uid());
create policy "images_public_read" on public.listing_images for select using(true);
create policy "images_own_insert" on public.listing_images for insert to authenticated with check(exists(select 1 from public.listings l where l.id=listing_id and l.seller_id=auth.uid()));
create policy "images_own_delete" on public.listing_images for delete to authenticated using(exists(select 1 from public.listings l where l.id=listing_id and l.seller_id=auth.uid()));
create policy "favorites_own_read" on public.favorites for select to authenticated using(user_id=auth.uid());
create policy "favorites_own_insert" on public.favorites for insert to authenticated with check(user_id=auth.uid());
create policy "favorites_own_delete" on public.favorites for delete to authenticated using(user_id=auth.uid());
create policy "conversations_participant_read" on public.conversations for select to authenticated using(auth.uid() in (buyer_id,seller_id));
create policy "conversations_buyer_insert" on public.conversations for insert to authenticated with check(buyer_id=auth.uid() and seller_id<>auth.uid());
create policy "messages_participant_read" on public.messages for select to authenticated using(exists(select 1 from public.conversations c where c.id=conversation_id and auth.uid() in(c.buyer_id,c.seller_id)));
create policy "messages_participant_insert" on public.messages for insert to authenticated with check(sender_id=auth.uid() and exists(select 1 from public.conversations c where c.id=conversation_id and auth.uid() in(c.buyer_id,c.seller_id)));
create policy "reports_own_insert" on public.reports for insert to authenticated with check(reporter_id=auth.uid());
create policy "reports_own_read" on public.reports for select to authenticated using(reporter_id=auth.uid());

insert into public.categories(name,slug,position) values
('Vehicles','vehicles',1),('Property','property',2),('Phones & Tablets','phones-tablets',3),('Electronics','electronics',4),
('Home, Furniture & Appliances','home-furniture-appliances',5),('Fashion','fashion',6),('Beauty & Personal Care','beauty-personal-care',7),('Services','services',8),
('Repair & Construction','repair-construction',9),('Commercial Equipment & Tools','commercial-equipment-tools',10),('Leisure & Activities','leisure-activities',11),
('Babies & Kids','babies-kids',12),('Food, Agriculture & Farming','food-agriculture-farming',13),('Animals & Pets','animals-pets',14),
('Jobs','jobs',15),('Seeking Work — CVs','seeking-work-cvs',16)
on conflict(slug) do update set name=excluded.name,position=excluded.position,active=true;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('listing-images','listing-images',true,10485760,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "storage_public_read" on storage.objects for select using(bucket_id='listing-images');
create policy "storage_own_insert" on storage.objects for insert to authenticated with check(bucket_id='listing-images' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "storage_own_update" on storage.objects for update to authenticated using(bucket_id='listing-images' and owner_id=auth.uid()::text);
create policy "storage_own_delete" on storage.objects for delete to authenticated using(bucket_id='listing-images' and owner_id=auth.uid()::text);

create index if not exists listings_category_idx on public.listings(category_id);
create index if not exists listings_seller_idx on public.listings(seller_id);
create index if not exists listings_status_created_idx on public.listings(status,created_at desc);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id,created_at);
