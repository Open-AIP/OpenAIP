begin;

-- =============================================================================
-- Align add-information write policies with published-only backend route guards.
-- Existing policies relied on can_edit_aip/can_edit_project (draft/for_revision),
-- which blocked barangay/city officials from writing on published AIPs.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Published-scope write helpers
-- -----------------------------------------------------------------------------
create or replace function public.can_write_published_aip(p_aip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.aips a
    where a.id = p_aip_id
      and a.status = 'published'
      and public.is_active_auth()
      and (
        public.is_admin()
        or (
          public.is_barangay_official()
          and a.barangay_id is not null
          and a.barangay_id = public.current_barangay_id()
        )
        or (
          public.is_city_official()
          and a.city_id is not null
          and a.city_id = public.current_city_id()
        )
      )
  );
$$;

create or replace function public.can_write_published_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.projects pr
    where pr.id = p_project_id
      and public.can_write_published_aip(pr.aip_id)
  );
$$;

create or replace function public.can_write_published_project_update(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.can_write_published_project(p_project_id);
$$;

-- -----------------------------------------------------------------------------
-- 2) Projects update policy (insert/delete unchanged)
-- -----------------------------------------------------------------------------
drop policy if exists projects_update_policy on public.projects;
create policy projects_update_policy
on public.projects
for update
to authenticated
using (
  public.is_active_auth()
  and (
    public.can_edit_aip(aip_id)
    or public.can_write_published_aip(aip_id)
  )
)
with check (
  public.is_active_auth()
  and (
    public.can_edit_aip(aip_id)
    or public.can_write_published_aip(aip_id)
  )
);

-- -----------------------------------------------------------------------------
-- 3) Health details add-information write policies (delete unchanged)
-- -----------------------------------------------------------------------------
drop policy if exists health_details_insert_policy on public.health_project_details;
create policy health_details_insert_policy
on public.health_project_details
for insert
to authenticated
with check (
  public.is_active_auth()
  and (
    public.can_edit_project(project_id)
    or public.can_write_published_project(project_id)
  )
  and (updated_by is null or updated_by = public.current_user_id())
);

drop policy if exists health_details_update_policy on public.health_project_details;
create policy health_details_update_policy
on public.health_project_details
for update
to authenticated
using (
  public.is_active_auth()
  and (
    public.can_edit_project(project_id)
    or public.can_write_published_project(project_id)
  )
)
with check (
  public.is_active_auth()
  and (
    public.can_edit_project(project_id)
    or public.can_write_published_project(project_id)
  )
);

-- -----------------------------------------------------------------------------
-- 4) Infrastructure details add-information write policies (delete unchanged)
-- -----------------------------------------------------------------------------
drop policy if exists infra_details_insert_policy on public.infrastructure_project_details;
create policy infra_details_insert_policy
on public.infrastructure_project_details
for insert
to authenticated
with check (
  public.is_active_auth()
  and (
    public.can_edit_project(project_id)
    or public.can_write_published_project(project_id)
  )
  and (updated_by is null or updated_by = public.current_user_id())
);

drop policy if exists infra_details_update_policy on public.infrastructure_project_details;
create policy infra_details_update_policy
on public.infrastructure_project_details
for update
to authenticated
using (
  public.is_active_auth()
  and (
    public.can_edit_project(project_id)
    or public.can_write_published_project(project_id)
  )
)
with check (
  public.is_active_auth()
  and (
    public.can_edit_project(project_id)
    or public.can_write_published_project(project_id)
  )
);

commit;

