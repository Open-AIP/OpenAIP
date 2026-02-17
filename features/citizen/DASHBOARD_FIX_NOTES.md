# Citizen Dashboard Fix Notes

## Current smells
- Dashboard-adjacent conventions (constants/tokens and shared dashboard boundaries) were not uniformly centralized.
- Refactor safety needed explicit guardrails to prevent UI regressions during cross-feature cleanup.

## What Phase 1 is changing
- Shared dashboard architecture is clarified under `features/dashboard/shared/*`.
- Dashboard constants/tokens are centralized where already present in code.
- No Citizen route or visual behavior changes are introduced.

## Guardrail
- Do not break UI visuals: no Tailwind class/layout/spacing/typography changes in this refactor.
