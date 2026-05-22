-- Find factory_payables rows where customer_id references a non-existent customer
-- These rows get silently dropped by PostgREST's embedded resource join
SELECT
  fp.id,
  fp.transaction_type,
  fp.sku,
  fp.quantity,
  fp.amount,
  fp.transaction_date::date,
  fp.description,
  fp.customer_id
FROM public.factory_payables fp
WHERE fp.customer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.customers c WHERE c.id = fp.customer_id
  );
