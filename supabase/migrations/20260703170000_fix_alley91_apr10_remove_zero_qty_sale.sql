-- Remove erroneous 4/10/2026 250 EC sale entry for Alley 91 Nanakramguda:
-- qty=0, ₹5,160 — not present in Elma client ledger.
-- No inventory impact (qty=0) but was adding ₹5,160 to outstanding incorrectly.

DELETE FROM public.sales_transactions st
USING public.customers c
WHERE st.customer_id = c.id
  AND c.client_name ILIKE '%alley%'
  AND st.transaction_type = 'sale'
  AND st.transaction_date = '2026-04-10'
  AND st.sku = '250 EC'
  AND st.quantity = 0
  AND st.amount = 5160.00;
