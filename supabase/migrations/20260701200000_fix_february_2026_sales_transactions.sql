-- Fix February 2026 sales_transactions discrepancies vs Elma ledger (2026-07-01).

-- Insert 1: Chaitanya's Modern Kitchen 2/21 — factory stock adjustment qty -12, amount ₹0.
INSERT INTO public.sales_transactions (transaction_date, customer_id, transaction_type, sku, quantity, amount)
SELECT '2026-02-21', '4cada784-9ab9-4f68-9571-11d59ad6af9d', 'sale', 'P 500 ml', -12, 0.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE transaction_date = '2026-02-21'
    AND customer_id = '4cada784-9ab9-4f68-9571-11d59ad6af9d'
    AND quantity = -12
);
