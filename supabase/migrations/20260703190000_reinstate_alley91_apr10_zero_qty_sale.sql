-- Reinstate Alley 91 Nanakramguda 4/10/2026 250 EC zero-qty sale (₹5,160):
-- This entry was removed earlier today, but outstanding comparison against Elma
-- confirms it is a valid price adjustment / credit note present in Elma ledger.
-- qty=0 means inventory is unaffected; outstanding increases by ₹5,160 to match Elma.

INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE '%alley%' LIMIT 1),
  '2026-04-10', 'sale', '250 EC', 0, 5160.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions st
  JOIN public.customers c ON st.customer_id = c.id
  WHERE c.client_name ILIKE '%alley%'
    AND st.transaction_type = 'sale'
    AND st.transaction_date = '2026-04-10'
    AND st.sku = '250 EC'
    AND st.quantity = 0
    AND st.amount = 5160.00
);
