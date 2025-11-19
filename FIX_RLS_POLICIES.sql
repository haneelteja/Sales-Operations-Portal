-- ==============================================
-- FIX RLS POLICIES FOR FACTORY_PRICING
-- Run this to ensure proper access permissions
-- ==============================================

-- Step 1: Check current RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'factory_pricing';

-- Step 2: Check current policies
SELECT 
    policyname,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'factory_pricing';

-- Step 3: Drop all existing policies (if any)
DROP POLICY IF EXISTS "Allow all operations on factory_pricing" ON public.factory_pricing;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.factory_pricing;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.factory_pricing;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.factory_pricing;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.factory_pricing;

-- Step 4: Create comprehensive policies for all operations
-- Policy for SELECT (READ)
CREATE POLICY "Enable read access for all users" 
ON public.factory_pricing 
FOR SELECT 
USING (true);

-- Policy for INSERT
CREATE POLICY "Enable insert for all users" 
ON public.factory_pricing 
FOR INSERT 
WITH CHECK (true);

-- Policy for UPDATE
CREATE POLICY "Enable update for all users" 
ON public.factory_pricing 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Policy for DELETE
CREATE POLICY "Enable delete for all users" 
ON public.factory_pricing 
FOR DELETE 
USING (true);

-- Step 5: Verify policies were created
SELECT 
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'factory_pricing'
ORDER BY cmd, policyname;

-- Step 6: Test query as anon user (simulate)
-- This should work now
SELECT 
    sku, 
    bottles_per_case,
    price_per_bottle,
    cost_per_case
FROM public.factory_pricing
ORDER BY sku ASC
LIMIT 5;

