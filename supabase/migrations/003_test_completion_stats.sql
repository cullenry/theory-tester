create table if not exists public.test_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  test_type text not null check (test_type in ('mock')),
  source_id uuid unique,
  completed_at timestamptz not null default now()
);

create index if not exists test_completions_completed_at_idx
  on public.test_completions(completed_at desc);

alter table public.test_completions enable row level security;

drop policy if exists "Users can insert test completions" on public.test_completions;
create policy "Users can insert test completions"
  on public.test_completions
  for insert
  with check (user_id is null or auth.uid() = user_id);

-- Backfill the completions already recorded in mock_tests.
insert into public.test_completions (user_id, test_type, source_id, completed_at)
select user_id, 'mock', id, created_at
from public.mock_tests
where not exists (
  select 1
  from public.test_completions existing
  where existing.source_id = mock_tests.id
);

create or replace function public.get_test_completion_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.test_completions;
$$;

revoke all on function public.get_test_completion_count() from public;
grant execute on function public.get_test_completion_count() to anon, authenticated;
