-- June 2026 label fixes:
-- 1. Add 4 missing Jun 4 purchases (Iron hill café, Maryadha Ramanna, This is it café, Ballus Kitchen)
-- 2. Add Jun 9 (₹9980) and Jun 16 (₹13600) Morya Labels payments
-- 3. Add 8 Jun 25 count mismatch adjustments
-- 4. Add 3 Jun 30 count mismatch adjustments

-- ── 1. Jun 4 purchases ────────────────────────────────────────────────────────

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  'Morya labels',
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill%' LIMIT 1),
  'P 500 ml', 2169, 0.9440, 2048.00, '2026-06-04', 'purchase', NULL;

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  'Morya labels',
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna%' LIMIT 1),
  'P 500 ml', 2264, 0.9440, 2137.00, '2026-06-04', 'purchase', NULL;

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  'Morya labels',
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it%' LIMIT 1),
  'P 500 ml', 2188, 0.9440, 2065.00, '2026-06-04', 'purchase', NULL;

-- Ballus Kitchen = Ballu Kitchen in DB (P 1000 ml: 2634 × 1.416 = 3730)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  'Morya labels',
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballu Kitchen%' LIMIT 1),
  'P 1000 ml', 2634, 1.4160, 3730.00, '2026-06-04', 'purchase', NULL;

-- ── 2. Jun vendor payments ────────────────────────────────────────────────────

INSERT INTO public.label_payments (vendor_id, payment_amount, payment_date, payment_method, description)
VALUES
  ('Morya labels',  9980.00, '2026-06-09', 'Bank Transfer', NULL),
  ('Morya labels', 13600.00, '2026-06-16', 'Bank Transfer', NULL);

-- ── 3. Jun 25 count mismatch adjustments ──────────────────────────────────────
-- Gismat New in Elma = Gismat (c23daee9-4068-4024-b50c-50cb6bbde582)

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
VALUES
  ('Morya labels', 'c23daee9-4068-4024-b50c-50cb6bbde582', 'P 500 ml',  -19, 0, 0, '2026-06-25', 'adjustment', 'count mismatch'),
  ('Morya labels', (SELECT id FROM public.customers WHERE client_name = 'Hiyya Dino Mandi'            LIMIT 1), 'P 500 ml',  100, 0, 0, '2026-06-25', 'adjustment', 'count mismatch'),
  ('Morya labels', (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi'     LIMIT 1), 'P 500 ml',  588, 0, 0, '2026-06-25', 'adjustment', 'count mismatch'),
  ('Morya labels', (SELECT id FROM public.customers WHERE client_name = 'Benguluru Bhavan'            LIMIT 1), 'P 500 ml', -180, 0, 0, '2026-06-25', 'adjustment', 'count mismatch'),
  ('Morya labels', (SELECT id FROM public.customers WHERE client_name = 'Soul of South'               LIMIT 1), 'P 500 ml', -430, 0, 0, '2026-06-25', 'adjustment', 'count mismatch'),
  ('Morya labels', (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%'           LIMIT 1), 'P 500 ml',    9, 0, 0, '2026-06-25', 'adjustment', 'count mismatch'),
  ('Morya labels', (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%Modern%'       LIMIT 1), 'P 500 ml',   31, 0, 0, '2026-06-25', 'adjustment', 'count mismatch'),
  ('Morya labels', (SELECT id FROM public.customers WHERE client_name ILIKE 'Chandhu Poda%'           LIMIT 1), 'P 500 ml',  211, 0, 0, '2026-06-25', 'adjustment', 'count mismatch');

-- ── 4. Jun 30 count mismatch adjustments ──────────────────────────────────────
-- Biryanis uses P 1000 ml; Benguluru Bhavan and Chaitanya use P 500 ml

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
VALUES
  ('Morya labels', (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis%'         LIMIT 1), 'P 1000 ml', 3896, 0, 0, '2026-06-30', 'adjustment', 'count mismatch'),
  ('Morya labels', (SELECT id FROM public.customers WHERE client_name = 'Benguluru Bhavan'      LIMIT 1), 'P 500 ml',  1200, 0, 0, '2026-06-30', 'adjustment', 'count mismatch'),
  ('Morya labels', (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%Modern%' LIMIT 1), 'P 500 ml',    40, 0, 0, '2026-06-30', 'adjustment', 'count mismatch');
