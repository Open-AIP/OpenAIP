# REFACTOR_PLAN_LIB_CENTRAL

## Scope
Phase 0 only: inventory + move plan. No code changes.

## Phase 2 — Domain types discovered

- `lib/repos/aip/types.ts`
- `lib/repos/projects/types.ts`
- `lib/repos/feedback/types.ts`
- `lib/repos/audit/types.ts`
- `lib/repos/submissions/types.ts`
- `lib/repos/chat/types.ts`
- `lib/repos/lgu/types.ts`
- `features/chat/types/chat.types.ts` (mixed domain + UI)
- `features/audit/types/audit.types.ts` (domain alias)
- `features/admin/aip-monitoring/types/monitoring.types.ts` (UI table row models; reviewed)

## Phase 3 — Mapper inventory candidates

- `features/dashboard/barangay/presentation/mapBarangayDashboardVM.ts` → outputs `BarangayDashboardVM` (shared dashboard VM contract)
- `features/dashboard/city/presentation/mapCityDashboardVM.ts` → outputs `CityDashboardVM` (shared dashboard VM contract)
- `features/admin/dashboard/presentation/mapAdminDashboardVM.ts` → outputs `AdminDashboardVM` (admin dashboard VM contract)
- `features/submissions/presentation/submissions.presentation.ts` → outputs submission status labels/badge mapping (shared across submissions + dashboard)
- `features/audit/presentation/audit.ts` → outputs audit action/entity/role labels (shared in audit UI)
- `features/audit/mappers/audit.mapper.ts` → outputs normalized `ActivityLogRow` (shared by admin audit logs page)
- `features/chat/mappers/chat.mapper.ts` → outputs `ChatSessionListItem` and `ChatMessageBubble` (chat VM contract)
- `features/admin/aip-monitoring/mappers/aip-monitoring.mapper.ts` → outputs `AipMonitoringRow[]` and `CaseRow[]` (admin AIP monitoring VM contract)

## 1) Inventory table per feature

| Feature | UI folders/files to keep | Non-UI folders/files to move | Duplicates already existing in lib |
|---|---|---|---|
| `features/citizen` | `components/`, `constants/`, `types/` | None identified in Phase 0 | None identified |
| `features/projects` | UI components/views/hooks/types | `utils/status-badges.ts` (classification/mapping utility) | None confirmed |
| `features/dashboard/city` | `hooks/`, `types/`, `views/` | `presentation/mapCityDashboardVM.ts` | None confirmed |
| `features/dashboard/barangay` | `hooks/`, `types/`, `views/` | `presentation/mapBarangayDashboardVM.ts`, `repo/barangayDashboard.repo.ts` | `lib/repos/barangay-dashboard/repo.ts` already exists |
| `features/submissions` | UI-facing types/hooks/views | `presentation/submissions.presentation.ts` | Repo/domain layer exists in `lib/repos/submissions/*` |
| `features/admin/aip-monitoring` | Feature UI views/components/hooks/types | `mappers/aip-monitoring.mapper.ts` | Possible overlap with lib repo/domain mapping patterns |
| `features/admin/dashboard` | Feature UI views/components/hooks/types | `presentation/mapAdminDashboardVM.ts` | `lib/repos/admin-dashboard/mappers/*` already exists |
| `features/audit` | Feature UI views/components/hooks/types | `mappers/audit.mapper.ts`, `presentation/audit.ts`, `mock/auditLogs.mock.ts` | Repo/domain layer exists in `lib/repos/audit/*` |
| `features/chat` | Feature UI views/components/hooks/types | `mappers/chat.mapper.ts` | Repo/domain layer exists in `lib/repos/chat/*` |
| `features/dashboard/shared` | UI-only shared dashboard primitives | `utils/index.ts` (if transform/mapper logic) | None confirmed |
| `features/feedback` | UI views/components/hooks/types | `lib/debug.ts`, `lib/format.ts`, `lib/kind.ts`, `lib/status.ts` | Related domains exist in `lib/formatting`, `lib/constants`, `lib/ui` |

---

## 2) Move map (from → to)

### A. Move feature mappers/presentation/repo into lib

#### Admin
- `features/admin/aip-monitoring/mappers/aip-monitoring.mapper.ts` → `lib/mappers/aip-monitoring/aip-monitoring.mapper.ts`
- `features/admin/dashboard/presentation/mapAdminDashboardVM.ts` → merge/remove in favor of `lib/repos/admin-dashboard/mappers/admin-dashboard.mapper.ts` (single source of truth)

