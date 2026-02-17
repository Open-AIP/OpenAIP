# City Dashboard Fix Notes

## Current smells
- City dashboard imported multiple components and view-model types from Barangay dashboard feature paths.
- Status palette/order and filter option constants were locally hard-coded in the City view file.

## What Phase 1 is changing
- City dashboard dependencies are redirected to `features/dashboard/shared/components` and `features/dashboard/shared/types`.
- Shared constants are moved to central dashboard constants modules for safer reuse.
- City feature boundary no longer depends on `features/dashboard/barangay/*`.

## Guardrail
- Do not break UI visuals: no Tailwind class/layout/spacing/typography changes in this refactor.
