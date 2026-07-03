-- Fix Alley 91 Nanakramguda 1/27/2026 missing damaged stock entry:
-- -10 cases 250 EC at ₹0 present in Elma client ledger but absent from portal.
-- Without it, client net = 349, factory net = 339, inventory = -10.
-- After insert: client net = 339 = factory net → inventory = 0.

INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE '%alley%' LIMIT 1),
  '2026-01-27', 'sale', '250 EC', -10, 0.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions st
  JOIN public.customers c ON st.customer_id = c.id
  WHERE c.client_name ILIKE '%alley%'
    AND st.transaction_type = 'sale'
    AND st.transaction_date = '2026-01-27'
    AND st.sku = '250 EC'
    AND st.quantity = -10
);
