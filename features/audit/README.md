# Audit Feature Guide

## A. Purpose
Display an audit feed of important actions (draft creation, submissions, updates, approvals, etc.) for transparency and accountability.

## B. UI Surfaces
Routes:
- `app/(lgu)/barangay/(authenticated)/audit/page.tsx`
- `app/(lgu)/city/(authenticated)/audit/page.tsx`

View:
- `features/audit/views/AuditView.tsx`

Queries:
- `lib/repos/audit/queries.ts`

Repo:
- `lib/repos/audit/repo.ts`
- `lib/repos/audit/repo.server.ts`
- `lib/repos/audit/repo.mock.ts`
- `lib/repos/audit/repo.supabase.ts` (stub)

## C. Data Flow (diagram in text)
`app/(lgu)/.../audit/page.tsx`
→ `getAuditFeed()` (`lib/repos/audit/queries.ts`)
→ `getAuditRepo()` (`lib/repos/audit/repo.server.ts`)
→ adapter:
  - today: `createMockAuditRepo()` (`lib/repos/audit/repo.mock.ts`) → `mocks/fixtures/audit/activity-log.fixture.ts`
  - future: Supabase adapter → `public.activity_log`
→ `features/audit/views/AuditView.tsx`

## D. databasev2 Alignment
Relevant DBV2 table/policies:
- `public.activity_log`

Key constraints & visibility rules:
- Writes are server-only (DBV2 requires “service role” writes; no insert/update/delete policies for `authenticated`).
- Reads:
  - admin can read all rows
  - officials can read only their own rows (`actor_id = auth.uid()`)
  - citizens cannot read
  - anon cannot read

How those rules should be enforced:
- UI should never attempt direct client-side writes to `activity_log`.
- A server-side event logger (future) should be the only writer.
- Repository reads should use RLS for enforcement; the service layer can still apply additional UX-friendly filtering.

## E. Current Implementation (Mock)
- Mock data lives in `mocks/fixtures/audit/activity-log.fixture.ts`.
- Server repo entrypoint returns mock repo in `dev` and selects Supabase stub for non-dev (`lib/repos/audit/repo.server.ts`).
- `getAuditFeedForActor()` intentionally includes a dev-only fallback to keep the page usable when mock actor ids do not match.

## F. Supabase Swap Plan (Future-only)
1) Add a Supabase adapter:
- Implement `lib/repos/audit/repo.supabase.ts` implementing `AuditRepo`.
2) Update selector:
- Update `lib/repos/audit/repo.server.ts` to return the Supabase adapter for non-dev environments.
3) Query mapping:
- `listMyActivity(actorId)` → select from `public.activity_log` filtered by `actor_id = actorId` (RLS should already enforce; keep explicit filter for clarity).
- `listAllActivity()` → select all rows (admin-only via RLS).

Server-only writes:
- Create a server-only logger (e.g., `lib/server/activity-log.ts`) that uses service role to insert into `public.activity_log`.
- Do not allow UI routes/components to insert directly.

## G. Testing Checklist
Manual:
- As admin: audit page shows all entries.
- As official: audit page shows only “my activity” (and in dev fallback, scope-only rows may appear).
- As citizen: audit page should be empty / inaccessible per your UI policy.

Automated:
- Unit-test `AuditRepo` adapters to ensure ordering is newest-first and RLS errors are handled gracefully.

## H. Gotchas / Pitfalls
- Do not log sensitive content into `metadata` that should not be exposed to officials.
- Do not build features that depend on `activity_log` writes from the client; DBV2 explicitly forbids it.
