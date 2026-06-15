# Crowdsource Image Feature Audit

## Intended Feature

- Admins define image slots for a collection.
- Users mark owned images and can submit missing images.
- Admins can register, replace, and remove canonical images.
- User uploads go to pending submissions; admin uploads write canonical images directly.
- An image slot is one entity. Pattern-generated slots and arbitrary tagged slots share the same `Bromide` shape.
- There is no offline image product mode.
- Canonical image writes require admin permission in application code, in addition to Supabase policy enforcement.

## Current Implementation

- Collections still keep the legacy `kind` values internally for migration compatibility, but the UI exposes them as slot-definition patterns:
  - `メンバー × 番号`
  - `番号のみ`
  - `自由リスト`
- `Bromide` and `BromideSpec` support optional `type`.
- Existing untyped IDs are unchanged, for example `mixed-2024:momo:1`.
- Typed arbitrary slots use distinct IDs only when a type is present, for example `mixed-2024:momo:rare:1`.
- `slotLabel` is used by collection cards, upload target labels, trade selection, and trade text so typed slots render as the same image entity.
- `/admin?collection=<id>` opens the collection edit modal from the collection page.
- Collection detail admin mode exposes:
  - collection edit deep link;
  - image management mode;
  - upload/replace;
  - image removal;
  - arbitrary typed card add/remove for free-list collections.
- Upload remains crop/document-scanner based.
- E2E test users are isolated from remote catalog writes and use seed/local data.
- `catalogActions.setBromideImage` refuses canonical image writes unless the current E2E or Supabase profile is admin.

## Resolved Issues

1. User uploads bypassed submissions.
   - Fixed: non-admin uploads call `createImageSubmission` and `saveImageSubmission`.

2. Admin could not remove canonical images.
   - Fixed: admin image management exposes `画像を削除`, which calls `catalogActions.setBromideImage(id, null)`.

3. Upload cropper could accept a file but fail at save.
   - Fixed: crop previews use data URLs and image file detection accepts MIME type or image extension.

4. Collection edit was only practical from admin and mixed concepts were exposed directly.
   - Fixed: collection pages link to the edit modal, and admin UI uses slot-definition language instead of raw internal kinds.

5. Arbitrary typed images could not coexist with the same member/number.
   - Fixed: optional `type` is part of the same image entity and participates in IDs only when present.

6. Browser E2E was not isolated from remote catalog state.
   - Fixed: E2E profiles use seed/local catalog data and skip remote collection/member writes.

7. Canonical image writes depended on caller/UI discipline.
   - Fixed: `setBromideImage` checks current profile admin status before writing or deleting canonical images.

8. Supabase profile policy allowed own-profile updates on a row containing `is_admin`.
   - Fixed: `0003_profile_admin_guard.sql` blocks authenticated non-admin users from changing `profiles.is_admin`, while still allowing SQL editor/service-role admin setup.

## Verification

Commands:

- `bun test src/data/catalog.test.ts src/lib/submissions.test.ts supabase/migrations.test.ts`
- `bun run type-check`
- `bun run build`
- `bun run verify:supabase-public`

Configured Supabase anon-policy check:

- Project host: `defapgrwvxkhuyavytld.supabase.co`
- Public members read: pass
- Public collections read: pass
- Public approved images read: pass
- Anonymous submission insert blocked: pass
- Anonymous storage upload blocked: pass
- Authenticated non-admin `profiles.is_admin` update: not run; requires `SUPABASE_TEST_EMAIL` and `SUPABASE_TEST_PASSWORD` for a disposable non-admin user.

Browser evidence:

- `dogfood-output/current/crowdsource-final-evidence.webm`
- `dogfood-output/type-slots/type-slot-admin-flow.webm`
- `dogfood-output/current/20-isolated-admin-edit-modal.png`
- `dogfood-output/current/23-isolated-admin-uploaded-tile.png`
- `dogfood-output/current/24-isolated-admin-image-delete.png`
- `dogfood-output/current/27-user-submission-saved.png`
- `dogfood-output/type-slots/21-type-slot-rendered.png`
- `dogfood-output/type-slots/23-type-upload-crop.png`
- `dogfood-output/type-slots/24-type-upload-saved.png`
- `dogfood-output/type-slots/25-type-uploaded-tile.png`
- `dogfood-output/type-slots/26-type-image-deleted.png`
- `dogfood-output/final-permissions/report.md`
- `dogfood-output/final-permissions/videos/user-submission-flow.webm`
- `dogfood-output/final-permissions/videos/admin-management-flow.webm`
- `dogfood-output/final-permissions/videos/admin-delete-proof-clean.webm`
- `dogfood-output/final-permissions/screenshots/02-user-mixed-collection.png`
- `dogfood-output/final-permissions/screenshots/06-user-submission-summary.png`
- `dogfood-output/final-permissions/screenshots/08-admin-edit-modal-from-collection.png`
- `dogfood-output/final-permissions/screenshots/10-admin-tagged-slot-rendered.png`
- `dogfood-output/final-permissions/screenshots/15-admin-uploaded-tile.png`
- `dogfood-output/final-permissions/screenshots/19-delete-proof-after-delete.png`

## Remaining Risk

- Deployed Supabase projects must apply `supabase/migrations/0003_profile_admin_guard.sql`. The repository schema now contains the guard, but the deployed authenticated non-admin boundary still needs verification with a disposable non-admin account or DB/admin access.
