-- Prevent authenticated users from escalating their own role in the profiles table.
-- The profiles.role column should only be changed by admins or server-side (service role).
-- RLS WITH CHECK cannot reference OLD values, so a BEFORE UPDATE trigger is used instead.

CREATE OR REPLACE FUNCTION public.prevent_profile_role_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce when called from an authenticated session (auth.uid() is set).
  -- Service-role calls have no auth.uid() and are allowed through unrestricted.
  IF auth.uid() IS NOT NULL AND NEW.role IS DISTINCT FROM OLD.role THEN
    -- Allow if the caller is a confirmed admin in user_management.
    IF NOT EXISTS (
      SELECT 1
      FROM public.user_management
      WHERE user_id = auth.uid()
        AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Forbidden: you cannot change your own role';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if present (idempotent re-run)
DROP TRIGGER IF EXISTS trg_prevent_profile_role_escalation ON public.profiles;

CREATE TRIGGER trg_prevent_profile_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_self_escalation();
