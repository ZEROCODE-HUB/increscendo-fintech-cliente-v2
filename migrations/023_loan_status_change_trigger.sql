-- 023_loan_status_change_trigger.sql
-- Trigger que inserta un evento en loan_events cuando cambia el status de un loan
CREATE OR REPLACE FUNCTION fn_log_loan_status_change()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO loan_events (loan_id, event_type, payload, created_by)
    VALUES (
      NEW.id,
      'state_change',
      jsonb_build_object('from', OLD.status, 'to', NEW.status, 'changed_at', now()),
      NULL
    );
    -- update updated_at timestamp
    NEW.updated_at = now();
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to loans
DROP TRIGGER IF EXISTS trg_log_loan_status_change ON loans;
CREATE TRIGGER trg_log_loan_status_change
AFTER UPDATE ON loans
FOR EACH ROW
EXECUTE FUNCTION fn_log_loan_status_change();
