begin;

-- Trigger-driven async indexing dispatch for newly published AIPs.
-- Required runtime config:
--   app.embed_categorize_url
-- Optional local/dev fallback:
--   app.embed_categorize_secret
-- Preferred secret source:
--   vault.decrypted_secrets name = 'embed_categorize_job_secret'

create extension if not exists pg_net;

create or replace function public.on_aip_published_embed_categorize()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
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
