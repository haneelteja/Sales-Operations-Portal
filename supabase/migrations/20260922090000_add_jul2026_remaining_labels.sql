-- July 2026 label purchases: Jul 3–30 remaining batches.
-- Jul 1 batch (5 rows) already in portal via 20260704110000_add_jul2026_labels.sql.
-- Gismat New (Elma) = Gismat Kondapur (portal UUID c23daee9).
-- Count mismatch adjustments: record_type='adjustment', cost_per_label=0, total_amount=0.
-- vendor_id is now UUID FK referencing label_vendors(id) since 20260921080000.

-- ── Jul 3 Morya Labels batch ──────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1),
       'P 500 ml', 4074, 0.9440, 3845.86, '2026-07-03', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-03' AND quantity=4074 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE '%Chaitanya%Modern Kitchen%' LIMIT 1),
       'P 500 ml', 4169, 0.9440, 3935.54, '2026-07-03', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-03' AND quantity=4169 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1),
       'P 500 ml', 2075, 0.9440, 1958.80, '2026-07-03', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases
                  WHERE purchase_date='2026-07-03' AND quantity=2075 AND record_type='purchase'
                    AND client_id=(SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name='Hiyya Dino Mandi' LIMIT 1),
       'P 500 ml', 4094, 0.9440, 3864.74, '2026-07-03', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-03' AND quantity=4094 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna%' LIMIT 1),
       'P 500 ml', 2075, 0.9440, 1958.80, '2026-07-03', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases
                  WHERE purchase_date='2026-07-03' AND quantity=2075 AND record_type='purchase'
                    AND client_id=(SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna%' LIMIT 1));

-- ── Jul 8 count mismatch adjustments ─────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7%' LIMIT 1),
       'P 1000 ml', -247, 0, 0, '2026-07-08', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-08' AND quantity=-247 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1),
       'P 500 ml', 25, 0, 0, '2026-07-08', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-08' AND quantity=25 AND record_type='adjustment'
                    AND client_id=(SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill%' LIMIT 1),
       'P 500 ml', -347, 0, 0, '2026-07-08', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-08' AND quantity=-347 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it%' LIMIT 1),
       'P 500 ml', -623, 0, 0, '2026-07-08', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-08' AND quantity=-623 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion%' LIMIT 1),
       'AL 750 ml', -1929, 0, 0, '2026-07-08', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-08' AND quantity=-1929 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion%' LIMIT 1),
       'P 500 ml', 1150, 0, 0, '2026-07-08', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-08' AND quantity=1150 AND record_type='adjustment');

-- ── Jul 8 Morya Labels purchases ──────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion%' LIMIT 1),
       'AL 750 ml', 2532, 0.8260, 2091.43, '2026-07-08', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-08' AND quantity=2532 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan%' LIMIT 1),
       'P 500 ml', 4056, 0.9440, 3828.86, '2026-07-08', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-08' AND quantity=4056 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it%' LIMIT 1),
       'P 500 ml', 3113, 0.9440, 2938.67, '2026-07-08', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-08' AND quantity=3113 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill%' LIMIT 1),
       'P 500 ml', 2037, 0.9440, 1922.93, '2026-07-08', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-08' AND quantity=2037 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7%' LIMIT 1),
       'P 1000 ml', 2507, 1.4160, 3549.91, '2026-07-08', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-08' AND quantity=2507 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR branch NOT ILIKE '%250%') LIMIT 1),
       'P 1000 ml', 4935, 1.4160, 6987.96, '2026-07-08', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-08' AND quantity=4935 AND record_type='purchase');

-- ── Jul 8 & 11 Morya Labels payments ─────────────────────────────────────────
INSERT INTO public.label_payments (vendor_id, payment_amount, payment_date, payment_method, description)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       34706.00, '2026-07-08', 'Bank Transfer', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_payments WHERE payment_date='2026-07-08' AND payment_amount=34706.00);

INSERT INTO public.label_payments (vendor_id, payment_amount, payment_date, payment_method, description)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       50000.00, '2026-07-11', 'Bank Transfer', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_payments WHERE payment_date='2026-07-11' AND payment_amount=50000.00);

-- ── Jul 16 Morya Labels purchases + adjustment ────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion%' LIMIT 1),
       'AL 750 ml', 2586, 0.8260, 2136.04, '2026-07-16', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-16' AND quantity=2586 AND record_type='purchase');

-- Ca La Vie 750 ml — label client only, not in customers table
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       NULL,
       'AL 750 ml', 2158, 1.4160, 3055.73, '2026-07-16', 'purchase', 'Ca La Vie - 750 ml'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-16' AND quantity=2158 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1),
       'P 500 ml', 5207, 0.9440, 4915.41, '2026-07-16', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-16' AND quantity=5207 AND record_type='purchase');

-- Jul 16 adjustment: Hiyya Dino Mandi -244
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name='Hiyya Dino Mandi' LIMIT 1),
       'P 500 ml', -244, 0, 0, '2026-07-16', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-16' AND quantity=-244 AND record_type='adjustment');

