-- Add label_purchase rows: June 2026 batch + earlier count-mismatch corrections
--
-- Row skipped:
--   03/31/2026 Alley 91 P 500 ml -940 (already present in reimport migration 20260619000000)
--
-- Count-mismatch rows inserted with total_amount = 0 and description = 'count mismatch'
-- as confirmed by user. Negative quantities are inserted as-is (correction entries).

INSERT INTO label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description)
SELECT t.v,
  CASE
    WHEN t.c IS NULL THEN NULL
    WHEN t.c = 'Gismat' THEN COALESCE(
      (SELECT id FROM customers WHERE client_name = 'Gismat' LIMIT 1),
      (SELECT id FROM customers WHERE client_name = 'Jismat' ORDER BY created_at LIMIT 1)
    )
    WHEN t.c = 'Sri Sri group' THEN
      (SELECT id FROM customers WHERE client_name ILIKE '%Sri Sri%' LIMIT 1)
    WHEN t.c = 'Chandhu Poda Marriage Order' THEN
      (SELECT id FROM customers WHERE client_name ILIKE '%Chandhu%' LIMIT 1)
    ELSE (SELECT id FROM customers WHERE client_name = t.c LIMIT 1)
  END,
  t.s, t.q, t.cpl, t.ta, t.pd::date, t.d
FROM (VALUES

  -- ── Count-mismatch / correction entries ──────────────────────────────────────
  -- Jan 5 2026
  ('Morya labels', 'Gismat',                      'P 500 ml',   155,    0.0000,  0.00,        '2026-01-05', 'count mismatch'),
  -- Feb 14 2026
  ('Morya labels', 'Biryanis and More',            'P 1000 ml',  1244,   1.4160,  0.00,        '2026-02-14', 'count mismatch'),
  -- Feb 28 2026
  ('Morya labels', 'Element E7',                   'P 1000 ml',  -89,    1.4160,  0.00,        '2026-02-28', 'count mismatch'),
  ('Morya labels', 'Jismat',                       'P 500 ml',   305,    0.9440,  0.00,        '2026-02-28', 'count mismatch'),
  ('Morya labels', 'Gismat',                       'P 500 ml',   -95,    0.0000,  0.00,        '2026-02-28', 'count mismatch'),
  -- Mar 22 2026
  ('Morya labels', 'Biryanis and More',            'P 1000 ml',  2451,   1.4160,  0.00,        '2026-03-22', 'count mismatch'),
  ('Morya labels', 'Chaitanya''s Modern Kitchen',  'P 500 ml',   -318,   0.9441,  0.00,        '2026-03-22', 'count mismatch'),
  ('Morya labels', 'Tara South Indian',            'P 500 ml',   -720,   0.9440,  0.00,        '2026-03-22', 'count mismatch'),
  -- May 31 2026
  ('Morya labels', 'Hiyya Chrono Jail Mandi',      'P 500 ml',   -921,   0.9000,  0.00,        '2026-05-31', 'count mismatch'),
  ('Morya labels', 'Hiyya Dino Mandi',             'P 500 ml',   -80,    0.9000,  0.00,        '2026-05-31', 'count mismatch'),

  -- ── Jun 10 2026 ──────────────────────────────────────────────────────────────
  ('Morya labels', 'Hiyya Dino Mandi',             'P 500 ml',   4000,   0.9440,  3776.000,    '2026-06-10', NULL),
  ('Morya labels', 'Hiyya Chrono Jail Mandi',      'P 500 ml',   2000,   0.9440,  1888.000,    '2026-06-10', NULL),
  ('Morya labels', 'Benguluru Bhavan',             'P 500 ml',   3000,   0.9440,  2832.000,    '2026-06-10', NULL),
  ('Morya labels', 'Jismat',                       'P 500 ml',   4000,   0.9440,  3776.000,    '2026-06-10', NULL),
  ('Morya labels', 'Biryanis and More',            'P 1000 ml',  3600,   1.4160,  5097.600,    '2026-06-10', NULL),

  -- ── Jun 14 2026 ──────────────────────────────────────────────────────────────
  ('Morya labels', 'Sri Sri group',                'P 1000 ml',  2650,   1.4160,  3752.400,    '2026-06-14', NULL),
  ('Morya labels', 'Sri Sri group',                'P 500 ml',   4301,   0.9440,  4060.144,    '2026-06-14', NULL),
  ('Morya labels', 'Ballu Kitchen',                'P 1000 ml',  2666,   1.4160,  3775.056,    '2026-06-14', NULL),
  ('Morya labels', 'Hiyya Chrono Jail Mandi',      'P 500 ml',   2132,   0.9440,  2012.608,    '2026-06-14', NULL),

  -- ── Jun 18 2026 ──────────────────────────────────────────────────────────────
  ('Morya labels', 'Biryanis and More',            'P 1000 ml',  4126,   1.4160,  5842.416,    '2026-06-18', NULL),
  ('Morya labels', 'Soul of South',                'P 500 ml',   2132,   0.9440,  2012.608,    '2026-06-18', NULL),
  ('Morya labels', 'Chandhu Poda Marriage Order',  'P 500 ml',   2849,   0.9440,  2689.456,    '2026-06-18', NULL)

) AS t(v, c, s, q, cpl, ta, pd, d);
