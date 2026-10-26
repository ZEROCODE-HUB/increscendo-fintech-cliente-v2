-- Migration 014: Create invoices table to record payments and billing data

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_membership_id uuid NULL REFERENCES public.user_memberships(id) ON DELETE SET NULL,
  coupon_id uuid NULL REFERENCES public.coupons(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'MXN',
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending | paid | failed | canceled
  payment_provider text NULL,
  provider_payment_id text NULL,
  rfc text NULL,
  fiscal_address text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices (user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices (status);

COMMIT;
