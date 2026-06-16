drop policy if exists "admins delete bromide images" on storage.objects;

create policy "admins delete bromide images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'bromides' and public.is_admin(auth.uid()));
