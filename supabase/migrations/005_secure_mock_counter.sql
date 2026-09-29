-- Security hardening for the global mock-test counter.
-- The browser must never be able to increment this counter directly.
-- Only the trusted server-side Supabase client may execute the RPC.
revoke execute on function public.increment_mock_test_count() from anon, authenticated, public;
grant execute on function public.increment_mock_test_count() to service_role;
