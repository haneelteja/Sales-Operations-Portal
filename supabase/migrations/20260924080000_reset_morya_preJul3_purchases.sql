-- Reset Morya pre-Jul-3 label purchases to canonical Elma data.
--
-- Root cause: migration 20260923080000 used IS NOT DISTINCT FROM client_id in
-- WHERE NOT EXISTS guards. Pre-existing portal entries had specific client UUIDs
-- that didn't match the subquery UUIDs, so almost all 127 entries were inserted
-- as new (on top of pre-existing), doubling Morya purchased from ~4,67,328 to
-- 9,00,438. Cleanup 20260923090000 only removed ~9,216 (NULL client_id cases).
--
-- Fix: delete ALL pre-existing + migration entries for 2025-07-12..2026-07-01,
-- then re-insert the 127 canonical Elma entries cleanly.
-- After push: Morya purchased = ~4,35,022 + 1,88,920 (Jul3+) = ~6,23,942.

-- Step 1: Wipe all Morya purchases in the affected date range.
DELETE FROM public.label_purchases
WHERE vendor_id = (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
  AND record_type = 'purchase'
  AND purchase_date >= '2025-07-12'
  AND purchase_date <= '2026-07-01';

-- Step 2: Re-insert canonical entries (guards ensure idempotency on re-run).
-- Historical Morya Labels purchases: Jul 2025 – Jul 1, 2026
-- These were missing from the portal (added with WHERE NOT EXISTS guards).
-- vendor_id uses label_vendors subquery (UUID FK since 20260921080000).

-- ── 2025-07-12 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion%' LIMIT 1),
       'AL 750 ml', 2650, 0.826, 2188.9, '2025-07-12', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-07-12' AND lp.quantity=2650 AND ABS(lp.total_amount-2188.9)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       NULL::uuid,
       'AL 750 ml', 2650, 0.826, 2188.9, '2025-07-12', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-07-12' AND lp.quantity=2650 AND ABS(lp.total_amount-2188.9)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM NULL::uuid);

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jagan%' AND sku ILIKE '%1000%' LIMIT 1),
       'P 1000 ml', 1350, 1.416, 1911.6, '2025-07-12', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-07-12' AND lp.quantity=1350 AND ABS(lp.total_amount-1911.6)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Jagan%' AND sku ILIKE '%1000%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jagan%' AND sku NOT ILIKE '%1000%' LIMIT 1),
       'P 500 ml', 1350, 0.944, 1274.4, '2025-07-12', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-07-12' AND lp.quantity=1350 AND ABS(lp.total_amount-1274.4)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Jagan%' AND sku NOT ILIKE '%1000%' LIMIT 1));

-- ── 2025-07-31 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       NULL::uuid,
       'AL 750 ml', 10017, 0.826, 8274, '2025-07-31', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-07-31' AND lp.quantity=10017 AND ABS(lp.total_amount-8274)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM NULL::uuid);

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       NULL::uuid,
       'P 250 ml', 6100, 0.649, 3959.0, '2025-07-31', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-07-31' AND lp.quantity=6100 AND ABS(lp.total_amount-3959.0)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM NULL::uuid);

-- ── 2025-08-05 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Chandhu Poda%' LIMIT 1),
       'P 250 ml', 7100, 0.649, 4608.0, '2025-08-05', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-08-05' AND lp.quantity=7100 AND ABS(lp.total_amount-4608.0)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Chandhu Poda%' LIMIT 1));

-- ── 2025-09-14 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       NULL::uuid,
       'AL 750 ml', 5100, 0.826, 4212.6, '2025-09-14', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-09-14' AND lp.quantity=5100 AND ABS(lp.total_amount-4212.6)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM NULL::uuid);

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%' LIMIT 1),
       'AL 750 ml', 3960, 0.826, 3270.96, '2025-09-14', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-09-14' AND lp.quantity=3960 AND ABS(lp.total_amount-3270.96)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion%' LIMIT 1),
       'AL 750 ml', 1900, 0.826, 1569.4, '2025-09-14', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-09-14' AND lp.quantity=1900 AND ABS(lp.total_amount-1569.4)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion%' LIMIT 1));

