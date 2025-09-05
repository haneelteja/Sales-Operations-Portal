-- Promote the current user to manager by ensuring a profile exists and updating role
DO $$
DECLARE
  uid uuid := '34df638c-e8fe-48e9-8f58-9604ff7ace79';
  uemail text;
  uname text;
BEGIN
  -- Get email and name from auth.users
  SELECT email, raw_user_meta_data->>'full_name'
    INTO uemail, uname
  FROM auth.users
  WHERE id = uid;

  -- If profile doesn't exist, create it with manager role
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = uid) THEN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      uid,
      COALESCE(uemail, 'unknown@local'),
      COALESCE(uname, uemail),
      'manager'::app_role
    );
  ELSE
    -- Otherwise, update role to manager and backfill email/name if missing
    UPDATE public.profiles
    SET 
      role = 'manager'::app_role,
      email = COALESCE(public.profiles.email, uemail),
      full_name = COALESCE(public.profiles.full_name, COALESCE(uname, uemail))
    WHERE id = uid;
  END IF;
END $$;