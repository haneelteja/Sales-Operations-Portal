-- ==============================================
-- FIX RLS POLICIES FOR ORDERS TABLE (SIMPLIFIED)
-- Run this if the previous script didn't create policies
-- ==============================================

-- Step 1: Drop ALL existing policies (run this first)
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

-- Step 2: Create policies one at a time (simplified - without TO clause)
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

-- Step 3: Verify policies were created
SELECT 
    policyname,
    cmd as command
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'orders'
ORDER BY cmd, policyname;

-- Expected result: Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)

