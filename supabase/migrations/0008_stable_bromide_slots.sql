alter table public.collections
  add column if not exists slots jsonb;
