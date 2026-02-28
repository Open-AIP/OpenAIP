begin;

-- Rename project status value from 'planning' to 'proposed' for existing DBs.
update public.projects
set status = 'proposed'
where status = 'planning';

alter table public.projects
  alter column status set default 'proposed';

alter table public.projects
  drop constraint if exists chk_projects_status;

alter table public.projects
  add constraint chk_projects_status
  check (status in ('proposed', 'ongoing', 'completed', 'on_hold'));

commit;
