-- Fix loan_number sequence to start from the correct value
-- This migration ensures the sequence is synced with existing loan numbers

-- Find the maximum loan number currently in use and set the sequence to the next value
DO $$
DECLARE
  max_loan_num INTEGER;
BEGIN
  -- Extract the numeric part from the maximum loan_number (e.g., 'PREST-0001' -> 1)
  SELECT COALESCE(MAX(CAST(SUBSTRING(loan_number FROM 7) AS INTEGER)), 0)
  INTO max_loan_num
  FROM public.loans
  WHERE loan_number IS NOT NULL;
  
  -- Set the sequence to the next available number
  PERFORM setval('loan_number_seq', max_loan_num + 1, false);
  
  RAISE NOTICE 'loan_number_seq set to start from %', max_loan_num + 1;
END $$;
