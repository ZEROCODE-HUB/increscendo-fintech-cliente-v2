-- Migration 016: Add RFC and fiscal_address to users for reusable billing info

BEGIN;

ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS rfc character varying(20),
  ADD COLUMN IF NOT EXISTS fiscal_address text;

COMMIT;
