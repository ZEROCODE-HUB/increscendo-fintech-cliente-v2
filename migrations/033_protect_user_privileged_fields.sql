-- 033_protect_user_privileged_fields.sql
-- Seguridad: la política users_update_own (002) deja que un cliente actualice
-- CUALQUIER columna de su propia fila, incluida `role` y todo `metadata`.
-- Eso permite que un cliente se haga admin (role = 'admin' o
-- metadata.backoffice_role) o que marque su identidad como verificada o se
-- invite solo a préstamos (metadata.kyc / metadata.loan_eligible).
--
-- Este trigger conserva esos campos cuando quien actualiza NO es admin.
-- El cliente solo puede mover su KYC a 'por_verificar' (al subir documentos)
-- desde 'incompleto' o 'rechazado'. El service_role (backend) no se ve afectado.
--
-- Revisar antes de aplicar en producción.

CREATE OR REPLACE FUNCTION public.is_backoffice_user(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = uid
      AND (lower(u.role) = 'admin' OR coalesce(u.metadata->>'backoffice_role', '') <> '')
      AND coalesce((u.metadata->>'backoffice_active')::boolean, true)
  );
$$;

CREATE OR REPLACE FUNCTION public.protect_user_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  protected_keys text[] := ARRAY['backoffice_role', 'backoffice_active', 'backoffice_location', 'loan_eligible', 'executive_id', 'created_by'];
  k text;
  old_kyc jsonb := OLD.metadata->'kyc';
  new_kyc jsonb := NEW.metadata->'kyc';
  old_status text := coalesce(OLD.metadata->'kyc'->>'status', 'incompleto');
BEGIN
  -- Backend con service_role o sin sesión de usuario: no se restringe.
  IF auth.uid() IS NULL OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  -- Personal de backoffice: sin restricción.
  IF public.is_backoffice_user(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Rol: nunca lo cambia el propio cliente.
  NEW.role := OLD.role;

  NEW.metadata := coalesce(NEW.metadata, '{}'::jsonb);
  FOREACH k IN ARRAY protected_keys LOOP
    IF OLD.metadata ? k THEN
      NEW.metadata := jsonb_set(NEW.metadata, ARRAY[k], OLD.metadata->k);
    ELSE
      NEW.metadata := NEW.metadata - k;
    END IF;
  END LOOP;

  -- KYC: solo se permite pasar a 'por_verificar' desde incompleto/rechazado.
  IF new_kyc IS DISTINCT FROM old_kyc THEN
    IF NOT (coalesce(new_kyc->>'status', '') = 'por_verificar' AND old_status IN ('incompleto', 'rechazado')) THEN
      IF old_kyc IS NULL THEN
        NEW.metadata := NEW.metadata - 'kyc';
      ELSE
        NEW.metadata := jsonb_set(NEW.metadata, '{kyc}', old_kyc);
      END IF;
    ELSE
      -- Al reenviar se limpian los datos de revisión para que no los falsifique.
      NEW.metadata := jsonb_set(NEW.metadata, '{kyc}', jsonb_build_object('status', 'por_verificar', 'submittedAt', now()));
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_privileged_fields ON public.users;
CREATE TRIGGER trg_protect_user_privileged_fields
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_privileged_fields();
