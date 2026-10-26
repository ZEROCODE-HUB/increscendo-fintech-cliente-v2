-- Improve sync_user_profile to accept multiple metadata key aliases
-- This helps when client sends keys like `firstName` or `first_name`.
-- Run in Supabase SQL Editor as a privileged user.

BEGIN;

CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS trigger AS $$
DECLARE
  um jsonb := COALESCE(NEW.user_metadata::jsonb, '{}'::jsonb);
  fname text;
  lname text;
  phone text;
  phone_cc text;
  terms boolean;
BEGIN
  -- accept multiple aliases for first name
  fname := NULLIF(coalesce(um ->> 'first_name', um ->> 'firstName', um ->> 'given_name', um ->> 'name'), '');
  lname := NULLIF(coalesce(um ->> 'last_name', um ->> 'lastName', um ->> 'family_name'), '');
  phone := NULLIF(coalesce(um ->> 'phone', um ->> 'phone_number', um ->> 'mobile'), '');
  phone_cc := NULLIF(coalesce(um ->> 'phone_country_code', um ->> 'phoneCountryCode'), '');
  BEGIN
    terms := (um ->> 'terms_accepted')::boolean;
  EXCEPTION WHEN OTHERS THEN terms := false; END;

  BEGIN
    INSERT INTO public.users (id, email, first_name, last_name, phone, phone_country_code, metadata, terms_accepted, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      fname,
      lname,
      phone,
      phone_cc,
      COALESCE(NEW.user_metadata::jsonb, '{}'::jsonb),
      COALESCE(terms, false),
      now(), now()
    )
    ON CONFLICT (id) DO UPDATE
      SET email = COALESCE(EXCLUDED.email, public.users.email),
          first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
          last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
          phone = COALESCE(EXCLUDED.phone, public.users.phone),
          phone_country_code = COALESCE(EXCLUDED.phone_country_code, public.users.phone_country_code),
          metadata = COALESCE(EXCLUDED.metadata, public.users.metadata),
          terms_accepted = COALESCE(EXCLUDED.terms_accepted, public.users.terms_accepted),
          updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'sync_user_profile suppressed error: %', SQLERRM;
  END;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_sync_user_profile ON auth.users;
CREATE TRIGGER trg_sync_user_profile
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_profile();

COMMIT;

-- After applying, verify by checking auth.users.user_metadata for a recently created user:
-- SELECT id, user_metadata FROM auth.users WHERE email = 'you@example.com';
