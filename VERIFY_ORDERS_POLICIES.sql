-- ==============================================
-- VERIFY ORDERS RLS POLICIES EXPRESSIONS
-- This will show the actual policy expressions
-- ==============================================

-- Check policy expressions
SELECT 
    policyname,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression,
    roles
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'orders'
ORDER BY cmd, policyname;

-- If the expressions are not 'true', you may need to recreate the policies
-- The INSERT policy should have WITH CHECK (true)
-- The SELECT, UPDATE, DELETE policies should have USING (true)

