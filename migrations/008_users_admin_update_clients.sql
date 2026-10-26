-- Migration 008: Allow admin users to update any user row
-- This policy lets authenticated users whose role in public.users is 'admin'
-- perform UPDATEs on public.users for any record.

BEGIN;

DROP POLICY IF EXISTS users_admin_update_all ON public.users;

CREATE POLICY users_admin_update_all ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
  );

COMMIT;
