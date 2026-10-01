-- Tighten user-owned RLS policies and reduce the public RPC surface.

drop policy if exists "Users can insert their own question attempts" on public.question_attempts;
create policy "Users can insert their own question attempts"
on public.question_attempts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can view their own question attempts" on public.question_attempts;
create policy "Users can view their own question attempts"
on public.question_attempts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own mock tests" on public.mock_tests;
create policy "Users can insert their own mock tests"
on public.mock_tests
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can view their own mock tests" on public.mock_tests;
create policy "Users can view their own mock tests"
on public.mock_tests
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can delete their own question bookmarks" on public.question_bookmarks;
create policy "Users can delete their own question bookmarks"
on public.question_bookmarks
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own question bookmarks" on public.question_bookmarks;
create policy "Users can insert their own question bookmarks"
on public.question_bookmarks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can view their own question bookmarks" on public.question_bookmarks;
create policy "Users can view their own question bookmarks"
on public.question_bookmarks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Anyone can view the public mock test counter" on public.site_stats;
create policy "Anyone can view the public mock test counter"
on public.site_stats
for select
to anon, authenticated
using (id = 1);

create or replace function public.get_mock_test_count()
returns bigint
language sql
stable
security invoker
set search_path = public
as $function$
  select mock_tests_completed
  from public.site_stats
  where id = 1;
$function$;

revoke execute on function public.increment_mock_test_count() from public, anon, authenticated;

-- Reconciliation is security-definer because it writes protected-day state,
-- but the function itself enforces auth.uid() = target_user.
grant execute on function public.reconcile_streak_protection(uuid) to authenticated;
