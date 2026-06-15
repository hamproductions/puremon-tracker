# Crowdsource Image Feature Audit

## Intended Feature

- Admins define image slots for a collection.
- Users mark owned images and can submit missing images.
- Admins can register, replace, and remove canonical images.
- User uploads go to pending submissions; admin uploads write canonical images directly.
- An image slot is one entity. Pattern-generated slots and arbitrary tagged slots share the same `Bromide` shape.
- There is no offline image product mode.

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

## Verification

Commands:

- `bun test src/data/catalog.test.ts src/lib/submissions.test.ts`
- `bun run type-check`
- `bun run build`

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

## Remaining Risk

- Remote Supabase policy correctness still depends on deployed table/storage policies, not only frontend code. The frontend now routes admin/user image writes through the intended paths, but production policy drift must be verified against the deployed Supabase project before changing policies.
