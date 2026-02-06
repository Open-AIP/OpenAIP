# Feedback Feature Guide

## A. Purpose
Provide a “feedback inbox” and thread UI for LGU users, and (future) persist feedback in DBV2’s `public.feedback` table.

This feature currently contains two parallel shapes:
1) Threaded “comments” UI repo (`CommentRepo`) used by `CommentsView` and `CommentThreadsSplitView`.
2) A DBV2-aligned feedback repository (`FeedbackRepo` / `FeedbackThreadsRepo`) intended to map to `public.feedback`.

## B. UI Surfaces
Routes:
- `app/(lgu)/barangay/(authenticated)/comments/page.tsx`
- `app/(lgu)/city/(authenticated)/comments/page.tsx`

Views/components:
- `features/feedback/views/comments-view.tsx` (inbox)
- `features/feedback/components/comment-threads-split-view.tsx` (embedded in AIP/Project detail pages)
- `features/feedback/components/comment-thread-panel.tsx`

Embedded by other features:
- `features/aip/views/aip-detail-view.tsx` (Feedback tab)
- `features/projects/*/views/*-project-detail-page-view.tsx`

## C. Data Flow (diagram in text)
Inbox / thread UI (today)
→ `getCommentRepo()` (`features/feedback/services/comment-repo.ts`)
→ `CommentRepo` contract (same file)
→ adapter:
  - today: `createMockCommentRepo()` (`features/feedback/services/comment-repo.mock.ts`)
  - future: `createSupabaseCommentRepo()` (`features/feedback/services/comment-repo.supabase.ts`)
→ resolve sidebar context:
  - `getCommentTargetLookup()` (`features/feedback/services/comment-target-lookup.mock.ts`)
  - `resolveCommentSidebar()` (`features/feedback/services/resolve-comment-sidebar.ts`)

DBV2-aligned repo (future-facing; not the primary UI path yet)
→ `FeedbackRepo` (`features/feedback/data/FeedbackRepo.ts`) or `FeedbackThreadsRepo` (`features/feedback/data/feedback.repo.ts`)
→ adapter:
  - today: mock impls under `features/feedback/data/*.mock.ts`
  - future: Supabase adapters under `features/feedback/data/*.supabase.ts`

## D. databasev2 Alignment
Relevant DBV2 tables/enums/helpers:
- `public.feedback`
  - enums: `feedback_target_type` (`aip`/`project`), `feedback_kind` (`question`, `suggestion`, `concern`, `lgu_note`, `ai_finding`, `commend`)
- Public visibility:
  - anon/public can read feedback only when parent AIP is `published`
- Write gates:
  - citizens can write only when parent AIP is `published` and only limited kinds
  - officials/reviewers can write `kind='lgu_note'` only (plus jurisdiction gates for reviewers)
  - reviewers cannot write project-target feedback (by design)
- Reply constraints:
  - replies must match parent target (trigger `feedback_enforce_parent_target`)

How those rules should be enforced:
- Supabase adapters should rely on RLS for enforcement, but the service layer should proactively:
  - hide/disable posting UI when the AIP is not published (citizen flows)
  - restrict kind options based on actor role (citizen vs official vs admin)
- Keep thread “root” vs “reply” mapping consistent with `parent_feedback_id`.

## E. Current Implementation (Mock)
Thread UI mocks:
- Threads/messages live in `features/feedback/mock/comment-threads.mock.ts` and `features/feedback/mock/comment-messages.mock.ts`.
- `createMockCommentRepo()` is in `features/feedback/services/comment-repo.mock.ts`.

DBV2-aligned mock store:
- `features/feedback/data/feedback.mock.ts` builds a `FeedbackItem[]` store from the thread mocks.
- `features/feedback/data/feedback.repo.mock.ts` builds a `FeedbackRow[]` store (thread roots + replies).

## F. Supabase Swap Plan (Future-only)
Keep UI unchanged; swap adapters behind repo selectors.

1) Decide the “single source” repo for UI:
- Recommended: migrate UI to the DBV2-aligned repo (`FeedbackThreadsRepo`) so one row = one `public.feedback` record.

2) Implement Supabase adapters:
- `features/feedback/services/comment-repo.supabase.ts` (if you keep CommentRepo)
- `features/feedback/data/feedback.supabase.ts` and/or `features/feedback/data/feedback.repo.supabase.ts`

3) Method → table mapping (DBV2 canonical):
- list thread roots → `public.feedback` where `parent_feedback_id is null` and matches `target_type` + `(aip_id|project_id)`
- list messages → `public.feedback` where `id = rootId OR parent_feedback_id = rootId`
- create root → insert `public.feedback` row with `parent_feedback_id = null`
- create reply → insert `public.feedback` row with `parent_feedback_id = rootId`

RLS vs server routes:
- Reads/writes should rely on RLS.
- AI-generated feedback (`source='ai'`) should be inserted server-side (service role), since DBV2 expects AI rows to have `author_id` null and may be pipeline-driven.

## G. Testing Checklist
Manual:
- Open `/barangay/comments` and `/city/comments`.
- Filter by year/status/context; open a thread and add a reply.
- Verify that feedback is not visible publicly for unpublished/draft AIPs once Supabase is enabled.

Automated:
- Existing tests:
  - `features/feedback/services/__tests__/commentThread.highlight.test.ts`
  - `features/feedback/services/__tests__/commentThreadAccordionList.test.tsx`
- Add adapter tests for:
  - published-only public visibility
  - reply target enforcement (parent/child match)
  - role-based kind restrictions

## H. Gotchas / Pitfalls
- Public visibility is **published-only** for feedback in DBV2; do not leak feedback for `draft/under_review/for_revision`.
- Reviewers can write only AIP-target feedback (no project-target).
- Keep `is_public` semantics aligned: DBV2 uses `is_public` plus additional gates; don’t treat `is_public=true` as “always visible”.

