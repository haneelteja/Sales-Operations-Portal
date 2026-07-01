-- Fix November 2025 sales_transactions discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: Benguluru Bhavan 11/3 — qty 48→50.
UPDATE public.sales_transactions
SET quantity = 50
WHERE id = '0456f5b4-8934-4342-9b4c-d90f905936d7';

-- Fix 2: 1980s Milatry Hotel 11/6 — qty 79→80, amount ₹13,746→₹13,920.
UPDATE public.sales_transactions
SET quantity = 80, amount = 13920.00
WHERE id = 'a09e6509-9f57-4657-accf-f2a2eded273e';

-- Fix 3: Golden Pavilion 11/18 — qty 38→40.
UPDATE public.sales_transactions
SET quantity = 40
WHERE id = '852dd3f9-5e6e-4064-9fc0-17d6570a9261';

-- Fix 4: Deccan kitchen 750ml 11/21 — qty 43→45.
UPDATE public.sales_transactions
SET quantity = 45
WHERE id = '2a0915b3-f45d-4b3f-aa91-28f56e89cc87';

-- Insert 1: Gismat-Pragathi Nagar 11/7 — missing 50 cases P 500ml ₹8,500.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT 'f1e7fb82-e889-4274-9ae3-5219a5a69fe2', '2025-11-07', 'sale', 'P 500 ml', 50, 8500.00, 'Stock Delivered'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = 'f1e7fb82-e889-4274-9ae3-5219a5a69fe2'
    AND transaction_date = '2025-11-07' AND transaction_type = 'sale'
    AND quantity = 50
);

-- Insert 2: Biryanis and More Tirumalagiri 11/8 — missing 60 cases P 1000ml ₹10,800.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '4a1f31b5-f70a-4218-9b1e-cc617bd2f307', '2025-11-08', 'sale', 'P 1000 ml', 60, 10800.00, 'Stock Delivered'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '4a1f31b5-f70a-4218-9b1e-cc617bd2f307'
    AND transaction_date = '2025-11-08' AND transaction_type = 'sale'
    AND quantity = 60
);
