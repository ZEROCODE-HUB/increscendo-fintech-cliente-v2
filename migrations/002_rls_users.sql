-- Migration: Enable Row Level Security and create policies for `public.users`.
-- This file drops any existing policies with the same names and recreates them.
-- Apply in Supabase SQL editor or via psql as a privileged user.

-- Drop existing policies (safe to run multiple times)
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_insert_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;

-- Enable RLS on the users table
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to SELECT their own profile
CREATE POLICY users_select_own ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow authenticated users to INSERT their own profile (id must match auth.uid())
CREATE POLICY users_insert_own ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to UPDATE their own profile
CREATE POLICY users_update_own ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Note: Deleting profiles is intentionally not allowed by authenticated users.
-- Use the service role key or an admin role to remove users.
