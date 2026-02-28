-- Ensure app settings schema/table exists and is writable by service role clients.
create schema if not exists app;

create table if not exists app.settings (
  key text primary key,
  value text not null
);

grant usage on schema app to service_role;
grant select, insert, update, delete on table app.settings to service_role;
