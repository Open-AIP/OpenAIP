# Submissions Feature Guide

## A. Purpose
Support the LGU “review submissions” workflow for barangay AIPs:
- city official (or admin) sees a feed of submitted AIPs in their jurisdiction,
- can move AIPs into `under_review`,
- can request revision (→ `for_revision`) or publish (→ `published`),
- records reviewer decisions/notes.

## B. UI Surfaces
Routes:
- `app/(lgu)/city/(authenticated)/submissions/page.tsx` (feed)
- `app/(lgu)/city/(authenticated)/submissions/aip/[aipId]/page.tsx` (detail + review actions)
- `app/(lgu)/city/(authenticated)/submissions/aip/page.tsx` (currently an empty placeholder file)

Feature components/services:
- `features/submissions/views/SubmissionsView.tsx`
- `features/submissions/views/city-submission-review-detail.tsx`
- `features/submissions/services/submissionsService.ts`
- Server actions: `features/submissions/actions/submissionsReview.actions.ts`

Repo contract + adapters:
- `features/submissions/data/submissionsReview.repo.ts`
- `features/submissions/data/submissionsReview.repo.mock.ts`
- `features/submissions/data/submissionsReview.repo.supabase.ts` (stub)
- `features/submissions/data/submissionsReview.repo.selector.ts`

## C. Data Flow (diagram in text)
Feed page
→ `getCitySubmissionsFeed()` (`features/submissions/services/submissionsService.ts`)
→ `getAipSubmissionsReviewRepo()` (`features/submissions/data/submissionsReview.repo.selector.ts`)
→ adapter:
  - today: `createMockAipSubmissionsReviewRepo()` (`features/submissions/data/submissionsReview.repo.mock.ts`)
  - future: Supabase adapter (`features/submissions/data/submissionsReview.repo.supabase.ts`)
→ `SubmissionsView` (`features/submissions/views/SubmissionsView.tsx`)

Detail/review page
→ (server component) `getAipSubmissionsReviewRepo()` and `startReviewIfNeeded()` (`app/(lgu)/city/(authenticated)/submissions/aip/[aipId]/page.tsx`)
→ `CitySubmissionReviewDetail` (`features/submissions/views/city-submission-review-detail.tsx`)
→ server actions:
  - `publishAipAction()` / `requestRevisionAction()` (`features/submissions/actions/submissionsReview.actions.ts`)
→ repo methods:
  - `publishAip()` / `requestRevision()` (`features/submissions/data/submissionsReview.repo.ts`)

## D. databasev2 Alignment
Relevant DBV2 tables/enums/helpers:
- `public.aips` + enum `public.aip_status`
- `public.aip_reviews` + enum `public.review_action` (`approve`, `request_revision`)
- RLS update rules: reviewers can update barangay AIPs under jurisdiction (`aips_update_policy`)
- Reviewer insert rules: `aip_reviews_insert_policy` requires:
  - AIP non-draft
  - reviewer is admin or city/municipal official within jurisdiction

Key constraints & visibility rules:
- Submissions feed should exclude `draft` AIPs (public transparency is non-draft; reviewers act only on non-draft).
- Jurisdiction checks matter:
  - city officials can review barangay AIPs within their city (see DBV2 helper `barangay_in_my_city`)
  - municipal officials similarly for municipality

How those rules should be enforced:
- Service/usecase should validate lifecycle actions:
  - `pending_review` → `under_review` via `startReviewIfNeeded`
  - `under_review` → `for_revision` (and insert `aip_reviews` row with `request_revision`)
  - `under_review` → `published` (and insert `aip_reviews` row with `approve`)
- Repo adapter should rely on RLS, but also include explicit filters by status/scope for predictable UX.

## E. Current Implementation (Mock)
- AIP source is `features/aip/mock/aips.table.ts` (shared mock table).
- Reviewer decisions are stored in-memory in `features/submissions/data/submissionsReview.repo.mock.ts` (`reviewStore`).
- Actor enforcement exists in mock (`requireCityReviewer()` + `assertInJurisdiction()`), but is relaxed in dev when actor is null.

## F. Supabase Swap Plan (Future-only)
Implement `features/submissions/data/submissionsReview.repo.supabase.ts` (do not change UI):
1) Replace the `NotImplementedError` with a real adapter implementing `AipSubmissionsReviewRepo`.
2) Query mapping:
- `listSubmissionsForCity({ cityId, filters })`
  - select from `public.aips` where:
    - `status <> 'draft'`
    - scope is barangay and barangay is within the city jurisdiction (join `barangays` to `cities` or use helper patterns)
  - optionally join the latest `public.aip_reviews` row per AIP to show reviewer name
- `startReviewIfNeeded({ aipId })`
  - update `public.aips.status` from `pending_review` → `under_review`
- `requestRevision({ aipId, note, actor })`
  - insert into `public.aip_reviews` with `action='request_revision'`, `note`, `reviewer_id=actor.userId`
  - update `public.aips.status` → `for_revision`
- `publishAip({ aipId, note, actor })`
  - insert into `public.aip_reviews` with `action='approve'`
  - update `public.aips.status` → `published`

RLS vs server routes:
- These operations can be done via Supabase (server-side) relying on RLS for reviewer gating.
- If you need stronger transition rules, keep the checks in the server action layer (`submissionsReview.actions.ts`) before issuing writes.

## G. Testing Checklist
Manual:
- Open `/city/submissions` and confirm counts by status.
- Click a submission row to open `/city/submissions/aip/[aipId]`.
- Enter review mode (query param `mode=review`); verify `pending_review` becomes `under_review`.
- Request revision (requires note) and verify status becomes `for_revision`.
- Publish and verify status becomes `published` and success UI renders.

Automated:
- Existing tests:
  - `features/submissions/services/__tests__/submissionsService.test.ts`
  - `features/submissions/services/__tests__/submissionsReviewRepo.mock.test.ts`
- Add Supabase adapter tests once implemented (jurisdiction + status transitions).

## H. Gotchas / Pitfalls
- Do not allow reviewers to act on `draft` AIPs (DBV2 reviewer policies require non-draft).
- Avoid “cross-draft visibility”: city/municipal officials must not see drafts they do not own.
- Keep the review log append-only: in DBV2, `aip_reviews` is insert-only for non-admin; updates/deletes are admin-only.