-- ── 2025-09-18 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       NULL::uuid,
       'P 250 ml', 1250, 0.472, 590, '2025-09-18', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-09-18' AND lp.quantity=1250 AND ABS(lp.total_amount-590)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM NULL::uuid);

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%' AND (branch IS NULL OR branch NOT ILIKE '%250%') LIMIT 1),
       'P 500 ml', 1250, 0.944, 1180, '2025-09-18', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-09-18' AND lp.quantity=1250 AND ABS(lp.total_amount-1180)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%' AND (branch IS NULL OR branch NOT ILIKE '%250%') LIMIT 1));

-- ── 2025-10-05 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%' LIMIT 1),
       'P 500 ml', 4020, 0.944, 3794.88, '2025-10-05', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-10-05' AND lp.quantity=4020 AND ABS(lp.total_amount-3794.88)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%' AND (branch IS NULL OR branch NOT ILIKE '%250%') LIMIT 1),
       'P 500 ml', 1500, 0.944, 1416, '2025-10-05', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-10-05' AND lp.quantity=1500 AND ABS(lp.total_amount-1416)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%' AND (branch IS NULL OR branch NOT ILIKE '%250%') LIMIT 1));

-- ── 2025-10-17 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion%' LIMIT 1),
       'AL 750 ml', 3660, 0.826, 3023.16, '2025-10-17', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-10-17' AND lp.quantity=3660 AND ABS(lp.total_amount-3023.16)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%' LIMIT 1),
       'P 500 ml', 4550, 0.944, 4295.2, '2025-10-17', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-10-17' AND lp.quantity=4550 AND ABS(lp.total_amount-4295.2)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%' LIMIT 1));

-- ── 2025-11-03 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE '1980%' LIMIT 1),
       'AL 750 ml', 1302, 0.826, 1075.45, '2025-11-03', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-11-03' AND lp.quantity=1302 AND ABS(lp.total_amount-1075.45)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE '1980%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       NULL::uuid,
       'AL 750 ml', 1250, 1.062, 1327.5, '2025-11-03', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-11-03' AND lp.quantity=1250 AND ABS(lp.total_amount-1327.5)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM NULL::uuid);

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       NULL::uuid,
       'P 250 ml', 1550, 0.472, 731.6, '2025-11-03', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-11-03' AND lp.quantity=1550 AND ABS(lp.total_amount-731.6)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM NULL::uuid);

-- ── 2025-11-18 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1),
       'P 500 ml', 2020, 0.944, 1906.88, '2025-11-18', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-11-18' AND lp.quantity=2020 AND ABS(lp.total_amount-1906.88)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%' AND (branch IS NULL OR branch NOT ILIKE '%250%') LIMIT 1),
       'P 500 ml', 2520, 0.944, 2378.88, '2025-11-18', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-11-18' AND lp.quantity=2520 AND ABS(lp.total_amount-2378.88)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%' AND (branch IS NULL OR branch NOT ILIKE '%250%') LIMIT 1));

-- ── 2025-12-06 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1),
       'P 500 ml', 4050, 0.944, 3823.2, '2025-12-06', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-12-06' AND lp.quantity=4050 AND ABS(lp.total_amount-3823.2)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1));

-- ── 2025-12-12 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1),
       'P 500 ml', 8120, 0.944, 7665.28, '2025-12-12', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-12-12' AND lp.quantity=8120 AND ABS(lp.total_amount-7665.28)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1),
       'P 500 ml', 6169, 0.944, 5823.54, '2025-12-12', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-12-12' AND lp.quantity=6169 AND ABS(lp.total_amount-5823.54)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1));

-- ── 2025-12-21 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE '1980%' LIMIT 1),
       'AL 750 ml', 1290, 0.826, 1065.54, '2025-12-21', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-12-21' AND lp.quantity=1290 AND ABS(lp.total_amount-1065.54)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE '1980%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Tawalogy%' AND sku ILIKE '%1000%' LIMIT 1),
       'P 1000 ml', 2230, 1.416, 3157.68, '2025-12-21', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-12-21' AND lp.quantity=2230 AND ABS(lp.total_amount-3157.68)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Tawalogy%' AND sku ILIKE '%1000%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1),
       'P 500 ml', 4050, 0.944, 3823.2, '2025-12-21', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-12-21' AND lp.quantity=4050 AND ABS(lp.total_amount-3823.2)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1));

