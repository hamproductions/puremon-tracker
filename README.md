# ピュアモン ブロマイド管理 / Purely Monster Bromide Tracker

A bromide (ブロマイド) collection tracker for the idol group **ピュアリーモンスター (Purely Monster)**.
Track which bromides you own across collections, see what's missing, manage duplicates, and
auto-generate copy-paste 譲渡 (trade) posts for X/Twitter. Japanese UI, **works fully without login
and offline** — your data is saved locally; Supabase is an optional sync/crowdsource layer.

## Features

- **コレクション** — browse bromide collections; per-collection grid (7 members × No., or flat 集合).
  Tap a tile to record ownership, persisted instantly to `localStorage`.
- **マイコレ・不足** — aggregate dashboard: completion %, missing (不足) and duplicate (ダブり) lists,
  per-member completion, and a share-ready poster export (PNG).
- **譲渡** — generates idiomatic 譲/求 trade text from your duplicates + missing, with copy & X-share,
  conditions (郵送/手渡し, 〆切, 連絡先), preset formats, and saved drafts (マイ募集).
- **画像投稿** — crowdsource bromide images; submissions go to admin approval (or save locally).
- **管理** — admins create collections, register bromide images, and approve submissions.
- Local-first + offline; X(Twitter) login, cloud image storage and cross-user crowdsourcing when
  Supabase is configured.

## Stack

Vite · Vike (SSG/SSR) · React 19 · Panda CSS · Park UI (Ark UI) · Supabase (optional) · Bun.

## Develop

```bash
bun install
bun run dev          # http://localhost:3000
```

Other scripts: `bun run type-check`, `bun run lint` / `bun run fix`, `bun run build` (prerenders all
routes to `dist/client/`), `bun run preview`.

## Deploy

`bun run build` outputs a fully static site to `dist/client/` — host it anywhere (Vercel/Netlify
static, GitHub Pages, Cloudflare Pages). For a subpath (e.g. GitHub Pages) set
`PUBLIC_ENV__BASE_URL=/puremon-tracker/` before building.

## Supabase (optional)

The app runs without any backend. To enable login + cloud crowdsourcing:

1. Create a Supabase project.
2. **Auth → Providers → Twitter**: enable and set your X app keys. Add your deploy URL to redirect URLs.
3. Run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) in the SQL editor
   (creates `profiles`, `submissions`, `ownership`, `trades`, the `bromides` storage bucket + RLS).
4. Copy `.env.example` → `.env` and fill `PUBLIC_ENV__SUPABASE_URL`, `PUBLIC_ENV__SUPABASE_ANON_KEY`.
5. Grant yourself admin: either add your handle to `PUBLIC_ENV__ADMIN_HANDLES` (UI gate), and/or
   `update public.profiles set is_admin = true where handle = 'yourhandle';` (RLS enforcement).

## Admin without Supabase

On `/admin`, toggle **ローカル管理モードを有効化** to manage collections/images locally on your own
device (stored in `localStorage`) — useful for seeding the catalog offline before wiring Supabase.

## Data model

The catalog (group, 7 members, collections, bromides) ships as code seed in
`src/data/catalog.ts` and is admin-extendable. Ownership/submissions/trades live in `localStorage`
via a small `useSyncExternalStore`-backed store (`src/data/store.ts`), and optionally sync to Supabase.
Bromide IDs are stable: `"<collectionId>:<memberId>:<no>"` (or `"<collectionId>:flat:<no>"`).

---

Unofficial fan tool. Not affiliated with Stand-Up! Records or Purely Monster.
