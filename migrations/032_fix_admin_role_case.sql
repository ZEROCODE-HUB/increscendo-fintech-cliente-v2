-- Migration: Fix admin user role case sensitivity
-- The admin user might have 'Admin' (capitalized) instead of 'admin' (lowercase)
-- This migration normalizes the role to lowercase

UPDATE public.users
SET role = LOWER(role),
    updated_at = now()
WHERE role ILIKE 'admin';