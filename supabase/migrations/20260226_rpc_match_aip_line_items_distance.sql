begin;

drop function if exists public.match_aip_line_items(
  extensions.vector,
  int,
  int,
  uuid
);

create or replace function public.match_aip_line_items(
  p_query_embedding extensions.vector(3072),
  p_match_count int default 20,
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
  page_no int,
  row_no int,
  table_no int,
  distance double precision,
  score double precision
)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select
    li.id as line_item_id,
    li.aip_id,
    li.fiscal_year,
    li.barangay_id,
    li.aip_ref_code,
    li.program_project_title,
    li.page_no,
    li.row_no,
    li.table_no,
    (e.embedding OPERATOR(extensions.<->) p_query_embedding) as distance,
    1.0 / (1.0 + (e.embedding OPERATOR(extensions.<->) p_query_embedding)) as score
  from public.aip_line_items li
  join public.aip_line_item_embeddings e on e.line_item_id = li.id
  join public.aips a on a.id = li.aip_id
  where a.status = 'published'
    and (p_fiscal_year is null or li.fiscal_year = p_fiscal_year)
    and (p_barangay_id is null or li.barangay_id = p_barangay_id)
  order by e.embedding OPERATOR(extensions.<->) p_query_embedding asc
  limit greatest(1, least(coalesce(p_match_count, 20), 80));
$$;

revoke all on function public.match_aip_line_items(
  extensions.vector,
  int,
  int,
  uuid
) from public;

revoke all on function public.match_aip_line_items(
  extensions.vector,
  int,
  int,
  uuid
) from anon;

revoke all on function public.match_aip_line_items(
  extensions.vector,
  int,
  int,
  uuid
) from authenticated;

grant execute on function public.match_aip_line_items(
  extensions.vector,
  int,
  int,
  uuid
) to authenticated;

grant execute on function public.match_aip_line_items(
  extensions.vector,
  int,
  int,
  uuid
) to service_role;

commit;
