-- Corrective migration: the previous H:L history migration (20260925090000)
-- added purchase entries for ALL active clients, including those that were
-- already correct or already OVER. This migration adds adjustment entries
-- to bring every client's available count back to the correct Elma remaining value.
--
-- For Gismat/Jismat/Benguluru Bhavan/This is it café: restores to pre-migration
-- state (those clients are intentionally OVER due to the Gismat→Jismat branch
-- transition; the user confirmed no fix needed for the underlying discrepancy).
--
-- For all other clients: targets Elma remaining column directly.

-- ============================================================
-- NEGATIVE CORRECTIONS (portal > Elma remaining / pre-mig state)
-- ============================================================

-- Gismat P 500ml: 185,978 → 32,676 (pre-migration intentional OVER)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml', -153302, 0, 0, '2026-09-25', 'adjustment',
  'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND sku = 'P 500 ml'
    AND quantity = -153302
    AND record_type = 'adjustment'
    AND reason = 'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
);

-- Benguluru Bhavan P 500ml: 77,644 → 21,190 (pre-migration intentional OVER)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml', -56454, 0, 0, '2026-09-25', 'adjustment',
  'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND sku = 'P 500 ml'
    AND quantity = -56454
    AND record_type = 'adjustment'
    AND reason = 'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
);

-- This is it café P 500ml: 38,911 → 14,895 (pre-migration intentional OVER)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'P 500 ml', -24016, 0, 0, '2026-09-25', 'adjustment',
  'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND sku = 'P 500 ml'
    AND quantity = -24016
    AND record_type = 'adjustment'
    AND reason = 'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
);

-- Hiyya Chrono Jail Mandi P 500ml: 43,014 → 3,057 (was exactly correct pre-migration)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono%' LIMIT 1),
  'P 500 ml', -39957, 0, 0, '2026-09-25', 'adjustment',
  'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono%' LIMIT 1)
    AND sku = 'P 500 ml'
    AND quantity = -39957
    AND record_type = 'adjustment'
    AND reason = 'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
);

-- Biryanis and More P 1000ml: 58,793 → 8,085 (Elma remaining)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml', -50708, 0, 0, '2026-09-25', 'adjustment',
  'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND sku = 'P 1000 ml'
    AND quantity = -50708
    AND record_type = 'adjustment'
    AND reason = 'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
);

-- Iron hill café P 500ml: 16,261 → 1,150 (Elma remaining)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1),
  'P 500 ml', -15111, 0, 0, '2026-09-25', 'adjustment',
  'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1)
    AND sku = 'P 500 ml'
    AND quantity = -15111
    AND record_type = 'adjustment'
    AND reason = 'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
);

-- Element E7 P 1000ml: 13,017 → 1,916 (Elma remaining)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1),
  'P 1000 ml', -11101, 0, 0, '2026-09-25', 'adjustment',
  'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1)
    AND sku = 'P 1000 ml'
    AND quantity = -11101
    AND record_type = 'adjustment'
    AND reason = 'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
);

-- Jismat P 500ml: 59,303 → 52,769 (pre-migration intentional OVER)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1),
  'P 500 ml', -6534, 0, 0, '2026-09-25', 'adjustment',
  'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1)
    AND sku = 'P 500 ml'
    AND quantity = -6534
    AND record_type = 'adjustment'
    AND reason = 'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
);

-- SSKL P 250ml: 1,374 → 450 (Elma remaining)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'SSKL' LIMIT 1),
  'P 250 ml', -924, 0, 0, '2026-09-25', 'adjustment',
  'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'SSKL' LIMIT 1)
    AND sku = 'P 250 ml'
    AND quantity = -924
    AND record_type = 'adjustment'
    AND reason = 'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
);

-- Sri Sri group P 1000ml: 2,660 → 1,330 (Elma remaining)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Sri Sri group' LIMIT 1),
  'P 1000 ml', -1330, 0, 0, '2026-09-25', 'adjustment',
  'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Sri Sri group' LIMIT 1)
    AND sku = 'P 1000 ml'
    AND quantity = -1330
    AND record_type = 'adjustment'
    AND reason = 'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
);

-- Tawalogy P 1000ml: 1,830 → 1,038 (Elma remaining; was exactly correct pre-migration)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Tawalogy' LIMIT 1),
  'P 1000 ml', -792, 0, 0, '2026-09-25', 'adjustment',
  'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Tawalogy' LIMIT 1)
    AND sku = 'P 1000 ml'
    AND quantity = -792
    AND record_type = 'adjustment'
    AND reason = 'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
);

-- Thatha Kottu Tiffins P 500ml: 956 → 0 (Elma remaining = 0; all labels used)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1),
  'P 500 ml', -956, 0, 0, '2026-09-25', 'adjustment',
  'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1)
    AND sku = 'P 500 ml'
    AND quantity = -956
    AND record_type = 'adjustment'
    AND reason = 'Elma reconciliation - restore pre-migration state (H:L overcorrection fix)'
);

-- ============================================================
-- POSITIVE CORRECTIONS (portal still under Elma remaining)
-- ============================================================

-- Alley 91 P 500ml: -429 → 2,151 (Elma remaining)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1),
  'P 500 ml', 2580, 0, 0, '2026-09-25', 'adjustment',
  'Elma reconciliation - H:L undercorrection fix'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1)
    AND sku = 'P 500 ml'
    AND quantity = 2580
    AND record_type = 'adjustment'
    AND reason = 'Elma reconciliation - H:L undercorrection fix'
);

-- Ballu Kitchen P 1000ml: 988 → 4,006 (Elma remaining)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballu Kitchen' LIMIT 1),
  'P 1000 ml', 3018, 0, 0, '2026-09-25', 'adjustment',
  'Elma reconciliation - H:L undercorrection fix'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballu Kitchen' LIMIT 1)
    AND sku = 'P 1000 ml'
    AND quantity = 3018
    AND record_type = 'adjustment'
    AND reason = 'Elma reconciliation - H:L undercorrection fix'
);

-- Golden Pavilion AL 750ml: 255 → 5,118 (Elma remaining)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1),
  'AL 750 ml', 4863, 0, 0, '2026-09-25', 'adjustment',
  'Elma reconciliation - H:L undercorrection fix'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1)
    AND sku = 'AL 750 ml'
    AND quantity = 4863
    AND record_type = 'adjustment'
    AND reason = 'Elma reconciliation - H:L undercorrection fix'
);

-- Chaitanya's Modern Kitchen P 500ml: 1,769 → 2,736 (Elma remaining)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%Modern Kitchen' LIMIT 1),
  'P 500 ml', 967, 0, 0, '2026-09-25', 'adjustment',
  'Elma reconciliation - H:L undercorrection fix'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%Modern Kitchen' LIMIT 1)
    AND sku = 'P 500 ml'
    AND quantity = 967
    AND record_type = 'adjustment'
    AND reason = 'Elma reconciliation - H:L undercorrection fix'
);

-- Hiyya Dino Mandi P 500ml: 2,166 → 2,525 (Elma remaining)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1),
  'P 500 ml', 359, 0, 0, '2026-09-25', 'adjustment',
  'Elma reconciliation - H:L undercorrection fix'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1)
    AND sku = 'P 500 ml'
    AND quantity = 359
    AND record_type = 'adjustment'
    AND reason = 'Elma reconciliation - H:L undercorrection fix'
);
