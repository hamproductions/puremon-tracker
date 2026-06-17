-- Legacy bromides were stored with aspect 0.75 (3:4). Bromides are L判/2L判 (89:127).
-- Strip the stale 0.75 aspect so the app's DEFAULT_BROMIDE_ASPECT (89/127) applies.

update collections c
set slots = (
  select jsonb_agg(
    case when (s->>'aspect')::numeric = 0.75 then s - 'aspect' else s end
  )
  from jsonb_array_elements(c.slots) s
)
where c.slots is not null
  and exists (
    select 1 from jsonb_array_elements(c.slots) s where (s->>'aspect')::numeric = 0.75
  );

update collections c
set items = (
  select jsonb_agg(
    case when (i->>'aspect')::numeric = 0.75 then i - 'aspect' else i end
  )
  from jsonb_array_elements(c.items) i
)
where c.items is not null
  and exists (
    select 1 from jsonb_array_elements(c.items) i where (i->>'aspect')::numeric = 0.75
  );
