begin;

drop function if exists public.get_top_projects(
  int,
  int,
  uuid
);

create or replace function public.get_top_projects(
  p_limit int default 10,
  p_fiscal_year int default null,
  p_barangay_id uuid default null
)
returns table (
  line_item_id uuid,
  aip_id uuid,
  fiscal_year int,
  barangay_id uuid,
  aip_ref_code text,
  program_project_title text,
  fund_source text,
  start_date date,
  end_date date,
  total numeric,
  page_no int,
  row_no int,
  table_no int
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    li.id as line_item_id,
    li.aip_id,
    li.fiscal_year,
    li.barangay_id,
    li.aip_ref_code,
    li.program_project_title,
    li.fund_source,
    li.start_date,
    li.end_date,
    li.total,
    li.page_no,
    li.row_no,
    li.table_no
  from public.aip_line_items li
  join public.aips a on a.id = li.aip_id
  where a.status = 'published'
    and li.total is not null
    and (p_fiscal_year is null or li.fiscal_year = p_fiscal_year)
    and (p_barangay_id is null or li.barangay_id = p_barangay_id)
  order by li.total desc nulls last
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

revoke all on function public.get_top_projects(
  int,
  int,
  uuid
) from public;

revoke all on function public.get_top_projects(
  int,
  int,
  uuid
) from anon;

revoke all on function public.get_top_projects(
  int,
  int,
  uuid
) from authenticated;

grant execute on function public.get_top_projects(
  int,
  int,
  uuid
) to authenticated;

grant execute on function public.get_top_projects(
  int,
  int,
  uuid
) to service_role;

commit;
