-- Sep 2026 factory payables not yet covered by any migration.
-- Source: Elma IN & Out sheet (sheet2.xml), Sep 22-26 production + 5 Bank Transfer payments.
-- All amounts verified: P 250ml=113.40/case, P 500ml=124.70/case, P 1000ml=117.93/case.
-- NOT EXISTS guards: use transaction_date + sku + quantity so they are safe whether or not
-- the user already entered these entries through the portal UI.

-- ══════════════════════════════════════════════════════════
-- SEP 23 — Production entries
-- ══════════════════════════════════════════════════════════

-- Iron hill café (Madhapur): 50 cases P 500ml = 6,235.00
INSERT INTO public.factory_payables
  (customer_id, transaction_type, quantity, amount, transaction_date, sku)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill%' AND branch ILIKE '%Madhapur%' LIMIT 1),
  'production', 50, 6235.00, '2026-09-23', 'P 500 ml'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-23'
    AND transaction_type = 'production'
    AND sku = 'P 500 ml'
    AND quantity = 50
);

-- Thatha Kottu Tiffins: 68 cases P 500ml = 8,479.60
INSERT INTO public.factory_payables
  (customer_id, transaction_type, quantity, amount, transaction_date, sku)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1),
  'production', 68, 8479.60, '2026-09-23', 'P 500 ml'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-23'
    AND transaction_type = 'production'
    AND sku = 'P 500 ml'
    AND quantity = 68
);

-- Alley 91 (P 500ml): 58 cases = 7,232.60
INSERT INTO public.factory_payables
  (customer_id, transaction_type, quantity, amount, transaction_date, sku)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' AND sku = 'P 500 ml' LIMIT 1),
  'production', 58, 7232.60, '2026-09-23', 'P 500 ml'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-23'
    AND transaction_type = 'production'
    AND sku = 'P 500 ml'
    AND quantity = 58
);

-- Alley 91 (P 250ml): 60 cases = 6,804.00
INSERT INTO public.factory_payables
  (customer_id, transaction_type, quantity, amount, transaction_date, sku)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' AND sku = 'P 250 ml' LIMIT 1),
  'production', 60, 6804.00, '2026-09-23', 'P 250 ml'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-23'
    AND transaction_type = 'production'
    AND sku = 'P 250 ml'
    AND quantity = 60
);

-- ══════════════════════════════════════════════════════════
-- SEP 24 — Production entries
-- ══════════════════════════════════════════════════════════

-- Sri Sri Group (P 1000ml): 110 cases = 12,972.30
INSERT INTO public.factory_payables
  (customer_id, transaction_type, quantity, amount, transaction_date, sku)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Sri Sri%' AND sku = 'P 1000 ml' LIMIT 1),
  'production', 110, 12972.30, '2026-09-24', 'P 1000 ml'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-24'
    AND transaction_type = 'production'
    AND sku = 'P 1000 ml'
    AND quantity = 110
);

-- Sri Sri Group (P 500ml): 110 cases = 13,717.00
INSERT INTO public.factory_payables
  (customer_id, transaction_type, quantity, amount, transaction_date, sku)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Sri Sri%' AND sku = 'P 500 ml' LIMIT 1),
  'production', 110, 13717.00, '2026-09-24', 'P 500 ml'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-24'
    AND transaction_type = 'production'
    AND sku = 'P 500 ml'
    AND quantity = 110
);

-- Golden Pavilion Vijayawada (P 500ml): 130 cases = 16,211.00
INSERT INTO public.factory_payables
  (customer_id, transaction_type, quantity, amount, transaction_date, sku)
SELECT
  (SELECT id FROM public.customers
   WHERE client_name ILIKE '%Golden Pavilion%' AND branch ILIKE '%Vijayawada%' AND sku = 'P 500 ml' LIMIT 1),
  'production', 130, 16211.00, '2026-09-24', 'P 500 ml'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-24'
    AND transaction_type = 'production'
    AND sku = 'P 500 ml'
    AND quantity = 130
);

