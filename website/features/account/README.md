# Account Feature Guide

## A. Purpose
Provide an authenticated LGU user with:
- a read-only view of their account/profile fields, and
- a password update/reset form.

This feature is intentionally UI-focused today; it does not own a repository/service layer yet.

## B. UI Surfaces
- Route: `app/(lgu)/barangay/(authenticated)/account/page.tsx`
- View: `features/account/account-view.tsx`
- Form: `features/account/update-password-form.tsx`

## C. Data Flow (diagram in text)
`app/(lgu)/.../account/page.tsx`
→ `getUser()` (auth action; existing auth flow)
→ `features/account/account-view.tsx`
→ `features/account/update-password-form.tsx`
→ (client) `supabase.auth.updateUser({ password })`

## D. databasev2 Alignment
Relevant DBV2 objects:
- `public.profiles` + `public.role_type` (role/scope binding)

Key constraints & visibility rules this feature must respect:
- Roles are strictly one of: `citizen`, `barangay_official`, `city_official`, `municipal_official`, `admin`.
- Scope binding is enforced by DB constraint `chk_profiles_scope_binding` (admins unbound; officials bound to exactly one geo scope; citizens bound to barangay).

How those rules should be enforced (repo/service boundaries):
- Profile reads should ultimately come from a `ProfilesRepo` (future) that reads `public.profiles` for the current user (`profiles_select_self_or_admin` policy).
- Password updates are auth-layer concerns (Supabase Auth), not `databasev2` tables.

## E. Current Implementation (Mock)
- Profile fields displayed in `AccountView` currently come from `getUser()` in `app/(lgu)/barangay/(authenticated)/account/page.tsx`.
- There is no feature-local mock table or repository for profiles in `features/account/`.

## F. Supabase Swap Plan (Future-only)
Checklist (keep UI unchanged):
1) Create `features/account/data/profiles.repo.ts` (interface) for `getMyProfile()` and `updateMyProfile()` (if needed).
2) Add `features/account/data/profiles.repo.supabase.ts` adapter that queries `public.profiles` by `auth.uid()` (RLS-enforced).
3) Add `features/account/data/profiles.repo.mock.ts` if you want local dev without Supabase.
4) Update `app/(lgu)/.../account/page.tsx` to use the new repo/service instead of directly mapping `getUser()` fields (do not change auth flows).

Method → table mapping:
- `getMyProfile()` → `public.profiles` (select by `id = auth.uid()`)

RLS vs server routes:
- `public.profiles` reads should rely on RLS.
- Password updates should continue using the auth client (not a DB table).

## G. Testing Checklist
Manual:
- Visit `/(lgu)/barangay/account` while authenticated.
- Confirm read-only fields render and the password form submits.
- Confirm redirect logic after password update still routes to the correct dashboard for your current role routing scheme.

Automated:
- (None currently in this feature.) Add component tests only if/when account gains domain logic.

## H. Gotchas / Pitfalls
- Draft/visibility rules in DBV2 do not apply here; this feature is about identity/profile + auth.
- Role naming: DBV2 roles are `*_official` variants; UI routing may use different strings. Keep a single mapping layer (auth/domain) rather than leaking UI route roles into DB logic.

