-- Migration 009: Add document URL fields (INE front/back, CURP) to public.users
-- These columns will be used to store Supabase Storage URLs for uploaded documents
-- from the admin "Ver Documentos" modal.

BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS ine_front_url text,
  ADD COLUMN IF NOT EXISTS ine_back_url text,
  ADD COLUMN IF NOT EXISTS curp_url text;

-- The public.clients view already does SELECT * FROM public.users WHERE role = 'client',
-- so it will automatically expose these new columns. No change needed there.

COMMIT;
