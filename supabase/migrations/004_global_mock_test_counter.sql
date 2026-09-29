-- Global mock-test counter. This starts at zero and is intentionally
-- independent of individual user accounts.
create table if not exists public.site_stats (
  id integer primary key check (id = 1),
  mock_tests_completed bigint not null default 0 check (mock_tests_completed >= 0)
);

insert into public.site_stats (id, mock_tests_completed)
values (1, 0)
on conflict (id) do nothing;

alter table public.site_stats enable row level security;

create or replace function public.get_mock_test_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select mock_tests_completed
  from public.site_stats
  where id = 1;
$$;

create or replace function public.increment_mock_test_count()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count bigint;
begin
  update public.site_stats
  set mock_tests_completed = mock_tests_completed + 1
  where id = 1
  returning mock_tests_completed into next_count;

  return next_count;
end;
$$;

revoke all on public.site_stats from anon, authenticated;
revoke all on function public.get_mock_test_count() from public;
revoke all on function public.increment_mock_test_count() from public;

grant execute on function public.get_mock_test_count() to anon, authenticated;
grant execute on function public.increment_mock_test_count() to anon, authenticated;

-- The earlier event-table implementation is no longer used for the counter.
drop function if exists public.get_test_completion_count();
drop table if exists public.test_completions;
