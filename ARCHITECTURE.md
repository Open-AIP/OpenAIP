# Architecture Lock (Phase 6)

This repository follows a layered architecture to keep domain logic stable and UI implementation replaceable.

## DBv2 Contract Lock (Phase 8)

- Canonical data flow is now locked to: `DB contract row -> mapper -> UI view model -> component`.
- Authorization and route gating must normalize to DBv2 role semantics before decisions.
- Scope and visibility decisions are actor-derived and DBv2-aligned (published-only public/citizen reads).
- Municipality remains part of DBv2 role/scope contract types, but municipality route/page rollout is deferred for this cycle.
- Detailed enforcement rules are documented in `lib/ARCHITECTURE_RULES.md`.

## Layer Boundaries

- `lib/` is the source of truth for:
  - domain contracts and shared types
  - repositories and mock adapters
  - mappers and formatting helpers
  - canonical constants and non-visual UI helpers
- `features/` is UI-focused:
  - views, components, hooks, and UI-only types
  - composition/orchestration of `lib` data for rendering
- `app/` contains route wiring and page composition.

## Import Rules

- `lib/**` must never import from `features/**`.
- `features/**` must not directly import from `mocks/fixtures/**`; fixtures are consumed only through `lib/repos/**`.
- Cross-feature imports are not allowed (`features/*` importing `features/*` from another feature).
- Shared presentation reuse should happen through neutral entry points (`components/**`) or `lib/**` helpers.

## Mapper Purity

- `lib/mappers/**` must remain framework-agnostic:
  - no React imports
  - no hooks (`useMemo`, `useEffect`, `useState`, etc.)
  - map data only

## Mock and Repo Policy

- Mock datasets live in `mocks/fixtures/**`.
- Repo mock adapters live in `lib/repos/**/repo.mock.ts`.
- Feature folders do not define repo-mock creation helpers.

## Canonical Source of Truth

- Shared constants/status mappings should live in `lib/constants/**` or `lib/ui/**`.
- Feature-local duplicates of shared status/category mappings should be removed or redirected to `lib`.

## Verification Gates

A change is considered architecture-safe when all of the following pass:

1. `npm run typecheck`
2. `npm run build`
3. Layer checks show:
   - no `lib -> features` imports
   - no direct `features -> mocks/fixtures` imports
   - no cross-feature imports
   - no React/hooks usage in `lib/mappers`
   - no path-derived scope authorization checks
   - no hardcoded jurisdiction IDs in authorization/data-access paths
   - no municipality route scaffolding in `app/(lgu)/municipality/**` for this cycle

## Practical Guidance

- If a feature needs shared behavior that is not UI-specific, move it to `lib`.
- If two features need the same UI fragment, expose it through `components/**`.
- Prefer minimal rewires and compatibility re-exports over broad refactors.
