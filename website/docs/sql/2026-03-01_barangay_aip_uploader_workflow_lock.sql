begin;

-- ============================================================================
-- Barangay AIP workflow lock: only the current uploader (or created_by fallback)
-- can modify barangay draft/for_revision workflows.
-- ============================================================================

create or replace function public.can_manage_barangay_aip(p_aip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.aips a
    left join lateral (
      select uf.uploaded_by
      from public.uploaded_files uf
      where uf.aip_id = a.id
        and uf.is_current = true
      order by uf.created_at desc, uf.id desc
      limit 1
    ) current_file on true
    where a.id = p_aip_id
      and a.barangay_id is not null
      and public.is_active_auth()
      and public.is_barangay_official()
      and a.barangay_id = public.current_barangay_id()
      and coalesce(current_file.uploaded_by, a.created_by) = public.current_user_id()
  );
$$;

create or replace function public.can_edit_aip(p_aip_id uuid)
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
      and (
        public.is_admin()
        or (
          public.is_active_auth()
          and a.status in ('draft','for_revision')
          and (
            (
              public.is_barangay_official()
              and a.barangay_id is not null
              and a.barangay_id = public.current_barangay_id()
              and public.can_manage_barangay_aip(a.id)
            )
            or
            (public.is_city_official() and a.city_id is not null and a.city_id = public.current_city_id())
            or
            (public.is_municipal_official() and a.municipality_id is not null and a.municipality_id = public.current_municipality_id())
          )
        )
      )
  );
$$;

create or replace function public.can_upload_aip_pdf(p_aip_id uuid)
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
      and (
        public.is_admin()
        or (
          a.status in ('draft','for_revision')
          and (
            (
              public.is_barangay_official()
              and a.barangay_id is not null
              and a.barangay_id = public.current_barangay_id()
              and public.can_manage_barangay_aip(a.id)
            )
            or
            (public.is_city_official() and a.city_id is not null and a.city_id = public.current_city_id())
            or
            (public.is_municipal_official() and a.municipality_id is not null and a.municipality_id = public.current_municipality_id())
          )
        )
      )
  );
$$;

drop policy if exists aips_update_policy on public.aips;
create policy aips_update_policy
on public.aips
for update
to authenticated
using (
  public.is_active_auth()
  and (
    public.is_admin()
    or (
      public.is_barangay_official()
      and barangay_id is not null
      and barangay_id = public.current_barangay_id()
      and public.can_manage_barangay_aip(id)
    )
    or (
      public.is_city_official()
      and city_id is not null
      and city_id = public.current_city_id()
    )
    or (
      public.is_municipal_official()
      and municipality_id is not null
      and municipality_id = public.current_municipality_id()
    )
    or (
      public.is_city_official()
      and barangay_id is not null
      and public.barangay_in_my_city(barangay_id)
    )
    or (
      public.is_municipal_official()
      and barangay_id is not null
      and public.barangay_in_my_municipality(barangay_id)
    )
  )
)
with check (
  public.is_active_auth()
  and (
    public.is_admin()
    or (
      public.is_barangay_official()
      and barangay_id is not null
      and barangay_id = public.current_barangay_id()
      and city_id is null and municipality_id is null
      and public.can_manage_barangay_aip(id)
    )
    or (
      public.is_city_official()
      and city_id is not null
      and city_id = public.current_city_id()
      and barangay_id is null and municipality_id is null
    )
    or (
      public.is_municipal_official()
      and municipality_id is not null
      and municipality_id = public.current_municipality_id()
      and barangay_id is null and city_id is null
    )
    or (
      public.is_city_official()
      and barangay_id is not null
      and public.barangay_in_my_city(barangay_id)
      and city_id is null and municipality_id is null
    )
    or (
      public.is_municipal_official()
      and barangay_id is not null
      and public.barangay_in_my_municipality(barangay_id)
      and city_id is null and municipality_id is null
    )
  )
);

-- Keep read visibility for uploaded file metadata decoupled from upload/edit rights.
drop policy if exists uploaded_files_select_policy on public.uploaded_files;
create policy uploaded_files_select_policy
on public.uploaded_files
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.aips a
    where a.id = uploaded_files.aip_id
      and (
        a.status <> 'draft'
        or (
          public.is_active_auth()
          and public.can_read_aip(a.id)
        )
      )
  )
);

commit;
