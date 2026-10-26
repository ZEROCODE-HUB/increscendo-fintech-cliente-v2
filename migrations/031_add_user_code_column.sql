-- 031_add_user_code_column.sql
-- Add user-friendly code to public.users with format INC-XXXXXX (6 digits, incremental).
-- New users get the code automatically via a BEFORE INSERT trigger.
-- Existing users are backfilled in registration order (oldest first).

-- 1) Add the code column (nullable first so backfill can run)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS code VARCHAR(20) UNIQUE NULL;

CREATE INDEX IF NOT EXISTS idx_users_code ON public.users(code);

-- 2) Create a sequence for auto-generating user codes
CREATE SEQUENCE IF NOT EXISTS user_code_seq START 1;

-- 3) Create a trigger function that generates the code on insert
CREATE OR REPLACE FUNCTION public.generate_user_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    next_num := nextval('user_code_seq');
    NEW.code := 'INC-' || LPAD(next_num::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4) Attach the trigger to public.users
DROP TRIGGER IF EXISTS trg_generate_user_code ON public.users;
CREATE TRIGGER trg_generate_user_code
BEFORE INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.generate_user_code();

-- 5) Backfill existing users in registration order (oldest first -> INC-000001, ...)
WITH numbered_users AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS row_num
  FROM public.users
  WHERE code IS NULL OR code = ''
)
UPDATE public.users u
SET code = 'INC-' || LPAD(nu.row_num::TEXT, 6, '0')
FROM numbered_users nu
WHERE u.id = nu.id;

-- 6) Sync the sequence so new users continue after the highest existing code
DO $$
DECLARE
  max_code_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0)
  INTO max_code_num
  FROM public.users
  WHERE code IS NOT NULL AND code ~ '^INC-[0-9]+$';

  PERFORM setval('user_code_seq', max_code_num + 1, false);

  RAISE NOTICE 'user_code_seq set to start from %', max_code_num + 1;
END $$;

-- 7) Enforce uniqueness and not null
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_code_unique;

ALTER TABLE public.users
  ADD CONSTRAINT users_code_unique UNIQUE (code),
  ALTER COLUMN code SET NOT NULL;