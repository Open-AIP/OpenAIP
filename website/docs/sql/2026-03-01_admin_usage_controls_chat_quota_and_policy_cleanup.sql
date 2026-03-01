begin;

alter table if exists public.chat_rate_events
  drop constraint if exists chat_rate_events_event_status_check;

alter table if exists public.chat_rate_events
  add constraint chat_rate_events_event_status_check
  check (
    event_status in (
      'accepted',
      'rejected_minute',
      'rejected_hour',
      'rejected_day'
    )
  );

drop function if exists public.consume_chat_quota(uuid, int, int, text);

create or replace function public.consume_chat_quota(
  p_user_id uuid,
  p_per_hour int default 20,
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
  v_hour_count int := 0;
  v_day_count int := 0;
  v_remaining_hour int := 0;
  v_remaining_day int := 0;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_per_hour < 1 or p_per_hour > 100000 then
    raise exception 'p_per_hour must be between 1 and 100000';
  end if;

  if p_per_day < 1 or p_per_day > 100000 then
    raise exception 'p_per_day must be between 1 and 100000';
  end if;

  select count(*)::int
    into v_hour_count
  from public.chat_rate_events
  where user_id = p_user_id
    and event_status = 'accepted'
    and created_at >= v_now - interval '1 hour';

  select count(*)::int
    into v_day_count
  from public.chat_rate_events
  where user_id = p_user_id
    and event_status = 'accepted'
    and created_at >= date_trunc('day', v_now);

  if v_hour_count >= p_per_hour then
    insert into public.chat_rate_events (user_id, route, event_status)
    values (p_user_id, coalesce(nullif(trim(p_route), ''), 'barangay_chat_message'), 'rejected_hour');

    return jsonb_build_object(
      'allowed', false,
      'reason', 'hour_limit',
      'remaining_hour', 0,
      'remaining_day', greatest(0, p_per_day - v_day_count)
    );
  end if;

  if v_day_count >= p_per_day then
    insert into public.chat_rate_events (user_id, route, event_status)
    values (p_user_id, coalesce(nullif(trim(p_route), ''), 'barangay_chat_message'), 'rejected_day');

    return jsonb_build_object(
      'allowed', false,
      'reason', 'day_limit',
      'remaining_hour', greatest(0, p_per_hour - v_hour_count),
      'remaining_day', 0
    );
  end if;

  insert into public.chat_rate_events (user_id, route, event_status)
  values (p_user_id, coalesce(nullif(trim(p_route), ''), 'barangay_chat_message'), 'accepted');

  v_remaining_hour := greatest(0, p_per_hour - (v_hour_count + 1));
  v_remaining_day := greatest(0, p_per_day - (v_day_count + 1));

  return jsonb_build_object(
    'allowed', true,
    'reason', 'ok',
    'remaining_hour', v_remaining_hour,
    'remaining_day', v_remaining_day
  );
end;
$$;

revoke all on function public.consume_chat_quota(uuid, int, int, text) from public;
revoke all on function public.consume_chat_quota(uuid, int, int, text) from anon;
revoke all on function public.consume_chat_quota(uuid, int, int, text) from authenticated;
grant execute on function public.consume_chat_quota(uuid, int, int, text) to service_role;

delete from app.settings
where key = 'controls.chatbot_policy';

commit;
