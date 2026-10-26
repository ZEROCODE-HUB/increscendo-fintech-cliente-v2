-- 020_create_loan_disbursements.sql
-- Registra acciones de desembolso
CREATE TABLE IF NOT EXISTS loan_disbursements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  destination_account jsonb,
  transaction_id text,
  disbursed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_disbursements_loan_id ON loan_disbursements (loan_id);
