# Projects Feature Guide

## A. Purpose
Display and manage projects (health and infrastructure) and their details/updates, scoped under an AIP.

## B. UI Surfaces
Routes:
- `app/(lgu)/barangay/(authenticated)/projects/health/page.tsx`
- `app/(lgu)/barangay/(authenticated)/projects/health/[projectId]/page.tsx`
- `app/(lgu)/barangay/(authenticated)/projects/infrastructure/page.tsx`
- `app/(lgu)/barangay/(authenticated)/projects/infrastructure/[projectId]/page.tsx`
- `app/(lgu)/city/(authenticated)/projects/health/page.tsx`
- `app/(lgu)/city/(authenticated)/projects/health/[projectId]/page.tsx`
- `app/(lgu)/city/(authenticated)/projects/infrastructure/page.tsx`
- `app/(lgu)/city/(authenticated)/projects/infrastructure/[projectId]/page.tsx`

Service entrypoints:
- `lib/repos/projects/queries.ts` (`projectService`)

Repo entrypoints:
- `lib/repos/projects/repo.ts` (`ProjectsRepo`)
- `lib/repos/projects/repo.server.ts` (`getProjectsRepo()` for server-only callers)
- mock adapter: `lib/repos/projects/repo.mock.ts`

Embedded feedback:
- Project detail views embed `CommentThreadsSplitView` from `features/feedback`.

## C. Data Flow (diagram in text)
`app/(lgu)/.../projects/*` pages
→ `projectService` (`lib/repos/projects/queries.ts`)
→ `getProjectsRepo()` (`lib/repos/projects/repo.server.ts`)
→ `ProjectsRepo` contract (`lib/repos/projects/repo.ts`)
→ adapter:
  - today: `createMockProjectsRepoImpl()` (`lib/repos/projects/repo.mock.ts`)
    → `mocks/fixtures/projects/projects.mock.fixture.ts` (normalized mock rows)
    → `mocks/fixtures/projects/*` (tables like updates)
  - future: Supabase adapter (to be created) → `public.projects` + detail tables

## D. databasev2 Alignment
Relevant DBV2 tables/enums/helpers:
- `public.projects` (FK to `public.aips` via `aip_id`)
- enum `public.project_category` (`health` / `infrastructure` / `other`)
- detail tables:
  - `public.health_project_details` (FK `project_id`)
  - `public.infrastructure_project_details` (FK `project_id`)
- Access helpers:
  - read gates use `public.can_read_aip(aip_id)` / `public.can_read_project(project_id)`
  - write gates use `public.can_edit_aip(aip_id)` / `public.can_edit_project(project_id)`

Key constraints & visibility rules:
- Public can read projects only when their parent AIP is readable (non-draft public; drafts owner/admin).
- Writes are allowed only when the parent AIP is editable (`draft` or `for_revision`, owner/admin).

How those rules should be enforced:
- Repositories should treat `aip_id` as the primary scope boundary and never return projects for unreadable AIPs.
- Service layer should avoid exposing “edit” entrypoints when status is not editable.

## E. Current Implementation (Mock)
- Mock tables are under `mocks/fixtures/projects/*`.
- Repository mock implementation joins normalized mock rows into UI types:
  - `lib/repos/projects/repo.mock.ts`
  - mapper: `lib/repos/projects/mappers.ts`
- Server repo entrypoint: `lib/repos/projects/repo.server.ts` uses mock in `dev` and selects the Supabase adapter in non-dev (currently stubbed).

## F. Supabase Swap Plan (Future-only)
1) Add adapter file:
- Implement `lib/repos/projects/repo.supabase.ts` implementing `ProjectsRepo`.
2) Update selector:
- Update `lib/repos/projects/repo.server.ts` to use the Supabase adapter for non-dev.
3) Method → table mapping:
- `listByAip(aipId)` → `public.projects` where `aip_id = $1`
- `getById(projectId)` → `public.projects` where `id = $1` (or by `aip_ref_code` if you use that as the UI id)
- `listHealth()` / `listInfrastructure()` → `public.projects` filtered by `category`
- `getByRefCode(projectRefCode)` → `public.projects` where `aip_ref_code = $1` plus join detail tables by `project_id`

RLS vs server routes:
- Reads/writes should rely on RLS (`can_read_project`, `can_edit_project`).
- Any derived “search across all projects” should remain server-only if it risks leaking drafts.

## G. Testing Checklist
Manual:
- Visit health/infrastructure list pages and open a detail page.
- Verify feedback panel renders and does not show feedback for unpublished AIPs once Supabase is enabled.

Automated:
- Existing tests:
  - `tests/repo-smoke/projects/projects.repo.mock.test.ts`
- Add adapter tests:
  - list-by-aip respects readability
  - update gates enforce editable-only windows

## H. Gotchas / Pitfalls
- Don’t confuse UI “projectId” with DBV2 identifiers:
  - DBV2 has both `projects.id` (uuid) and `projects.aip_ref_code` (text, unique per AIP).
  - Decide which one the UI uses and map consistently in the repo adapter.
- Avoid leaking projects for draft AIPs when building “global search” features.
