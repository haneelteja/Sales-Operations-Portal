-- Fix security warnings for function search paths

-- Fix search_path for get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Fix search_path for has_role_or_higher function
CREATE OR REPLACE FUNCTION public.has_role_or_higher(user_id UUID, required_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN required_role = 'viewer' THEN get_user_role(user_id) IN ('viewer', 'employee', 'manager', 'admin')
    WHEN required_role = 'employee' THEN get_user_role(user_id) IN ('employee', 'manager', 'admin')
    WHEN required_role = 'manager' THEN get_user_role(user_id) IN ('manager', 'admin')
    WHEN required_role = 'admin' THEN get_user_role(user_id) = 'admin'
    ELSE false
  END;
$$;