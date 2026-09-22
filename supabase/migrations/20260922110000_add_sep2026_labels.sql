-- September 2026 label purchases (entries through 2026-09-22 from Elma Labels Production Table).
-- vendor_id is UUID FK referencing label_vendors(id) since 20260921080000.

-- ── Sep 1 Morya Labels batch ──────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name='Hiyya Chrono Jail Mandi' LIMIT 1),
       'P 500 ml', 4207, 0.9440, 3971.41, '2026-09-01', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-09-01' AND quantity=4207 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Hotel Vinflora%' LIMIT 1),
       'P 500 ml', 1093, 0.9440, 1031.79, '2026-09-01', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-09-01' AND quantity=1093 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1),
       'P 500 ml', 2452, 0.9440, 2314.69, '2026-09-01', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-09-01' AND quantity=2452 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%' AND (branch IS NULL OR branch NOT ILIKE '%250%') LIMIT 1),
       'P 500 ml', 2396, 0.9440, 2261.82, '2026-09-01', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-09-01' AND quantity=2396 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'House Party%' LIMIT 1),
       'P 500 ml', 2094, 0.9440, 1976.74, '2026-09-01', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-09-01' AND quantity=2094 AND record_type='purchase');

-- Alley 91 - 250 ml: 0.649/label
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%250%' LIMIT 1),
       'P 250 ml', 3206, 0.6490, 2080.69, '2026-09-01', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-09-01' AND quantity=3206 AND record_type='purchase');

-- TOS Club Sep 1 count adjustment (-33)
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'TOS Club%' LIMIT 1),
       'P 1000 ml', -33, 0, 0, '2026-09-01', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-09-01' AND quantity=-33 AND record_type='adjustment');

-- ── Sep 8 Morya Labels payment + adjustment ───────────────────────────────────
INSERT INTO public.label_payments (vendor_id, payment_amount, payment_date, payment_method, description)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       23138.00, '2026-09-08', 'Bank Transfer', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_payments WHERE payment_date='2026-09-08' AND payment_amount=23138.00);

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1),
       'P 500 ml', -9, 0, 0, '2026-09-08', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-09-08' AND quantity=-9 AND record_type='adjustment');

-- ── Sep 10 count mismatch adjustments ────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%') LIMIT 1),
       'P 1000 ml', 13244, 0, 0, '2026-09-10', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-09-10' AND quantity=13244 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name='SSKL' AND branch ILIKE '%Kalamandir%' LIMIT 1),
       'P 250 ml', -1832, 0, 0, '2026-09-10', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-09-10' AND quantity=-1832 AND record_type='adjustment');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Hotel Vinflora%' LIMIT 1),
       'P 500 ml', -93, 0, 0, '2026-09-10', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-09-10' AND quantity=-93 AND record_type='adjustment');

-- ── Sep 11 Morya Labels batch ─────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Twilight Embassy%' LIMIT 1),
       'P 500 ml', 1132, 0.9440, 1068.61, '2026-09-11', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-09-11' AND quantity=1132 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1),
       'P 500 ml', 1113, 0.9440, 1050.67, '2026-09-11', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-09-11' AND quantity=1113 AND record_type='purchase');

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%') LIMIT 1),
       'P 1000 ml', 5205, 1.4160, 7370.28, '2026-09-11', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-09-11' AND quantity=5205 AND record_type='purchase');

-- ── Sep 14 count adjustment: Twilight Embassy -72 ────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Twilight Embassy%' LIMIT 1),
       'P 500 ml', -72, 0, 0, '2026-09-14', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-09-14' AND quantity=-72 AND record_type='adjustment');

-- ── Sep 22 count adjustment: Thatha Kottu Tiffins +247 ───────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1),
       'P 500 ml', 247, 0, 0, '2026-09-22', 'adjustment', 'count mismatch'
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-09-22' AND quantity=247 AND record_type='adjustment');
