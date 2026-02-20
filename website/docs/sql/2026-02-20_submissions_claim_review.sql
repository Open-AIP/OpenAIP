do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'review_action'
      and e.enumlabel = 'claim_review'
  ) then
    alter type public.review_action add value 'claim_review';
  end if;
end
$$;

create or replace function public.claim_aip_review(p_aip_id uuid)
returns table (
  aip_id uuid,
  reviewer_id uuid,
  status public.aip_status
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_aip public.aips%rowtype;
  v_latest record;
  v_actor_id uuid;
  v_has_latest boolean := false;
begin
  if p_aip_id is null then
    raise exception 'AIP id is required.';
  end if;

  if not public.is_active_auth() then
    raise exception 'Unauthorized.';
  end if;

  if not (public.is_admin() or public.is_city_official()) then
    raise exception 'Unauthorized.';
  end if;

  v_actor_id := public.current_user_id();
  if v_actor_id is null then
    raise exception 'Unauthorized.';
  end if;

  select *
    into v_aip
  from public.aips
  where id = p_aip_id
  for update;

  if not found then
    raise exception 'AIP not found.';
  end if;

  if v_aip.barangay_id is null then
    raise exception 'AIP is not a barangay submission.';
  end if;

  if v_aip.status not in ('pending_review', 'under_review') then
    raise exception 'AIP is not available for review claim.';
  end if;

  if not public.is_admin() and not public.barangay_in_my_city(v_aip.barangay_id) then
    raise exception 'AIP is outside jurisdiction.';
  end if;

  select r.aip_id, r.reviewer_id, r.action, r.created_at, r.id
    into v_latest
  from public.aip_reviews r
  where r.aip_id = p_aip_id
  order by r.created_at desc, r.id desc
  limit 1;
  v_has_latest := found;

  if v_has_latest
     and v_latest.action = 'claim_review'
     and v_latest.reviewer_id <> v_actor_id
     and not public.is_admin() then
    raise exception 'This AIP is assigned to another reviewer.';
  end if;

  if v_aip.status = 'pending_review' then
    update public.aips
    set status = 'under_review'
    where id = v_aip.id;
    v_aip.status := 'under_review';
  end if;

  if not v_has_latest
     or v_latest.action <> 'claim_review'
     or v_latest.reviewer_id <> v_actor_id then
    insert into public.aip_reviews (aip_id, action, note, reviewer_id)
    values (v_aip.id, 'claim_review', null, v_actor_id);
  end if;

  return query
  select v_aip.id, v_actor_id, v_aip.status;
end;
$$;

grant execute on function public.claim_aip_review(uuid) to authenticated;
