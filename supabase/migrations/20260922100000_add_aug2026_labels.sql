-- August 2026 label purchases (all batches from Elma Labels Production Table).
-- vendor_id is UUID FK referencing label_vendors(id) since 20260921080000.

-- ── Aug 3 Morya Labels batch ──────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1),
       'P 500 ml', 3792, 0.9440, 3579.65, '2026-08-03', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-03' AND quantity=3792 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE '%Chaitanya%Modern Kitchen%' LIMIT 1),
       'P 500 ml', 2037, 0.9440, 1922.93, '2026-08-03', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-03' AND quantity=2037 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill%' LIMIT 1),
       'P 500 ml', 4075, 0.9440, 3846.80, '2026-08-03', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-03' AND quantity=4075 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name='SSKL' AND branch ILIKE '%Kalamandir%' LIMIT 1),
       'P 250 ml', 10138, 0.4720, 4785.14, '2026-08-03', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-03' AND quantity=10138 AND record_type='purchase');

-- ── Aug 5 Morya Labels batch ──────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballu Kitchen%' LIMIT 1),
       'P 1000 ml', 2746, 1.4160, 3888.34, '2026-08-05', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-05' AND quantity=2746 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7%' LIMIT 1),
       'P 1000 ml', 2730, 1.4160, 3865.68, '2026-08-05', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-05' AND quantity=2730 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1),
       'P 500 ml', 3056, 0.9440, 2884.86, '2026-08-05', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-05' AND quantity=3056 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%' AND (branch IS NULL OR branch NOT ILIKE '%250%') LIMIT 1),
       'P 500 ml', 2075, 0.9440, 1958.80, '2026-08-05', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-05' AND quantity=2075 AND record_type='purchase');

-- By the Bay: label client not in customers table
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       NULL,
       'P 1000 ml', 2174, 1.4160, 3078.38, '2026-08-05', 'purchase', 'By the Bay'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-05' AND quantity=2174 AND record_type='purchase');

-- ── Aug 10 Morya Labels batch ─────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE '%Rangaswami%' LIMIT 1),
       'P 500 ml', 1207, 0.9440, 1139.41, '2026-08-10', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-10' AND quantity=1207 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Hotel Ellappa%500%' LIMIT 1),
       'P 500 ml', 679, 0.9440, 640.98, '2026-08-10', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-10' AND quantity=679 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Hotel Ellappa%1000%' LIMIT 1),
       'P 1000 ml', 444, 1.4160, 628.70, '2026-08-10', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-10' AND quantity=444 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna%' LIMIT 1),
       'P 500 ml', 2150, 0.9440, 2029.60, '2026-08-10', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-10' AND quantity=2150 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan%' LIMIT 1),
       'P 500 ml', 4018, 0.9440, 3793.00, '2026-08-10', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-10' AND quantity=4018 AND record_type='purchase');

-- ── Aug 11 Morya Labels batch + adjustment ────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name='SSKL' AND branch ILIKE '%Kalamandir%' LIMIT 1),
       'P 250 ml', 10232, 0.4720, 4829.50, '2026-08-11', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-11' AND quantity=10232 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More%' AND branch ILIKE '%Gachibowli%' LIMIT 1),
       'P 250 ml', 3162, 0.4720, 1492.46, '2026-08-11', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-11' AND quantity=3162 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%') LIMIT 1),
       'P 1000 ml', 5158, 1.4160, 7303.73, '2026-08-11', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-11' AND quantity=5158 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Aha Bengali%' LIMIT 1),
       'P 1000 ml', 730, 1.4160, 1033.68, '2026-08-11', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-11' AND quantity=730 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion%' LIMIT 1),
       'P 500 ml', 1132, 1.0620, 1202.18, '2026-08-11', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-11' AND quantity=1132 AND record_type='purchase');

-- Jismat +9 count adjustment
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1),
       'P 500 ml', 9, 0, 0, '2026-08-11', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-11' AND quantity=9 AND record_type='adjustment');

-- ── Aug 12 & 14 Morya Labels payments ────────────────────────────────────────
INSERT INTO public.label_payments (vendor_id, payment_amount, payment_date, payment_method, description)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       30172.00, '2026-08-12', 'Bank Transfer', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_payments WHERE payment_date='2026-08-12' AND payment_amount=30172.00);

INSERT INTO public.label_payments (vendor_id, payment_amount, payment_date, payment_method, description)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       30000.00, '2026-08-14', 'Bank Transfer', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_payments WHERE payment_date='2026-08-14' AND payment_amount=30000.00);

