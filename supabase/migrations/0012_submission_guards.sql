create unique index if not exists submissions_one_pending_per_slot_user
  on public.submissions (bromide_id, submitted_by)
  where status = 'pending';

create unique index if not exists submissions_unique_pending_image
  on public.submissions (image_url)
  where status = 'pending';
