-- 021_create_loan_documents.sql
-- Documentos relacionados a préstamos (INE, CURP, comprobantes, etc.)
CREATE TABLE IF NOT EXISTS loan_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  type text NOT NULL,
  uploader_id uuid REFERENCES users(id),
  file_url text,
  file_name text,
  mime_type text,
  uploaded_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_loan_documents_loan_id ON loan_documents (loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_documents_type ON loan_documents (type);
