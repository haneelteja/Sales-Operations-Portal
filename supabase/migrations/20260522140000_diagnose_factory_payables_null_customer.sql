-- Check FK nullability (PostgREST uses INNER JOIN when FK is NOT NULL, LEFT JOIN when nullable)
SELECT
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'factory_payables'
  AND column_name  = 'customer_id';

-- Count rows by customer_id presence and transaction_type
SELECT
  transaction_type,
  CASE WHEN customer_id IS NULL THEN 'null' ELSE 'set' END AS customer_id_status,
  COUNT(*) AS row_count
FROM public.factory_payables
GROUP BY transaction_type, customer_id_status
ORDER BY transaction_type, customer_id_status;
