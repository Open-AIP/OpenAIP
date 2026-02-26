begin;

drop function if exists public.get_totals_by_sector_for_barangays(
  int,
  uuid[]
);

create or replace function public.get_totals_by_sector_for_barangays(
  p_fiscal_year int default null,
  p_barangay_ids uuid[] default null
)
returns table (
  sector_code text,
  sector_name text,
  sector_total numeric,
  count_items bigint
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    li.sector_code,
    li.sector_name,
    sum(coalesce(li.total, 0)) as sector_total,
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
  group by li.sector_code, li.sector_name
  order by sector_total desc, li.sector_name asc nulls last;
$$;

revoke all on function public.get_totals_by_sector_for_barangays(
  int,
  uuid[]
) from public;

revoke all on function public.get_totals_by_sector_for_barangays(
  int,
  uuid[]
) from anon;

revoke all on function public.get_totals_by_sector_for_barangays(
  int,
  uuid[]
) from authenticated;

grant execute on function public.get_totals_by_sector_for_barangays(
  int,
  uuid[]
) to authenticated;

grant execute on function public.get_totals_by_sector_for_barangays(
  int,
  uuid[]
) to service_role;

commit;
