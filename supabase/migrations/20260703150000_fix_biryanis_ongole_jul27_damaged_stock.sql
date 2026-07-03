-- Fix Biryanis and More Ongole 7/27/2025 damaged stock entry:
-- -5 P 1000ml at ₹-960 was recorded as a payment instead of a negative client sale.
-- Remove erroneous payment and insert correct negative sale entry.

DELETE FROM public.sales_transactions st
USING public.customers c
WHERE st.customer_id = c.id
  AND c.client_name ILIKE '%biryan%' AND c.branch ILIKE '%ongole%'
  AND st.transaction_type = 'payment'
  AND st.transaction_date = '2025-07-27'
  AND st.amount = 960.00;

INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE '%biryan%' AND branch ILIKE '%ongole%' LIMIT 1),
  '2025-07-27', 'sale', 'P 1000 ml', -5, -960.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions st
  JOIN public.customers c ON st.customer_id = c.id
  WHERE c.client_name ILIKE '%biryan%' AND c.branch ILIKE '%ongole%'
    AND st.transaction_type = 'sale'
    AND st.transaction_date = '2025-07-27'
    AND st.sku = 'P 1000 ml'
    AND st.quantity = -5
);
