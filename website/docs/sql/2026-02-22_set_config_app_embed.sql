create schema if not exists app;

create table if not exists app.settings (
  key text primary key,
  value text not null
);

insert into app.settings(key, value) values
  ('embed_categorize_url', 'https://<YOUR_PROJECT_URL>/functions/v1/embed_categorize_artifact')
on conflict (key) do update set value = excluded.value;

create or replace function app.embed_categorize_url()
returns text
language sql
stable
as $$
  select value from app.settings where key = 'embed_categorize_url'
$$;