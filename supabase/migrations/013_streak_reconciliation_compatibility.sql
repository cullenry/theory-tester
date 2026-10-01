-- Keep the existing streak reconciliation path safe and compatible
-- with the current production route until the server-only route is deployed.
create or replace function public.reconcile_streak_protection(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  preference record;
  timezone_name text := 'Europe/Dublin';
  today_local date;
  activation_date date;
  cursor_date date;
  day_active boolean;
  previous_day_active boolean;
begin
  if auth.role() <> 'service_role'
     and (auth.uid() is null or auth.uid() <> target_user) then
    raise exception 'Not authorised';
  end if;

  select
    streak_protection_active,
    streak_protection_activated_at,
    reminder_timezone
  into preference
  from public.user_app_preferences
  where user_id = target_user
  for update;

  if not found or not preference.streak_protection_active then
    return;
  end if;

  timezone_name := coalesce(nullif(preference.reminder_timezone, ''), 'Europe/Dublin');

  begin
    today_local := (now() at time zone timezone_name)::date;
    activation_date := coalesce(
      (preference.streak_protection_activated_at at time zone timezone_name)::date,
      today_local
    );
  exception when invalid_parameter_value then
    timezone_name := 'Europe/Dublin';
    today_local := (now() at time zone timezone_name)::date;
    activation_date := coalesce(
      (preference.streak_protection_activated_at at time zone timezone_name)::date,
      today_local
    );
  end;

  if activation_date >= today_local then
    return;
  end if;

  cursor_date := activation_date;

  while cursor_date < today_local loop
    select exists (
      select 1
      from public.question_attempts attempt
      where attempt.user_id = target_user
        and attempt.selected_answer is not null
        and (attempt.created_at at time zone timezone_name)::date = cursor_date
    )
    into day_active;

    if not day_active then
      select
        exists (
          select 1
          from public.question_attempts attempt
          where attempt.user_id = target_user
            and attempt.selected_answer is not null
            and (attempt.created_at at time zone timezone_name)::date = cursor_date - 1
        )
        or exists (
          select 1
          from public.streak_protected_days protected_day
          where protected_day.user_id = target_user
            and protected_day.protected_date = cursor_date - 1
        )
      into previous_day_active;

      if previous_day_active then
        insert into public.streak_protected_days (user_id, protected_date)
        values (target_user, cursor_date)
        on conflict (user_id, protected_date) do nothing;

        update public.user_app_preferences
        set streak_protection_active = false,
            streak_protection_activated_at = null,
            updated_at = now()
        where user_id = target_user;

        exit;
      end if;
    end if;

    cursor_date := cursor_date + 1;
  end loop;
end;
$$;

revoke all on function public.reconcile_streak_protection(uuid) from public, anon;
grant execute on function public.reconcile_streak_protection(uuid) to authenticated;
grant execute on function public.reconcile_streak_protection(uuid) to service_role;
