-- ==============================================
-- CHECK ORDERS TABLE ACTUAL SCHEMA
-- This will show the actual column names in the orders table
-- ==============================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'orders'
ORDER BY ordinal_position;

