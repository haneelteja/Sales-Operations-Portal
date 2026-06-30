-- Fix May 2025 sales_transactions discrepancies vs Elma ledger (2026-06-30).

-- Fix 1: Fusion Aroma 5/1 — wrong qty (18→19) and amount (₹3,132→₹3,306).
UPDATE public.sales_transactions
SET quantity = 19, amount = 3306.00
WHERE id = 'd8953dc3-7479-4550-8c3c-3edec380f692';

-- Fix 2: AAHA 5/24 — wrong qty (67→67.5); amount ₹11,475 already correct.
UPDATE public.sales_transactions
SET quantity = 67.5
WHERE id = 'cacff032-ac83-4f27-8557-6594302406f2';

-- Fix 3: Gismat-Ameerpet 5/29 — wrong qty (99→100); amount ₹16,600 already correct.
UPDATE public.sales_transactions
SET quantity = 100
WHERE id = '5406928a-73b0-4b1b-82cf-84fe0f3e24ca';

-- Fix 4: Gismat-Pragathi nagar 5/29 — wrong amount (₹8,500→₹8,300); qty 50 correct.
UPDATE public.sales_transactions
SET amount = 8300.00
WHERE id = '132f9471-8e77-4bb3-86ad-7f2299971067';

-- Fix 5: Insert 3 missing 5/5 payments.
-- Fusion Aroma: customer_id 2e93416d
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, amount, description)
SELECT '2e93416d-50bb-4751-85ce-66655d818df7', '2025-05-05', 'payment', 3100.00, 'Payment'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '2e93416d-50bb-4751-85ce-66655d818df7'
    AND transaction_date = '2025-05-05' AND transaction_type = 'payment' AND amount = 3100.00
);

-- Tilaks kitchen ₹12,000: customer_id d2fa0e28
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, amount, description)
SELECT 'd2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6', '2025-05-05', 'payment', 12000.00, 'Payment'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = 'd2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6'
    AND transaction_date = '2025-05-05' AND transaction_type = 'payment' AND amount = 12000.00
);

-- Tilaks kitchen ₹700: customer_id d2fa0e28
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, amount, description)
SELECT 'd2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6', '2025-05-05', 'payment', 700.00, 'Payment'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = 'd2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6'
    AND transaction_date = '2025-05-05' AND transaction_type = 'payment' AND amount = 700.00
);

-- Fix 6: Insert missing Atias Kitchen 5/27 payment ₹3,696.
-- customer_id: 7e33cd87-5c7f-4155-9364-e61383ecf34a
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, amount, description)
SELECT '7e33cd87-5c7f-4155-9364-e61383ecf34a', '2025-05-27', 'payment', 3696.00, 'Payment'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '7e33cd87-5c7f-4155-9364-e61383ecf34a'
    AND transaction_date = '2025-05-27' AND transaction_type = 'payment' AND amount = 3696.00
);

-- Fix 7: Insert missing Atias Kitchen 5/30 sale: 85 cases P 1000ml ₹14,280.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '7e33cd87-5c7f-4155-9364-e61383ecf34a', '2025-05-30', 'sale', 'P 1000 ml', 85, 14280.00, 'Stock Delivered'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '7e33cd87-5c7f-4155-9364-e61383ecf34a'
    AND transaction_date = '2025-05-30' AND transaction_type = 'sale'
    AND sku = 'P 1000 ml' AND quantity = 85
);