-- ── 2025-12-26 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%' LIMIT 1),
       'P 500 ml', 5886, 0.944, 5556.38, '2025-12-26', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-12-26' AND lp.quantity=5886 AND ABS(lp.total_amount-5556.38)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Tawalogy%' AND sku ILIKE '%250%' LIMIT 1),
       'P 250 ml', 1212, 0.472, 572.06, '2025-12-26', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-12-26' AND lp.quantity=1212 AND ABS(lp.total_amount-572.06)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Tawalogy%' AND sku ILIKE '%250%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%250%' LIMIT 1),
       'P 250 ml', 1255, 0.649, 814.5, '2025-12-26', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2025-12-26' AND lp.quantity=1255 AND ABS(lp.total_amount-814.5)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%250%' LIMIT 1));

-- ── 2026-01-05 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1),
       'P 500 ml', 1854, 0.944, 1750.18, '2026-01-05', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-01-05' AND lp.quantity=1854 AND ABS(lp.total_amount-1750.18)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1),
       'P 500 ml', 1838, 0.944, 1735.07, '2026-01-05', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-01-05' AND lp.quantity=1838 AND ABS(lp.total_amount-1735.07)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it%' LIMIT 1),
       'P 500 ml', 3225, 0.944, 3044.4, '2026-01-05', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-01-05' AND lp.quantity=3225 AND ABS(lp.total_amount-3044.4)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%' AND (branch IS NULL OR branch NOT ILIKE '%250%') LIMIT 1),
       'P 500 ml', 2645, 0.944, 2496.88, '2026-01-05', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-01-05' AND lp.quantity=2645 AND ABS(lp.total_amount-2496.88)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%' AND (branch IS NULL OR branch NOT ILIKE '%250%') LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1),
       'P 500 ml', 3532, 0.944, 3334.21, '2026-01-05', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-01-05' AND lp.quantity=3532 AND ABS(lp.total_amount-3334.21)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1));

-- ── 2026-01-13 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7%' LIMIT 1),
       'P 1000 ml', 3761, 1.416, 5325.58, '2026-01-13', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-01-13' AND lp.quantity=3761 AND ABS(lp.total_amount-5325.58)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%250%' LIMIT 1),
       'P 250 ml', 2091, 0.649, 1357.06, '2026-01-13', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-01-13' AND lp.quantity=2091 AND ABS(lp.total_amount-1357.06)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%250%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion%' LIMIT 1),
       'P 500 ml', 2528, 1.062, 2684.74, '2026-01-13', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-01-13' AND lp.quantity=2528 AND ABS(lp.total_amount-2684.74)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1),
       'P 500 ml', 9150, 0.944, 8637.6, '2026-01-13', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-01-13' AND lp.quantity=9150 AND ABS(lp.total_amount-8637.6)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1),
       'P 500 ml', 2226, 0.944, 2101.34, '2026-01-13', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-01-13' AND lp.quantity=2226 AND ABS(lp.total_amount-2101.34)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1),
       'P 500 ml', 3207, 0.944, 3027.41, '2026-01-13', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-01-13' AND lp.quantity=3207 AND ABS(lp.total_amount-3027.41)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Happy Monkeys%' LIMIT 1),
       'P 500 ml', 2113, 0.944, 1994.67, '2026-01-13', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-01-13' AND lp.quantity=2113 AND ABS(lp.total_amount-1994.67)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Happy Monkeys%' LIMIT 1));

-- ── 2026-02-02 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1),
       'P 500 ml', 4037, 0.944, 3810.93, '2026-02-02', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-02-02' AND lp.quantity=4037 AND ABS(lp.total_amount-3810.93)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1));

