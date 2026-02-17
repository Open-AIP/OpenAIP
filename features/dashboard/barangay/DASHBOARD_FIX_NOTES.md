# Barangay Dashboard Fix Notes

## Current smells
- Shared UI blocks were tightly coupled to `features/dashboard/barangay/components` and consumed by City dashboard.
- Shared view-model types were defined in `features/dashboard/barangay/types`, causing cross-feature dependency.
- Some dashboard constants were inline in feature files instead of centralized modules.

## What Phase 1 is changing
- Shared dashboard components and shared dashboard types are moved under `features/dashboard/shared/*`.
- City dashboard imports are updated to use `features/dashboard/shared/*` only.
- Barangay dashboard imports are updated to consume shared modules from the shared boundary.

## Guardrail
- Do not break UI visuals: no Tailwind class/layout/spacing/typography changes in this refactor.
