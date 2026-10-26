-- Migration: Create users table
-- Detectada a partir de src/pages/Auth.tsx los campos: firstName, lastName, regEmail, phone, regPassword
-- Migration: Create users table as profile linked to Supabase Auth

-- If using Supabase Auth, store email/password in auth.users and use
-- this `users` table as the profile table linked to `auth.users(id)`.

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  first_name text,
  last_name text,
  phone text,
  phone_country_code varchar(6),
  avatar_url text,
  role text NOT NULL DEFAULT 'client',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  terms_accepted boolean NOT NULL DEFAULT false,
  last_seen timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para búsquedas por teléfono (no único para permitir flexibilidad)
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users (phone);


CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS trigger AS $$
BEGIN
  -- Guard the upsert so any DB error doesn't abort the auth flow.
  BEGIN
    -- Insert email if present; on conflict, avoid overwriting existing email with NULL
    INSERT INTO public.users (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, now(), now())
    ON CONFLICT (id) DO UPDATE
      SET email = COALESCE(EXCLUDED.email, public.users.email),
          updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'sync_user_profile suppressed error: %', SQLERRM;
    -- swallow error so auth insert won't fail
  END;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_user_profile ON auth.users;
CREATE TRIGGER trg_sync_user_profile
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_profile();

CREATE OR REPLACE FUNCTION public.delete_user_profile()
RETURNS trigger AS $$
BEGIN
  BEGIN
    DELETE FROM public.users WHERE id = OLD.id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'delete_user_profile suppressed error: %', SQLERRM;
    -- swallow error
  END;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_delete_user_profile ON auth.users;
CREATE TRIGGER trg_delete_user_profile
AFTER DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.delete_user_profile();


ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS curp varchar(18);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ine_key text;