# AIP Feature Guide

## A. Purpose
Manage Annual Investment Plans (AIPs):
- list AIPs for a given LGU scope (barangay/city),
- view an AIP detail page (PDF + extracted rows + remarks),
- (future) upload/replace the AIP PDF and drive review/publish lifecycle.

## B. UI Surfaces
Routes:
- `app/(lgu)/barangay/(authenticated)/aips/page.tsx`
- `app/(lgu)/barangay/(authenticated)/aips/[aipId]/page.tsx`
- `app/(lgu)/city/(authenticated)/aips/page.tsx`
- `app/(lgu)/city/(authenticated)/aips/[aipId]/page.tsx`

Views/components (selected):
- `features/aip/views/aip-management-view.tsx` (list UI)
- `features/aip/views/aip-detail-view.tsx` (detail UI; embeds feedback tab)
- `features/aip/components/aip-pdf-container.tsx`
- `features/aip/views/aip-details-table.tsx` (extracted rows table)
- `features/aip/dialogs/upload-aip-dialog.tsx` (upload UI surface)

Cross-feature composition:
- `features/aip/views/aip-detail-view.tsx` embeds `CommentThreadsSplitView` from `features/feedback`.

## C. Data Flow (diagram in text)
Server components (pages)
→ `getAipRepo()` (`lib/repos/aip/repo.server.ts`)
→ `AipRepo` contract (`lib/repos/aip/repo.ts`)
→ adapter:
  - today: `createMockAipRepoImpl()` (`lib/repos/aip/repo.mock.ts`) → `mocks/fixtures/aip/aips.table.fixture.ts`
  - future: `createSupabaseAipRepo()` (`lib/repos/aip/repo.supabase.ts`) → `public.aips` (+ joins for scope names)

AIP extracted rows table
→ `getAipProjectRepo()` (`lib/repos/aip/repo.server.ts`)
→ `AipProjectRepo` contract (`lib/repos/aip/repo.ts`)
→ adapter:
  - today: `createMockAipProjectRepo()` (`lib/repos/aip/repo.mock.ts`) → `mocks/fixtures/aip/aip-project-rows.table.fixture.ts`
  - future: Supabase adapter → `public.projects` (+ `health_project_details` / `infrastructure_project_details`)

## D. databasev2 Alignment
Relevant DBV2 tables/enums/helpers:
- `public.aips` + enum `public.aip_status` (`draft`, `pending_review`, `under_review`, `for_revision`, `published`)
- Visibility: `aips_select_policy` + helper `public.can_read_aip(aip_id)`
- Review: `public.aip_reviews` (approve / request_revision)
- Upload metadata: `public.uploaded_files` + helper `public.can_upload_aip_pdf(aip_id)`
- Extraction pipeline: `public.extraction_runs`, `public.extraction_artifacts` (public can see summarize/categorize for non-draft)
- Projects under an AIP: `public.projects` (+ `public.project_category`, `public.can_edit_aip(aip_id)`)

Key constraints & visibility rules:
- AIP scope is exactly one of barangay/city/municipality (`chk_aips_exactly_one_scope`).
- Draft visibility:
  - public can read only non-draft AIPs
  - draft rows are readable only by the owning official for that scope (or admin)
- Reviewers (city/municipal) may update barangay AIPs under their jurisdiction (`aips_update_policy`).
- Uploads:
  - only admin or owning official may upload/replace PDFs while status is `draft` or `for_revision` (`can_upload_aip_pdf`).

How these rules should be enforced:
- Repository layer should apply DBV2 filters explicitly for UX (even if RLS also enforces), especially around draft vs non-draft listing.
- Service/usecase layer should validate lifecycle transitions (DBV2 explicitly notes state-machine tightening can be added later).

## E. Current Implementation (Mock)
- AIP list/detail data: `mocks/fixtures/aip/aips.table.fixture.ts` (in-memory table)
- AIP rows data: `mocks/fixtures/aip/aip-project-rows.table.fixture.ts` + generator `lib/repos/aip/mock-aip-generator.ts`
- Server repo entrypoint: `lib/repos/aip/repo.server.ts` (dev uses mock; non-dev selects Supabase stub)

## F. Supabase Swap Plan (Future-only)
Goal: keep all pages/components unchanged; only swap repo adapters.

1) Add Supabase adapter files:
- `lib/repos/aip/repo.supabase.ts` implementing `AipRepo` + `AipProjectRepo`

2) Update selectors:
- `lib/repos/aip/repo.server.ts` to return Supabase adapter in non-dev

3) Method → table/query mapping (minimum viable):
- `AipRepo.listVisibleAips({ visibility: "public" })`
  - select from `public.aips` where `status <> 'draft'` (RLS already allows)
- `AipRepo.listVisibleAips({ visibility: "my", scope })`
  - select from `public.aips` constrained to the actor’s scope id (and include drafts)
- `AipRepo.getAipDetail(aipId)`
  - select from `public.aips` by id (RLS-gated), plus any scope-name joins used by the UI
- `AipRepo.updateAipStatus(aipId, next)`
  - update `public.aips.status` (and let DB triggers populate timestamps)

- `AipProjectRepo.listByAip(aipId)`
  - select from `public.projects` where `aip_id = $1`
  - join detail tables by `project_id` (`health_project_details` / `infrastructure_project_details`) if the UI needs them

- `AipProjectRepo.submitReview(...)`
  - map to inserting rows in `public.feedback` (recommended) rather than inventing a new review table:
    - reviewers can only write AIP-target feedback (not project-target) and only `kind='lgu_note'`
    - use `field_key` to reference the row/ref-code being discussed

RLS vs server routes:
- AIP reads/writes should rely on RLS for enforcement.
- Upload/replace PDF must be done via a Next.js Route Handler using service role for storage, while still respecting DBV2 gates (`can_upload_aip_pdf`) and writing `public.uploaded_files`.

## G. Testing Checklist
Manual:
- AIP list pages load for both scopes and show expected filters.
- AIP detail shows Summary tab (PDF + extracted rows) and Feedback tab without leaking drafts.
- When status is `draft`, ensure any “public” listing path does not show it.

Automated:
- Add unit tests around `AipRepo` adapters (mock/supabase) for:
  - draft visibility filtering
  - scope filtering

## H. Gotchas / Pitfalls
- Do not leak draft AIPs to public listings (`status <> 'draft'` is the baseline gate).
- Reviewer vs owner behavior differs:
  - reviewers can act on barangay AIPs under jurisdiction
  - owners can act only within their own scope
- Keep the “rows table” mapping honest: DBV2’s canonical source for projects-under-AIP is `public.projects` (+ detail tables). Avoid introducing parallel “AIP rows” tables beyond what DBV2 defines.
