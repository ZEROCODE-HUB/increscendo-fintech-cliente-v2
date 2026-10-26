-- Add RFC column to users table
ALTER TABLE public.users
ADD COLUMN rfc VARCHAR(13);

-- Add unique constraint for RFC
ALTER TABLE public.users
ADD CONSTRAINT users_rfc_key UNIQUE (rfc);
