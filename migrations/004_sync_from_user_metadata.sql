-- Update sync_user_profile to populate profile fields from auth.users.user_metadata
-- Run this in Supabase SQL editor as a privileged user.

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
  BEGIN
    fname := NULLIF( (um ->> 'first_name')::text, '') ;
  EXCEPTION WHEN OTHERS THEN fname := NULL; END;
  BEGIN
    lname := NULLIF( (um ->> 'last_name')::text, '');
  EXCEPTION WHEN OTHERS THEN lname := NULL; END;
  BEGIN
    phone := NULLIF( (um ->> 'phone')::text, '');
  EXCEPTION WHEN OTHERS THEN phone := NULL; END;
  BEGIN
    phone_cc := NULLIF( (um ->> 'phone_country_code')::text, '');
  EXCEPTION WHEN OTHERS THEN phone_cc := NULL; END;
  BEGIN
    terms := (um ->> 'terms_accepted')::boolean;
  EXCEPTION WHEN OTHERS THEN terms := false; END;

  -- Wrap the insert/upsert in its own block so we can catch exceptions
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

-- Ensure trigger exists (in case it was not created earlier)
DROP TRIGGER IF EXISTS trg_sync_user_profile ON auth.users;
CREATE TRIGGER trg_sync_user_profile
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_profile();

COMMIT;
