begin;

create table if not exists public.aip_totals (
  id uuid primary key default extensions.gen_random_uuid(),
  aip_id uuid not null references public.aips(id) on delete cascade,
  fiscal_year int not null,
  barangay_id uuid null references public.barangays(id) on delete set null,
  city_id uuid null references public.cities(id) on delete set null,
  municipality_id uuid null references public.municipalities(id) on delete set null,
  total_investment_program numeric not null,
  currency text not null default 'PHP',
  page_no int null,
  evidence_text text not null,
  source_label text not null default 'pdf_total_line',
  created_at timestamptz not null default now(),
  constraint uq_aip_totals_aip_source unique (aip_id, source_label),
  constraint chk_aip_totals_exactly_one_scope check (
    ((barangay_id is not null)::int + (city_id is not null)::int + (municipality_id is not null)::int) = 1
  )
);

create index if not exists idx_aip_totals_aip_id
  on public.aip_totals(aip_id);

create index if not exists idx_aip_totals_scope_fiscal
  on public.aip_totals(barangay_id, city_id, municipality_id, fiscal_year);

alter table public.aip_totals enable row level security;

drop policy if exists aip_totals_select_policy on public.aip_totals;
create policy aip_totals_select_policy
on public.aip_totals
for select
to authenticated
using (
  public.is_active_auth()
);

grant select on public.aip_totals to authenticated;

commit;
