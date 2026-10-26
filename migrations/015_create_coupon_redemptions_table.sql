-- Migration 015: Create coupon_redemptions table to record individual coupon usages

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  invoice_id uuid NULL REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_id ON public.coupon_redemptions (coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_id ON public.coupon_redemptions (user_id);

COMMIT;
