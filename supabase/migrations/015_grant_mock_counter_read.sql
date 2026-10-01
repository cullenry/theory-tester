-- Allow the read-only counter RPC to run as SECURITY INVOKER.
-- The existing RLS policy limits these roles to the singleton stats row.
grant select (id, mock_tests_completed)
on public.site_stats
to anon, authenticated;
