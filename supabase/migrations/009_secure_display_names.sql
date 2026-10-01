-- Keep account display names bounded and free of control characters.
-- This protects both the UI and the auth metadata from oversized/malformed values.

create or replace function public.validate_auth_user_display_name()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  raw_name text;
  clean_name text;
begin
  raw_name := new.raw_user_meta_data ->> 'full_name';

  if raw_name is null then
    return new;
  end if;

  clean_name := btrim(
    regexp_replace(
      regexp_replace(raw_name, '[[:cntrl:]]+', '', 'g'),
      '[[:space:]]+',
      ' ',
      'g'
    )
  );

  if clean_name = '' then
    new.raw_user_meta_data := new.raw_user_meta_data - 'full_name';
    return new;
  end if;

  if char_length(clean_name) > 40 then
    raise exception using
      errcode = '22023',
      message = 'Full name must be 40 characters or fewer.';
  end if;

  new.raw_user_meta_data := jsonb_set(
    new.raw_user_meta_data,
    '{full_name}',
    to_jsonb(clean_name),
    true
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_display_name_validation on auth.users;

create trigger on_auth_user_display_name_validation
before insert or update of raw_user_meta_data on auth.users
for each row
execute function public.validate_auth_user_display_name();

revoke execute on function public.validate_auth_user_display_name() from public, anon, authenticated;
