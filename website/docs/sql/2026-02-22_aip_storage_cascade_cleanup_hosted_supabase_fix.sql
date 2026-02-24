begin;

-- Hotfix for hosted Supabase guard:
-- "Direct deletion from storage tables is not allowed. Use the Storage API instead."
-- Keep trigger behavior best-effort so AIP/extraction row deletes do not fail.

create or replace function public.uploaded_files_delete_storage_object()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, storage
as $$
declare
  v_bucket_id text;
  v_object_name text;
begin
  v_bucket_id := nullif(btrim(old.bucket_id), '');
  v_object_name := nullif(btrim(old.object_name), '');

  if v_bucket_id is not null and v_object_name is not null then
    begin
      delete from storage.objects
      where bucket_id = v_bucket_id
        and name = v_object_name;
    exception
      when others then
        if position('Direct deletion from storage tables is not allowed' in sqlerrm) > 0 then
          null;
        else
          raise;
        end if;
    end;
  end if;

  return old;
end;
$$;

create or replace function public.extraction_artifacts_delete_storage_object()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, storage
as $$
declare
  v_storage_path text;
  v_bucket_id text;
begin
  if old.artifact_json is null or jsonb_typeof(old.artifact_json) <> 'object' then
    return old;
  end if;

  v_storage_path := nullif(btrim(old.artifact_json ->> 'storage_path'), '');
  if v_storage_path is null then
    return old;
  end if;

  v_bucket_id := coalesce(
    nullif(btrim(old.artifact_json ->> 'storage_bucket'), ''),
    nullif(btrim(old.artifact_json ->> 'storage_bucket_id'), ''),
    nullif(btrim(old.artifact_json ->> 'bucket_id'), ''),
    nullif(btrim(old.artifact_json ->> 'bucket'), ''),
    'aip-artifacts'
  );

  begin
    delete from storage.objects
    where bucket_id = v_bucket_id
      and name = v_storage_path;
  exception
    when others then
      if position('Direct deletion from storage tables is not allowed' in sqlerrm) > 0 then
        null;
      else
        raise;
      end if;
  end;

  return old;
end;
$$;

commit;
