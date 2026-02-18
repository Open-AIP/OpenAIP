# UI-DB Remediation Tracker

| Issue ID | Phase | Owner | Status | Evidence | Gate |
| --- | --- | --- | --- | --- | --- |
| UI-DB-01 | Phase 1-2 | Codex | Complete | `lib/auth/roles.ts`, `app/(lgu)/city/(authenticated)/layout.tsx`, `app/(lgu)/barangay/(authenticated)/layout.tsx`, `lib/supabase/proxy.ts` | Passed |
| UI-DB-02 | Phase 2 | Codex | Complete | `app/admin/layout.tsx` canonical admin guard + normalized role checks | Passed |
| UI-DB-03 | Phase 1 | Codex | Complete | `lib/auth/scope.ts`, scoped unions in AIP/projects/feedback surfaces include municipality | Passed |
| UI-DB-04 | Phase 6 | Codex | Complete | repo/UI boundaries hardened; row-like feedback typing aligned in `lib/repos/feedback/db.types.ts` | Passed |
| UI-DB-05 | Phase 6 | Codex | Complete | `mocks/fixtures/projects/projects.mock.fixture.ts` moved mock-only status to `ui_status` (non-DB) | Passed |
| UI-DB-06 | Phase 6 | Codex | Complete | Verified no new numeric-string drift introduced on DB row boundaries during phase changes | Passed |
| UI-DB-07 | Phase 6 | Codex | Complete | `author_id` nullable in `lib/repos/feedback/db.types.ts` + mapper null-safe handling | Passed |
| UI-DB-08 | Phase 4 | Codex | Complete | `lib/repos/_shared/visibility.ts`; citizen/public reads published-only in citizen AIP + feedback repos | Passed |
| UI-DB-09 | Phase 3 | Codex | Complete | Removed hardcoded LGU IDs in feedback access paths and comments routes; actor-derived scope wiring | Passed |
| UI-DB-10 | Phase 7 | Codex | Complete | AIP monitoring now separates persisted `aipStatus` from operational `Locked` case state | Passed |
| UI-DB-11 | Phase 5 | Codex | Complete | Added `PipelineStage`/`PipelineStatus` in `lib/contracts/databasev2/enums.ts` | Passed |
| UI-DB-12 | Phase 7 | Codex | Complete | UUID-like IDs introduced on active UUID-constrained mock surfaces (`mocks/fixtures/chat/chat.fixture.ts`, `mocks/fixtures/admin/aip-monitoring/aipMonitoring.mock.ts`) | Passed |
| UI-DB-13 | Phase 5 | Codex | Complete | Added missing DBv2 row contracts under `lib/contracts/databasev2/rows/*` | Passed |
| UI-DB-14 | Phase 7 | Codex | Complete | Pipeline UI enums now source from DB contract enums via `lib/types/viewmodels/aip-processing.vm.ts` | Passed |
| UI-DB-15 | Phase 7 | Codex | Complete | Feedback role unions/labels include `municipal_official` | Passed |
| UI-DB-16 | Phase 2 | Codex | Complete | Middleware/login role dual-read normalization + authenticated route guard alignment | Passed |
| UI-DB-17 | Phase 1 | Codex | Complete | Actor context role normalization with ID-preferred locale mapping in `lib/domain/actor-context.ts` | Passed |

## Contract Coverage Added

- New DBv2 row contracts added:
  - `lib/contracts/databasev2/rows/regions.ts`
  - `lib/contracts/databasev2/rows/provinces.ts`
  - `lib/contracts/databasev2/rows/cities.ts`
  - `lib/contracts/databasev2/rows/municipalities.ts`
  - `lib/contracts/databasev2/rows/barangays.ts`
  - `lib/contracts/databasev2/rows/sectors.ts`
  - `lib/contracts/databasev2/rows/uploaded_files.ts`
  - `lib/contracts/databasev2/rows/extraction_runs.ts`
  - `lib/contracts/databasev2/rows/extraction_artifacts.ts`
  - `lib/contracts/databasev2/rows/aip_chunks.ts`
  - `lib/contracts/databasev2/rows/aip_chunk_embeddings.ts`
  - `lib/contracts/databasev2/rows/chat_sessions.ts`
  - `lib/contracts/databasev2/rows/chat_messages.ts`

## Baseline Notes

- Baseline run date: 2026-02-18
- Source of truth: `databasev2.txt`
- Gate suite (final):
  - `npm run typecheck`
  - `npm run build`
  - `node scripts/repo-smoke/run.js`
  - `powershell -ExecutionPolicy Bypass -File scripts/architecture-check.ps1 -Strict`
