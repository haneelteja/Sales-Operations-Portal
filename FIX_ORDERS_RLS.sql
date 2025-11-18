-- ==============================================
-- FIX RLS POLICIES FOR ORDERS TABLE
-- This will allow INSERT operations for orders
-- ==============================================

-- Step 1: Check current RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'orders';

-- Step 2: Check current policies
SELECT 
    policyname,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'orders';

-- Step 3: Remove ALL existing policies
DROP POLICY IF EXISTS "Allow all operations on orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view orders based on client/branch access" ON public.orders;
DROP POLICY IF EXISTS "Users can insert orders based on client/branch access" ON public.orders;
DROP POLICY IF EXISTS "Users can update orders based on client/branch access" ON public.orders;
DROP POLICY IF EXISTS "Users can delete orders based on client/branch access" ON public.orders;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_policy" ON public.orders;

-- Step 4: Create comprehensive policies (simplified - without TO clause)
CREATE POLICY "orders_select_policy" 
ON public.orders 
FOR SELECT 
USING (true);

CREATE POLICY "orders_insert_policy" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "orders_update_policy" 
ON public.orders 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "orders_delete_policy" 
ON public.orders 
FOR DELETE 
USING (true);

-- Step 5: Grant explicit table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO public;

-- Step 6: Verify policies were created
SELECT 
    policyname,
    cmd as command
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'orders'
ORDER BY cmd, policyname;

-- Step 7: Verify permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'orders'
  AND grantee IN ('anon', 'authenticated', 'public')
ORDER BY grantee, privilege_type;

