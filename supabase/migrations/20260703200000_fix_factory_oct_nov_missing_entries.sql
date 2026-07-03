-- Fix factory_payables discrepancies vs Elma ledger for Oct & Nov 2025:
--
-- 1. Oct 27 2025: Gismat-Main office 10 P 500ml @ ₹1,092 was missing from portal.
--    Effect: +10 cases, +₹1,092 → Oct net goes from -17,529 to -16,437 (matches Elma).
--
-- 2. Nov 11 2025: Two return entries were missing from portal:
--    - P 1000 ml return: -60 cases @ -₹6,086
--    - P 500 ml return:  -20 cases @ -₹2,184
--    Effect: -80 cases, -₹8,270 → Nov net goes from +72,977 to +64,707 (matches Elma).

-- 1. Oct 27: Gismat-Main office production
INSERT INTO public.factory_payables (customer_id, transaction_date, transaction_type, sku, quantity, amount)
SELECT
  (SELECT id FROM public.customers
   WHERE client_name ILIKE '%ismat%' AND branch ILIKE '%main%'
   ORDER BY id LIMIT 1),
  '2025-10-27', 'production', 'P 500 ml', 10, 1092.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables fp
  JOIN public.customers c ON fp.customer_id = c.id
  WHERE c.client_name ILIKE '%ismat%' AND c.branch ILIKE '%main%'
    AND fp.transaction_date = '2025-10-27'
    AND fp.transaction_type = 'production'
    AND fp.sku = 'P 500 ml'
    AND fp.quantity = 10
    AND fp.amount = 1092.00
);

-- 2a. Nov 11: P 1000 ml return (-60 cases, -₹6,086)
INSERT INTO public.factory_payables (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT NULL, '2025-11-11', 'production', 'P 1000 ml', -60, -6086.00, 'P 1000 ml return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE customer_id IS NULL
    AND transaction_date = '2025-11-11'
    AND transaction_type = 'production'
    AND sku = 'P 1000 ml'
    AND quantity = -60
    AND amount = -6086.00
);

-- 2b. Nov 11: P 500 ml return (-20 cases, -₹2,184)
INSERT INTO public.factory_payables (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT NULL, '2025-11-11', 'production', 'P 500 ml', -20, -2184.00, 'P 500 ml return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE customer_id IS NULL
    AND transaction_date = '2025-11-11'
    AND transaction_type = 'production'
    AND sku = 'P 500 ml'
    AND quantity = -20
    AND amount = -2184.00
);