-- ══════════════════════════════════════════════════════════
-- SEP 25 — Production entries
-- ══════════════════════════════════════════════════════════

-- Iron hill café - Financial District: 54 cases P 500ml = 6,733.80
INSERT INTO public.factory_payables
  (customer_id, transaction_type, quantity, amount, transaction_date, sku)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill%' AND branch ILIKE '%Financial%' LIMIT 1),
  'production', 54, 6733.80, '2026-09-25', 'P 500 ml'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-25'
    AND transaction_type = 'production'
    AND sku = 'P 500 ml'
    AND quantity = 54
);

-- Tawalogy 1 ltr: 35 cases P 1000ml = 4,127.55
INSERT INTO public.factory_payables
  (customer_id, transaction_type, quantity, amount, transaction_date, sku)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Tawalogy%' LIMIT 1),
  'production', 35, 4127.55, '2026-09-25', 'P 1000 ml'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-25'
    AND transaction_type = 'production'
    AND sku = 'P 1000 ml'
    AND quantity = 35
);

-- Ballus Kitchen: 150 cases P 1000ml = 17,689.50
INSERT INTO public.factory_payables
  (customer_id, transaction_type, quantity, amount, transaction_date, sku)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballus Kitchen%' AND sku = 'P 1000 ml' LIMIT 1),
  'production', 150, 17689.50, '2026-09-25', 'P 1000 ml'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-25'
    AND transaction_type = 'production'
    AND sku = 'P 1000 ml'
    AND quantity = 150
);

-- Biryanis and More, Warangal: 300 cases P 1000ml = 35,379.00
INSERT INTO public.factory_payables
  (customer_id, transaction_type, quantity, amount, transaction_date, sku)
SELECT
  (SELECT id FROM public.customers
   WHERE client_name ILIKE '%Biryanis%' AND branch ILIKE '%Warangal%' LIMIT 1),
  'production', 300, 35379.00, '2026-09-25', 'P 1000 ml'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-25'
    AND transaction_type = 'production'
    AND sku = 'P 1000 ml'
    AND quantity = 300
);

-- Golden Pavilion Vijayawada (P 1000ml): 130 cases = 15,330.90
INSERT INTO public.factory_payables
  (customer_id, transaction_type, quantity, amount, transaction_date, sku)
SELECT
  (SELECT id FROM public.customers
   WHERE client_name ILIKE '%Golden Pavilion%' AND branch ILIKE '%Vijayawada%' AND sku = 'P 1000 ml' LIMIT 1),
  'production', 130, 15330.90, '2026-09-25', 'P 1000 ml'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-25'
    AND transaction_type = 'production'
    AND sku = 'P 1000 ml'
    AND quantity = 130
);

-- ══════════════════════════════════════════════════════════
-- SEP 2026 — Bank Transfer payments to factory (5 transfers)
-- ══════════════════════════════════════════════════════════

INSERT INTO public.factory_payables (transaction_date, transaction_type, amount, description)
SELECT '2026-09-02', 'payment', -75000.00, 'Bank Transfer'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-02' AND transaction_type = 'payment' AND amount = -75000.00
);

INSERT INTO public.factory_payables (transaction_date, transaction_type, amount, description)
SELECT '2026-09-07', 'payment', -150000.00, 'Bank Transfer'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-07' AND transaction_type = 'payment' AND amount = -150000.00
);

INSERT INTO public.factory_payables (transaction_date, transaction_type, amount, description)
SELECT '2026-09-11', 'payment', -50000.00, 'Bank Transfer'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-11' AND transaction_type = 'payment' AND amount = -50000.00
);

INSERT INTO public.factory_payables (transaction_date, transaction_type, amount, description)
SELECT '2026-09-23', 'payment', -75000.00, 'Bank Transfer'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-23' AND transaction_type = 'payment' AND amount = -75000.00
);

INSERT INTO public.factory_payables (transaction_date, transaction_type, amount, description)
SELECT '2026-09-26', 'payment', -50000.00, 'Bank Transfer'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-26' AND transaction_type = 'payment' AND amount = -50000.00
);
