begin;

-- ============================================================================
-- Add financial_expenses to projects
-- Date: 2026-02-15
-- Purpose:
-- - Align DB schema with extraction pipeline output where FE is extracted.
-- ============================================================================

alter table public.projects
  add column if not exists financial_expenses numeric(18,2) null;

alter table public.projects
  drop constraint if exists chk_projects_financial_expenses_non_negative;

alter table public.projects
  add constraint chk_projects_financial_expenses_non_negative
  check (financial_expenses is null or financial_expenses >= 0);

commit;
