# Submissions Feature Guide

## A. Purpose
Support city-level review workflow for barangay AIPs:
- list submitted AIPs,
- claim review ownership,
- request revision or approve/publish,
- preserve append-only review history.

## B. UI Surfaces
Routes:
- `app/(lgu)/city/(authenticated)/submissions/page.tsx`
- `app/(lgu)/city/(authenticated)/submissions/aip/[aipId]/page.tsx`
- `app/(lgu)/city/(authenticated)/submissions/aip/[aipId]/[projectId]/page.tsx`

Feature files:
- `features/submissions/views/SubmissionsView.tsx`
- `features/submissions/views/city-submission-review-detail.tsx`
- `features/submissions/components/SubmissionTable.tsx`
- `features/submissions/actions/submissionsReview.actions.ts`

Repo files:
- `lib/repos/submissions/repo.server.ts`
- `lib/repos/submissions/repo.mock.ts`
- `lib/repos/submissions/repo.supabase.ts`

## C. Data Flow
Page/server action
-> `getAipSubmissionsReviewRepo()`
-> repo selector
-> adapter:
  - mock mode: `repo.mock.ts`
  - supabase mode: `repo.supabase.ts`

Claim flow:
- `claimReviewAction()` calls repo `claimReview()`
- Supabase implementation uses RPC `public.claim_aip_review(p_aip_id uuid)`

Decision flow:
- `requestRevisionAction()` writes `request_revision` and sets `for_revision`
- `publishAipAction()` writes `approve` and sets `published`

## D. databasev2 Alignment
Primary tables/enums:
- `public.aips` with `public.aip_status`
- `public.aip_reviews` with `public.review_action`

Lifecycle:
- `pending_review` + claim -> `under_review`
- `under_review` + request revision -> `for_revision`
- `under_review` + approve -> `published`

Ownership model:
- latest `claim_review` entry determines active reviewer,
- non-claim latest action clears active assignment,
- admins can take over by claiming again.

## E. UX Rules
- Pending rows prompt claim modal with `Just View` and `Review & Claim`.
- Review actions are disabled for non-owner reviewers.
- Detail pages preserve breadcrumb and pagination context.
- Project detail pages are read-only from submissions flow.

## F. Testing Checklist
Manual:
- Claim a pending submission and verify owner/status refresh.
- Verify `Just View` does not mutate status.
- Verify non-owner cannot publish/request revision.
- Verify admin takeover requires claim first.

Automated:
- `tests/repo-smoke/submissions/submissions.queries.test.ts`
- `tests/repo-smoke/submissions/submissions.repo.mock.test.ts`

## G. Pitfalls
- Keep claim ownership checks aligned with latest-review semantics.
- Do not allow direct publish/request revision without active claim ownership.
