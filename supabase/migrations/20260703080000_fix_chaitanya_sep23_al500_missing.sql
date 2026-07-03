-- Add missing Chaitanya's Modern Kitchen 9/23/2025 AL 500 ml client entry:
-- 27 cases / ₹4,725 present in Elma client ledger but absent from portal.

INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE '%chaitanya%' LIMIT 1),
  '2025-09-23', 'sale', 'AL 500 ml', 27, 4725.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions st
  JOIN public.customers c ON st.customer_id = c.id
  WHERE c.client_name ILIKE '%chaitanya%'
    AND st.transaction_date = '2025-09-23'
    AND st.sku = 'AL 500 ml'
    AND st.quantity = 27
);