-- ── 2026-02-14 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%250%' LIMIT 1),
       'P 250 ml', 3558, 0.649, 2309.14, '2026-02-14', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-02-14' AND lp.quantity=3558 AND ABS(lp.total_amount-2309.14)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%250%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%' AND (branch IS NULL OR branch NOT ILIKE '%250%') LIMIT 1),
       'P 500 ml', 2075, 0.944, 1958.8, '2026-02-14', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-02-14' AND lp.quantity=2075 AND ABS(lp.total_amount-1958.8)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%' AND (branch IS NULL OR branch NOT ILIKE '%250%') LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion%' LIMIT 1),
       'AL 750 ml', 2067, 0.826, 1707.34, '2026-02-14', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-02-14' AND lp.quantity=2067 AND ABS(lp.total_amount-1707.34)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1),
       'P 500 ml', 4735, 0.944, 4469.84, '2026-02-14', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-02-14' AND lp.quantity=4735 AND ABS(lp.total_amount-4469.84)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1));

-- ── 2026-02-20 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1),
       'P 500 ml', 6113, 0.9439, 5769.97, '2026-02-20', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-02-20' AND lp.quantity=6113 AND ABS(lp.total_amount-5769.97)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR (branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%')) LIMIT 1),
       'P 1000 ml', 6110, 1.4159, 8651, '2026-02-20', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-02-20' AND lp.quantity=6110 AND ABS(lp.total_amount-8651)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR (branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%')) LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%' LIMIT 1),
       'P 500 ml', 4358, 0.944, 4113.95, '2026-02-20', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-02-20' AND lp.quantity=4358 AND ABS(lp.total_amount-4113.95)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it%' LIMIT 1),
       'P 500 ml', 4169, 0.944, 3935.54, '2026-02-20', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-02-20' AND lp.quantity=4169 AND ABS(lp.total_amount-3935.54)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it%' LIMIT 1));

-- ── 2026-02-23 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1),
       'P 500 ml', 4188, 0.944, 3953.47, '2026-02-23', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-02-23' AND lp.quantity=4188 AND ABS(lp.total_amount-3953.47)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan%' LIMIT 1),
       'P 500 ml', 4490, 0.944, 4238.56, '2026-02-23', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-02-23' AND lp.quantity=4490 AND ABS(lp.total_amount-4238.56)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan%' LIMIT 1));

-- ── 2026-03-19 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1),
       'P 500 ml', 4094, 0.944, 3864.74, '2026-03-19', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-03-19' AND lp.quantity=4094 AND ABS(lp.total_amount-3864.74)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1),
       'P 500 ml', 6094, 0.944, 5752.74, '2026-03-19', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-03-19' AND lp.quantity=6094 AND ABS(lp.total_amount-5752.74)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7%' LIMIT 1),
       'P 1000 ml', 2523, 1.4157, 3571.81, '2026-03-19', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-03-19' AND lp.quantity=2523 AND ABS(lp.total_amount-3571.81)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR (branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%')) LIMIT 1),
       'P 1000 ml', 6919, 1.4159, 9796.54, '2026-03-19', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-03-19' AND lp.quantity=6919 AND ABS(lp.total_amount-9796.54)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR (branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%')) LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       NULL::uuid,
       'P 500 ml', 6094, 0.944, 5752.74, '2026-03-19', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-03-19' AND lp.quantity=6094 AND ABS(lp.total_amount-5752.74)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM NULL::uuid);

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1),
       'P 500 ml', 2108, 0.944, 1989.95, '2026-03-19', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-03-19' AND lp.quantity=2108 AND ABS(lp.total_amount-1989.95)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1));

