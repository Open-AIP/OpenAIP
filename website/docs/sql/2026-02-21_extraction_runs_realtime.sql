begin;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'extraction_runs'
  ) then
    alter publication supabase_realtime add table public.extraction_runs;
  end if;
end
$$;

commit;
