-- Finalise streak reconciliation behind the server-only Supabase client.
-- Apply this migration after the hardened application code is deployed.
-- Migration 013 keeps the currently deployed client route compatible during the transition.

revoke all on function public.reconcile_streak_protection(uuid) from public, anon, authenticated;
grant execute on function public.reconcile_streak_protection(uuid) to service_role;