-- ── Jul 18 count mismatch adjustments ────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill%' LIMIT 1),
       'P 500 ml', 43, 0, 0, '2026-07-18', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-18' AND quantity=43 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1),
       'P 500 ml', -575, 0, 0, '2026-07-18', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-18' AND quantity=-575 AND record_type='adjustment');

-- ── Jul 20 Morya Labels purchases ─────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill%' LIMIT 1),
       'P 500 ml', 2075, 0.9440, 1958.80, '2026-07-20', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-20' AND quantity=2075 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion%' LIMIT 1),
       'P 500 ml', 2640, 0.9440, 2492.16, '2026-07-20', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-20' AND quantity=2640 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR branch NOT ILIKE '%250%') LIMIT 1),
       'P 1000 ml', 4126, 1.4160, 5842.42, '2026-07-20', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-20' AND quantity=4126 AND record_type='purchase');

-- ── Jul 21 Morya Labels purchases ─────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name='Hiyya Dino Mandi' LIMIT 1),
       'P 500 ml', 4150, 0.9440, 3917.60, '2026-07-21', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-21' AND quantity=4150 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name='Hiyya Chrono Jail Mandi' LIMIT 1),
       'P 500 ml', 3924, 0.9440, 3704.26, '2026-07-21', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-21' AND quantity=3924 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Twilight Embassy%' LIMIT 1),
       'P 500 ml', 1207, 0.9440, 1139.41, '2026-07-21', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-21' AND quantity=1207 AND record_type='purchase');

-- SSKL kalamandir: P 250 ml at ₹0.472/label
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name='SSKL' AND branch ILIKE '%Kalamandir%' LIMIT 1),
       'P 250 ml', 5018, 0.4720, 2368.50, '2026-07-21', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-21' AND quantity=5018 AND record_type='purchase');

-- ── Jul 21 JSR Printers purchases ─────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'One Bite%1000%' LIMIT 1),
       'P 1000 ml', 300, 2.7780, 833.33, '2026-07-21', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-21' AND quantity=300 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'One Bite%500%' LIMIT 1),
       'P 500 ml', 500, 2.0830, 1041.67, '2026-07-21', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-21' AND quantity=500 AND record_type='purchase');

-- ── Jul 21 & 22 payments ──────────────────────────────────────────────────────
INSERT INTO public.label_payments (vendor_id, payment_amount, payment_date, payment_method, description)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1),
       1875.00, '2026-07-21', 'Bank Transfer', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_payments WHERE payment_date='2026-07-21' AND payment_amount=1875.00);

INSERT INTO public.label_payments (vendor_id, payment_amount, payment_date, payment_method, description)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       31530.00, '2026-07-22', 'Bank Transfer', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_payments WHERE payment_date='2026-07-22' AND payment_amount=31530.00);

-- ── Jul 25 count mismatch adjustments ────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballu Kitchen%' LIMIT 1),
       'P 1000 ml', -566, 0, 0, '2026-07-25', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-25' AND quantity=-566 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7%' LIMIT 1),
       'P 1000 ml', -47, 0, 0, '2026-07-25', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-25' AND quantity=-47 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1),
       'P 500 ml', 793, 0, 0, '2026-07-25', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-25' AND quantity=793 AND record_type='adjustment'
                    AND client_id=(SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE '%Chaitanya%Modern Kitchen%' LIMIT 1),
       'P 500 ml', 574, 0, 0, '2026-07-25', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-25' AND quantity=574 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1),
       'P 500 ml', 500, 0, 0, '2026-07-25', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-25' AND quantity=500 AND record_type='adjustment'
                    AND client_id=(SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it%' LIMIT 1),
       'P 500 ml', -2113, 0, 0, '2026-07-25', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-25' AND quantity=-2113 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1),
       'P 500 ml', -3983, 0, 0, '2026-07-25', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-25' AND quantity=-3983 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%' AND (branch IS NULL OR branch NOT ILIKE '%250%') LIMIT 1),
       'P 500 ml', -956, 0, 0, '2026-07-25', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-25' AND quantity=-956 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1),
       'P 500 ml', -2032, 0, 0, '2026-07-25', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-25' AND quantity=-2032 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'One Bite%1000%' LIMIT 1),
       'P 1000 ml', -24, 0, 0, '2026-07-25', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-25' AND quantity=-24 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'One Bite%500%' LIMIT 1),
       'P 500 ml', -20, 0, 0, '2026-07-25', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-25' AND quantity=-20 AND record_type='adjustment');

-- ── Jul 30 Morya Labels purchases + adjustments ───────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1),
       'P 500 ml', 4131, 0.9440, 3899.66, '2026-07-30', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-30' AND quantity=4131 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1),
       'P 500 ml', 2509, 0.9440, 2368.50, '2026-07-30', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-30' AND quantity=2509 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan%' LIMIT 1),
       'P 500 ml', 694, 0, 0, '2026-07-30', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-30' AND quantity=694 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name='SSKL' AND branch ILIKE '%Kalamandir%' LIMIT 1),
       'P 250 ml', 1014, 0, 0, '2026-07-30', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-07-30' AND quantity=1014 AND record_type='adjustment');
