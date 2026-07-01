-- Fix May 2026 client transaction discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: BnM Warangal 5/4 payment — DB has date 5/5, Elma shows 5/4.
UPDATE public.sales_transactions SET transaction_date = '2026-05-04' WHERE id = '38a6396b-041c-4bc8-9b58-85af2489646d';

-- Fix 2: Thangedu payment — DB has date 5/19, Elma shows 5/20.
UPDATE public.sales_transactions SET transaction_date = '2026-05-20' WHERE id = '8916911e-88ad-476d-b04d-4f7fe93b7306';

-- Insert 1: Missing Tawalogy 1 ltr 5/8 sale (qty=50, ₹9,300).
INSERT INTO public.sales_transactions (transaction_date, customer_id, transaction_type, sku, quantity, amount)
SELECT '2026-05-08', '6ce0fbbb-bda1-415b-81eb-9c31ee9be062', 'sale', 'P 1000 ml', 50, 9300.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE transaction_date = '2026-05-08'
    AND customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062'
    AND transaction_type = 'sale'
    AND amount = 9300.00
);

-- Insert 2: Missing Tawalogy 1 ltr 5/11 payment (₹9,300).
INSERT INTO public.sales_transactions (transaction_date, customer_id, transaction_type, sku, quantity, amount)
SELECT '2026-05-11', '6ce0fbbb-bda1-415b-81eb-9c31ee9be062', 'payment', 'Payment', 0, 9300.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE transaction_date = '2026-05-11'
    AND customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062'
    AND transaction_type = 'payment'
    AND amount = 9300.00
);
