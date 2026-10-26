-- Migration 007: Create membership plans and user memberships
-- Adds tables for membership plans and user subscriptions, and a simple clients view

BEGIN;

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Membership plans (catalog of available membership products)
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MXN',
  duration_days integer NOT NULL DEFAULT 30,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_membership_plans_slug ON public.membership_plans (slug);

-- User memberships (which user has which plan)
CREATE TABLE IF NOT EXISTS public.user_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  membership_plan_id uuid NULL REFERENCES public.membership_plans(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active', -- active | canceled | expired | pending
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NULL,
  auto_renew boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON public.user_memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_plan_id ON public.user_memberships (membership_plan_id);

-- Convenience view for admin -> clients (users with role = 'client')
CREATE OR REPLACE VIEW public.clients AS
SELECT * FROM public.users WHERE role = 'client';

-- Seed a couple of sample plans (safe: only insert if slug not exists)
INSERT INTO public.membership_plans (name, slug, description, price, currency, duration_days, features)
SELECT 'Básica', 'basica', 'Acceso básico a servicios', 0.00, 'MXN', 30, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.membership_plans WHERE slug = 'basica');

INSERT INTO public.membership_plans (name, slug, description, price, currency, duration_days, features)
SELECT 'Premium', 'premium', 'Acceso completo + beneficios', 199.00, 'MXN', 30, '{"benefits": ["priority_support","lower_rates"], "interestRate": 0}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.membership_plans WHERE slug = 'premium');

COMMIT;
