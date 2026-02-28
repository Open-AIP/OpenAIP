begin;

-- =============================================================================
-- Projects add-information + updates backend support
-- - Adds project status + cover image path on public.projects
-- - Adds project_updates + project_update_media tables
-- - Enforces published-only read/write rules for updates/media
-- - Cleans up storage objects on row delete/replacement
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Extend projects with status + cover image pointer
-- -----------------------------------------------------------------------------
alter table public.projects
  add column if not exists status text not null default 'proposed';

alter table public.projects
  drop constraint if exists chk_projects_status;

alter table public.projects
  add constraint chk_projects_status
  check (status in ('proposed', 'ongoing', 'completed', 'on_hold'));

alter table public.projects
  add column if not exists image_url text null;

create index if not exists idx_projects_status
  on public.projects(status);

create index if not exists idx_projects_image_url_not_null
  on public.projects(image_url)
  where image_url is not null;

-- -----------------------------------------------------------------------------
-- 2) project_updates table
-- -----------------------------------------------------------------------------
create table if not exists public.project_updates (
  id uuid primary key default extensions.gen_random_uuid(),

  project_id uuid not null references public.projects(id) on delete cascade,
  aip_id uuid not null references public.aips(id) on delete cascade,

  title text not null,
  description text not null,
  progress_percent int not null default 0
    check (progress_percent >= 0 and progress_percent <= 100),
  attendance_count int null
    check (attendance_count is null or attendance_count >= 0),
  posted_by uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'active'
    check (status in ('active', 'flagged', 'removed')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_updates_project_id
  on public.project_updates(project_id);

create index if not exists idx_project_updates_aip_id
  on public.project_updates(aip_id);

create index if not exists idx_project_updates_created_at
  on public.project_updates(created_at desc);

drop trigger if exists trg_project_updates_set_updated_at on public.project_updates;
create trigger trg_project_updates_set_updated_at
before update on public.project_updates
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3) project_update_media table
-- -----------------------------------------------------------------------------
create table if not exists public.project_update_media (
  id uuid primary key default extensions.gen_random_uuid(),

  update_id uuid not null references public.project_updates(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,

  bucket_id text not null default 'project-media',
  object_name text not null,
  mime_type text not null,
  size_bytes bigint null check (size_bytes is null or size_bytes >= 0),

  created_at timestamptz not null default now()
);

create unique index if not exists uq_project_update_media_bucket_object
  on public.project_update_media(bucket_id, object_name);

create index if not exists idx_project_update_media_update_id
  on public.project_update_media(update_id);

create index if not exists idx_project_update_media_project_id
  on public.project_update_media(project_id);

-- -----------------------------------------------------------------------------
-- 4) Access helpers
-- -----------------------------------------------------------------------------
create or replace function public.can_read_published_project_update(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.projects pr
    join public.aips a on a.id = pr.aip_id
    where pr.id = p_project_id
      and a.status = 'published'
      and public.can_read_aip(a.id)
  );
$$;

create or replace function public.can_write_published_project_update(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.projects pr
    join public.aips a on a.id = pr.aip_id
    where pr.id = p_project_id
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

-- -----------------------------------------------------------------------------
-- 5) RLS policies
-- -----------------------------------------------------------------------------
alter table public.project_updates enable row level security;
alter table public.project_update_media enable row level security;

drop policy if exists project_updates_select_policy on public.project_updates;
create policy project_updates_select_policy
on public.project_updates
for select
to anon, authenticated
using (public.can_read_published_project_update(project_id));

drop policy if exists project_updates_insert_policy on public.project_updates;
create policy project_updates_insert_policy
on public.project_updates
for insert
to authenticated
with check (
  public.can_write_published_project_update(project_id)
  and posted_by = public.current_user_id()
);

drop policy if exists project_updates_update_policy on public.project_updates;
create policy project_updates_update_policy
on public.project_updates
for update
to authenticated
using (public.can_write_published_project_update(project_id))
with check (public.can_write_published_project_update(project_id));

drop policy if exists project_updates_delete_policy on public.project_updates;
create policy project_updates_delete_policy
on public.project_updates
for delete
to authenticated
using (public.can_write_published_project_update(project_id));

drop policy if exists project_update_media_select_policy on public.project_update_media;
create policy project_update_media_select_policy
on public.project_update_media
for select
to anon, authenticated
using (public.can_read_published_project_update(project_id));

drop policy if exists project_update_media_insert_policy on public.project_update_media;
create policy project_update_media_insert_policy
on public.project_update_media
for insert
to authenticated
with check (public.can_write_published_project_update(project_id));

drop policy if exists project_update_media_update_policy on public.project_update_media;
create policy project_update_media_update_policy
on public.project_update_media
for update
to authenticated
using (public.can_write_published_project_update(project_id))
with check (public.can_write_published_project_update(project_id));

drop policy if exists project_update_media_delete_policy on public.project_update_media;
create policy project_update_media_delete_policy
on public.project_update_media
for delete
to authenticated
using (public.can_write_published_project_update(project_id));

grant select on public.project_updates to anon, authenticated;
grant insert, update, delete on public.project_updates to authenticated;

grant select on public.project_update_media to anon, authenticated;
grant insert, update, delete on public.project_update_media to authenticated;

-- -----------------------------------------------------------------------------
-- 6) Storage cleanup: update media objects
-- -----------------------------------------------------------------------------
create or replace function public.project_update_media_delete_storage_object()
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

drop trigger if exists trg_project_update_media_delete_storage_object on public.project_update_media;
create trigger trg_project_update_media_delete_storage_object
after delete on public.project_update_media
for each row
execute function public.project_update_media_delete_storage_object();

-- -----------------------------------------------------------------------------
-- 7) Storage cleanup: projects cover image replacement/delete
-- -----------------------------------------------------------------------------
create or replace function public.projects_delete_cover_image_object()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, storage
as $$
declare
  v_old_path text;
  v_new_path text;
  v_bucket_id text;
begin
  v_old_path := nullif(btrim(old.image_url), '');
  if tg_op = 'UPDATE' then
    v_new_path := nullif(btrim(new.image_url), '');
  else
    v_new_path := null;
  end if;
  v_bucket_id := coalesce(
    nullif(current_setting('app.settings.project_media_bucket', true), ''),
    'project-media'
  );

  if v_old_path is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and v_old_path = v_new_path then
    return new;
  end if;

  begin
    delete from storage.objects
    where bucket_id = v_bucket_id
      and name = v_old_path;
  exception
    when others then
      if position('Direct deletion from storage tables is not allowed' in sqlerrm) > 0 then
        null;
      else
        raise;
      end if;
  end;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_projects_delete_cover_image_on_update on public.projects;
create trigger trg_projects_delete_cover_image_on_update
after update of image_url on public.projects
for each row
execute function public.projects_delete_cover_image_object();

drop trigger if exists trg_projects_delete_cover_image_on_delete on public.projects;
create trigger trg_projects_delete_cover_image_on_delete
after delete on public.projects
for each row
execute function public.projects_delete_cover_image_object();

commit;
