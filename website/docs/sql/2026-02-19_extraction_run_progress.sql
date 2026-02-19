alter table public.extraction_runs
  add column if not exists overall_progress_pct smallint null,
  add column if not exists stage_progress_pct smallint null,
  add column if not exists progress_message text null,
  add column if not exists progress_updated_at timestamptz null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'extraction_runs_overall_progress_pct_range_chk'
  ) then
    alter table public.extraction_runs
      add constraint extraction_runs_overall_progress_pct_range_chk
      check (
        overall_progress_pct is null
        or (overall_progress_pct >= 0 and overall_progress_pct <= 100)
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'extraction_runs_stage_progress_pct_range_chk'
  ) then
    alter table public.extraction_runs
      add constraint extraction_runs_stage_progress_pct_range_chk
      check (
        stage_progress_pct is null
        or (stage_progress_pct >= 0 and stage_progress_pct <= 100)
      );
  end if;
end
$$;
