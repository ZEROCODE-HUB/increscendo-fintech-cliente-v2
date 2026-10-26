-- 019_create_loan_signatures.sql
-- Registra firmas / contratos relacionados a un préstamo
CREATE TABLE IF NOT EXISTS loan_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  signed_by uuid REFERENCES users(id),
  signature_url text,
  signature_method text,
  signed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_signatures_loan_id ON loan_signatures (loan_id);
