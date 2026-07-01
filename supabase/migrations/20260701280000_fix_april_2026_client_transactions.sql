-- Fix April 2026 client transaction discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: Alley 91 4/28 SKU — DB shows 'P 500 ml', should be 'P 250 ml'.
-- 35 units × ₹165 = ₹5,775 confirms Parinay 250 ml pricing.
UPDATE public.sales_transactions SET sku = 'P 250 ml' WHERE id = '193f63c2-207e-421a-9829-7001322263aa';

-- Insert 1: Missing Gismat-Ameerpet 4/27 stock reversal (qty=-40, ₹0).
-- Elma shows the 40-case sale and its paired ₹0 reversal; DB only has the sale.
INSERT INTO public.sales_transactions (transaction_date, customer_id, transaction_type, sku, quantity, amount)
SELECT '2026-04-27',
       (SELECT id FROM public.customers WHERE client_name = 'Jismat' AND branch = 'Ameerpet' LIMIT 1),
       'sale', 'P 500 ml', -40, 0.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions st
  JOIN public.customers c ON st.customer_id = c.id
  WHERE st.transaction_date = '2026-04-27'
    AND c.client_name = 'Jismat' AND c.branch = 'Ameerpet'
    AND st.quantity = -40
);
