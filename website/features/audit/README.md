# Audit Feature Guide

## A. Purpose
Display audit activity for transparency and accountability across LGU workflows.

## B. UI Surfaces
Routes:
- `app/(lgu)/barangay/(authenticated)/audit/page.tsx`
- `app/(lgu)/city/(authenticated)/audit/page.tsx`

Feature files:
- `features/audit/views/AuditView.tsx`
- `lib/repos/audit/queries.ts`
- `lib/repos/audit/repo.server.ts`

## C. Data Flow
Audit page
-> `getAuditFeed()` from `lib/repos/audit/queries.ts`
-> `getAuditRepo()` from `lib/repos/audit/repo.server.ts`
-> repo selector
-> adapter:
  - mock: `lib/repos/audit/repo.mock.ts`
  - supabase: `lib/repos/audit/repo.supabase.ts`

## D. databasev2 Alignment
Canonical table:
- `public.activity_log`

Rules to preserve:
- Writes are server-only/service-role.
- Read visibility is RLS-gated:
  - admin: all rows
  - barangay officials: barangay-official rows from their barangay
  - city officials: city-official rows from their city
  - municipal officials: own rows
  - citizen/anon: no read access

## E. Current Implementation Status
- Mock adapter is active in dev mode.
- Supabase adapter is intentionally deferred and currently throws `NotImplementedError`.
- `getAuditFeedForActor()` includes a dev fallback when fixture actor IDs do not match logged-in user IDs.

## F. Testing Checklist
Manual:
- As admin, verify broad activity visibility.
- As official, verify scoped/self activity behavior.
- In dev mode, verify fallback rendering remains usable.

Automated:
- Add adapter tests when Supabase audit adapter is implemented.

## G. Pitfalls
- Never write `activity_log` directly from client code.
- Avoid logging sensitive data in `metadata`.
