create table if not exists public.oshi (
  user_id uuid not null references auth.users (id) on delete cascade,
  member_id text not null references public.members (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, member_id)
);

alter table public.oshi enable row level security;

drop policy if exists "owner manages own oshi" on public.oshi;

create policy "owner manages own oshi"
  on public.oshi for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.user_preferences (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_preferences enable row level security;

drop policy if exists "owner manages own preferences" on public.user_preferences;

create policy "owner manages own preferences"
  on public.user_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.collections
  add column if not exists slots jsonb;
