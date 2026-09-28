create table if not exists public.question_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create index if not exists question_bookmarks_user_created_idx
  on public.question_bookmarks(user_id, created_at desc);

alter table public.question_bookmarks enable row level security;

drop policy if exists "Users can view their own question bookmarks" on public.question_bookmarks;
create policy "Users can view their own question bookmarks"
  on public.question_bookmarks
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own question bookmarks" on public.question_bookmarks;
create policy "Users can insert their own question bookmarks"
  on public.question_bookmarks
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own question bookmarks" on public.question_bookmarks;
create policy "Users can delete their own question bookmarks"
  on public.question_bookmarks
  for delete
  using (auth.uid() = user_id);
