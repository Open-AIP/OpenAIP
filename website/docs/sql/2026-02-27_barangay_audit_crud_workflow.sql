begin;

-- =============================================================================
-- Barangay audit logging completion: CRUD trigger coverage + barangay feed RLS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) AIP CRUD audit trigger (barangay officials only)
-- -----------------------------------------------------------------------------
create or replace function public.trg_aips_activity_log_crud()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_actor_id uuid;
  v_actor_role text;
  v_actor_name text;
  v_action text;
  v_details text;
  v_entity_id uuid;
  v_fiscal_year int;
  v_status text;
  v_previous_status text;
  v_barangay_id uuid;
  v_city_id uuid;
  v_municipality_id uuid;
begin
  v_actor_id := public.current_user_id();
  v_actor_role := public.current_role_code();

  if v_actor_id is null or v_actor_role is null or v_actor_role <> 'barangay_official' then
    return coalesce(new, old);
  end if;

  select nullif(trim(p.full_name), '')
    into v_actor_name
  from public.profiles p
  where p.id = v_actor_id;

  if tg_op = 'INSERT' then
    v_action := 'aip_created';
    v_entity_id := new.id;
    v_fiscal_year := new.fiscal_year;
    v_status := new.status::text;
    v_previous_status := null;
    v_barangay_id := new.barangay_id;
    v_city_id := new.city_id;
    v_municipality_id := new.municipality_id;
    v_details := format('Created AIP record for fiscal year %s.', coalesce(new.fiscal_year::text, 'unknown'));
  elsif tg_op = 'UPDATE' then
    v_action := 'aip_updated';
    v_entity_id := new.id;
    v_fiscal_year := new.fiscal_year;
    v_status := new.status::text;
    v_previous_status := old.status::text;
    v_barangay_id := new.barangay_id;
    v_city_id := new.city_id;
    v_municipality_id := new.municipality_id;

    if new.status is distinct from old.status then
      v_details := format(
        'Updated AIP record for fiscal year %s (status: %s -> %s).',
        coalesce(new.fiscal_year::text, 'unknown'),
        coalesce(old.status::text, 'unknown'),
        coalesce(new.status::text, 'unknown')
      );
    else
      v_details := format('Updated AIP record for fiscal year %s.', coalesce(new.fiscal_year::text, 'unknown'));
    end if;
  else
    v_action := 'aip_deleted';
    v_entity_id := old.id;
    v_fiscal_year := old.fiscal_year;
    v_status := old.status::text;
    v_previous_status := null;
    v_barangay_id := old.barangay_id;
    v_city_id := old.city_id;
    v_municipality_id := old.municipality_id;
    v_details := format('Deleted AIP record for fiscal year %s.', coalesce(old.fiscal_year::text, 'unknown'));
  end if;

  perform public.log_activity(
    p_action => v_action,
    p_entity_table => 'aips',
    p_entity_id => v_entity_id,
    p_region_id => null,
    p_province_id => null,
    p_city_id => v_city_id,
    p_municipality_id => v_municipality_id,
    p_barangay_id => v_barangay_id,
    p_metadata => jsonb_build_object(
      'source', 'crud',
      'actor_name', coalesce(v_actor_name, 'Unknown'),
      'actor_position', 'Barangay Official',
      'details', v_details,
      'fiscal_year', v_fiscal_year,
      'status', v_status,
      'previous_status', v_previous_status
    )
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_aips_activity_log_crud on public.aips;
create trigger trg_aips_activity_log_crud
after insert or update or delete
on public.aips
for each row
execute function public.trg_aips_activity_log_crud();

-- -----------------------------------------------------------------------------
-- B) Project CRUD audit trigger (barangay officials only)
-- -----------------------------------------------------------------------------
create or replace function public.trg_projects_activity_log_crud()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_actor_id uuid;
  v_actor_role text;
  v_actor_name text;
  v_action text;
  v_details text;
  v_project_id uuid;
  v_aip_id uuid;
  v_aip_ref_code text;
  v_category text;
  v_barangay_id uuid;
  v_city_id uuid;
  v_municipality_id uuid;
