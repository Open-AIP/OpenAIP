begin;

-- ============================================================================
-- Account Administration hardening
-- Date: 2026-02-13
-- Purpose:
-- 1) Prevent deactivating/demoting/deleting the last active admin.
-- 2) Keep guardrails in the database layer (not only in application code).
-- ============================================================================

create or replace function public.prevent_last_active_admin_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_active_admin_count bigint;
begin
  -- UPDATE path:
  -- Block if this row is currently an active admin and update would remove that.
  if tg_op = 'UPDATE' then
    if old.role = 'admin'::public.role_type and old.is_active = true then
      if not (new.role = 'admin'::public.role_type and new.is_active = true) then
        select count(*)::bigint
          into v_active_admin_count
        from public.profiles p
        where p.role = 'admin'::public.role_type
          and p.is_active = true;

        if v_active_admin_count <= 1 then
          raise exception 'Cannot modify the last active admin account.';
        end if;
      end if;
    end if;
    return new;
  end if;

  -- DELETE path:
  -- Block deleting the last active admin.
  if tg_op = 'DELETE' then
    if old.role = 'admin'::public.role_type and old.is_active = true then
      select count(*)::bigint
        into v_active_admin_count
      from public.profiles p
      where p.role = 'admin'::public.role_type
        and p.is_active = true;

      if v_active_admin_count <= 1 then
        raise exception 'Cannot delete the last active admin account.';
      end if;
    end if;
    return old;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_profiles_prevent_last_active_admin_update on public.profiles;
create trigger trg_profiles_prevent_last_active_admin_update
before update of role, is_active
on public.profiles
for each row
execute function public.prevent_last_active_admin_mutation();

drop trigger if exists trg_profiles_prevent_last_active_admin_delete on public.profiles;
create trigger trg_profiles_prevent_last_active_admin_delete
before delete
on public.profiles
for each row
execute function public.prevent_last_active_admin_mutation();

commit;