-- ── 2026-03-30 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Tara South%' LIMIT 1),
       'P 500 ml', 3188, 0.944, 3009.47, '2026-03-30', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-03-30' AND lp.quantity=3188 AND ABS(lp.total_amount-3009.47)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Tara South%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%' LIMIT 1),
       'P 500 ml', 4094, 0.944, 3864.74, '2026-03-30', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-03-30' AND lp.quantity=4094 AND ABS(lp.total_amount-3864.74)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1),
       'P 500 ml', 4018, 0.944, 3792.99, '2026-03-30', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-03-30' AND lp.quantity=4018 AND ABS(lp.total_amount-3792.99)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR (branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%')) LIMIT 1),
       'P 1000 ml', 7158, 1.416, 10135.73, '2026-03-30', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-03-30' AND lp.quantity=7158 AND ABS(lp.total_amount-10135.73)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR (branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%')) LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7%' LIMIT 1),
       'P 1000 ml', 1349, 1.416, 1910.18, '2026-03-30', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-03-30' AND lp.quantity=1349 AND ABS(lp.total_amount-1910.18)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7%' LIMIT 1));

-- ── 2026-04-10 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       NULL::uuid,
       'Elma Back sticker', 10052, 0.354, 3558.41, '2026-04-10', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-10' AND lp.quantity=10052 AND ABS(lp.total_amount-3558.41)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM NULL::uuid);

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1),
       'P 500 ml', 4188, 0.944, 3953.47, '2026-04-10', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-10' AND lp.quantity=4188 AND ABS(lp.total_amount-3953.47)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1));

-- ── 2026-04-14 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill%' LIMIT 1),
       'P 500 ml', 2188, 0.944, 2065.47, '2026-04-14', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-14' AND lp.quantity=2188 AND ABS(lp.total_amount-2065.47)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1),
       'P 500 ml', 2132, 0.944, 2012.61, '2026-04-14', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-14' AND lp.quantity=2132 AND ABS(lp.total_amount-2012.61)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion%' LIMIT 1),
       'AL 750 ml', 2223, 0.826, 1836.2, '2026-04-14', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-14' AND lp.quantity=2223 AND ABS(lp.total_amount-1836.2)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion%' LIMIT 1));

-- ── 2026-04-15 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7%' LIMIT 1),
       'P 1000 ml', 2571, 1.416, 3640.54, '2026-04-15', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-15' AND lp.quantity=2571 AND ABS(lp.total_amount-3640.54)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1),
       'P 500 ml', 4584, 0.944, 4327.3, '2026-04-15', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-15' AND lp.quantity=4584 AND ABS(lp.total_amount-4327.3)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1),
       'P 500 ml', 2150, 0.944, 2029.6, '2026-04-15', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-15' AND lp.quantity=2150 AND ABS(lp.total_amount-2029.6)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan%' LIMIT 1),
       'P 500 ml', 3169, 0.944, 2991.54, '2026-04-15', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-15' AND lp.quantity=3169 AND ABS(lp.total_amount-2991.54)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan%' LIMIT 1));

-- ── 2026-04-18 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1),
       'P 500 ml', 3169, 0.944, 2991.54, '2026-04-18', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-18' AND lp.quantity=3169 AND ABS(lp.total_amount-2991.54)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it%' LIMIT 1),
       'P 500 ml', 2075, 0.944, 1958.8, '2026-04-18', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-18' AND lp.quantity=2075 AND ABS(lp.total_amount-1958.8)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Angana Caters%' LIMIT 1),
       'P 250 ml', 5116, 0.649, 3320.28, '2026-04-18', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-18' AND lp.quantity=5116 AND ABS(lp.total_amount-3320.28)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Angana Caters%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'First Cut%' LIMIT 1),
       'P 250 ml', 5116, 0.649, 3320.28, '2026-04-18', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-18' AND lp.quantity=5116 AND ABS(lp.total_amount-3320.28)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'First Cut%' LIMIT 1));

