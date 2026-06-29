-- Fix 1: Correct payment date 12/19/2025 → 11/19/2025 for Intercity Bachupally.
-- The ₹34,000 payment was entered with month off by one; Elma ledger confirms 11/19.
UPDATE public.sales_transactions
SET transaction_date = '2025-11-19'
WHERE id = 'f8670a22-9097-4980-9b11-12c07a4ba429';

-- Fix 2: Insert 43 missing Intercity Bachupally EL 500ml sales (Nov 5 – Dec 30, 2025).
-- All sales entries for this period were never entered in the portal.
-- Prices: ₹110/case (Nov 5–14), ₹118/case (Nov 15 onward, except partial days).
-- customer_id: 1ee3ce8c-a487-4035-8103-abf40a3fbd12 (Intercity, Bachupally, EL 500 ml)
INSERT INTO public.sales_transactions
  (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT
  '1ee3ce8c-a487-4035-8103-abf40a3fbd12',
  t.txn_date::date,
  'sale',
  'EL 500 ml',
  t.qty,
  t.amt,
  'Stock Delivered'
FROM (VALUES
  ('2025-11-05', 30,  3300.00),
  ('2025-11-07', 30,  3300.00),
  ('2025-11-08', 30,  3300.00),
  ('2025-11-10', 50,  5500.00),
  ('2025-11-12', 50,  5500.00),
  ('2025-11-13', 40,  4400.00),
  ('2025-11-14', 40,  4400.00),
  ('2025-11-15', 40,  4720.00),
  ('2025-11-16', 50,  5900.00),
  ('2025-11-18', 50,  5900.00),
  ('2025-11-20', 50,  5900.00),
  ('2025-11-22', 50,  5900.00),
  ('2025-11-24', 50,  5900.00),
  ('2025-11-26', 50,  5900.00),
  ('2025-11-28', 50,  5900.00),
  ('2025-11-29', 50,  5900.00),
  ('2025-12-01', 50,  5900.00),
  ('2025-12-02', 50,  5900.00),
  ('2025-12-03', 50,  5900.00),
  ('2025-12-04', 50,  5900.00),
  ('2025-12-06', 50,  5900.00),
  ('2025-12-08', 50,  5900.00),
  ('2025-12-09', 50,  5900.00),
  ('2025-12-10', 50,  5900.00),
  ('2025-12-12', 50,  5900.00),
  ('2025-12-13', 50,  5900.00),
  ('2025-12-14', 40,  4720.00),
  ('2025-12-15', 50,  5900.00),
  ('2025-12-16', 50,  5900.00),
  ('2025-12-17', 50,  5900.00),
  ('2025-12-18', 39,  4602.00),
  ('2025-12-19', 50,  5900.00),
  ('2025-12-20', 50,  5900.00),
  ('2025-12-21', 50,  5900.00),
  ('2025-12-22', 50,  5900.00),
  ('2025-12-23', 50,  5900.00),
  ('2025-12-24', 50,  5900.00),
  ('2025-12-25', 50,  5900.00),
  ('2025-12-26', 50,  5900.00),
  ('2025-12-27', 50,  5900.00),
  ('2025-12-28', 50,  5900.00),
  ('2025-12-29', 50,  5900.00),
  ('2025-12-30', 50,  5900.00)
) AS t(txn_date, qty, amt)
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions st
  WHERE st.customer_id     = '1ee3ce8c-a487-4035-8103-abf40a3fbd12'
    AND st.transaction_date = t.txn_date::date
    AND st.transaction_type = 'sale'
    AND st.sku              = 'EL 500 ml'
    AND st.quantity         = t.qty
);

-- Fix 3: Insert 1/30/2026 return of -10 cases at ₹0 (stock came back, no credit).
INSERT INTO public.sales_transactions
  (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT
  '1ee3ce8c-a487-4035-8103-abf40a3fbd12',
  '2026-01-30',
  'sale',
  'EL 500 ml',
  -10,
  0.00,
  'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id      = '1ee3ce8c-a487-4035-8103-abf40a3fbd12'
    AND transaction_date = '2026-01-30'
    AND transaction_type = 'sale'
    AND quantity         = -10
);
