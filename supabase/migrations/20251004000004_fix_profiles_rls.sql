-- Fix profiles RLS policies to allow public access for development
-- Drop existing RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Re-enable RLS (if it was disabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add a policy to allow public access for development
CREATE POLICY "Allow public access for development"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);







