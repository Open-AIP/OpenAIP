# Feedback Feature Guide

## A. Purpose
Provide threaded feedback/comment UX for AIP and project contexts, with DBV2-compatible domain modeling.

## B. UI Surfaces
Routes:
- `app/(lgu)/barangay/(authenticated)/feedback/page.tsx`
- `app/(lgu)/city/(authenticated)/feedback/page.tsx`

Feature files:
- `features/feedback/views/comments-view.tsx`
- `features/feedback/components/comment-threads-split-view.tsx`
- `features/feedback/components/comment-thread-panel.tsx`

Embedded by:
- `features/aip/views/aip-detail-view.tsx`
- project detail views under `features/projects/*/views`

## C. Data Flow
UI components/hooks
-> feedback repos in `lib/repos/feedback`
-> selector-based adapter choice (mock vs supabase)

Important repository split:
- `CommentRepo` and thread UI contracts
- `FeedbackRepo` / `FeedbackThreadsRepo` DBV2-oriented contracts

## D. databasev2 Alignment
Canonical table:
- `public.feedback`

Relevant enums:
- `feedback_target_type` (`aip`, `project`)
- `feedback_kind` (`question`, `suggestion`, `concern`, `lgu_note`, `ai_finding`, `commend`)

Core rules:
- public visibility depends on published parent AIP plus policy gates,
- replies must match parent target (`feedback_enforce_parent_target`),
- reviewer and role-specific write restrictions are enforced by RLS/policies.

## E. Current Implementation Status
- Mock adapters are active and power current UI behavior in mock mode.
- Supabase feedback adapters are scaffolded but not implemented:
  - `createSupabaseCommentRepo()`
  - `createSupabaseFeedbackRepo()`
  - `createSupabaseFeedbackThreadsRepo()`
- `CommentTargetLookup.supabase` is also not implemented.

## F. Testing Checklist
Manual:
- Open feedback pages for barangay and city.
- Open a thread and post a reply in mock mode.
- Validate sidebar target resolution still works for AIP and project contexts.

Automated:
- `tests/repo-smoke/feedback/commentThread.highlight.test.ts`
- `tests/repo-smoke/feedback/commentThreadAccordionList.test.tsx`

## G. Pitfalls
- Do not treat `is_public=true` as globally visible without AIP/status checks.
- Keep root/reply mapping tied to `parent_feedback_id`.
- Avoid enabling non-mock feedback mode until Supabase adapters are fully implemented.
