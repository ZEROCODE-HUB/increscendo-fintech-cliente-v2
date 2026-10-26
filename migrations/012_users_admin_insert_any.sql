-- Migration 012: Allow admin users to INSERT any user row
-- This policy lets authenticated users whose role in public.users is 'admin'
-- create rows in public.users for any id (for example, when creating clients from the admin panel).

BEGIN;

DROP POLICY IF EXISTS users_admin_insert_any ON public.users;

CREATE POLICY users_admin_insert_any ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
  );

COMMIT;
