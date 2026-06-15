# Crowdsource Image Feature Audit

## Intended Feature

- Users browse bromide collections and can contribute missing images.
- Supabase is optional for collection tracking. Image upload requires Supabase login.
- Logged-in user image contributions should go through `submissions` and wait for admin approval.
- Approved images live in `bromide_images` and are public catalog data.
- Admins can manage collections and approve/reject image submissions.
- Mixed collections need practical per-card management because members and card counts differ.

## Current Breaks

1. `CollectionDetail` uploads directly to `catalogActions.setBromideImage`.
   - This bypasses `submissions`.
   - Non-admin users hit Supabase RLS on `bromide_images`.
   - Anonymous/no-Supabase users can start an upload even though image upload is not a local feature.

2. `SubmissionReview` exists, but normal uploads never feed it.
   - It only sees manually created local submissions or remote rows from code paths that do not currently exist.

3. Admin direct image management and crowdsource submission share the same tile action.
   - The UI does not make clear whether an image is being submitted for review or registered as canonical.
   - Existing images cannot be replaced from the tile because the image action is hidden once an image exists.

4. `PhotoAddDialog` has a better batch/crop/targeting workflow, but it was dead code.
   - It is not mounted from the collection page.
   - It still writes directly to approved images, so wiring it back without changes would preserve the permission bug.

5. Mixed collection item management is split between `/admin` and inline collection editing.
   - The admin form can create mixed items, but the collection page mutates the collection immediately per action.
   - There is no full-list review state and no clear relationship between card edits and image management.

6. Permission logic is inconsistent.
   - UI admin checks use `PUBLIC_ENV__ADMIN_HANDLES`.
   - Database admin checks use `profiles.is_admin`.
   - If those drift, the UI can show admin controls that the database rejects.

7. Homepage is noisy for the current product state.
   - It prioritizes oshi widgets and progress cards but does not surface missing images or the contribution workflow.
   - There is no obvious route into image contribution.

## Repair Contract

- Add a first-class submission action:
  - logged-in users upload to storage and insert a `pending` submission;
  - admins can directly set approved images;
  - anonymous/no-Supabase users cannot upload images.
- Make tile image actions explicit:
  - missing image, submit image;
  - admin edit mode, register/replace image.
- Feed `SubmissionReview` from the same submission path.
- Keep mixed item CRUD in one predictable surface for now:
  - inline mixed editing remains admin-only;
  - actions stay immediate but are labeled and gated clearly.
- Update homepage to surface missing-image contribution as a compact operational section, not another decorative dashboard block.
- Keep Supabase docs honest about the two admin gates and the required storage/table permissions.

## Verification Baseline

- `bun run type-check && bun run build` passes before changes.
- Current build has one large chunk warning from Vite.

## Changes Made

- Image upload is auth-only.
- User image uploads create pending submissions.
- Admin image registration waits for canonical image writes to succeed.
- The crop/document scanner dialog is restored and used as the upload surface.
- Mixed collection grids have user-selectable display size and default to larger cards.
- Homepage now surfaces collections with missing images under `画像募集中`.