#### Audit
- `features/audit/mappers/audit.mapper.ts` → `lib/mappers/audit/audit.mapper.ts`
- `features/audit/presentation/audit.ts` → `lib/mappers/audit/mapAuditToVM.ts` (rename optional in later phase)
- `features/audit/mock/auditLogs.mock.ts` → `mocks/fixtures/audit-logs.fixture.ts`

#### Chat
- `features/chat/mappers/chat.mapper.ts` → `lib/mappers/chat/chat.mapper.ts`

#### Dashboards
- `features/dashboard/barangay/repo/barangayDashboard.repo.ts` → remove and use `lib/repos/barangay-dashboard/repo.ts`
- `features/dashboard/barangay/presentation/mapBarangayDashboardVM.ts` → `lib/mappers/barangay-dashboard/mapBarangayDashboardVM.ts`
- `features/dashboard/city/presentation/mapCityDashboardVM.ts` → `lib/mappers/city-dashboard/mapCityDashboardVM.ts`
- `features/dashboard/shared/utils/index.ts` →
  - `lib/mappers/dashboard-shared/*` if transform/mapping logic, or
  - `lib/ui/*` if UI token/class helpers

#### Feedback
- `features/feedback/lib/debug.ts` → `lib/formatting/feedback/debug.ts` (if domain formatting/debug helper)
- `features/feedback/lib/format.ts` → `lib/formatting/feedback/format.ts`
- `features/feedback/lib/kind.ts` → `lib/constants/feedback.ts` (kind classification)
- `features/feedback/lib/status.ts` → `lib/ui/feedback-status.ts` (status/token mapping)

#### Projects
- `features/projects/utils/status-badges.ts` →
  - `lib/ui/status-badges.ts` if badge style/token mapping, or
  - `lib/mappers/projects/status-badges.ts` if transformation logic

#### Submissions
- `features/submissions/presentation/submissions.presentation.ts` → `lib/mappers/submissions/mapSubmissionsToVM.ts`
- `features/submissions/actions/submissionsReview.actions.ts` → `features/submissions/types/submissions-actions.ts` (UI action contract)

### B. Normalize lib repo mappers (repo-owned mappers → central mappers)

- `lib/repos/admin-dashboard/mappers/*` → `lib/mappers/admin-dashboard/*`
- `lib/repos/feedback-moderation/mappers/*` → `lib/mappers/feedback-moderation/*`
- `lib/repos/feedback-moderation-project-updates/mappers/*` → `lib/mappers/feedback-moderation-project-updates/*`
- `lib/repos/usage-controls/mappers/*` → `lib/mappers/usage-controls/*`

Then update all repo imports to `lib/mappers/...` rather than `./mappers/...` under repo folders.

### C. Type placement plan

#### Keep in `features/<feature>/types` (UI-only)
- Component prop types
- UI filter state types
- UI action contracts

#### Move to `lib/types/domain`
- Consolidate domain/shared entity types currently distributed in `lib/repos/*/types.ts`
- Target path: `lib/types/domain/*.ts`

#### Move to `lib/types/viewmodels`
- Any ViewModel returned by `lib/mappers/*`
- Any ViewModel shared across City/Barangay/Admin flows

#### Immediate mixed-type issue
- `features/chat/types/chat.types.ts` currently mixes domain aliases (`ChatSessionRow`, `ChatMessageRow`) and UI VM types (`ChatSessionListItem`, `ChatMessageBubble`)
- Plan: keep UI VM types in `features/chat/types/*`; source domain rows from `lib/contracts/databasev2` (or move aliases to `lib/types/domain/chat.ts`)

---

## 3) Duplicate notes (must track during migration)

1. Barangay dashboard duplication
   - Feature repo exists: `features/dashboard/barangay/repo/barangayDashboard.repo.ts`
   - Canonical lib repo already exists: `lib/repos/barangay-dashboard/repo.ts`
   - Action: remove feature repo usage and standardize to lib repo.

2. Admin dashboard mapper duplication
   - Feature VM mapper exists: `features/admin/dashboard/presentation/mapAdminDashboardVM.ts`
   - Lib mapper set already exists: `lib/repos/admin-dashboard/mappers/*`
   - Action: keep one mapper source of truth in lib and delete feature duplicate.

3. General anti-pattern to eliminate
   - Feature folders currently contain mapper/repo/mock utilities in several domains.
   - Action: features remain UI-only; non-UI logic moves to `lib/*` and `mocks/fixtures/*`.
