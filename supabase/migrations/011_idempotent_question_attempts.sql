-- Give each client-recorded attempt a stable identifier so offline retries
-- cannot create duplicate history entries.
alter table public.question_attempts
  add column if not exists client_event_id text;

alter table public.question_attempts
  drop constraint if exists question_attempts_client_event_id_key;

drop index if exists public.question_attempts_client_event_id_uidx;

alter table public.question_attempts
  add constraint question_attempts_client_event_id_key unique (client_event_id);
