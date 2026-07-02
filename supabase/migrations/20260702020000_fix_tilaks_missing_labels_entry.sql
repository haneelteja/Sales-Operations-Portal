-- Add missing 3/31/2025 Tilaks Kitchen sale entry (325 P 500 ml, ₹0).
-- This was a labels-calculation dispatch recorded in the Elma factory ledger
-- but missing from client transactions, causing a 325-case inventory gap.

INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT (SELECT id FROM public.customers WHERE client_name ILIKE '%Tilak%' AND client_name ILIKE '%Kitchen%' LIMIT 1),
       '2025-03-31', 'sale', 'P 500 ml', 325, 0.00, 'Added for labels calculation'
WHERE (SELECT id FROM public.customers WHERE client_name ILIKE '%Tilak%' AND client_name ILIKE '%Kitchen%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_transactions st
    JOIN public.customers c ON st.customer_id = c.id
    WHERE st.transaction_date = '2025-03-31' AND st.transaction_type = 'sale'
      AND c.client_name ILIKE '%Tilak%' AND c.client_name ILIKE '%Kitchen%'
      AND st.quantity = 325 AND st.sku = 'P 500 ml'
  );
