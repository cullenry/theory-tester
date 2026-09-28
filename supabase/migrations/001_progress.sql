create extension if not exists pgcrypto;

create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id integer not null,
  is_correct boolean not null default false,
  selected_answer text,
  mode text not null default 'practice' check (mode in ('practice', 'mock', 'daily', 'smart')),
  created_at timestamptz not null default now()
);

create index if not exists question_attempts_user_created_idx on public.question_attempts(user_id, created_at desc);
create index if not exists question_attempts_user_question_idx on public.question_attempts(user_id, question_id);
alter table public.question_attempts enable row level security;
drop policy if exists "Users can view their own question attempts" on public.question_attempts;
create policy "Users can view their own question attempts" on public.question_attempts for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own question attempts" on public.question_attempts;
create policy "Users can insert their own question attempts" on public.question_attempts for insert with check (auth.uid() = user_id);

create table if not exists public.mock_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  format_id text not null,
  question_count integer not null,
  correct_count integer not null,
  answered_count integer not null,
  percentage integer not null,
  time_expired boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists mock_tests_user_created_idx on public.mock_tests(user_id, created_at desc);
alter table public.mock_tests enable row level security;
drop policy if exists "Users can view their own mock tests" on public.mock_tests;
create policy "Users can view their own mock tests" on public.mock_tests for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own mock tests" on public.mock_tests;
create policy "Users can insert their own mock tests" on public.mock_tests for insert with check (auth.uid() = user_id);