-- Aug 14 count adjustment: Hiyya Dino Mandi -30
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name='Hiyya Dino Mandi' LIMIT 1),
       'P 500 ml', -30, 0, 0, '2026-08-14', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-14' AND quantity=-30 AND record_type='adjustment');

-- ── Aug 18 Morya Labels batch ─────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name='Hiyya Dino Mandi' LIMIT 1),
       'P 500 ml', 2132, 0.9440, 2012.61, '2026-08-18', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-18' AND quantity=2132 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE '%Chaitanya%Modern Kitchen%' LIMIT 1),
       'P 500 ml', 4056, 0.9440, 3828.86, '2026-08-18', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-18' AND quantity=4056 AND record_type='purchase');

-- ── Aug 21 Morya Labels batch ─────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan%' LIMIT 1),
       'P 500 ml', 4018, 0.9440, 3793.00, '2026-08-21', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-21' AND quantity=4018 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%') LIMIT 1),
       'P 1000 ml', 5031, 1.4160, 7123.90, '2026-08-21', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-21' AND quantity=5031 AND record_type='purchase');

-- ── Aug 23 Morya Labels batch ─────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Finora%1000%' LIMIT 1),
       'P 1000 ml', 841, 1.4160, 1190.86, '2026-08-23', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-23' AND quantity=841 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Finora%250%' LIMIT 1),
       'P 250 ml', 4302, 0.4720, 2030.54, '2026-08-23', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-23' AND quantity=4302 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1),
       'P 500 ml', 6131, 0.9440, 5787.66, '2026-08-23', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-23' AND quantity=6131 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it%' LIMIT 1),
       'P 500 ml', 2056, 0.9440, 1940.86, '2026-08-23', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-23' AND quantity=2056 AND record_type='purchase');

-- ── Aug 24 count mismatch adjustments ────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1),
       'P 500 ml', 1840, 0, 0, '2026-08-24', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-24' AND quantity=1840 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it%' LIMIT 1),
       'P 500 ml', 1000, 0, 0, '2026-08-24', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-24' AND quantity=1000 AND record_type='adjustment');

-- ── Aug 26 JSR Printers batch + payment ──────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'TOS Club%' LIMIT 1),
       'P 1000 ml', 352, 3.1250, 1100.00, '2026-08-26', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-26' AND quantity=352 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%250%' LIMIT 1),
       'P 250 ml', 640, 1.2500, 800.00, '2026-08-26', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-26' AND quantity=640 AND record_type='purchase');

INSERT INTO public.label_payments (vendor_id, payment_amount, payment_date, payment_method, description)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1),
       1900.00, '2026-08-26', 'Bank Transfer', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_payments WHERE payment_date='2026-08-26' AND payment_amount=1900.00);

-- ── Aug 27 Morya Labels batch ─────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'TOS Club%' LIMIT 1),
       'P 1000 ml', 1301, 1.4160, 1842.22, '2026-08-27', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-27' AND quantity=1301 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7%' LIMIT 1),
       'P 1000 ml', 2666, 1.4160, 3775.06, '2026-08-27', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-27' AND quantity=2666 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name='Hiyya Dino Mandi' LIMIT 1),
       'P 500 ml', 4113, 0.9440, 3882.67, '2026-08-27', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-27' AND quantity=4113 AND record_type='purchase');

-- ── Aug 29 Morya Labels payment ───────────────────────────────────────────────
INSERT INTO public.label_payments (vendor_id, payment_amount, payment_date, payment_method, description)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       27708.00, '2026-08-29', 'Bank Transfer', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_payments WHERE payment_date='2026-08-29' AND payment_amount=27708.00);

-- ── Aug 31 count mismatch adjustments ────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Finora%1000%' LIMIT 1),
       'P 1000 ml', -193, 0, 0, '2026-08-31', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-31' AND quantity=-193 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Twilight Embassy%' LIMIT 1),
       'P 500 ml', -207, 0, 0, '2026-08-31', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-31' AND quantity=-207 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Aha Bengali%' LIMIT 1),
       'P 1000 ml', -70, 0, 0, '2026-08-31', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-31' AND quantity=-70 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More%' AND branch ILIKE '%Gachibowli%' LIMIT 1),
       'P 250 ml', -12, 0, 0, '2026-08-31', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-08-31' AND quantity=-12 AND record_type='adjustment');
