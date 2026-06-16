create or replace function public.prevent_profile_admin_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if
    new.is_admin is distinct from old.is_admin
    and auth.uid() is not null
    and not public.is_admin(auth.uid())
  then
    raise exception 'only admins can change profile admin status';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_admin_self_escalation on public.profiles;
create trigger prevent_profile_admin_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_admin_self_escalation();

drop policy if exists "users update own profile" on public.profiles;
drop policy if exists "admins update profiles" on public.profiles;

create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin = public.is_admin(auth.uid())
  );

create policy "admins update profiles"
  on public.profiles for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "profiles are readable by everyone" on public.profiles;
drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "admins read profiles" on public.profiles;

create policy "users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "admins read profiles"
  on public.profiles for select
  using (public.is_admin(auth.uid()));
