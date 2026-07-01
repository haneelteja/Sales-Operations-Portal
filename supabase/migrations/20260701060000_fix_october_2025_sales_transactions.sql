-- Fix October 2025 sales_transactions discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: House Party 10/1 — qty 48→50.
UPDATE public.sales_transactions
SET quantity = 50
WHERE id = 'bc6f983d-cdb3-47b1-982a-cb64361ac022';

-- Fix 2: Maryadha Ramanna - Kondapur 10/6 — qty 109→111.
UPDATE public.sales_transactions
SET quantity = 111
WHERE id = '35aaf41e-3283-40ce-a310-9013d0b358af';

-- Fix 3: Deccan kitchen 750ml 10/14 — qty 63→64.
UPDATE public.sales_transactions
SET quantity = 64
WHERE id = '6fdd93e7-9226-42e0-b314-183dbd59e134';

-- Fix 4: Benguluru Bhavan 10/16 — qty 118→120.
UPDATE public.sales_transactions
SET quantity = 120
WHERE id = 'a7b7e9f5-4386-49d4-b2c9-74d0b4fadafe';

-- Insert 1: Maryadha Ramanna LB Nagar 10/23 — return −20 cases ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '587eee6f-9afa-4f07-a920-baaa7ed0cc2b', '2025-10-23', 'sale', 'P 500 ml', -20, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '587eee6f-9afa-4f07-a920-baaa7ed0cc2b'
    AND transaction_date = '2025-10-23' AND transaction_type = 'sale'
    AND quantity = -20
);
