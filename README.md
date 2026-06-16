# ピュアモン ブロマイド管理 / Purely Monster Bromide Tracker

A bromide (ブロマイド) collection tracker for the idol group **ピュアリーモンスター (Purely Monster)**.
Admins define the collection catalog, users mark owned bromides, and logged-in users contribute
missing images for admin approval. Japanese UI, with Supabase as the production source of truth for
catalog, image submissions, and authenticated ownership persistence.

## Features

- **コレクション** — browse bromide collections; per-collection grid (7 members × No., or flat 集合).
  Tap a tile to record ownership.
- **マイコレ・不足** — aggregate dashboard: completion %, missing (不足) and duplicate (ダブり) lists,
  per-member completion, and a share-ready poster export (PNG).
- **譲渡** — generates idiomatic 譲/求 trade text from your duplicates + missing, with copy & X-share,
  conditions (郵送/手渡し, 〆切, 連絡先), preset formats, and saved drafts (マイ募集).
- **画像投稿** — logged-in users can contribute missing bromide images; submissions go to admin approval.
- **管理** — admins create collections, register bromide images, and approve submissions.
- Supabase-authenticated ownership, selected oshi, and collection view preference sync; localStorage
  is only the logged-out ownership fallback.

## Stack

Vite · Vike (SSG/SSR) · React 19 · Panda CSS · Park UI (Ark UI) · Supabase (optional) · Bun.

## Develop

```bash
bun install
bun run dev          # http://localhost:3000
```

Other scripts: `bun run type-check`, `bun run lint` / `bun run fix`, `bun run build` (prerenders all
routes to `dist/client/`), `bun run preview`, `bun run verify:supabase-public`.

## Deploy

`bun run build` outputs a fully static site to `dist/client/` — host it anywhere (Vercel/Netlify
static, GitHub Pages, Cloudflare Pages). For a subpath (e.g. GitHub Pages) set
`PUBLIC_ENV__BASE_URL=/puremon-tracker/` before building.

## Supabase (for production — server-defined catalog + login)

The app runs with no backend (bundled seed + localStorage). For production, where **collections
are defined on the server** (an admin defines them once and every visitor sees them), wire Supabase:

1. Create a Supabase project.
2. **Auth → Providers → Twitter**: enable and set your X app keys; add your deploy URL to the redirect list.
3. Run all migrations in the SQL editor (or `supabase db push`):
   - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — `profiles`, `submissions`,
     `ownership`, `trades`, the `bromides` storage bucket, `is_admin()`, + RLS.
   - [`supabase/migrations/0002_catalog.sql`](supabase/migrations/0002_catalog.sql) — **the catalog**:
     `members`, `collections`, `bromide_images` (public read, admin-only writes) + the initial data.
   - [`supabase/migrations/0003_profile_admin_guard.sql`](supabase/migrations/0003_profile_admin_guard.sql) —
     prevents authenticated users from changing their own admin flag.
   - [`supabase/migrations/0004_profile_update_policy_guard.sql`](supabase/migrations/0004_profile_update_policy_guard.sql) —
     tightens the profile update policy so non-admin profile writes cannot carry `is_admin` changes.
   - [`supabase/migrations/0005_profile_read_policy_guard.sql`](supabase/migrations/0005_profile_read_policy_guard.sql) —
     removes anonymous/public reads from `profiles`.
   - [`supabase/migrations/0006_oshi_sync.sql`](supabase/migrations/0006_oshi_sync.sql) —
     persists each logged-in user's selected oshi.
   - [`supabase/migrations/0007_user_preferences.sql`](supabase/migrations/0007_user_preferences.sql) —
     persists logged-in user UI preferences such as collection grid size/layout.
   - For an existing live database that only needs the profile security fix, run
     [`supabase/live-policy-hotfix-2026-06-16.sql`](supabase/live-policy-hotfix-2026-06-16.sql), then run
     `bun run verify:supabase-public`.
   - For an existing live database missing user persistence tables, run
     [`supabase/live-persistence-hotfix-2026-06-16.sql`](supabase/live-persistence-hotfix-2026-06-16.sql).
4. Copy `.env.example` → `.env`, fill `PUBLIC_ENV__SUPABASE_URL` + `PUBLIC_ENV__SUPABASE_ANON_KEY`, rebuild.
5. Make yourself admin: `update public.profiles set is_admin = true where handle = 'yourhandle';`
   (and add your handle to `PUBLIC_ENV__ADMIN_HANDLES` so the in-app `/admin` gate opens).

Once configured, the app fetches the catalog from Supabase, and everything an admin does on `/admin` —
create/edit collections, register/approve bromide images — writes to the server, so all users see it.
Logged-in ownership ticks write to `public.ownership`; selected oshi write to `public.oshi`; collection
view preferences write to `public.user_preferences`. Anonymous ticks stay in localStorage until login,
then the server state takes priority. Anonymous visitors can still browse public catalog data. Admin
management and image upload require Supabase login.

## Local Supabase (dev)

`supabase start` (Docker) brings up the full stack and applies migrations. Put the printed
API URL + anon key in `.env`, then `bun run dev`.

## Supabase policy verification

With production Supabase env values in `.env`, run:

```bash
bun run verify:supabase-public
```

This verifies public catalog reads and confirms anonymous users cannot insert submissions or upload
storage objects. With a disposable non-admin login, it also verifies selected oshi and user preference
insert/read/delete persistence. Authenticated non-admin `profiles.is_admin` escalation is guarded by
`supabase/migrations/0003_profile_admin_guard.sql` and
`supabase/migrations/0004_profile_update_policy_guard.sql`; profile row privacy is guarded by
`supabase/migrations/0005_profile_read_policy_guard.sql`. Verify a deployed database has these
migrations before treating admin permissions as production-ready.

To verify the deployed authenticated non-admin boundary, provide a disposable non-admin login:

```bash
SUPABASE_TEST_EMAIL=... SUPABASE_TEST_PASSWORD=... bun run verify:supabase-public
```

## Data model

Catalog source order: **Supabase when configured, otherwise bundled seed**
(`src/data/catalog.ts`). Members + collections live in the `members`/`collections` tables; bromides are
generated client-side from each collection's params (`member_grid` = members × numbers × sizes, `mixed` =
an explicit per-item tagged list, `flat` = numbers only), and approved images come from `bromide_images`.
Authenticated ownership lives in `public.ownership`, selected oshi in `public.oshi`, and collection view
preferences in `public.user_preferences`. Logged-out ownership and trade drafts use `localStorage`
(`src/data/store.ts`). Bromide IDs are stable:
`"<collectionId>:<memberId>:<size>:<no>"` (size/member segments omitted when absent; group items use
`flat`).

---

Unofficial fan tool. Not affiliated with Stand-Up! Records or Purely Monster.
