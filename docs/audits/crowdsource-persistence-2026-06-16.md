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
