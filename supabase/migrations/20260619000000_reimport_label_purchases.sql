-- Full re-import of label_purchases from authoritative spreadsheet (Jan–Jun 2026)
-- Clears all existing rows and inserts the canonical dataset.

DELETE FROM label_purchases;

-- Helper function inline: resolve client name → customer id.
-- "Gismat" falls back to "Jismat" because the rename migration only updated
-- the customers table; the spreadsheet still uses the old spelling.

INSERT INTO label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description)
SELECT
  t.v,
  CASE
    WHEN t.c IS NULL THEN NULL
    WHEN t.c = 'Gismat' THEN COALESCE(
      (SELECT id FROM customers WHERE client_name = 'Gismat' LIMIT 1),
      (SELECT id FROM customers WHERE client_name = 'Jismat' ORDER BY created_at LIMIT 1)
    )
    ELSE (SELECT id FROM customers WHERE client_name = t.c LIMIT 1)
  END,
  t.s,
  t.q,
  t.cpl,
  t.ta,
  t.pd::date,
  t.d
FROM (VALUES
  -- ── Jan 5 2026 ────────────────────────────────────────────────────────────
  ('GMG labels',   'Biryanis and More',           'P 1000 ml', 2016,   1.5833, 3192.00,   '2026-01-05', NULL),
  ('GMG labels',   'Happy Monkeys',               'P 500 ml',  1008,   1.5833, 1596.00,   '2026-01-05', NULL),
  ('Morya labels', 'Jismat',                      'P 500 ml',  3532,   0.9440, 3334.21,   '2026-01-05', NULL),
  ('Morya labels', 'Alley 91',                    'P 500 ml',  2645,   0.9440, 2496.88,   '2026-01-05', NULL),
  ('Morya labels', 'This is it café',             'P 500 ml',  3225,   0.9440, 3044.40,   '2026-01-05', NULL),
  ('Morya labels', 'Soul of South',               'P 500 ml',  1854,   0.9440, 1750.18,   '2026-01-05', NULL),
  ('Morya labels', 'Gismat',                      'P 500 ml',  1838,   0.9440, 1735.07,   '2026-01-05', NULL),
  -- ── Jan 13 2026 ───────────────────────────────────────────────────────────
  ('Morya labels', 'Happy Monkeys',               'P 500 ml',  2113,   0.9440, 1994.67,   '2026-01-13', NULL),
  ('Morya labels', 'Jismat',                      'P 500 ml',  3207,   0.9440, 3027.41,   '2026-01-13', NULL),
  ('Morya labels', 'Soul of South',               'P 500 ml',  2226,   0.9440, 2101.34,   '2026-01-13', NULL),
  ('Morya labels', 'Jismat',                      'P 500 ml',  9150,   0.9440, 8637.60,   '2026-01-13', NULL),
  ('Morya labels', 'Illuzion',                    'P 750 ml',  2528,   1.0620, 2684.74,   '2026-01-13', NULL),
  ('Morya labels', 'Alley 91',                    'P 250 ml',  2091,   0.6490, 1357.06,   '2026-01-13', NULL),
  ('Morya labels', 'Element E7',                  'P 1000 ml', 3761,   1.4160, 5325.58,   '2026-01-13', NULL),
  -- ── Feb 2 2026 ────────────────────────────────────────────────────────────
  ('Morya labels', 'Hiyya Chrono Jail Mandi',     'P 500 ml',  4037,   0.9440, 3810.93,   '2026-02-02', NULL),
  -- ── Feb 10 2026 (count mismatch) ──────────────────────────────────────────
  ('Morya labels', 'Chaitanya''s Modern Kitchen', 'P 500 ml',  14,     0.9440, 0.00,      '2026-02-10', 'Count Mismatch'),
  ('Morya labels', 'Gismat',                      'P 500 ml',  200,    0.9440, 0.00,      '2026-02-10', 'count mismatch'),
  -- ── Feb 14 2026 ───────────────────────────────────────────────────────────
  ('Morya labels', 'Gismat',                      'P 500 ml',  4735,   0.9440, 4469.84,   '2026-02-14', NULL),
  ('Morya labels', 'Golden Pavilion',             'AL 750 ml', 2067,   0.8400, 1707.34,   '2026-02-14', NULL),
  ('Morya labels', 'Alley 91',                    'P 500 ml',  2075,   0.9440, 1958.80,   '2026-02-14', NULL),
  ('Morya labels', 'Alley 91',                    'P 250 ml',  3558,   0.6490, 2309.14,   '2026-02-14', NULL),
  -- ── Feb 20 2026 ───────────────────────────────────────────────────────────
  ('Morya labels', 'This is it café',             'P 500 ml',  4169,   0.9440, 3935.54,   '2026-02-20', NULL),
  ('Morya labels', 'Chaitanya''s Modern Kitchen', 'P 500 ml',  4358,   0.9440, 4113.95,   '2026-02-20', NULL),
  ('Morya labels', 'Biryanis and More',           'P 1000 ml', 6110,   1.4160, 8651.76,   '2026-02-20', NULL),
  ('Morya labels', 'Jismat',                      'P 500 ml',  6113,   0.9440, 5770.67,   '2026-02-20', NULL),
  -- ── Feb 23 2026 ───────────────────────────────────────────────────────────
  ('Morya labels', 'Benguluru Bhavan',            'P 500 ml',  4490,   0.9440, 4239.00,   '2026-02-23', NULL),
  ('Morya labels', 'Hiyya Chrono Jail Mandi',     'P 500 ml',  4188,   0.9440, 3953.47,   '2026-02-23', NULL),
  -- ── Mar 19 2026 ───────────────────────────────────────────────────────────
  ('Morya labels', 'Hiyya Chrono Jail Mandi',     'P 500 ml',  6094,   0.9440, 5752.74,   '2026-03-19', NULL),
  ('Morya labels', 'Soul of South',               'P 500 ml',  2108,   0.9440, 1989.95,   '2026-03-19', NULL),
  ('Morya labels', 'Biryanis and More',           'P 1000 ml', 6919,   1.4000, 9797.00,   '2026-03-19', NULL),
  ('Morya labels', 'Element E7',                  'P 1000 ml', 2523,   1.4160, 3572.00,   '2026-03-19', NULL),
  ('Morya labels', 'Jismat',                      'P 500 ml',  6094,   0.9440, 5752.74,   '2026-03-19', NULL),
  ('Morya labels', 'Gismat',                      'P 500 ml',  4094,   0.9440, 3864.74,   '2026-03-19', NULL),
  -- ── Mar 30 2026 ───────────────────────────────────────────────────────────
  ('Morya labels', 'Chaitanya''s Modern Kitchen', 'P 500 ml',  4094,   0.9440, 3864.74,   '2026-03-30', NULL),
  ('Morya labels', 'Element E7',                  'P 1000 ml', 1349,   1.0000, 1910.00,   '2026-03-30', NULL),
  ('Morya labels', 'Biryanis and More',           'P 1000 ml', 7158,   1.9900, 10136.00,  '2026-03-30', NULL),
  ('Morya labels', 'Gismat',                      'P 500 ml',  4018,   0.9440, 3792.99,   '2026-03-30', NULL),
  ('Morya labels', 'Tara South Indian',           'P 500 ml',  3188,   0.9440, 3009.47,   '2026-03-30', NULL),
  -- ── Mar 31 2026 (count mismatch adjustments) ──────────────────────────────
  ('Morya labels', 'Alley 91',                    'P 500 ml',  -940,   0.0000, 0.00,      '2026-03-31', 'count mismatch'),
  ('Morya labels', NULL,                          NULL,        -562,   0.0000, 0.00,      '2026-03-31', 'count mismatch - Gismat'),
  ('Morya labels', 'Alley 91',                    'P 250 ml',  -2049,  0.0000, 0.00,      '2026-03-31', 'count mismatch'),
  ('Morya labels', 'Benguluru Bhavan',            'P 500 ml',  -239,   0.0000, 0.00,      '2026-03-31', 'count mismatch'),
  ('Morya labels', 'Illuzion',                    'P 750 ml',  512,    0.0000, 0.00,      '2026-03-31', 'count mismatch'),
  ('Morya labels', NULL,                          NULL,        -388,   0.0000, 0.00,      '2026-03-31', 'count mismatch - Soul of South'),
  ('Morya labels', NULL,                          NULL,        -78,    0.0000, 0.00,      '2026-03-31', 'count mismatch - Biryanis and More'),
  ('Morya labels', NULL,                          NULL,        -3240,  0.0000, 0.00,      '2026-03-31', 'count mismatch - Maryadha Ramanna'),
  ('Morya labels', NULL,                          NULL,        306,    0.0000, 0.00,      '2026-03-31', 'count mismatch - Jismat'),
  ('GMG labels',   'Aaha',                        'AL 500 ml', 1130,   0.0000, 0.00,      '2026-03-31', 'count mismatch'),
  ('Morya labels', 'Chaitanya''s Modern Kitchen', 'P 500 ml',  -94,    0.0000, 0.00,      '2026-03-31', 'count mismatch'),
  ('Morya labels', 'Tara South Indian',           'P 500 ml',  -88,    0.0000, 0.00,      '2026-03-31', 'count mismatch'),
  ('Morya labels', 'This is it café',             'P 500 ml',  616,    0.0000, 0.00,      '2026-03-31', 'count mismatch'),
  -- ── Apr 10 2026 ───────────────────────────────────────────────────────────
  ('Morya labels', NULL,                          NULL,        4188,   0.9439, 3953.00,   '2026-04-10', 'Jismat'),
  -- ── Apr 11 2026 ───────────────────────────────────────────────────────────
  ('JSR Printers', 'Iron hill café',              'P 500 ml',  800,    1.8750, 1500.00,   '2026-04-11', NULL),
  -- ── Apr 14 2026 ───────────────────────────────────────────────────────────
  ('Morya labels', 'Golden Pavilion',             'AL 750 ml', 2223,   0.8259, 1836.00,   '2026-04-14', NULL),
  ('Morya labels', 'Thatha Kottu Tiffins',        'P 500 ml',  2132,   0.9442, 2013.00,   '2026-04-14', NULL),
  ('Morya labels', 'Iron hill café',              'P 500 ml',  2188,   0.9438, 2065.00,   '2026-04-14', NULL),
  -- ── Apr 15 2026 ───────────────────────────────────────────────────────────
  ('Morya labels', 'Benguluru Bhavan',            'P 500 ml',  3169,   0.9442, 2992.00,   '2026-04-15', NULL),
  ('Morya labels', NULL,                          'P 500 ml',  2150,   0.9442, 2030.00,   '2026-04-15', NULL),
  ('Morya labels', 'Jismat',                      'P 500 ml',  4584,   0.9440, 4327.00,   '2026-04-15', NULL),
  ('Morya labels', 'Element E7',                  'P 1000 ml', 2571,   1.4162, 3641.00,   '2026-04-15', NULL),
  -- ── Apr 18 2026 ───────────────────────────────────────────────────────────
  ('Morya labels', 'First Cut',                   'P 250 ml',  5116,   0.6489, 3320.00,   '2026-04-18', NULL),
  ('Morya labels', 'Angana Caters',               'P 250 ml',  5116,   0.6489, 3320.00,   '2026-04-18', 'Angana Caters'),
  ('Morya labels', 'This is it café',             'P 500 ml',  2075,   0.9441, 1959.00,   '2026-04-18', NULL),
  ('Morya labels', 'Hiyya Chrono Jail Mandi',     'P 500 ml',  3169,   0.9442, 2992.00,   '2026-04-18', NULL),
  -- ── Apr 28 2026 ───────────────────────────────────────────────────────────
  ('Morya labels', 'Chaitanya''s Modern Kitchen', 'P 500 ml',  4113,   0.9000, 3883.00,   '2026-04-28', NULL),
  ('Morya labels', 'Biryanis and More',           'P 1000 ml', 6237,   1.6000, 8832.00,   '2026-04-28', NULL),
  ('Morya labels', 'Benguluru Bhavan',            'P 500 ml',  4150,   0.9000, 3918.00,   '2026-04-28', NULL),
  ('Morya labels', 'Maryadha Ramanna',            'P 500 ml',  2094,   0.9000, 1977.00,   '2026-04-28', NULL),
  ('Morya labels', 'Gismat',                      'P 500 ml',  4169,   0.9000, 3936.00,   '2026-04-28', NULL),
  ('Morya labels', 'Soul of South',               'P 500 ml',  2094,   0.9000, 1977.00,   '2026-04-28', NULL),
  ('Morya labels', 'Iron hill café',              'P 500 ml',  3150,   0.9000, 2974.00,   '2026-04-28', NULL),
  -- ── Apr 30 2026 (count mismatch) ──────────────────────────────────────────
  ('Morya labels', 'Gismat',                      'P 500 ml',  2471,   0.0000, 0.00,      '2026-04-30', 'count mismatch'),
  ('Morya labels', 'Chaitanya''s Modern Kitchen', 'P 500 ml',  47,     0.0000, 0.00,      '2026-04-30', 'count mismatch'),
  ('Morya labels', 'Illuzion',                    'P 750 ml',  1080,   0.0000, 0.00,      '2026-04-30', 'count mismatch'),
  -- ── May 5 2026 ────────────────────────────────────────────────────────────
  ('Morya labels', 'Angana Caters',               'P 250 ml',  3627,   0.6490, 2354.00,   '2026-05-05', NULL),
  ('Morya labels', 'Alley 91',                    'P 250 ml',  5208,   0.6490, 3379.99,   '2026-05-05', NULL),
  ('Morya labels', 'Alley 91',                    'P 500 ml',  3056,   0.9440, 2885.00,   '2026-05-05', NULL),
  -- ── May 6 2026 ────────────────────────────────────────────────────────────
  ('Haneel',       'Hiyya Dino Mandi',            'P 500 ml',  800,    2.2500, 1800.00,   '2026-05-06', NULL),
  -- ── May 8 2026 ────────────────────────────────────────────────────────────
  ('Morya labels', NULL,                          'Back Label',10100,  0.3540, 3575.00,   '2026-05-08', 'Elma Back sticker'),
  ('Morya labels', 'Hiyya Dino Mandi',            'P 500 ml',  4030,   0.9000, 3804.00,   '2026-05-08', NULL),
  ('Morya labels', 'Thatha Kottu Tiffins',        'P 500 ml',  2090,   0.9440, 1973.00,   '2026-05-08', NULL),
  -- ── May 16 2026 ───────────────────────────────────────────────────────────
  ('Morya labels', 'This is it café',             'P 500 ml',  2100,   0.9000, 1982.00,   '2026-05-16', NULL),
  ('Morya labels', 'Gismat',                      'P 500 ml',  3150,   0.9000, 2974.00,   '2026-05-16', NULL),
  ('Morya labels', 'Biryanis and More',           'P 1000 ml', 4189,   1.0000, 5932.00,   '2026-05-16', NULL),
  ('Morya labels', 'Tawalogy',                    'P 1000 ml', 1400,   0.9000, 1982.00,   '2026-05-16', NULL),
  ('Morya labels', 'Soul of South',               'P 500 ml',  3584,   0.9000, 3383.00,   '2026-05-16', NULL),
  ('Morya labels', 'Benguluru Bhavan',            'P 500 ml',  4150,   0.9000, 3918.00,   '2026-05-16', NULL),
  ('Morya labels', 'Element E7',                  'P 1000 ml', 2492,   1.4161, 3529.00,   '2026-05-16', NULL),
  -- ── May 19 2026 ───────────────────────────────────────────────────────────
  ('Morya labels', 'Maryadha Ramanna',            'P 500 ml',  5169,   0.9440, 4880.00,   '2026-05-19', NULL),
  ('Morya labels', 'Jismat',                      'P 500 ml',  5471,   0.9000, 5165.00,   '2026-05-19', NULL),
  ('Morya labels', 'Hiyya Chrono Jail Mandi',     'P 500 ml',  3188,   0.9000, 3009.00,   '2026-05-19', NULL),
  ('Morya labels', 'Hiyya Dino Mandi',            'P 500 ml',  4150,   0.9000, 3918.00,   '2026-05-19', NULL),
  -- ── May 25 2026 ───────────────────────────────────────────────────────────
  ('Morya labels', 'Thatha Kottu Tiffins',        'P 500 ml',  2169,   0.9442, 2048.00,   '2026-05-25', NULL),
  ('Morya labels', 'Illuzion',                    'P 500 ml',  2490,   1.0620, 2644.40,   '2026-05-25', NULL),
  ('Morya labels', 'Chaitanya''s Modern Kitchen', 'P 500 ml',  4169,   0.9441, 3936.00,   '2026-05-25', NULL),
  ('Morya labels', 'Gismat',                      'P 500 ml',  4169,   0.9441, 3936.00,   '2026-05-25', NULL),
  -- ── Jun 4 2026 ────────────────────────────────────────────────────────────
  ('Morya labels', 'Ballu Kitchen',               'P 1000 ml', 2634,   1.4160, 3730.00,   '2026-06-04', NULL),
  ('Morya labels', 'This is it café',             'P 500 ml',  2188,   0.9440, 2065.47,   '2026-06-04', NULL),
  ('Morya labels', 'Maryadha Ramanna',            'P 500 ml',  2264,   0.9440, 2137.00,   '2026-06-04', NULL),
  ('Morya labels', 'Iron hill café',              'P 500 ml',  2169,   0.9440, 2048.00,   '2026-06-04', NULL)
) AS t(v, c, s, q, cpl, ta, pd, d);
