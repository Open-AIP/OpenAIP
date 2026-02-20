# Submissions Feature Guide

## A. Purpose
Support the LGU review workflow for barangay AIPs:
- city official (or admin) sees submitted AIPs in scope,
- reviewer can explicitly claim ownership (`claim_review`),
- reviewer can request revision (`for_revision`) or publish (`published`),
- review events are append-only in `public.aip_reviews`.

## B. UI Surfaces
Routes:
- `app/(lgu)/city/(authenticated)/submissions/page.tsx` (feed)
- `app/(lgu)/city/(authenticated)/submissions/aip/[aipId]/page.tsx` (detail + review actions)

Feature components/services:
- `features/submissions/views/SubmissionsView.tsx`
- `features/submissions/components/SubmissionTable.tsx`
- `features/submissions/views/city-submission-review-detail.tsx`
- `features/submissions/actions/submissionsReview.actions.ts`

Repo contract + adapters:
- `lib/repos/submissions/repo.ts`
- `lib/repos/submissions/repo.server.ts`
- `lib/repos/submissions/repo.mock.ts`
- `lib/repos/submissions/repo.supabase.ts`
- `lib/repos/submissions/queries.ts`

## C. Data Flow
Feed page:
- `getCitySubmissionsFeed()` -> `getAipSubmissionsReviewRepo()` -> adapter -> `SubmissionsView`

Detail page:
- server component loads detail only (no auto-claim side effect)
- user chooses `Just View` or `Review & Claim`
- claim path calls `claimReviewAction()` -> repo `claimReview()`
- decision path calls `publishAipAction()` / `requestRevisionAction()`

## D. databasev2 Alignment
Relevant tables/enums:
- `public.aips` (`public.aip_status`)
- `public.aip_reviews` (`public.review_action`: `claim_review`, `approve`, `request_revision`)

Lifecycle:
- `pending_review` + claim -> `under_review` + append `claim_review`
- `under_review` + request revision (owner only) -> append `request_revision` + set `for_revision`
- `under_review` + publish (owner only) -> append `approve` + set `published`

Ownership rules:
- Active assignment is inferred from the latest `aip_reviews` row when it is `claim_review`.
- If latest action is not `claim_review`, assignment is considered cleared.
- City officials cannot override another active claim.
- Admin can claim to take over, then perform review actions.

## E. UX Rules
- `/city/submissions`:
  - `pending_review` action opens detail with `?intent=review` (claim modal)
  - `under_review` action opens detail with `?mode=review`
- Claim modal options:
  - `Just View`: no status change, no owner assignment
  - `Review & Claim`: assigns owner and enables review actions
- Non-owner users in review mode see disabled action controls and owner notice.
- When unclaimed (or admin takeover path), detail shows a claim button.

## F. Testing Checklist
Manual:
- Open `/city/submissions` and verify reviewer changes after claim + refresh.
- From a pending AIP, click `Review`:
  - `Just View` keeps status pending and actions disabled.
  - `Review & Claim` changes to under review and enables actions for owner.
- Confirm non-owner cannot publish/request revision.
- Confirm admin can take over by claiming first.

Automated:
- `tests/repo-smoke/submissions/submissions.queries.test.ts`
- `tests/repo-smoke/submissions/submissions.repo.mock.test.ts`
