# UI Tokens (Dashboard Scope)

Centralized dashboard/citizen visual tokens live in this folder.

## Files

- `tokens.ts`
  - Shared chart palette and semantic hex tokens
  - Shared chart stroke tokens (grid/axis)
  - Shared dashboard class tokens used by multiple roles
- `status.ts`
  - Status-to-class mappings (AIP status badges, admin activity tones, city coverage tones)
- `sector.ts`
  - DBv2-aligned `sector_code` to label mapping helpers

## How to add a new status style

1. Add/update mappings in `status.ts`.
2. Keep values aligned with existing visual system.
3. Import from `@/lib/ui/status` in components; do not define local status maps.

## How to add a new chart color

1. Add the color to `DASHBOARD_CHART_PALETTE` in `tokens.ts`.
2. Use `getChartColorByIndex()` (or palette exports) in chart components.
3. Do not hardcode chart hex values in feature views/components.

## Rule of thumb

- Never hardcode hex values in dashboard views/components.
- Reuse tokens from `lib/ui/*` for status classes and chart fills/strokes.
