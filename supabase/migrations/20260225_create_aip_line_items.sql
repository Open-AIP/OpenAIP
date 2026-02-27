begin;

create table if not exists public.aip_line_items (
  id uuid primary key default extensions.gen_random_uuid(),
  aip_id uuid not null references public.aips(id) on delete cascade,
  fiscal_year int not null,
  barangay_id uuid null references public.barangays(id) on delete set null,
  aip_ref_code text null,
  sector_code text null,
  sector_name text null,
  program_project_title text not null,
  implementing_agency text null,
  start_date date null,
  end_date date null,
  fund_source text null,
  ps numeric null,
  mooe numeric null,
  co numeric null,
  fe numeric null,
  total numeric null,
  expected_output text null,
  page_no int null,
  row_no int null,
  table_no int null,
  created_at timestamptz not null default now()
);

create index if not exists idx_aip_line_items_aip_id
  on public.aip_line_items(aip_id);

create index if not exists idx_aip_line_items_barangay_fiscal_year
  on public.aip_line_items(barangay_id, fiscal_year);

create index if not exists idx_aip_line_items_fiscal_year
  on public.aip_line_items(fiscal_year);

create index if not exists idx_aip_line_items_title
  on public.aip_line_items(program_project_title);

create unique index if not exists uq_aip_line_items_aip_ref
  on public.aip_line_items(aip_id, aip_ref_code)
  where aip_ref_code is not null;

create unique index if not exists uq_aip_line_items_aip_provenance
  on public.aip_line_items(aip_id, page_no, row_no, table_no)
  where aip_ref_code is null
    and page_no is not null
    and row_no is not null
    and table_no is not null;

alter table public.aip_line_items enable row level security;

drop policy if exists aip_line_items_select_policy on public.aip_line_items;
create policy aip_line_items_select_policy
on public.aip_line_items
for select
to authenticated
using (
  public.is_active_auth()
  and public.can_read_aip(aip_id)
);

grant select on public.aip_line_items to authenticated;

commit;
