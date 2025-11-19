-- ==============================================
-- COMPLETE RLS FIX FOR FACTORY_PRICING
-- This ensures both authenticated and anon users can access the table
-- ==============================================

-- Step 1: Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'factory_pricing';

-- Step 2: Remove ALL existing policies
DROP POLICY IF EXISTS "Allow all operations on factory_pricing" ON public.factory_pricing;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.factory_pricing;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.factory_pricing;
DROP POLICY IF EXISTS "Enable update for all users" ON public.factory_pricing;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.factory_pricing;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.factory_pricing;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.factory_pricing;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.factory_pricing;

-- Step 3: Create policies that explicitly allow anon and authenticated roles
-- SELECT Policy - Allow everyone to read
CREATE POLICY "factory_pricing_select_policy" 
ON public.factory_pricing 
FOR SELECT 
TO public, anon, authenticated
USING (true);

-- INSERT Policy - Allow everyone to insert
CREATE POLICY "factory_pricing_insert_policy" 
ON public.factory_pricing 
FOR INSERT 
TO public, anon, authenticated
WITH CHECK (true);

-- UPDATE Policy - Allow everyone to update
CREATE POLICY "factory_pricing_update_policy" 
ON public.factory_pricing 
FOR UPDATE 
TO public, anon, authenticated
USING (true)
WITH CHECK (true);

-- DELETE Policy - Allow everyone to delete
CREATE POLICY "factory_pricing_delete_policy" 
ON public.factory_pricing 
FOR DELETE 
TO public, anon, authenticated
USING (true);

-- Step 4: Verify policies were created
SELECT 
    policyname,
    cmd as command,
    roles,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'factory_pricing'
ORDER BY cmd, policyname;

-- Step 5: Grant table permissions explicitly
GRANT SELECT, INSERT, UPDATE, DELETE ON public.factory_pricing TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.factory_pricing TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.factory_pricing TO public;

-- Step 6: Verify permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'factory_pricing'
  AND grantee IN ('anon', 'authenticated', 'public')
ORDER BY grantee, privilege_type;

