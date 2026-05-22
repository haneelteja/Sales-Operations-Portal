-- Check actual column definition for customers.price_per_case in live schema
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  is_generated,
  generation_expression
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'customers'
  AND column_name  = 'price_per_case';
