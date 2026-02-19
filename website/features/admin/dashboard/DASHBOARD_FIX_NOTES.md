# Admin Dashboard Fix Notes

## Current smells
- Dashboard-related palette and UI tone constants were defined inline across components.
- Some redundant computations existed in chart components (recomputing totals from identical source arrays).

## What Phase 1 is changing
- Dashboard constants/tokens are centralized under `lib/constants/dashboard.ts` and `lib/ui/tokens.ts` where trivial.
- Redundant dashboard-only computation is reduced without changing values.
- No route or behavior change is introduced.

## Guardrail
- Do not break UI visuals: no Tailwind class/layout/spacing/typography changes in this refactor.
