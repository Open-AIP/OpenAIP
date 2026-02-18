# DBv2 Remediation Tracker

Execution mode: sequential section gates. Do not start the next section until the current gate passes.

## Locked Issue Order

1. `C-04` / `C-06`
2. `C-10` / `C-09`
3. `C-03` / `C-07` / `C-08`
4. `C-01` / `C-02`
5. `S-01` / `S-02` / `S-03` / `S-04` / `S-05` / `S-06` / `S-07`

## Deferred

- `C-05` Municipality route/UI rollout: **Deferred this cycle**
  - Rationale: municipality remains in DB contract types and role/scope semantics, but route/page rollout is intentionally postponed.
  - Constraint: do not add `app/(lgu)/municipality/**` in this cycle.

## Tracking Sheet

| Issue ID | Section | PR | Owner | Start | Gate | Evidence | Status |
|---|---|---|---|---|---|---|---|
| C-04 | B1 | local | codex | 2026-02-18 | passed | actor-driven scope provider + city/barangay layout injection | completed |
| C-06 | B1/B3 | local | codex | 2026-02-18 | passed | removed `city_001` fallback + explicit scoped query/repo path | completed |
| C-10 | B8 | local | codex | 2026-02-18 | passed | canonical role/scope typing, role-string check=0, duplicate role enum removed from audit fixture | completed |
| C-09 | B8 | local | codex | 2026-02-18 | passed | strict architecture check + naming/structure checks + fixture path constraints in auth/data access | completed |
| C-03 | B2 | local | codex | 2026-02-18 | passed | canonical mapper entries under `lib/mappers/*` + selector extraction (`lib/selectors/projects/project-list.ts`) | completed |
| C-07 | B6 | local | codex | 2026-02-18 | passed | no route `return null` pages; shared incomplete placeholder component | completed |
| C-08 | B7 | local | codex | 2026-02-18 | passed | user-facing `alert` removed + route-group `error.tsx` added | completed |
| C-01 | B4 | local | codex | 2026-02-18 | passed | feature templates map + `index.ts`/`README.md` boundaries + `feature-structure-check.ps1` | completed |
| C-02 | B5 | local | codex | 2026-02-18 | passed | targeted kebab-case renames + `naming-check.ps1` + canonical submissions alias retained via redirect | completed |
| C-05 | deferred | n/a | codex | 2026-02-18 | n/a | municipality rollout deferred | deferred |
| S-01 | C | local | codex | 2026-02-18 | passed | shared project-list selector module now powers citizen + LGU list filtering | completed |
| S-02 | C | local | codex | 2026-02-18 | passed | duplicate project review modal replaced with canonical re-export | completed |
| S-03 | C | local | codex | 2026-02-18 | passed | boundary strategy locked (`components/**` shared-entry, feature internals private) and wrappers reduced to compatibility points only | completed |
| S-04 | C | local | codex | 2026-02-18 | passed | feedback mock god file split into `mock/comment-repo.mock.ts`, `mock/feedback-repo.mock.ts`, `mock/feedback-threads-repo.mock.ts` | completed |
| S-05 | C | local | codex | 2026-02-18 | passed | feedback client repo switched from dead adapter selector to mock-only guarded selector | completed |
| S-06 | C | local | codex | 2026-02-18 | passed | canonical fixture type imports + shared id validation + project list/selectors derived from shared selector/mappers | completed |
| S-07 | C | local | codex | 2026-02-18 | passed | submissions detail split into hook + focused components/dialogs | completed |