-- ── 2026-04-28 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill%' LIMIT 1),
       'P 500 ml', 3150, 0.944, 2973.6, '2026-04-28', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-28' AND lp.quantity=3150 AND ABS(lp.total_amount-2973.6)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1),
       'P 500 ml', 2094, 0.944, 1976.74, '2026-04-28', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-28' AND lp.quantity=2094 AND ABS(lp.total_amount-1976.74)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1),
       'P 500 ml', 4169, 0.944, 3935.54, '2026-04-28', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-28' AND lp.quantity=4169 AND ABS(lp.total_amount-3935.54)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna%' LIMIT 1),
       'P 500 ml', 2094, 0.944, 1976.74, '2026-04-28', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-28' AND lp.quantity=2094 AND ABS(lp.total_amount-1976.74)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan%' LIMIT 1),
       'P 500 ml', 4150, 0.944, 3917.6, '2026-04-28', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-28' AND lp.quantity=4150 AND ABS(lp.total_amount-3917.6)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR (branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%')) LIMIT 1),
       'P 1000 ml', 6237, 1.416, 8831.59, '2026-04-28', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-28' AND lp.quantity=6237 AND ABS(lp.total_amount-8831.59)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR (branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%')) LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%' LIMIT 1),
       'P 500 ml', 4113, 0.944, 3882.67, '2026-04-28', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-04-28' AND lp.quantity=4113 AND ABS(lp.total_amount-3882.67)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%' LIMIT 1));

-- ── 2026-05-05 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%' AND (branch IS NULL OR branch NOT ILIKE '%250%') LIMIT 1),
       'P 500 ml', 3056, 0.944, 2884.86, '2026-05-05', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-05' AND lp.quantity=3056 AND ABS(lp.total_amount-2884.86)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%' AND (branch IS NULL OR branch NOT ILIKE '%250%') LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%250%' LIMIT 1),
       'P 250 ml', 5208, 0.649, 3379.99, '2026-05-05', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-05' AND lp.quantity=5208 AND ABS(lp.total_amount-3379.99)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91%250%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Angana Caters%' LIMIT 1),
       'P 250 ml', 3627, 0.649, 2353.92, '2026-05-05', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-05' AND lp.quantity=3627 AND ABS(lp.total_amount-2353.92)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Angana Caters%' LIMIT 1));

-- ── 2026-05-08 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name = 'Hiyya Dino Mandi' LIMIT 1),
       'P 500 ml', 4030, 0.944, 3804.32, '2026-05-08', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-08' AND lp.quantity=4030 AND ABS(lp.total_amount-3804.32)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name = 'Hiyya Dino Mandi' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1),
       'P 500 ml', 2090, 0.944, 1972.96, '2026-05-08', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-08' AND lp.quantity=2090 AND ABS(lp.total_amount-1972.96)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       NULL::uuid,
       'Elma Back sticker', 10100, 0.354, 3575.4, '2026-05-08', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-08' AND lp.quantity=10100 AND ABS(lp.total_amount-3575.4)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM NULL::uuid);

-- ── 2026-05-16 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7%' LIMIT 1),
       'P 1000 ml', 2492, 1.416, 3528.67, '2026-05-16', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-16' AND lp.quantity=2492 AND ABS(lp.total_amount-3528.67)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan%' LIMIT 1),
       'P 500 ml', 4150, 0.944, 3917.6, '2026-05-16', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-16' AND lp.quantity=4150 AND ABS(lp.total_amount-3917.6)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1),
       'P 500 ml', 3584, 0.944, 3383.3, '2026-05-16', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-16' AND lp.quantity=3584 AND ABS(lp.total_amount-3383.3)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Tawalogy%' AND sku ILIKE '%1000%' LIMIT 1),
       'P 1000 ml', 1400, 1.416, 1982.4, '2026-05-16', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-16' AND lp.quantity=1400 AND ABS(lp.total_amount-1982.4)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Tawalogy%' AND sku ILIKE '%1000%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR (branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%')) LIMIT 1),
       'P 1000 ml', 4189, 1.416, 5931.62, '2026-05-16', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-16' AND lp.quantity=4189 AND ABS(lp.total_amount-5931.62)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR (branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%')) LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1),
       'P 500 ml', 3150, 0.944, 2973.6, '2026-05-16', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-16' AND lp.quantity=3150 AND ABS(lp.total_amount-2973.6)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it%' LIMIT 1),
       'P 500 ml', 2100, 0.944, 1982.4, '2026-05-16', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-16' AND lp.quantity=2100 AND ABS(lp.total_amount-1982.4)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it%' LIMIT 1));

