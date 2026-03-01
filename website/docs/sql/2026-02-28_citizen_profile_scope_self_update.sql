begin;

-- =============================================================================
-- Citizen profile self-service scope update
-- - Keep non-admin protections on role/email/is_active and row ownership.
-- - Allow citizens to update their own barangay scope + full_name.
-- - Keep non-citizen non-admin scope updates admin-managed.
-- =============================================================================

create or replace function public.enforce_profile_update_rules()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_is_admin boolean;
begin
  v_uid := (select auth.uid());
  v_is_admin := (public.current_role() = 'admin'::public.role_type);

  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if v_is_admin then
    return new;
  end if;

  if old.id <> v_uid then
    raise exception 'Not permitted';
  end if;

  if new.role is distinct from old.role then
    raise exception 'role is admin-managed';
  end if;

  if new.email is distinct from old.email then
    raise exception 'email is admin-managed';
  end if;

  if new.is_active is distinct from old.is_active then
    raise exception 'is_active is admin-managed';
  end if;

  -- Citizen self-service scope update:
  -- app writes barangay scope and keeps city/municipality null for citizen profiles.
  if old.role = 'citizen'::public.role_type then
    if new.city_id is not null or new.municipality_id is not null then
      raise exception 'scope is admin-managed';
    end if;
    return new;
  end if;

  if new.barangay_id is distinct from old.barangay_id
     or new.city_id is distinct from old.city_id
     or new.municipality_id is distinct from old.municipality_id then
    raise exception 'scope is admin-managed';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_enforce_update_rules on public.profiles;
create trigger trg_profiles_enforce_update_rules
before update on public.profiles
for each row execute function public.enforce_profile_update_rules();

commit;
