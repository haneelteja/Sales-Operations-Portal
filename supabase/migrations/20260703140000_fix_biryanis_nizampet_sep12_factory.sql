-- Add missing Biryanis and More Nizampet 9/12/2025 factory entry:
-- 50 cases P 1000 ml / ₹5,699 present in Elma factory ledger but absent from portal.
-- Client entry for same date exists and is correct.

INSERT INTO public.factory_payables (customer_id, transaction_date, transaction_type, sku, quantity, amount)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE '%biryan%' AND branch ILIKE '%nizampet%' LIMIT 1),
  '2025-09-12', 'production', 'P 1000 ml', 50, 5699.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables fp
  JOIN public.customers c ON fp.customer_id = c.id
  WHERE c.client_name ILIKE '%biryan%' AND c.branch ILIKE '%nizampet%'
    AND fp.transaction_type = 'production'
    AND fp.transaction_date = '2025-09-12'
    AND fp.sku = 'P 1000 ml'
    AND fp.quantity = 50
);
