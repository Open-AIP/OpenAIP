# DBv2 Architecture Rules (Locked)

## Core Flow

- Canonical flow is: `DB contract row -> mapper -> UI view model -> component props`.
- Components and route views must not consume raw DB row contracts directly.
- Repository adapters return contract rows or mapper-ready records; UI layers consume mapped VMs.

## Roles and Scope

- DB role enum (`RoleType`) is canonical for authorization.
- Route role segments are UI aliases only (`citizen`, `barangay`, `city`, `municipality`, `admin`).
- All route/layout/middleware guard checks must normalize to DB role semantics before decisions.
- Scope must be actor-derived (`barangay|city|municipality|none`), not path-derived for data access decisions.
- Municipality route/page rollout is deferred this cycle; keep municipality only in shared types/contracts and role normalization.

## Visibility Rules

- Public/citizen reads are published-only for AIP-bound contexts.
- Draft/under-review/for-revision AIP contexts must not leak to public/citizen feedback and listing surfaces.
- Shared visibility checks must live in repo/mapping boundaries (`lib/repos/_shared/visibility.ts`).

## Types and Contracts

- `lib/contracts/databasev2/**` is the canonical data-shape source.
- Avoid duplicate enum/type declarations in feature/domain layers when DBv2 contract types exist.
- Row-like types that represent DB rows must preserve nullability (example: `feedback.author_id` nullable).
- UUID-constrained mock surfaces should use UUID-like identifiers.

## Project Status Rule

- `public.projects` does not persist a `status` column in DBv2 contracts.
- Project status is VM-only UI state; mock datasets must label this as non-DB (`ui_status`).

## Enforcement

- Required checks before merge:
  1. `npm run typecheck`
  2. `npm run build`
  3. `node scripts/repo-smoke/run.js`
  4. `powershell -ExecutionPolicy Bypass -File scripts/architecture-check.ps1 -Strict`
  5. `powershell -ExecutionPolicy Bypass -File scripts/feature-structure-check.ps1 -Strict`
  6. `powershell -ExecutionPolicy Bypass -File scripts/naming-check.ps1 -Strict`
