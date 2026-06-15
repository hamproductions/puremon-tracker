-- Server-defined catalog: members, collections, and approved bromide images.
-- Public read (anon can browse before login); admin-only writes (uses is_admin()
-- from 0001_init.sql). Bromides are generated client-side from collection params.

-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.members (
  id text primary key,
  name text not null,
  name_kana text not null default '',
  nickname text not null default '',
  color text not null default '#FF5FA2',
  "order" integer not null default 0
);

create table if not exists public.collections (
  id text primary key,
  title text not null,
  description text,
  release_date text,
  kind text not null check (kind in ('member_grid', 'flat', 'mixed')),
  member_ids text[] not null default '{}',
  numbers integer[] not null default '{}',
  sizes text[],
  items jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.bromide_images (
  bromide_id text primary key,
  image_url text not null,
  updated_at timestamptz not null default now()
);

alter table public.members enable row level security;
alter table public.collections enable row level security;
alter table public.bromide_images enable row level security;

create policy "catalog members readable" on public.members for select using (true);
create policy "catalog collections readable" on public.collections for select using (true);
create policy "catalog images readable" on public.bromide_images for select using (true);

create policy "admin writes members" on public.members for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin writes collections" on public.collections for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin writes images" on public.bromide_images for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- initial catalog (idempotent). Edit/extend later from the in-app admin screen.
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.members (id, name, name_kana, nickname, color, "order") values
  ('momo',   '菅原もも',   'すがわらもも',   'ももちゅん', '#FF5FA2', 0),
  ('moeno',  '白城もえの', 'しらきもえの',   'らきちゃん', '#AEB4BE', 1),
  ('reina',  '安藤鈴菜',   'あんどうれいな', 'れいにゃ',   '#9B1B3F', 2),
  ('arisa',  '塙有咲',     'はなわありさ',   'あーちゃ',   '#34A853', 3),
  ('shiori', '西門志織',   'にしかどしおり', 'おりきゃん', '#9B5DE5', 4),
  ('rina',   '勝野里奈',   'かつのりな',     'りなりー',   '#F2B705', 5),
  ('ayumi',  '百瀬安由未', 'ももせあゆみ',   'あゆみん',   '#FF7A2E', 6)
on conflict (id) do nothing;

insert into public.collections (id, title, description, kind, member_ids, numbers, sizes, items, created_at) values
  ('floral', '花柄衣装', '花柄衣装ブロマイド（L／2L・各全5種）', 'member_grid',
   ARRAY['momo','moeno','reina','arisa','shiori','rina','ayumi'], ARRAY[1,2,3,4,5], ARRAY['L','2L'], null, '2024-05-01T00:00:00Z'),
  ('halloween', 'ハロウィン', 'ハロウィン衣装ブロマイド（L／2L・各全10種）', 'member_grid',
   ARRAY['momo','moeno','reina','arisa','shiori','rina','ayumi'], ARRAY[1,2,3,4,5,6,7,8,9,10], ARRAY['L','2L'], null, '2024-10-01T00:00:00Z'),
  ('christmas', 'クリスマス', 'クリスマス衣装ブロマイド（L／2L・各全5種）', 'member_grid',
   ARRAY['momo','moeno','reina','arisa','shiori','rina','ayumi'], ARRAY[1,2,3,4,5], ARRAY['L','2L'], null, '2024-12-01T00:00:00Z'),
  ('momo-birthday-2024', '菅原もも 生誕2024', '菅原ももソロ生誕ブロマイド（単独・L／2L・全6種）', 'member_grid',
   ARRAY['momo'], ARRAY[1,2,3,4,5,6], ARRAY['L','2L'], null, '2024-06-12T00:00:00Z'),
  ('mixed-2024', 'ミックスブロマイドセット', 'メンバーごとに枚数が違うミックスセット（個別タグ付け）', 'mixed',
   ARRAY[]::text[], ARRAY[]::integer[], null,
   '[{"memberId":"momo","no":1},{"memberId":"momo","no":2},{"memberId":"momo","no":3},{"memberId":"reina","no":1},{"memberId":"reina","no":2},{"memberId":"shiori","no":1},{"memberId":"ayumi","no":1},{"memberId":null,"no":1},{"memberId":null,"no":2}]'::jsonb,
   '2024-09-01T00:00:00Z'),
  ('anniversary-group', '1st Anniversary 集合ブロマイド', '集合写真ブロマイド（番号のみ・全8種）', 'flat',
   ARRAY[]::text[], ARRAY[1,2,3,4,5,6,7,8], null, null, '2024-07-07T00:00:00Z')
on conflict (id) do nothing;
