begin;

-- City AIP-only column used by extraction_city / validation_city output.
alter table if exists public.projects
  add column if not exists prm_ncr_lgu_rm_objective_results_indicator text null;

commit;
