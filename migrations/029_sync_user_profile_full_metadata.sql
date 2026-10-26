-- Migration: Sync user profile with full metadata + RLS
-- Updates the existing trigger to capture first_name, last_name, phone, phone_country_code from auth.users metadata
-- Adds Row Level Security policies for public.users table

-- =============================================
-- PARTE 1: HELPER FUNCTION PARA BYPASS RLS
-- =============================================

DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_current_user_admin();

-- Función helper que verifica si el usuario actual es admin
-- SECURITY DEFINER para que se ejecute con privilegios del creador (bypassea RLS)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- =============================================
-- PARTE 2: TRIGGER Y FUNCIÓN DE SYNC
-- =============================================

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS trg_sync_user_profile ON auth.users;
DROP FUNCTION IF EXISTS public.sync_user_profile();

-- Create updated function that syncs all metadata fields
-- SECURITY DEFINER para que se ejecute con permisos del creador (necesario para RLS)
CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.users (id, email, first_name, last_name, phone, phone_country_code, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'phone_country_code',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
      SET
        email = COALESCE(EXCLUDED.email, public.users.email),
        first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
        last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
        phone = COALESCE(EXCLUDED.phone, public.users.phone),
        phone_country_code = COALESCE(EXCLUDED.phone_country_code, public.users.phone_country_code),
        updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'sync_user_profile suppressed error: %', SQLERRM;
  END;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users INSERT and UPDATE
CREATE TRIGGER trg_sync_user_profile
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_profile();

-- =============================================
-- PARTE 3: ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Eliminar policies existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "auth_users_insert" ON public.users;
DROP POLICY IF EXISTS "auth_users_update" ON public.users;

-- =============================================
-- POLICIES DE USUARIO (client)
-- =============================================

-- Usuario puede ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Usuario puede actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================
-- POLICIES DE ADMIN (usando helper function)
-- =============================================

-- Admin puede ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON public.users
  FOR SELECT
  USING (public.is_current_user_admin());

-- Admin puede actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles" ON public.users
  FOR UPDATE
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- =============================================
-- POLICY PARA TRIGGER (auth insert bypass)
-- =============================================

-- Allow inserts from authenticated users for the trigger flow
CREATE POLICY "auth_users_insert" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow updates from authenticated users for the trigger flow
CREATE POLICY "auth_users_update" ON public.users
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);