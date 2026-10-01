-- Give each client-recorded attempt a stable identifier so offline retries
-- cannot create duplicate history entries.
alter table public.question_attempts
  add column if not exists client_event_id text;

create unique index if not exists question_attempts_client_event_id_uidx
  on public.question_attempts(client_event_id)
  where client_event_id is not null;
