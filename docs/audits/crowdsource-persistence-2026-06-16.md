# Crowdsource persistence audit

## Intended feature

Admins define the collection catalog and canonical bromide images. Users mark owned bromides and can upload image submissions for missing cards. Logged-in user state must persist across browser sessions through Supabase.

## Persistence matrix

| State | Owner | Storage | Status |
| --- | --- | --- | --- |
| Members | Admin | `public.members` | Server-backed |
| Collections | Admin | `public.collections` | Server-backed |
| Approved bromide images | Admin | `public.bromide_images` + `bromides` storage | Server-backed |
| Image submissions | Logged-in user | `public.submissions` + `bromides` storage | Server-backed |
| Ownership ticks/counts | Logged-in user | `public.ownership` | Server-backed |
| Ownership ticks/counts | Anonymous user | `localStorage:puremon:ownership` | Logged-out fallback only, cleared on login |
| Selected oshi | Logged-in user | `public.oshi` | Server-backed in `0006_oshi_sync.sql` |
| Collection view settings | Logged-in user | `public.user_preferences` | Server-backed in `0007_user_preferences.sql` |
| Admin access | Logged-in admin profile | `public.profiles.is_admin` | Server-backed |
| Trade drafts/preferences | User | Existing local trade stores | Not changed per request |

## Removed local product state

These keys are purged on app load and are not authoritative in Supabase mode:

- `puremon:admin`
- `puremon:collections`
- `puremon:deleted-collections`
- `puremon:e2e-profile`
- `puremon:images`
- `puremon:members`
- `puremon:oshi`
- `puremon:remote-catalog`
- `puremon:submissions`

## Live database requirements

Existing Supabase projects need both hotfix files applied:

- `supabase/live-policy-hotfix-2026-06-16.sql`
- `supabase/live-persistence-hotfix-2026-06-16.sql`

After applying them:

```bash
SUPABASE_TEST_EMAIL=test_user@ham-san.net SUPABASE_TEST_PASSWORD='...' bun run verify:supabase-public
```

The verifier checks public catalog reads, anonymous write blocks, profile privacy/admin escalation, selected oshi persistence, and user preference persistence.

## Real test result

Run against the live Supabase project with `test_user@ham-san.net` on 2026-06-16:

```text
public members read: PASS
public collections read: PASS
public approved images read: PASS
anonymous profiles read blocked: FAIL
anonymous submission insert blocked: PASS
anonymous storage upload blocked: PASS
test user sign-in: PASS
test user profile readable: PASS
test user is non-admin: PASS
test user selected-oshi delete before write: FAIL
test user selected-oshi insert: FAIL
test user selected-oshi readback: FAIL
test user selected-oshi delete after write: FAIL
test user preference upsert: FAIL
test user preference readback: FAIL
test user preference delete: FAIL
non-admin profile admin escalation blocked: FAIL
```

Browser evidence captured through `agent-browser`:

- `dogfood-output/real-persistence-2026-06-16/screenshots/test-user-session-loaded.png`
- `dogfood-output/real-persistence-2026-06-16/screenshots/oshi-click-result.png`
- `dogfood-output/real-persistence-2026-06-16/videos/test-user-oshi-view-controls.webm`

Observed live network result:

```text
GET /rest/v1/ownership?... 200
GET /rest/v1/oshi?... 404
```

Conclusion: authenticated ownership persistence is live; selected oshi and collection view preference persistence cannot pass on the deployed project until `public.oshi` and `public.user_preferences` exist. Profile RLS is also still unsafe until the profile policy hotfix is applied.

## 2026-06-16 repair slice evidence

Implemented and verified locally:

- Upload setup now starts with the file picker/drop zone, with target selection below it.
- Cropper now exposes portrait, landscape, square, and free crop modes.
- The scanner action is labeled as document trim instead of implying it replaces final crop.
- Admin collection management uses a dense table instead of card rows.
- Anonymous ownership is merged into authenticated ownership on login, with server values winning conflicts.
- Collection slots can carry stable `slotId` plus `legacyIds`, so images and ownership can resolve legacy IDs after view-setting changes.
- Admin collection saves now serialize stable `slots`; existing slots are reconciled by legacy ID where possible.

Local verification:

```text
bun test: 19 pass
bun run type-check: pass
bun run lint: pass with existing Panda warnings in src/pages/+Layout.tsx
bun run build: pass
```

Browser evidence:

- `dogfood-output/repair-slice-2026-06-16/screenshots/admin-table.png`
- `dogfood-output/repair-slice-2026-06-16/screenshots/upload-modal-file-first.png`
- `dogfood-output/repair-slice-2026-06-16/screenshots/upload-crop-landscape-controls.png`
- `dogfood-output/repair-slice-2026-06-16/screenshots/upload-crop-landscape-selected.png`
- `dogfood-output/repair-slice-2026-06-16/screenshots/upload-crop-free-selected.png`

Still not complete:

- The live Supabase database still has not applied profile, oshi, user preference, or stable-slot SQL.
- Full user/admin Supabase upload flow still needs post-SQL real DB proof.
- Cross-user and cross-browser-session persistence still needs the full test matrix run after live DB migration.
- The slot model is backward-compatible at the client/collection JSON layer, but a fuller server-side `bromide_slots` table would still be cleaner for long-term admin inventory management.

## 2026-06-16 React Query repair evidence

Implemented:

