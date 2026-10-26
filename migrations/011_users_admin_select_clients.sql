-- Migration 011: Allow admin users to SELECT client rows
-- This policy lets authenticated users whose role in public.users is 'admin'
-- see all users with role = 'client'.

BEGIN;

DROP POLICY IF EXISTS users_admin_select_clients ON public.users;

CREATE POLICY users_admin_select_clients ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
    AND role = 'client'
  );

COMMIT;
