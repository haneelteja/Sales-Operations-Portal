-- Fix July 2025 sales_transactions discrepancies vs Elma ledger (2026-06-30).

-- Fix 1: Gismat-Ameerpet 7/2 — qty 103→103.5.
UPDATE public.sales_transactions
SET quantity = 103.5
WHERE id = '7e8f7c41-cba3-424a-96d2-8f761be3e15a';

-- Fix 2: Gismat-Pragathi nagar 7/29 — amount ₹8,500→₹8,300.
UPDATE public.sales_transactions
SET amount = 8300.00
WHERE id = 'ff691bd9-a0e2-48ec-a29c-5358bdff8ff0';

-- Insert 1: Golden Pavilion 7/1 — fractional return −0.34 qty ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '19a0035e-cee5-4d54-92c8-93184cda4fd3', '2025-07-01', 'sale', 'AL 750 ml', -0.34, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '19a0035e-cee5-4d54-92c8-93184cda4fd3'
    AND transaction_date = '2025-07-01' AND transaction_type = 'sale'
    AND quantity = -0.34
);

-- Insert 2: Gismat-Ameerpet 7/2 — 1.5 qty ₹0 (remainder entry).
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '071556e7-be52-4caf-98a7-c0f09210978f', '2025-07-02', 'sale', 'P 500 ml', 1.5, 0.00, 'Stock Delivered'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '071556e7-be52-4caf-98a7-c0f09210978f'
    AND transaction_date = '2025-07-02' AND transaction_type = 'sale'
    AND quantity = 1.5
);

-- Insert 3: Tilaks Kitchen 7/9 — missing 90 cases P 500ml ₹15,300.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT 'd2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6', '2025-07-09', 'sale', 'P 500 ml', 90, 15300.00, 'Stock Delivered'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = 'd2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6'
    AND transaction_date = '2025-07-09' AND transaction_type = 'sale'
    AND quantity = 90
);

-- Insert 4: Biryanis Warangal 7/14 — return −10 qty ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT 'bb9f701c-ef79-4f46-8b2e-62c69ce1306a', '2025-07-14', 'sale', 'P 1000 ml', -10, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = 'bb9f701c-ef79-4f46-8b2e-62c69ce1306a'
    AND transaction_date = '2025-07-14' AND transaction_type = 'sale'
    AND quantity = -10
);

-- Insert 5: Biryanis Warangal 7/14 — return −5 qty ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT 'bb9f701c-ef79-4f46-8b2e-62c69ce1306a', '2025-07-14', 'sale', 'P 1000 ml', -5, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = 'bb9f701c-ef79-4f46-8b2e-62c69ce1306a'
    AND transaction_date = '2025-07-14' AND transaction_type = 'sale'
    AND quantity = -5
);

-- Insert 6: Fusion Aroma 7/29 — return −3 qty ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '2e93416d-50bb-4751-85ce-66655d818df7', '2025-07-29', 'sale', 'P 1000 ml', -3, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '2e93416d-50bb-4751-85ce-66655d818df7'
    AND transaction_date = '2025-07-29' AND transaction_type = 'sale'
    AND quantity = -3
);
