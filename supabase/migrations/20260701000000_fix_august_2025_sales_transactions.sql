-- Fix August 2025 sales_transactions discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: Jagan Pan House 1000ml — date 8/1→8/2.
UPDATE public.sales_transactions
SET transaction_date = '2025-08-02'
WHERE id = 'af1e1606-aa91-4c6d-b75f-a17870aa0ca6';

-- Fix 2: Gismat-Chandha Nagar 8/5 — qty 50→30 (amount ₹4,980 correct; the +20 adjustment is a separate ₹0 entry below).
UPDATE public.sales_transactions
SET quantity = 30
WHERE id = '984a2ab3-9190-48db-af95-6eaef176a2bc';

-- Insert 1: Gismat-Ameerpet 8/5 — −20 cases ₹0 Adjustment.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '071556e7-be52-4caf-98a7-c0f09210978f', '2025-08-05', 'sale', 'P 500 ml', -20, 0.00, 'Adjustment'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '071556e7-be52-4caf-98a7-c0f09210978f'
    AND transaction_date = '2025-08-05' AND transaction_type = 'sale'
    AND quantity = -20
);

-- Insert 2: Gismat-Chandha nagar 8/5 — +20 cases ₹0 Adjustment.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '54bf3b3d-63c5-494d-b992-d4976fc026fb', '2025-08-05', 'sale', 'P 500 ml', 20, 0.00, 'Adjustment'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '54bf3b3d-63c5-494d-b992-d4976fc026fb'
    AND transaction_date = '2025-08-05' AND transaction_type = 'sale'
    AND quantity = 20 AND amount = 0
);

-- Insert 3: Chandhu Poda Marriage Order 8/8 — −2 cases ₹0 return.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '89da408c-8181-4c21-86e0-4b33d01353f8', '2025-08-08', 'sale', 'P 250 ml', -2, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '89da408c-8181-4c21-86e0-4b33d01353f8'
    AND transaction_date = '2025-08-08' AND transaction_type = 'sale'
    AND quantity = -2
);

-- Insert 4: Tilaks Kitchen 8/20 — missing 35 cases P 500ml ₹5,950.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT 'd2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6', '2025-08-20', 'sale', 'P 500 ml', 35, 5950.00, 'Stock Delivered'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = 'd2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6'
    AND transaction_date = '2025-08-20' AND transaction_type = 'sale'
    AND quantity = 35
);

-- Insert 5: House Party 8/29 — −25 cases ₹0 return.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT 'f04be0ad-ed1a-4cb9-abfd-21750f9ed07b', '2025-08-29', 'sale', 'P 500 ml', -25, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = 'f04be0ad-ed1a-4cb9-abfd-21750f9ed07b'
    AND transaction_date = '2025-08-29' AND transaction_type = 'sale'
    AND quantity = -25
);
