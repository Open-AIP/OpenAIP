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
