drop policy if exists "users update own profile" on public.profiles;

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
