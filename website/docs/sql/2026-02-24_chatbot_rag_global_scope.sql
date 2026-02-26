begin;

-- =============================================================================
-- Chatbot hardening: global published retrieval + assistant citation guardrails
-- + DB-backed chat rate limits + retention helper
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Enforce citations for assistant messages (including refusals)
-- -----------------------------------------------------------------------------
alter table public.chat_messages
  drop constraint if exists chk_chat_messages_assistant_citations_required;

alter table public.chat_messages
  add constraint chk_chat_messages_assistant_citations_required check (
    role <> 'assistant'
    or (
      citations is not null
      and jsonb_typeof(citations) = 'array'
      and jsonb_array_length(citations) > 0
    )
  );

-- -----------------------------------------------------------------------------
-- 2) Retrieval RPC over published AIP chunks
--    Default: global published scope
--    Optional: own barangay or named scope targets (union)
-- -----------------------------------------------------------------------------
drop function if exists public.match_published_aip_chunks(
  extensions.vector,
  int,
  double precision,
  text,
  uuid,
  jsonb
);

create or replace function public.match_published_aip_chunks(
  query_embedding extensions.vector(3072),
  match_count int default 8,
  min_similarity double precision default 0.0,
  scope_mode text default 'global',
  own_barangay_id uuid default null,
  scope_targets jsonb default '[]'::jsonb
)
returns table (
  source_id text,
  chunk_id uuid,
  content text,
  similarity double precision,
  aip_id uuid,
  fiscal_year int,
  published_at timestamptz,
  scope_type text,
  scope_id uuid,
  scope_name text,
  metadata jsonb
)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
with params as (
  select
    greatest(1, least(coalesce(match_count, 8), 30)) as k,
    coalesce(min_similarity, 0.0) as sim_floor,
    lower(coalesce(scope_mode, 'global')) as mode
),
targets as (
  select
    lower(nullif(item ->> 'scope_type', '')) as scope_type,
    nullif(item ->> 'scope_id', '')::uuid as scope_id
  from jsonb_array_elements(coalesce(scope_targets, '[]'::jsonb)) item
  where nullif(item ->> 'scope_id', '') is not null
),
rows_scoped as (
  select
    c.id as chunk_id,
    c.chunk_text as content,
    c.metadata,
    a.id as aip_id,
    a.fiscal_year,
    a.published_at,
    case
      when a.barangay_id is not null then 'barangay'
      when a.city_id is not null then 'city'
      when a.municipality_id is not null then 'municipality'
      else 'unknown'
    end as scope_type,
    case
      when a.barangay_id is not null then a.barangay_id
      when a.city_id is not null then a.city_id
      when a.municipality_id is not null then a.municipality_id
      else null
    end as scope_id,
    coalesce(b.name, ci.name, m.name, 'Unknown Scope') as scope_name,
    1 - (e.embedding OPERATOR(extensions.<=>) query_embedding) as similarity
  from public.aip_chunks c
  join public.aip_chunk_embeddings e on e.chunk_id = c.id
  join public.aips a on a.id = c.aip_id
  left join public.barangays b on b.id = a.barangay_id
  left join public.cities ci on ci.id = a.city_id
  left join public.municipalities m on m.id = a.municipality_id
  cross join params p
  where a.status = 'published'
    and (
      p.mode = 'global'
      or (
        p.mode = 'own_barangay'
        and own_barangay_id is not null
        and a.barangay_id = own_barangay_id
      )
      or (
        p.mode = 'named_scopes'
        and exists (
          select 1
          from targets t
          where
            (t.scope_type = 'barangay' and a.barangay_id = t.scope_id)
            or (t.scope_type = 'city' and a.city_id = t.scope_id)
            or (t.scope_type = 'municipality' and a.municipality_id = t.scope_id)
        )
      )
    )
),
ranked as (
  select *
  from rows_scoped
  where similarity >= (select sim_floor from params)
  order by similarity desc, chunk_id
  limit (select k from params)
)
select
  'S' || row_number() over (order by similarity desc, chunk_id) as source_id,
  chunk_id,
  content,
  similarity,
  aip_id,
  fiscal_year,
  published_at,
  scope_type,
  scope_id,
  scope_name,
  metadata
from ranked;
$$;

revoke all on function public.match_published_aip_chunks(
  extensions.vector,
  int,
  double precision,
  text,
  uuid,
  jsonb
) from public;
revoke all on function public.match_published_aip_chunks(
  extensions.vector,
  int,
  double precision,
  text,
  uuid,
  jsonb
) from anon;
revoke all on function public.match_published_aip_chunks(
  extensions.vector,
  int,
  double precision,
  text,
  uuid,
  jsonb
) from authenticated;
grant execute on function public.match_published_aip_chunks(
  extensions.vector,
  int,
  double precision,
  text,
  uuid,
  jsonb
) to service_role;

