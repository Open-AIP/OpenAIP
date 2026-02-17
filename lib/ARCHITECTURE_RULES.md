# Architecture Rules

- `features/**` contains UI-only code (components/views/hooks + UI types).
- `lib/**` contains domain types, viewmodels, repos, and pure mappers.

## Layering rules
- `features` may import from `lib`.
- `lib` must never import from `features`.
- No feature-to-feature imports.
- Mappers must be pure (no React/hooks/DOM).
- Repos read from `mocks/fixtures` in mock mode.

## Type placement rules
- `features/<feature>/types` = UI-only types.
- `lib/types/domain` = DBv2-aligned entities + shared enums.
- `lib/types/viewmodels` = shared VMs produced by `lib/mappers`.
