-- Migration 017: Create finalize_invoice function to atomically mark invoice paid, redeem coupon and grant membership

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- This function finalizes an invoice: checks coupon availability, inserts coupon_redemption,
-- grants the membership (creates user_memberships) and marks invoice as paid.
-- It runs as SECURITY DEFINER to allow the operation under a privileged role.

CREATE OR REPLACE FUNCTION public.finalize_invoice(
  p_invoice_id uuid,
  p_payment_provider text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  inv record;
  c record;
  plan record;
  new_um_id uuid;
BEGIN
  -- Lock the invoice row
  SELECT * INTO inv FROM public.invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invoice_not_found';
  END IF;

  IF inv.status <> 'pending' THEN
    RAISE EXCEPTION 'invoice_not_pending';
  END IF;

  -- If a coupon was attached, validate and consume one use
  IF inv.coupon_id IS NOT NULL THEN
    SELECT * INTO c FROM public.coupons WHERE id = inv.coupon_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'coupon_not_found';
    END IF;
    IF c.max_redemptions IS NOT NULL AND c.redeemed_count >= c.max_redemptions THEN
      RAISE EXCEPTION 'coupon_exhausted';
    END IF;

    UPDATE public.coupons SET redeemed_count = redeemed_count + 1 WHERE id = c.id;
    INSERT INTO public.coupon_redemptions (coupon_id, user_id, invoice_id) VALUES (c.id, inv.user_id, inv.id);
  END IF;

  -- Grant membership if invoice metadata contains membership_plan_id
  IF inv.metadata ? 'membership_plan_id' THEN
    SELECT * INTO plan FROM public.membership_plans WHERE id = (inv.metadata->>'membership_plan_id')::uuid;
    IF FOUND THEN
      -- compute expires_at based on duration_days
      IF plan.duration_days IS NOT NULL THEN
        INSERT INTO public.user_memberships (user_id, membership_plan_id, status, started_at, expires_at, auto_renew, metadata)
        VALUES (inv.user_id, plan.id, 'active', now(), now() + (plan.duration_days || ' days')::interval, false, '{}'::jsonb)
        RETURNING id INTO new_um_id;

        UPDATE public.invoices SET user_membership_id = new_um_id WHERE id = inv.id;
      END IF;
    END IF;
  END IF;

  -- Mark invoice as paid and store provider info
  UPDATE public.invoices
  SET status = 'paid', payment_provider = p_payment_provider, provider_payment_id = gen_random_uuid()::text, updated_at = now()
  WHERE id = inv.id;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
