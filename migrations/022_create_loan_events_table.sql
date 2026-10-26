-- 022_create_loan_events_table.sql
-- Tabla de eventos/historial para auditoría y seguimiento
CREATE TABLE IF NOT EXISTS loan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_events_loan_id ON loan_events (loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_events_event_type ON loan_events (event_type);
