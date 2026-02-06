# Shared Feature Guide

## A. Purpose
Provide shared, feature-agnostic building blocks used across the codebase.

Today this folder is primarily for **mock-data integrity** utilities (stable ids + validators) used by multiple feature mocks.

## B. UI Surfaces
None directly. This module is consumed by other features’ mock layers.

Key files:
- `features/shared/mock/id-contract.ts`
- `features/shared/mock/validate-mock-ids.ts`

## C. Data Flow (diagram in text)
Feature mock adapters
→ import shared id constants (`id-contract.ts`)
→ optional validation (`validate-mock-ids.ts`)
→ feature UI/service consumes mock data

## D. databasev2 Alignment
Relevant DBV2 concepts:
- Stable identifiers and foreign keys across:
  - `public.aips` ↔ `public.projects` ↔ `public.feedback`

Key constraints:
- DBV2 uses UUIDs for primary keys across most tables, with some natural keys (e.g., `projects.aip_ref_code`).
- Mock ids should preserve referential integrity (threads target existing AIPs/projects; replies target the same parent thread).

Enforcement boundary:
- `validateMockIds()` is a dev-only guardrail to keep mock tables consistent; Supabase adapters should rely on FK constraints + RLS instead.

## E. Current Implementation (Mock)
- `id-contract.ts` centralizes ids used across:
  - `features/aip/mock/*`
  - `features/projects/mock/*`
  - `features/feedback/mock/*`
  - `features/audit/mock/*`
- `validate-mock-ids.ts` checks cross-feature mock integrity and throws in dev if broken.

## F. Supabase Swap Plan (Future-only)
No direct Supabase swap needed (this feature should remain UI-agnostic).

If you keep mock data in `dev` while moving to Supabase elsewhere:
- ensure mock ids don’t accidentally collide with real UUIDs in UI routing
- keep `validateMockIds()` to catch regressions in mock fixtures

## G. Testing Checklist
Manual:
- In dev, exercise pages that read mock feedback and ensure no “missing id” runtime errors.

Automated:
- Add a simple unit test that runs `validateMockIds()` once (optional; currently invoked by `createMockCommentRepo()`).

## H. Gotchas / Pitfalls
- Do not import feature modules into `features/shared` beyond mock-only helpers; keep dependencies one-way (shared → none).
- When moving to Supabase, avoid reusing mock ids as if they were DB UUIDs.

