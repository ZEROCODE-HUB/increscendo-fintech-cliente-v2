-- 018_create_loans_table.sql
-- Crea el tipo y la tabla principal de préstamos
CREATE TYPE loan_status AS ENUM (
  'pending',        -- solicitud recibida, aún no procesada
  'under_review',   -- en revisión previa a aprobación
  'approved',       -- aprobado, pendiente firma
  'signed',         -- contrato firmado por el cliente
  'disbursed',      -- fondos desembolsados
  'active',         -- préstamo activo (pagos iniciados)
  'closed',         -- pagado / cerrado
  'cancelled'       -- cancelado / rechazado
);

CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  installments int NOT NULL,
  monthly_payment numeric(12,2),
  interest_rate numeric(7,4),
  total_to_pay numeric(12,2),
  status loan_status NOT NULL DEFAULT 'pending',
  applied_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  signed_at timestamptz,
  disbursed_at timestamptz,
  closed_at timestamptz,
  cancelled_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans (user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans (status);
