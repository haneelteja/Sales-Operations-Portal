-- Revert Jismat-Dilshuknagar -₹4,150 return added in migration 20260702010000.
-- Elma (latest) shows ₹63,470 outstanding which does not include this entry.
-- Removing brings portal from ₹59,320 back to ₹63,470 to match Elma.

DELETE FROM public.sales_transactions st
USING public.customers c
WHERE st.customer_id = c.id
  AND (c.client_name = 'Jismat' OR c.client_name = 'Gismat')
  AND c.branch = 'Dilshuknagar'
  AND st.transaction_type = 'sale'
  AND st.transaction_date = '2025-11-05'
  AND st.quantity = -25
  AND st.sku = 'P 500 ml'
  AND st.amount = -4150.00;
