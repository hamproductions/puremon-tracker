-- Purely Monster bromide tracker — Supabase schema
-- Run in the Supabase SQL editor (or `supabase db push`). Optional: the app works
-- fully local-first without any of this. This adds Twitter login + cloud crowdsource.

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles: one row per auth user, mirrors X handle + admin flag
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by everyone"
  on public.profiles for select using (true);

create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- populate profile from the OAuth metadata on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, handle, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'preferred_username'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- submissions: crowdsourced bromide images awaiting admin approval
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.submissions (
  id text primary key,
  bromide_id text not null,
  image_url text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  note text,
  submitted_by uuid references auth.users (id) on delete set null,
  submitted_handle text,
  created_at timestamptz not null default now()
);

alter table public.submissions enable row level security;

create policy "submitters and admins can read"
  on public.submissions for select
  using (submitted_by = auth.uid() or public.is_admin(auth.uid()) or status = 'approved');

create policy "authenticated can submit"
  on public.submissions for insert
  with check (auth.uid() = submitted_by);

create policy "admins moderate"
  on public.submissions for update
  using (public.is_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- ownership + trades: optional cloud sync (app currently keeps these in
-- localStorage; tables provided for future cross-device sync)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.ownership (
  user_id uuid not null references auth.users (id) on delete cascade,
  bromide_id text not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, bromide_id)
);

alter table public.ownership enable row level security;

create policy "owner manages own ownership"
  on public.ownership for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.trades (
  id text primary key,
  owner_id uuid references auth.users (id) on delete cascade,
  owner_handle text,
  gives text[] not null default '{}',
  wants text[] not null default '{}',
  note text,
  contact text,
  created_at timestamptz not null default now()
);

alter table public.trades enable row level security;

create policy "trades readable by everyone"
  on public.trades for select using (true);

create policy "owner manages own trades"
  on public.trades for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- storage bucket for bromide images (public read)
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('bromides', 'bromides', true)
on conflict (id) do nothing;

create policy "bromide images are public"
  on storage.objects for select using (bucket_id = 'bromides');

create policy "authenticated can upload bromide images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'bromides');
