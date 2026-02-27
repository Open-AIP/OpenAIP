begin;

drop function if exists public.get_totals_by_fund_source_for_barangays(
  int,
  uuid[]
);

create or replace function public.get_totals_by_fund_source_for_barangays(
  p_fiscal_year int default null,
  p_barangay_ids uuid[] default null
)
returns table (
  fund_source text,
  fund_total numeric,
  count_items bigint
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    coalesce(nullif(trim(li.fund_source), ''), 'Unspecified') as fund_source,
    sum(coalesce(li.total, 0)) as fund_total,
    count(*) as count_items
  from public.aip_line_items li
  join public.aips a on a.id = li.aip_id
  where a.status = 'published'
    and (p_fiscal_year is null or li.fiscal_year = p_fiscal_year)
    and (
      p_barangay_ids is null
      or cardinality(p_barangay_ids) = 0
      or li.barangay_id = any(p_barangay_ids)
    )
  group by coalesce(nullif(trim(li.fund_source), ''), 'Unspecified')
  order by fund_total desc, fund_source asc;
$$;

revoke all on function public.get_totals_by_fund_source_for_barangays(
  int,
  uuid[]
) from public;

revoke all on function public.get_totals_by_fund_source_for_barangays(
  int,
  uuid[]
) from anon;

revoke all on function public.get_totals_by_fund_source_for_barangays(
  int,
  uuid[]
) from authenticated;

grant execute on function public.get_totals_by_fund_source_for_barangays(
  int,
  uuid[]
) to authenticated;

grant execute on function public.get_totals_by_fund_source_for_barangays(
  int,
  uuid[]
) to service_role;

commit;