-- ── 2026-05-19 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name = 'Hiyya Dino Mandi' LIMIT 1),
       'P 500 ml', 4150, 0.944, 3917.6, '2026-05-19', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-19' AND lp.quantity=4150 AND ABS(lp.total_amount-3917.6)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name = 'Hiyya Dino Mandi' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1),
       'P 500 ml', 3188, 0.944, 3009.47, '2026-05-19', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-19' AND lp.quantity=3188 AND ABS(lp.total_amount-3009.47)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1),
       'P 500 ml', 5471, 0.944, 5164.62, '2026-05-19', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-19' AND lp.quantity=5471 AND ABS(lp.total_amount-5164.62)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna%' LIMIT 1),
       'P 500 ml', 5169, 0.944, 4879.54, '2026-05-19', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-19' AND lp.quantity=5169 AND ABS(lp.total_amount-4879.54)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna%' LIMIT 1));

-- ── 2026-05-25 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       NULL::uuid,
       'Elma Back sticker', 10130, 0.354, 3586.02, '2026-05-25', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-25' AND lp.quantity=10130 AND ABS(lp.total_amount-3586.02)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM NULL::uuid);

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1),
       'P 500 ml', 2169, 0.944, 2047.54, '2026-05-25', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-25' AND lp.quantity=2169 AND ABS(lp.total_amount-2047.54)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1),
       'P 500 ml', 4169, 0.944, 3935.54, '2026-05-25', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-25' AND lp.quantity=4169 AND ABS(lp.total_amount-3935.54)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%' LIMIT 1),
       'P 500 ml', 4169, 0.944, 3935.54, '2026-05-25', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-25' AND lp.quantity=4169 AND ABS(lp.total_amount-3935.54)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion%' LIMIT 1),
       'P 500 ml', 2490, 1.062, 2644.38, '2026-05-25', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-05-25' AND lp.quantity=2490 AND ABS(lp.total_amount-2644.38)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion%' LIMIT 1));

-- ── 2026-06-04 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill%' LIMIT 1),
       'P 500 ml', 2169, 0.944, 2047.54, '2026-06-04', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-06-04' AND lp.quantity=2169 AND ABS(lp.total_amount-2047.54)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna%' LIMIT 1),
       'P 500 ml', 2264, 0.944, 2137.22, '2026-06-04', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-06-04' AND lp.quantity=2264 AND ABS(lp.total_amount-2137.22)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it%' LIMIT 1),
       'P 500 ml', 2188, 0.944, 2065.47, '2026-06-04', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-06-04' AND lp.quantity=2188 AND ABS(lp.total_amount-2065.47)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballus Kitchen%' LIMIT 1),
       'P 1000 ml', 2634, 1.416, 3729.74, '2026-06-04', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-06-04' AND lp.quantity=2634 AND ABS(lp.total_amount-3729.74)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballus Kitchen%' LIMIT 1));

-- ── 2026-06-10 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name = 'Hiyya Dino Mandi' LIMIT 1),
       'P 500 ml', 4150, 0.944, 3917.6, '2026-06-10', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-06-10' AND lp.quantity=4150 AND ABS(lp.total_amount-3917.6)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name = 'Hiyya Dino Mandi' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1),
       'P 500 ml', 2113, 0.944, 1994.67, '2026-06-10', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-06-10' AND lp.quantity=2113 AND ABS(lp.total_amount-1994.67)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan%' LIMIT 1),
       'P 500 ml', 4150, 0.944, 3917.6, '2026-06-10', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-06-10' AND lp.quantity=4150 AND ABS(lp.total_amount-3917.6)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1),
       'P 500 ml', 4075, 0.944, 3846.8, '2026-06-10', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-06-10' AND lp.quantity=4075 AND ABS(lp.total_amount-3846.8)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR (branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%')) LIMIT 1),
       'P 1000 ml', 4142, 1.416, 5865.07, '2026-06-10', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-06-10' AND lp.quantity=4142 AND ABS(lp.total_amount-5865.07)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR (branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%')) LIMIT 1));

