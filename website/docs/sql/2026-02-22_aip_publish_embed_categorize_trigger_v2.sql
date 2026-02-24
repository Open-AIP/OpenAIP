begin;

-- Patch: move pg_net out of public schema to silence Supabase Security Advisor warning
-- "Extension pg_net is installed in the public schema. Move it to another schema."

-- 1) Ensure target schema exists
create schema if not exists extensions;

-- 2) Move extension if it currently lives in public
--    This is the safest approach because it preserves the extension without re-creating.
do $$
begin
  if exists (
    select 1
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'pg_net'
      and n.nspname = 'public'
  ) then
    begin
      execute 'alter extension pg_net set schema extensions';
    exception
      when others then
        -- Fallback path: re-install under extensions (only if ALTER fails for some reason)
        -- NOTE: This may fail if other objects depend on pg_net; in that case, remove the DROP and investigate deps.
        execute 'drop extension pg_net';
        execute 'create extension pg_net with schema extensions';
    end;
  end if;
end
$$;

-- 3) (Optional) Recreate trigger function with explicit schema qualification for net
--    Your function already uses net.http_post and search_path = pg_catalog, which is OK.
--    This is just a no-op refresh to ensure it compiles after extension move.
create or replace function public.on_aip_published_embed_categorize()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_url text := current_setting('app.embed_categorize_url', true);
  v_secret text := null;
  v_scope_type text := null;
  v_scope_id uuid := null;
  v_payload jsonb;
begin
  if tg_op = 'UPDATE'
     and old.status is distinct from new.status
     and new.status = 'published' then

    begin
      select ds.decrypted_secret
      into v_secret
      from vault.decrypted_secrets ds
      where ds.name = 'embed_categorize_job_secret'
      order by ds.created_at desc nulls last
      limit 1;
    exception
      when others then
        v_secret := null;
    end;

    if v_secret is null or btrim(v_secret) = '' then
      v_secret := current_setting('app.embed_categorize_secret', true);
    end if;

    if new.barangay_id is not null then
      v_scope_type := 'barangay';
      v_scope_id := new.barangay_id;
    elsif new.city_id is not null then
      v_scope_type := 'city';
      v_scope_id := new.city_id;
    elsif new.municipality_id is not null then
      v_scope_type := 'municipality';
      v_scope_id := new.municipality_id;
    else
      v_scope_type := 'unknown';
      v_scope_id := null;
    end if;

    if v_url is null
       or btrim(v_url) = ''
       or v_secret is null
       or btrim(v_secret) = '' then
      return new;
    end if;

    v_payload := jsonb_build_object(
      'aip_id', new.id,
      'published_at', new.published_at,
      'fiscal_year', new.fiscal_year,
      'scope_type', v_scope_type,
      'scope_id', v_scope_id,
      'barangay_id', new.barangay_id,
      'city_id', new.city_id,
      'municipality_id', new.municipality_id
    );

    begin
      perform net.http_post(
        url := v_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Job-Secret', v_secret
        ),
        body := v_payload
      );
    exception
      when others then
        raise warning 'on_aip_published_embed_categorize dispatch failed for aip %: %', new.id, SQLERRM;
    end;
  end if;

  return new;
end;
$$;

commit;