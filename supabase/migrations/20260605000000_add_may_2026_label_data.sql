-- May 2026 label purchases and payments reconciliation

-- ── 1. Fix existing records entered via app UI ──────────────────────────────

-- Angana Caters 5/5: total 2353.92 → 2354
UPDATE label_purchases
SET total_amount = 2354, cost_per_label = ROUND(2354.0 / 3627, 4)
WHERE id = '534a50a2-dc9e-4d6e-a63c-e201460fdcc7';

-- Hiyya Dino Mandi 5/6 (Haneel vendor): total 800 → 1800, fix vendor
UPDATE label_purchases
SET total_amount = 1800, cost_per_label = 2.25, vendor_id = 'Haneel'
WHERE id = 'c53cb01c-3e4f-4ccf-8419-78fc194ed585';

-- Thatha Kottu Tiffins 5/8: total 1972.96 → 1973
UPDATE label_purchases
SET total_amount = 1973, cost_per_label = ROUND(1973.0 / 2090, 4)
WHERE id = '3541324b-e6eb-4620-86c7-a3140dcfa3cf';

-- Element E7 5/16: total 3804 → 3529
UPDATE label_purchases
SET total_amount = 3529, cost_per_label = ROUND(3529.0 / 2492, 4)
WHERE id = 'abffb97e-31c3-4a91-a550-9d0c0d19af9d';

-- ── 2. Insert missing label_purchases ───────────────────────────────────────

-- 5/8: Elma Back sticker (no customer record — use NULL client_id)
INSERT INTO label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description)
VALUES ('Morya labels', NULL, 'Back Label', 10100, ROUND(3575.0 / 10100, 4), 3575, '2026-05-08', 'Elma Back sticker');

-- 5/25: Thatha Kottu Tiffins
INSERT INTO label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date)
VALUES ('Morya labels', 'ba30fb78-709e-4273-8f77-96f2e8418163', 'P 500 ml', 2169, ROUND(2048.0 / 2169, 4), 2048, '2026-05-25');

-- 5/25: Gismat New
INSERT INTO label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date)
VALUES ('Morya labels', 'cbacfc44-1153-4632-b1d0-76bc5efeae49', 'P 500 ml', 4169, ROUND(3936.0 / 4169, 4), 3936, '2026-05-25');

-- 5/25: Chaitanya's Modern Kitchen
INSERT INTO label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date)
VALUES ('Morya labels', '4cada784-9ab9-4f68-9571-11d59ad6af9d', 'P 500 ml', 4169, ROUND(3936.0 / 4169, 4), 3936, '2026-05-25');

-- 5/25: Illuzion
INSERT INTO label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date)
VALUES ('Morya labels', 'fb97d055-47fa-48ad-9fbf-817bfce59006', 'P 500 ml', 2490, ROUND(2644.4 / 2490, 4), 2644.4, '2026-05-25');

-- 5/25: Elma Back sticker (second batch)
INSERT INTO label_purchases (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description)
VALUES ('Morya labels', NULL, 'Back Label', 10130, ROUND(3586.0 / 10130, 4), 3586, '2026-05-25', 'Elma Back sticker');

-- ── 3. Insert May 2026 label_payments ───────────────────────────────────────

INSERT INTO label_payments (vendor_id, payment_amount, payment_date, payment_method, description)
VALUES
  ('Morya labels', 35994, '2026-05-04', 'Bank Transfer', NULL),
  ('Haneel',       1500,  '2026-05-04', 'Bank Transfer', NULL),
  ('Morya labels', 43471, '2026-05-18', 'Bank Transfer', NULL),
  ('Morya labels', 33120, '2026-05-27', 'Bank Transfer', NULL);
