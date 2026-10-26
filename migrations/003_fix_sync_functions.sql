-- Make trigger functions SECURITY DEFINER and owned by a privileged role
-- This allows triggers on auth.users to upsert into public.users even when RLS is enabled.
-- Run this in Supabase SQL editor as a privileged user.

BEGIN;

-- Recreate sync_user_profile as SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.users (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, now(), now())
    ON CONFLICT (id) DO UPDATE
      SET email = COALESCE(EXCLUDED.email, public.users.email),
          updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'sync_user_profile suppressed error: %', SQLERRM;
  END;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate delete_user_profile as SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.delete_user_profile()
RETURNS trigger AS $$
BEGIN
  BEGIN
    DELETE FROM public.users WHERE id = OLD.id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'delete_user_profile suppressed error: %', SQLERRM;
  END;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set owner to a superuser role so the SECURITY DEFINER runs with elevated privileges
-- Replace 'postgres' below with the appropriate DB owner if different in your project
ALTER FUNCTION public.sync_user_profile() OWNER TO postgres;
ALTER FUNCTION public.delete_user_profile() OWNER TO postgres;

COMMIT;

-- Notes:
-- If your Supabase project does not allow changing function owner to 'postgres', replace with the DB owner role available in your project (for example 'supabase_admin').
-- After running this migration, try signing up again; the trigger should create the row in `public.users`.
