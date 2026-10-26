-- Migration 010: Allow authenticated users to manage files in the `documents` bucket
-- Fixes "new row violates row-level security policy" errors when uploading
-- from the admin panel.

BEGIN;

-- NOTE: En Supabase la tabla storage.objects ya tiene RLS habilitado
-- y no se permite ALTER TABLE desde el proyecto, por eso ves
-- "must be owner of table objects" si intentas ese comando.
-- Solo definimos las policies, sin tocar el OWNER ni el ALTER.

-- Allow authenticated users to read objects in the `documents` bucket
CREATE POLICY documents_select ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

-- Allow authenticated users to upload (insert) objects into `documents`
CREATE POLICY documents_insert ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to update objects in `documents`
CREATE POLICY documents_update ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents');

-- (Optional) Allow authenticated users to delete objects in `documents`
CREATE POLICY documents_delete ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');

COMMIT;
