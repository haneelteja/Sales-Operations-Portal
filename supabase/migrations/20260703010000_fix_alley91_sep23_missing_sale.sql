-- Add missing 9/23/2025 Alley 91 sale: 33 P 500 ml, ₹0.
-- Factory dispatched 33 cases (comment: "Delivered on Sep-23") but no client
-- transaction existed, causing +33 inventory discrepancy.

INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE '%Alley%91%' LIMIT 1),
  '2025-09-23', 'sale', 'P 500 ml', 33, 0.00, 'Delivered on Sep-23'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions st
  JOIN public.customers c ON st.customer_id = c.id
  WHERE c.client_name ILIKE '%Alley%91%'
    AND st.transaction_date = '2025-09-23'
    AND st.sku = 'P 500 ml'
    AND st.quantity = 33
);