- Added app-level `QueryProvider`.
- Added app-level `AuthProvider` so page/hooks share one authenticated profile source instead of each hook opening its own auth subscription/profile load.
- Moved remote catalog reads to `useQuery(['catalog'])` and invalidates after catalog/image/member writes.
- Moved authenticated ownership reads/writes to `useQuery(['ownership', userId])` plus optimistic mutations.
- Kept anonymous ownership as the only persisted product local fallback; login migration writes merged state to Supabase before clearing anonymous local ownership.
- Moved selected oshi to `useQuery(['oshi', userId])` plus mutation invalidation.
- Moved collection view preferences to `useQuery(['preference', userId, key])` plus mutation invalidation.
- Admin image upload now uses direct admin image registration for any logged-in admin, independent of collection edit mode.

Verification:

```text
bun test src/hooks/useCatalog.test.ts src/hooks/useOwnership.test.ts src/lib/submissions.test.ts: pass
bun run type-check: pass
bun run lint: pass with existing Panda warnings in src/pages/+Layout.tsx
bun run build: pass
```

Browser evidence captured through `agent-browser`:

- `dogfood-output/react-query-persistence-2026-06-16/screenshots/initial-home.png`
- `dogfood-output/react-query-persistence-2026-06-16/screenshots/app-client-inline-login.png`
- `dogfood-output/react-query-persistence-2026-06-16/screenshots/app-client-halloween-collection.png`
- `dogfood-output/react-query-persistence-2026-06-16/videos/app-client-ownership-persistence.webm`
- `dogfood-output/react-query-persistence-2026-06-16/videos/final-user-oshi-live-db-404.webm`

Real browser findings:

- `test_user@ham-san.net` can be signed in through the app Supabase client and renders as `@Test_User`.
- Authenticated catalog and ownership reads hit Supabase.
- Current deployed Supabase still returns `404 PGRST205` for `public.oshi`.
- Current deployed Supabase still needs `supabase/live-persistence-hotfix-2026-06-16.sql` applied before selected oshi and user preference persistence can pass.
- Browser reload/cross-session proof remains blocked by the live DB/session test state and must be rerun after the SQL hotfix is applied.

## 2026-06-16 aspect slot repair evidence

Implemented:

- `BromideSpec.aspect` now propagates to runtime `Bromide.aspect`.
- Slot display uses each bromide's own aspect ratio instead of hard-coded portrait layout.
- Legacy slots without an aspect still default to `3/4`.
- Admin collection table includes a `比率` column.
- Admin generated collections accept a custom aspect value such as `3/4`, `4/3`, `1`, `16/9`, or a positive number.
- Admin free-list items accept per-item aspect values.
- Upload target cards and submission review cards respect the target slot aspect.
- Crop mode defaults from target aspect: portrait, landscape, square, or free for custom ratios.

Verification:

```text
bun test src/utils/aspect.test.ts src/data/catalog.test.ts src/hooks/useCatalog.test.ts src/components/photo/cropModes.test.ts: pass
bun run type-check: pass
bun run lint: pass with existing Panda warnings in src/pages/+Layout.tsx
bun run build: pass
```

Browser evidence captured through `agent-browser`:

- `dogfood-output/aspect-slots-2026-06-16/screenshots/admin-aspect-table.png`
- `dogfood-output/aspect-slots-2026-06-16/screenshots/admin-aspect-create-modal.png`
- `dogfood-output/aspect-slots-2026-06-16/screenshots/admin-landscape-created.png`
- `dogfood-output/aspect-slots-2026-06-16/screenshots/landscape-detail-rendered-fixed.png`
- `dogfood-output/aspect-slots-2026-06-16/screenshots/landscape-upload-setup.png`

Measured browser results:

```text
admin-created landscape slot aspect: 1.3333333333333333
landscape detail tile: 582x437, ratio 1.33
landscape upload target: 117x88, ratio 1.33
```

## 2026-06-16 target-first upload flow evidence

Implemented:

- Upload setup is now target-first instead of file-first.
- The modal opens directly to clickable target boxes; each target owns a real file input overlay.
- Clicking or uploading into a target box queues exactly that bromide slot.
- Bulk upload remains secondary through `複数枚を一括`.
- User mode exposes only missing-image targets.
- Admin mode exposes existing-image targets too, so admins can replace images directly.
- The crop step still includes document trim, aspect controls, zoom, skip, and confirm.

Verification:

```text
bun test src/components/photo/uploadTargets.test.ts src/components/photo/cropModes.test.ts src/utils/aspect.test.ts: pass
bun run type-check: pass
```

Browser evidence captured through `agent-browser`:

- `dogfood-output/upload-flow-2026-06-16/screenshots/modal-target-first.png`
- `dogfood-output/upload-flow-2026-06-16/screenshots/crop-step-after-target-upload.png`
- `dogfood-output/upload-flow-2026-06-16/videos/modal-target-click-to-crop.webm`

Real browser findings:

- Admin E2E profile opens the collection and upload modal at `http://127.0.0.1:3001/collections?c=floral&e2e_user=admin`.
- The upload modal exposes per-slot file controls in the browser tree.
- Uploading a real image file by absolute path into `菅原もも L 1の画像を選ぶ` transitions to the crop step.
- Crop step renders `書類トリム`, portrait/landscape/square/free crop controls, zoom, skip, and confirm.
- Confirm returned to the grid, but the E2E visible grid still showed the first slot missing. This specific local E2E admin persistence path is not proven yet and must be debugged before claiming the full upload feature complete.
