drop policy if exists "profiles are readable by everyone" on public.profiles;

create policy "users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "admins read profiles"
  on public.profiles for select
  using (public.is_admin(auth.uid()));