-- ── 2026-06-14 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Sri Sri%' AND sku ILIKE '%1000%' LIMIT 1),
       'P 1000 ml', 2650, 1.416, 3752.4, '2026-06-14', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-06-14' AND lp.quantity=2650 AND ABS(lp.total_amount-3752.4)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Sri Sri%' AND sku ILIKE '%1000%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Sri Sri%' AND sku NOT ILIKE '%1000%' LIMIT 1),
       'P 500 ml', 4301, 0.944, 4060.14, '2026-06-14', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-06-14' AND lp.quantity=4301 AND ABS(lp.total_amount-4060.14)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Sri Sri%' AND sku NOT ILIKE '%1000%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballus Kitchen%' LIMIT 1),
       'P 1000 ml', 2666, 1.416, 3775.06, '2026-06-14', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-06-14' AND lp.quantity=2666 AND ABS(lp.total_amount-3775.06)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballus Kitchen%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1),
       'P 500 ml', 2132, 0.944, 2012.61, '2026-06-14', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-06-14' AND lp.quantity=2132 AND ABS(lp.total_amount-2012.61)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1));

-- ── 2026-06-18 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR (branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%')) LIMIT 1),
       'P 1000 ml', 4126, 1.416, 5842.42, '2026-06-18', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-06-18' AND lp.quantity=4126 AND ABS(lp.total_amount-5842.42)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and more%' AND (branch IS NULL OR (branch NOT ILIKE '%250%' AND branch NOT ILIKE '%Gachibowli%')) LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Chandhu Poda%' LIMIT 1),
       'P 500 ml', 2849, 0.944, 2689.46, '2026-06-18', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-06-18' AND lp.quantity=2849 AND ABS(lp.total_amount-2689.46)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Chandhu Poda%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1),
       'P 500 ml', 2132, 0.944, 2012.61, '2026-06-18', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-06-18' AND lp.quantity=2132 AND ABS(lp.total_amount-2012.61)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1));

-- ── 2026-07-01 ──────────────────────────────────────────────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1),
       'P 500 ml', 3075, 0.944, 2902.8, '2026-07-01', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-07-01' AND lp.quantity=3075 AND ABS(lp.total_amount-2902.8)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat%' AND branch ILIKE '%Kondapur%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Sri Sri%' AND sku NOT ILIKE '%1000%' LIMIT 1),
       'P 500 ml', 4075, 0.944, 3846.8, '2026-07-01', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-07-01' AND lp.quantity=4075 AND ABS(lp.total_amount-3846.8)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Sri Sri%' AND sku NOT ILIKE '%1000%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1),
       'P 500 ml', 3113, 0.944, 2938.67, '2026-07-01', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-07-01' AND lp.quantity=3113 AND ABS(lp.total_amount-2938.67)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1),
       'P 500 ml', 4943, 0.944, 4666.19, '2026-07-01', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-07-01' AND lp.quantity=4943 AND ABS(lp.total_amount-4666.19)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%' LIMIT 1));

INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
       NULL::uuid,
       'Elma Back sticker', 9551, 0.354, 3381.05, '2026-07-01', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases lp WHERE lp.purchase_date='2026-07-01' AND lp.quantity=9551 AND ABS(lp.total_amount-3381.05)<0.01 AND lp.record_type='purchase' AND lp.client_id IS NOT DISTINCT FROM NULL::uuid);

-- ── 2026-04-11 JSR Printers: Iron hill café 800 labels ────────────────────────
INSERT INTO public.label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1),
       (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill%' LIMIT 1),
       'P 500 ml', 800, 1.8750, 1500.00, '2026-04-11', 'purchase', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.label_purchases WHERE purchase_date='2026-04-11' AND quantity=800 AND record_type='purchase');

INSERT INTO public.label_payments (vendor_id, payment_amount, payment_date, payment_method, description)
SELECT (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1),
       1500.00, '2026-04-11', 'Bank Transfer', 'Iron hill cafe label payment'
WHERE NOT EXISTS (SELECT 1 FROM public.label_payments WHERE payment_date='2026-04-11' AND payment_amount=1500.00);

-- Total Morya entries: 127 purchases, amount: 435,021.73
-- Plus 1 JSR entry (Iron hill 800 labels 1500.00) + 1 JSR payment (1500.00)
