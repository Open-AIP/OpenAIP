begin;

drop function if exists public.compare_fiscal_year_totals_for_barangays(
  int,
  int,
  uuid[]
);

create or replace function public.compare_fiscal_year_totals_for_barangays(
  p_year_a int,
  p_year_b int,
  p_barangay_ids uuid[] default null
)
returns table (
  year_a_total numeric,
  year_b_total numeric,
  delta numeric
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with filtered as (
    select
      li.fiscal_year,
      coalesce(li.total, 0) as total_value
    from public.aip_line_items li
    join public.aips a on a.id = li.aip_id
    where a.status = 'published'
      and li.fiscal_year in (p_year_a, p_year_b)
      and (
        p_barangay_ids is null
        or cardinality(p_barangay_ids) = 0
        or li.barangay_id = any(p_barangay_ids)
      )
  ),
  aggregated as (
    select
      coalesce(sum(case when fiscal_year = p_year_a then total_value else 0 end), 0) as year_a_total,
      coalesce(sum(case when fiscal_year = p_year_b then total_value else 0 end), 0) as year_b_total
    from filtered
  )
  select
    aggregated.year_a_total,
    aggregated.year_b_total,
    aggregated.year_b_total - aggregated.year_a_total as delta
  from aggregated;
$$;

revoke all on function public.compare_fiscal_year_totals_for_barangays(
  int,
  int,
  uuid[]
) from public;

revoke all on function public.compare_fiscal_year_totals_for_barangays(
  int,
  int,
  uuid[]
) from anon;

revoke all on function public.compare_fiscal_year_totals_for_barangays(
  int,
  int,
  uuid[]
) from authenticated;

grant execute on function public.compare_fiscal_year_totals_for_barangays(
  int,
  int,
  uuid[]
) to authenticated;

grant execute on function public.compare_fiscal_year_totals_for_barangays(
  int,
  int,
  uuid[]
) to service_role;

commit;
