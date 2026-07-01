-- Fix December 2025 sales_transactions discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: This is it café 12/21 — qty 17→19.
UPDATE public.sales_transactions
SET quantity = 19
WHERE id = '79e1aceb-3127-4a82-aec6-c0f4722b4300';

-- Insert 1: Tilaks kitchen 12/19 — missing 80 cases P 500ml ₹13,600.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT 'd2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6', '2025-12-19', 'sale', 'P 500 ml', 80, 13600.00, 'Stock Delivered'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = 'd2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6'
    AND transaction_date = '2025-12-19' AND transaction_type = 'sale'
    AND quantity = 80
);
