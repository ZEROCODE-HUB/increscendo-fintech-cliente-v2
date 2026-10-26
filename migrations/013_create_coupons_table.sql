-- Migration 013: Create coupons table for discounts

BEGIN;

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent integer NULL,
  discount_amount numeric(10,2) NULL,
  active boolean NOT NULL DEFAULT true,
  max_redemptions integer NULL,
  redeemed_count integer NOT NULL DEFAULT 0,
  starts_at timestamptz NULL,
  ends_at timestamptz NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code);

COMMIT;
