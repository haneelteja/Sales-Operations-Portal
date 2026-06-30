-- Fix September 2025 sales_transactions discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: House Party 9/5 — qty 38→40.
UPDATE public.sales_transactions
SET quantity = 40
WHERE id = '681a98c1-10bd-4c5a-9300-1906164f2091';

-- Fix 2: Gismat-Ameerpet 9/9 — SKU P 500ml→P 1000ml.
UPDATE public.sales_transactions
SET sku = 'P 1000 ml'
WHERE id = 'fcbbd8e9-e217-49be-9f97-388d575cbc1c';

-- Fix 3: Deccan kitchen 750ml 9/16 — qty 25→26.
UPDATE public.sales_transactions
SET quantity = 26
WHERE id = '52e4e79a-7ee8-4832-ad76-3bb025be71d2';

-- Fix 4: Gismat-Dilshuknagar 9/24 — qty 117→120.
UPDATE public.sales_transactions
SET quantity = 120
WHERE id = '58dfd923-0188-4391-8eff-b05d1f00b770';

-- Fix 5: Gismat-Chandha nagar 9/27 — qty 47→50.
UPDATE public.sales_transactions
SET quantity = 50
WHERE id = '256b0b3c-1a33-4b0e-b171-2fbcec0e0f1b';

-- Fix 6: Delete duplicate Gismat 9/3 payment — ghost customer (8c99e5ed) with no sales,
-- legitimate Gismat-Pragathi nagar 9/3 payment already recorded under f1e7fb82.
DELETE FROM public.sales_transactions
WHERE id = '15c55f83-069f-43dc-ac4a-0aab5d9688de';

-- Insert 1: Tilaks Kitchen 9/8 — missing 98 cases P 500ml ₹16,660.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT 'd2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6', '2025-09-08', 'sale', 'P 500 ml', 98, 16660.00, 'Stock Delivered'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = 'd2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6'
    AND transaction_date = '2025-09-08' AND transaction_type = 'sale'
    AND quantity = 98
);

-- Insert 2: Atias Kitchen 9/8 — missing 42 cases P 1000ml ₹7,056.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '7e33cd87-5c7f-4155-9364-e61383ecf34a', '2025-09-08', 'sale', 'P 1000 ml', 42, 7056.00, 'Stock Delivered'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '7e33cd87-5c7f-4155-9364-e61383ecf34a'
    AND transaction_date = '2025-09-08' AND transaction_type = 'sale'
    AND quantity = 42
);

-- Insert 3: Golden Pavilion 9/9 — return −1 case AL 750ml ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '19a0035e-cee5-4d54-92c8-93184cda4fd3', '2025-09-09', 'sale', 'AL 750 ml', -1, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '19a0035e-cee5-4d54-92c8-93184cda4fd3'
    AND transaction_date = '2025-09-09' AND transaction_type = 'sale'
    AND quantity = -1
);

-- Insert 4: Deccan kitchen 750ml 9/16 — return −1 case P 750ml ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '9d315841-30f0-478b-8186-15186f1098a8', '2025-09-16', 'sale', 'P 750 ml', -1, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '9d315841-30f0-478b-8186-15186f1098a8'
    AND transaction_date = '2025-09-16' AND transaction_type = 'sale'
    AND quantity = -1
);
