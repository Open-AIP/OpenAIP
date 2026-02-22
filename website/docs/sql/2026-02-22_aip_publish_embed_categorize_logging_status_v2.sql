begin;

create schema if not exists extensions;
create extension if not exists pg_net with schema extensions;

create or replace function public.dispatch_embed_categorize_for_aip(p_aip_id uuid)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_aip public.aips%rowtype;
  v_url text := nullif(current_setting('app.embed_categorize_url', true), '');
  v_secret text := null;
  v_scope_type text := 'unknown';
  v_scope_id uuid := null;
  v_payload jsonb;
  v_request_id bigint := null;
begin
  -- Hosted-safe fallback: app.settings + app.embed_categorize_url()
  if v_url is null then
    begin
      select nullif(app.embed_categorize_url(), '') into v_url;
    exception
      when undefined_function or invalid_schema_name then
        v_url := null;
      when others then
        v_url := null;
    end;
  end if;

  select *
  into v_aip
  from public.aips
  where id = p_aip_id;

  if not found then
    raise warning 'dispatch_embed_categorize_for_aip aip % not found', p_aip_id;
    return null;
  end if;

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

  if v_aip.barangay_id is not null then
    v_scope_type := 'barangay';
    v_scope_id := v_aip.barangay_id;
  elsif v_aip.city_id is not null then
    v_scope_type := 'city';
    v_scope_id := v_aip.city_id;
  elsif v_aip.municipality_id is not null then
    v_scope_type := 'municipality';
    v_scope_id := v_aip.municipality_id;
  end if;

  if v_url is null or btrim(v_url) = '' then
    raise warning 'dispatch_embed_categorize_for_aip missing app.embed_categorize_url/app.embed_categorize_url() for aip %', p_aip_id;
    return null;
  end if;

  if v_secret is null or btrim(v_secret) = '' then
    raise warning 'dispatch_embed_categorize_for_aip missing secret for aip %', p_aip_id;
    return null;
  end if;

  v_payload := jsonb_build_object(
    'aip_id', v_aip.id,
    'published_at', v_aip.published_at,
    'fiscal_year', v_aip.fiscal_year,
    'scope_type', v_scope_type,
    'scope_id', v_scope_id,
    'barangay_id', v_aip.barangay_id,
    'city_id', v_aip.city_id,
    'municipality_id', v_aip.municipality_id
  );

  v_request_id := net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Job-Secret', v_secret
    ),
    body := v_payload
  );

  raise log 'dispatch_embed_categorize_for_aip queued aip %, request_id %', p_aip_id, v_request_id;
  return v_request_id;
exception
  when others then
    raise warning 'dispatch_embed_categorize_for_aip failed for aip %: %', p_aip_id, sqlerrm;
    return null;
end;
$$;

revoke all on function public.dispatch_embed_categorize_for_aip(uuid) from public;
revoke all on function public.dispatch_embed_categorize_for_aip(uuid) from anon;
revoke all on function public.dispatch_embed_categorize_for_aip(uuid) from authenticated;
grant execute on function public.dispatch_embed_categorize_for_aip(uuid) to service_role;

create or replace function public.on_aip_published_embed_categorize()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if tg_op = 'UPDATE'
     and old.status is distinct from new.status
     and new.status = 'published' then
    begin
      perform public.dispatch_embed_categorize_for_aip(new.id);
    exception
      when others then
        raise warning 'on_aip_published_embed_categorize dispatch failed for aip %: %', new.id, sqlerrm;
    end;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_aip_published_embed_categorize on public.aips;
create trigger trg_aip_published_embed_categorize
after update of status
on public.aips
for each row
execute function public.on_aip_published_embed_categorize();

commit;
