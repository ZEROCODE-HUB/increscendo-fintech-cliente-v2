-- Add loan_number column to loans table for user-friendly ID
ALTER TABLE public.loans
ADD COLUMN loan_number VARCHAR(20) UNIQUE NULL;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_loans_loan_number ON public.loans(loan_number);

-- Create a sequence for auto-generating loan numbers
CREATE SEQUENCE IF NOT EXISTS loan_number_seq START 1;

-- Create a function to generate loan numbers automatically
CREATE OR REPLACE FUNCTION generate_loan_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  IF NEW.loan_number IS NULL THEN
    next_num := nextval('loan_number_seq');
    NEW.loan_number := 'PREST-' || LPAD(next_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate loan_number before insert
DROP TRIGGER IF EXISTS trg_generate_loan_number ON public.loans;
CREATE TRIGGER trg_generate_loan_number
BEFORE INSERT ON public.loans
FOR EACH ROW
EXECUTE FUNCTION generate_loan_number();

-- Make loan_number nullable initially (if not already)
ALTER TABLE public.loans
DROP CONSTRAINT IF EXISTS loans_loan_number_unique;

-- Update existing loans with loan_number if they don't have one using CTE
WITH numbered_loans AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM public.loans
  WHERE loan_number IS NULL
)
UPDATE public.loans l
SET loan_number = 'PREST-' || LPAD(nl.row_num::TEXT, 4, '0')
FROM numbered_loans nl
WHERE l.id = nl.id;

-- Make loan_number unique and not null
ALTER TABLE public.loans
ADD CONSTRAINT loans_loan_number_unique UNIQUE (loan_number),
ALTER COLUMN loan_number SET NOT NULL;
