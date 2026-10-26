-- Drop sync triggers and functions so client-side upsert handles profile creation
-- Run this in Supabase SQL Editor as a privileged user.

BEGIN;

-- Drop triggers on auth.users
DROP TRIGGER IF EXISTS trg_sync_user_profile ON auth.users;
DROP TRIGGER IF EXISTS trg_delete_user_profile ON auth.users;
DROP TRIGGER IF EXISTS trg_sync_user_profile_minimal ON auth.users;

-- Drop associated functions (ignore if missing)
DROP FUNCTION IF EXISTS public.sync_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.delete_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.sync_user_profile_minimal() CASCADE;

COMMIT;

-- After running this migration, ensure RLS policies on public.users allow
-- authenticated users to insert/update only their own row (see migrations/002_rls_users.sql).