begin
  v_actor_id := public.current_user_id();
  v_actor_role := public.current_role_code();

  if v_actor_id is null or v_actor_role is null or v_actor_role <> 'barangay_official' then
    return coalesce(new, old);
  end if;

  select nullif(trim(p.full_name), '')
    into v_actor_name
  from public.profiles p
  where p.id = v_actor_id;

  if tg_op = 'INSERT' then
    v_action := 'project_record_created';
    v_project_id := new.id;
    v_aip_id := new.aip_id;
    v_aip_ref_code := new.aip_ref_code;
    v_category := new.category::text;
    v_details := format('Created project record %s.', coalesce(new.aip_ref_code, new.id::text));
  elsif tg_op = 'UPDATE' then
    v_action := 'project_record_updated';
    v_project_id := new.id;
    v_aip_id := new.aip_id;
    v_aip_ref_code := new.aip_ref_code;
    v_category := new.category::text;
    v_details := format('Updated project record %s.', coalesce(new.aip_ref_code, new.id::text));
  else
    v_action := 'project_record_deleted';
    v_project_id := old.id;
    v_aip_id := old.aip_id;
    v_aip_ref_code := old.aip_ref_code;
    v_category := old.category::text;
    v_details := format('Deleted project record %s.', coalesce(old.aip_ref_code, old.id::text));
  end if;

  select a.barangay_id, a.city_id, a.municipality_id
    into v_barangay_id, v_city_id, v_municipality_id
  from public.aips a
  where a.id = v_aip_id;

  perform public.log_activity(
    p_action => v_action,
    p_entity_table => 'projects',
    p_entity_id => v_project_id,
    p_region_id => null,
    p_province_id => null,
    p_city_id => v_city_id,
    p_municipality_id => v_municipality_id,
    p_barangay_id => v_barangay_id,
    p_metadata => jsonb_build_object(
      'source', 'crud',
      'actor_name', coalesce(v_actor_name, 'Unknown'),
      'actor_position', 'Barangay Official',
      'details', v_details,
      'aip_id', v_aip_id,
      'aip_ref_code', v_aip_ref_code,
      'project_category', v_category
    )
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_projects_activity_log_crud on public.projects;
create trigger trg_projects_activity_log_crud
after insert or update or delete
on public.projects
for each row
execute function public.trg_projects_activity_log_crud();

-- -----------------------------------------------------------------------------
-- C) Feedback CRUD audit trigger (barangay officials only)
-- -----------------------------------------------------------------------------
create or replace function public.trg_feedback_activity_log_crud()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_actor_id uuid;
  v_actor_role text;
  v_actor_name text;
  v_action text;
  v_details text;
  v_feedback_id uuid;
  v_target_type text;
  v_kind text;
  v_parent_feedback_id uuid;
  v_aip_id uuid;
  v_project_id uuid;
  v_barangay_id uuid;
  v_city_id uuid;
  v_municipality_id uuid;
begin
  v_actor_id := public.current_user_id();
  v_actor_role := public.current_role_code();

  if v_actor_id is null or v_actor_role is null or v_actor_role <> 'barangay_official' then
    return coalesce(new, old);
  end if;

  select nullif(trim(p.full_name), '')
    into v_actor_name
  from public.profiles p
  where p.id = v_actor_id;

  if tg_op = 'INSERT' then
    v_action := 'feedback_created';
    v_feedback_id := new.id;
    v_target_type := new.target_type::text;
    v_kind := new.kind::text;
    v_parent_feedback_id := new.parent_feedback_id;
    v_aip_id := new.aip_id;
    v_project_id := new.project_id;
  elsif tg_op = 'UPDATE' then
    v_action := 'feedback_updated';
    v_feedback_id := new.id;
    v_target_type := new.target_type::text;
    v_kind := new.kind::text;
    v_parent_feedback_id := new.parent_feedback_id;
    v_aip_id := new.aip_id;
    v_project_id := new.project_id;
  else
    v_action := 'feedback_deleted';
    v_feedback_id := old.id;
    v_target_type := old.target_type::text;
    v_kind := old.kind::text;
    v_parent_feedback_id := old.parent_feedback_id;
    v_aip_id := old.aip_id;
    v_project_id := old.project_id;
  end if;

  if v_target_type = 'project' and v_project_id is not null then
    select p.aip_id into v_aip_id
    from public.projects p
    where p.id = v_project_id;
  end if;

  if v_aip_id is not null then
    select a.barangay_id, a.city_id, a.municipality_id
      into v_barangay_id, v_city_id, v_municipality_id
    from public.aips a
    where a.id = v_aip_id;
  end if;

  if v_action = 'feedback_created' then
    if v_parent_feedback_id is null then
      v_details := format('Created feedback entry (%s).', coalesce(v_kind, 'unknown'));
    else
      v_details := format('Created feedback reply (%s).', coalesce(v_kind, 'unknown'));
    end if;
  elsif v_action = 'feedback_updated' then
    v_details := format('Updated feedback entry (%s).', coalesce(v_kind, 'unknown'));
  else
    v_details := format('Deleted feedback entry (%s).', coalesce(v_kind, 'unknown'));
  end if;

  perform public.log_activity(
    p_action => v_action,
    p_entity_table => 'feedback',
    p_entity_id => v_feedback_id,
    p_region_id => null,
    p_province_id => null,
    p_city_id => v_city_id,
    p_municipality_id => v_municipality_id,
    p_barangay_id => v_barangay_id,
    p_metadata => jsonb_build_object(
      'source', 'crud',
      'actor_name', coalesce(v_actor_name, 'Unknown'),
      'actor_position', 'Barangay Official',
      'details', v_details,
      'target_type', v_target_type,
      'feedback_kind', v_kind,
      'parent_feedback_id', v_parent_feedback_id,
      'aip_id', v_aip_id,
      'project_id', v_project_id
    )
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_feedback_activity_log_crud on public.feedback;
create trigger trg_feedback_activity_log_crud
after insert or update or delete
on public.feedback
for each row
execute function public.trg_feedback_activity_log_crud();

-- -----------------------------------------------------------------------------
-- D) Barangay-official activity feed visibility
-- -----------------------------------------------------------------------------
drop policy if exists activity_log_select_policy on public.activity_log;
create policy activity_log_select_policy
on public.activity_log
for select
to authenticated
using (
  public.is_active_auth()
  and (
    public.is_admin()
    or (
      public.is_barangay_official()
      and actor_role = 'barangay_official'
      and barangay_id is not null
      and barangay_id = public.current_barangay_id()
    )
    or (
      (public.is_city_official() or public.is_municipal_official())
      and actor_id = public.current_user_id()
    )
  )
);

commit;
