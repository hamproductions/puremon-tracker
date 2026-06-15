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
