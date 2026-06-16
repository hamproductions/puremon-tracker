drop policy if exists "authenticated can submit" on public.submissions;

create policy "authenticated can submit"
  on public.submissions for insert
  with check (auth.uid() = submitted_by and status = 'pending');

create or replace function public.delete_collection(p_collection_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'only admins can delete collections';
  end if;
  if p_collection_id !~ '^[a-z0-9-]+$' then
    raise exception 'invalid collection id';
  end if;

  delete from public.bromide_images where bromide_id like p_collection_id || ':%';
  delete from public.submissions where bromide_id like p_collection_id || ':%';
  delete from public.ownership where bromide_id like p_collection_id || ':%';
  delete from public.collections where id = p_collection_id;
end;
$$;