-- -----------------------------------------------------------------------------
-- 3) DB-backed rate-limit event log
-- -----------------------------------------------------------------------------
create table if not exists public.chat_rate_events (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  route text not null default 'barangay_chat_message',
  event_status text not null check (event_status in ('accepted', 'rejected_minute', 'rejected_day')),
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_rate_events_user_created_at
  on public.chat_rate_events(user_id, created_at desc);

create index if not exists idx_chat_rate_events_created_at
  on public.chat_rate_events(created_at desc);

alter table public.chat_rate_events enable row level security;

drop policy if exists chat_rate_events_select_admin_only on public.chat_rate_events;
create policy chat_rate_events_select_admin_only
on public.chat_rate_events
for select
to authenticated
using (
  public.is_active_auth()
  and public.is_admin()
);

grant select on public.chat_rate_events to authenticated;

-- -----------------------------------------------------------------------------
-- 4) Atomic chat quota function (service role)
-- -----------------------------------------------------------------------------
drop function if exists public.consume_chat_quota(uuid, int, int, text);

create or replace function public.consume_chat_quota(
  p_user_id uuid,
  p_per_minute int default 8,
  p_per_day int default 200,
  p_route text default 'barangay_chat_message'
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := now();
  v_minute_count int := 0;
  v_day_count int := 0;
  v_remaining_minute int := 0;
  v_remaining_day int := 0;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_per_minute < 1 or p_per_minute > 120 then
    raise exception 'p_per_minute must be between 1 and 120';
  end if;

  if p_per_day < 1 or p_per_day > 10000 then
    raise exception 'p_per_day must be between 1 and 10000';
  end if;

  select count(*)::int
    into v_minute_count
  from public.chat_rate_events
  where user_id = p_user_id
    and event_status = 'accepted'
    and created_at >= v_now - interval '1 minute';

  select count(*)::int
    into v_day_count
  from public.chat_rate_events
  where user_id = p_user_id
    and event_status = 'accepted'
    and created_at >= date_trunc('day', v_now);

  if v_minute_count >= p_per_minute then
    insert into public.chat_rate_events (user_id, route, event_status)
    values (p_user_id, coalesce(nullif(trim(p_route), ''), 'barangay_chat_message'), 'rejected_minute');

    return jsonb_build_object(
      'allowed', false,
      'reason', 'minute_limit',
      'remaining_minute', 0,
      'remaining_day', greatest(0, p_per_day - v_day_count)
    );
  end if;

  if v_day_count >= p_per_day then
    insert into public.chat_rate_events (user_id, route, event_status)
    values (p_user_id, coalesce(nullif(trim(p_route), ''), 'barangay_chat_message'), 'rejected_day');

    return jsonb_build_object(
      'allowed', false,
      'reason', 'day_limit',
      'remaining_minute', greatest(0, p_per_minute - v_minute_count),
      'remaining_day', 0
    );
  end if;

  insert into public.chat_rate_events (user_id, route, event_status)
  values (p_user_id, coalesce(nullif(trim(p_route), ''), 'barangay_chat_message'), 'accepted');

  v_remaining_minute := greatest(0, p_per_minute - (v_minute_count + 1));
  v_remaining_day := greatest(0, p_per_day - (v_day_count + 1));

  return jsonb_build_object(
    'allowed', true,
    'reason', 'ok',
    'remaining_minute', v_remaining_minute,
    'remaining_day', v_remaining_day
  );
end;
$$;

revoke all on function public.consume_chat_quota(uuid, int, int, text) from public;
revoke all on function public.consume_chat_quota(uuid, int, int, text) from anon;
revoke all on function public.consume_chat_quota(uuid, int, int, text) from authenticated;
grant execute on function public.consume_chat_quota(uuid, int, int, text) to service_role;

-- -----------------------------------------------------------------------------
-- 5) Retention helper (default 90 days)
-- -----------------------------------------------------------------------------
drop function if exists public.purge_chat_data_older_than(int);

create or replace function public.purge_chat_data_older_than(p_days int default 90)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_deleted bigint;
begin
  if p_days < 1 or p_days > 3650 then
    raise exception 'p_days must be between 1 and 3650';
  end if;

  delete from public.chat_sessions
  where updated_at < now() - make_interval(days => p_days);

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.purge_chat_data_older_than(int) from public;
revoke all on function public.purge_chat_data_older_than(int) from anon;
revoke all on function public.purge_chat_data_older_than(int) from authenticated;
grant execute on function public.purge_chat_data_older_than(int) to service_role;

commit;
