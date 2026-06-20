-- Add label_purchase rows for Dec 2024 – Dec 2025
-- Pre-2026 data was wiped by the reimport migration (20260619000000); this restores it.
--
-- Vendor rules:
--   Haneel / Venu      → internal supply; total_amount = 0
--   GMG / GMG labels   → stored as 'GMG'
--   Morya Labels       → stored as 'Morya labels'
--   ABS                → stored as 'ABS'
--   "label size issue" → vendor = 'Morya labels', description = 'label size issue'
--
-- Date note:
--   Source row "10/05/2025 Gismat" is May 10 in DD/MM format (confirmed) → 2025-05-10
--   Source rows "10/05/2025 Chaitanya / Alley 91" are October 5 → 2025-10-05
--
-- Zero-total rows with a cpl value are count-mismatch/correction entries; stored with
-- description = 'count mismatch'.  Negative quantities are inserted as-is.

-- ── 1. New customers ──────────────────────────────────────────────────────────
-- Skips any name that already exists in the customers table.

INSERT INTO customers (id, client_name, branch)
SELECT gen_random_uuid(), v.name, ''
FROM (VALUES
  ('Jubile Festa'),
  ('House Party'),
  ('this is it café'),
  ('Tilaks kitchen'),
  ('Element E7'),
  ('Deccan kitchen'),
  ('Good Vibes'),
  ('Golden Pavilion'),
  ('Fusion Aroma'),
  ('Atias Kitchen'),
  ('Aaha'),
  ('Krigo'),
  ('The English Café'),
  ('Mid Land'),
  ('Jagan pan house'),
  ('Blossamin Spa'),
  ('Maryadha Ramanna'),
  ('1980s Milatry Hotel'),
  ('Tawalogy')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM customers WHERE client_name = v.name
);

-- ── 2. Label purchases ────────────────────────────────────────────────────────

INSERT INTO label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description)
SELECT t.v,
  CASE
    WHEN t.c IS NULL THEN NULL
    WHEN t.c = 'Gismat' THEN COALESCE(
      (SELECT id FROM customers WHERE client_name = 'Gismat' LIMIT 1),
      (SELECT id FROM customers WHERE client_name = 'Jismat' ORDER BY created_at LIMIT 1)
    )
    WHEN t.c = 'Chandhu Poda Marriage Order' THEN
      (SELECT id FROM customers WHERE client_name ILIKE '%Chandhu%' LIMIT 1)
    ELSE (SELECT id FROM customers WHERE client_name = t.c LIMIT 1)
  END,
  t.s, t.q, t.cpl, t.ta, t.pd::date, t.d
FROM (VALUES

  -- ── Dec 2024 (Haneel internal) ────────────────────────────────────────────
  ('Haneel', 'Jubile Festa',                      'P 1000 ml',   6600,  0.0000,      0.00, '2024-12-09', NULL),
  ('Haneel', 'Jubile Festa',                      'P 500 ml',    6300,  0.0000,      0.00, '2024-12-21', NULL),
  ('Haneel', 'House Party',                       'P 500 ml',    1340,  0.0000,      0.00, '2024-12-21', NULL),

  -- ── Jan 2025 (Haneel internal) ────────────────────────────────────────────
  ('Haneel', 'this is it café',                   'P 500 ml',     740,  0.0000,      0.00, '2025-01-06', NULL),
  ('Haneel', 'Tilaks kitchen',                    'P 500 ml',   16540,  0.0000,      0.00, '2025-01-11', NULL),
  ('Haneel', 'Element E7',                        'P 1000 ml',  11100,  0.0000,      0.00, '2025-01-11', NULL),
  ('Haneel', 'Deccan kitchen',                    'P 750 ml',    6064,  0.0000,      0.00, '2025-01-11', NULL),

  -- ── Apr 2025 ──────────────────────────────────────────────────────────────
  ('GMG',    'House Party',                       'P 500 ml',    5400,  0.9000,   4860.00, '2025-04-26', NULL),
  ('GMG',    'this is it café',                   'P 500 ml',   10400,  0.8000,   8320.00, '2025-04-26', NULL),
  ('GMG',    'Golden Pavilion',                   'AL 750 ml',    720,  1.6000,   1152.00, '2025-04-28', NULL),
  ('GMG',    'Good Vibes',                        'P 500 ml',     625,  1.4000,    875.00, '2025-04-28', NULL),
  ('Venu',   'Golden Pavilion',                   'AL 750 ml',   1056,  0.0000,      0.00, '2025-04-30', NULL),

  -- ── May 2025 ──────────────────────────────────────────────────────────────
  ('Haneel', 'Fusion Aroma',                      'P 1000 ml',    228,  0.0000,      0.00, '2025-05-01', NULL),
  -- source date was 10/05/2025 (DD/MM), confirmed = May 10
  ('GMG',    'Gismat',                            'P 500 ml',   10550,  0.8000,   8440.00, '2025-05-10', NULL),
  ('Haneel', 'Deccan kitchen',                    'P 250 ml',    1500,  0.0000,      0.00, '2025-05-12', NULL),
  ('GMG',    'Biryanis and More',                 'P 1000 ml',  10800,  1.0000,  10800.00, '2025-05-16', NULL),
  ('GMG',    'Fusion Aroma',                      'P 1000 ml',   5300,  1.2000,   6360.00, '2025-05-16', NULL),
  ('GMG',    'Atias Kitchen',                     'P 1000 ml',   5400,  1.2000,   6480.00, '2025-05-16', NULL),
  ('GMG',    'Deccan kitchen',                    'P 750 ml',    5300,  1.2000,   6360.00, '2025-05-16', NULL),
  ('GMG',    'Aaha',                              'AL 500 ml',  11000,  0.8000,   8800.00, '2025-05-20', NULL),
  ('GMG',    'Gismat',                            'P 500 ml',   16000,  0.8000,  12800.00, '2025-05-20', NULL),
  ('GMG',    'Biryanis and More',                 'P 1000 ml',  15900,  1.0000,  15900.00, '2025-05-20', NULL),

  -- ── Jun 2025 ──────────────────────────────────────────────────────────────
  ('Haneel', 'Benguluru Bhavan',                  'P 500 ml',     880,  0.0000,      0.00, '2025-06-05', NULL),
  ('Haneel', 'Good Vibes',                        'P 500 ml',     315,  0.0000,      0.00, '2025-06-05', NULL),
  ('GMG',    'Tara South Indian',                 'P 500 ml',   10300,  0.8000,   8240.00, '2025-06-11', NULL),
  ('GMG',    'Gismat',                            'P 500 ml',   12500,  0.8000,  10000.00, '2025-06-16', NULL),
  ('GMG',    'Biryanis and More',                 'P 1000 ml',  15500,  1.0000,  15500.00, '2025-06-25', NULL),
  ('GMG',    'Benguluru Bhavan',                  'P 500 ml',   17500,  0.8000,  14000.00, '2025-06-25', NULL),
  ('GMG',    'Tilaks kitchen',                    'P 500 ml',   10000,  0.8000,   8000.00, '2025-06-25', NULL),
  ('Haneel', 'Golden Pavilion',                   'AL 750 ml',   2000,  0.0000,      0.00, '2025-06-30', NULL),
  ('Haneel', 'Good Vibes',                        'P 500 ml',    2000,  0.0000,      0.00, '2025-06-30', NULL),
  ('Haneel', 'The English Café',                  'P 750 ml',    5000,  0.0000,      0.00, '2025-06-30', NULL),
  ('Haneel', 'Mid Land',                          'P 1000 ml',    768,  0.0000,      0.00, '2025-06-30', NULL),
  ('Haneel', 'Krigo',                             'P 1000 ml',    888,  0.0000,      0.00, '2025-06-30', NULL),

  -- ── Jul 2025 ──────────────────────────────────────────────────────────────
  ('GMG',          'Gismat',                      'P 500 ml',   21000,  0.8000,  16800.00, '2025-07-01', NULL),
  ('Morya labels', 'Golden Pavilion',             'AL 750 ml',   2650,  0.8260,   2188.90, '2025-07-12', NULL),
  ('Morya labels', 'Mid Land',                    'P 750 ml',    2650,  0.8260,   2188.90, '2025-07-12', NULL),
  ('Morya labels', 'Jagan pan house',             'P 1000 ml',   1350,  1.4160,   1911.60, '2025-07-12', NULL),
  ('Morya labels', 'Jagan pan house',             'P 500 ml',    1350,  0.9440,   1274.40, '2025-07-12', NULL),
  ('GMG',          'House Party',                 'P 500 ml',    6900,  0.8000,   5520.00, '2025-07-17', NULL),
  ('GMG',          'Element E7',                  'P 1000 ml',  12000,  1.0000,  12000.00, '2025-07-17', NULL),
  ('GMG',          'Blossamin Spa',               'P 250 ml',   12000,  0.4000,   4800.00, '2025-07-22', NULL),
  ('Morya labels', 'Mid Land',                    'P 750 ml',   10017,  0.8260,   8274.00, '2025-07-31', NULL),
  ('Morya labels', 'Blossamin Spa',               'P 250 ml',    6100,  0.6490,   3959.00, '2025-07-31', NULL),

  -- ── Aug 2025 ──────────────────────────────────────────────────────────────
  ('Haneel',       'Gismat',                      'P 500 ml',    2500,  0.0000,      0.00, '2025-08-01', NULL),
  ('Morya labels', 'Blossamin Spa',               'P 250 ml',  -12000, 0.0000,      0.00, '2025-08-02', 'label size issue'),
  ('GMG',          'Gismat',                      'P 500 ml',   15700,  0.8000,  12560.00, '2025-08-04', NULL),
  ('GMG',          'Maryadha Ramanna',            'P 500 ml',   10000,  0.8000,   8000.00, '2025-08-04', NULL),
  ('Morya labels', 'Chandhu Poda Marriage Order', 'P 250 ml',    7100,  0.6490,   4608.00, '2025-08-05', NULL),
  ('GMG',          'Biryanis and More',           'P 1000 ml',  12700,  1.0000,  12700.00, '2025-08-19', NULL),
  ('GMG',          'Gismat',                      'P 500 ml',   13500,  0.8000,  10800.00, '2025-08-19', NULL),
  ('GMG',          'Tilaks kitchen',              'P 500 ml',   12700,  0.8000,  10160.00, '2025-08-19', NULL),
  ('Haneel',       'this is it café',             'P 500 ml',     260,  0.0000,      0.00, '2025-08-31', NULL),
  ('Haneel',       'Deccan kitchen',              'P 250 ml',    -300,  0.0000,      0.00, '2025-08-31', NULL),
  ('Haneel',       'Alley 91',                    '250 EC',      2540,  0.0000,      0.00, '2025-08-31', NULL),

  -- ── Sep 2025 ──────────────────────────────────────────────────────────────
  ('GMG',          'this is it café',             'P 500 ml',     430,  0.8521,      0.00, '2025-09-03', 'count mismatch'),
  ('GMG',          'this is it café',             'P 500 ml',   11000,  0.8000,   8800.00, '2025-09-10', NULL),
  ('GMG',          'Benguluru Bhavan',            'P 500 ml',   11000,  0.8000,   8800.00, '2025-09-10', NULL),
  ('Morya labels', 'Mid Land',                    'P 750 ml',    5100,  0.8260,   4212.60, '2025-09-14', NULL),
  ('Morya labels', 'Chaitanya''s Modern Kitchen', 'P 500 ml',    3960,  0.8260,   3270.96, '2025-09-14', NULL),
  ('Morya labels', 'Golden Pavilion',             'AL 750 ml',   1900,  0.8260,   1569.40, '2025-09-14', NULL),
  ('Morya labels', 'Deccan kitchen',              'P 250 ml',    1250,  0.4720,    590.00, '2025-09-18', NULL),
  ('Morya labels', 'Alley 91',                    '250 EC',      1250,  0.9440,   1180.00, '2025-09-18', NULL),
  ('GMG',          'Gismat',                      'P 500 ml',   10700,  0.8000,   8560.00, '2025-09-23', NULL),
  ('Haneel',       'Biryanis and More',           'P 1000 ml',   8688,  0.0000,      0.00, '2025-09-30', NULL),
  ('Haneel',       'Maryadha Ramanna',            'P 500 ml',    3820,  0.0000,      0.00, '2025-09-30', NULL),

  -- ── Oct 2025 ──────────────────────────────────────────────────────────────
  ('Morya labels', 'Chaitanya''s Modern Kitchen', 'P 500 ml',    4020,  0.9440,   3794.88, '2025-10-05', NULL),
  ('Morya labels', 'Alley 91',                    '250 EC',      1500,  0.9440,   1416.00, '2025-10-05', NULL),
  ('GMG',          'Maryadha Ramanna',            'P 500 ml',   10000,  0.8000,   8000.00, '2025-10-06', NULL),
  ('GMG',          'Biryanis and More',           'P 1000 ml',  15300,  1.0000,  15300.00, '2025-10-13', NULL),
  ('GMG',          'Gismat',                      'P 500 ml',   14600,  0.8000,  11680.00, '2025-10-13', NULL),
  ('GMG',          'House Party',                 'P 500 ml',   10000,  0.8000,   8000.00, '2025-10-13', NULL),
  ('Morya labels', 'Golden Pavilion',             'AL 750 ml',   3660,  0.8260,   3023.16, '2025-10-17', NULL),
  ('Morya labels', 'Chaitanya''s Modern Kitchen', 'P 500 ml',    4550,  0.9440,   4295.20, '2025-10-17', NULL),
  ('Morya labels', 'Chaitanya''s Modern Kitchen', 'P 500 ml',   -4530,  0.8635,      0.00, '2025-10-17', 'count mismatch'),
  ('GMG',          'Soul of South',               'P 500 ml',    1000,  1.0000,   1000.00, '2025-10-25', NULL),
  ('GMG',          'Gismat',                      'P 500 ml',   21000,  0.8000,  16800.00, '2025-10-25', NULL),
  ('GMG',          'Benguluru Bhavan',            'P 500 ml',   12300,  0.8000,   9840.00, '2025-10-25', NULL),

  -- ── Nov 2025 ──────────────────────────────────────────────────────────────
  ('Morya labels', '1980s Milatry Hotel',         'AL 750 ml',   1302,  0.8260,   1075.45, '2025-11-03', NULL),
  ('Morya labels', 'Deccan kitchen',              'P 750 ml',    1250,  1.0620,   1327.50, '2025-11-03', NULL),
  ('Morya labels', 'Deccan kitchen',              'P 250 ml',    1550,  0.4720,    731.60, '2025-11-03', NULL),
  ('GMG',          'Maryadha Ramanna',            'P 500 ml',   -1000,  0.0000,      0.00, '2025-11-06', 'count mismatch'),
  ('Morya labels', 'Soul of South',               'P 500 ml',    2020,  0.9440,   1906.88, '2025-11-18', NULL),
  ('Morya labels', 'Alley 91',                    '250 EC',      2520,  0.9440,   2378.88, '2025-11-18', NULL),

  -- ── Dec 2025 ──────────────────────────────────────────────────────────────
  ('GMG',          'Maryadha Ramanna',            'P 500 ml',   11000,  0.8000,   8800.00, '2025-12-06', NULL),
  ('Morya labels', 'Gismat',                      'P 500 ml',    4050,  0.9440,   3823.20, '2025-12-06', NULL),
  ('Morya labels', 'Gismat',                      'P 500 ml',    8120,  0.9440,   7665.28, '2025-12-12', NULL),
  ('Morya labels', 'Hiyya Chrono Jail Mandi',     'P 500 ml',    6169,  0.9440,   5823.54, '2025-12-12', NULL),
  ('Morya labels', '1980s Milatry Hotel',         'AL 750 ml',   1290,  0.8260,   1065.54, '2025-12-21', NULL),
  ('Morya labels', 'Tawalogy',                    'P 1000 ml',   2230,  1.4160,   3157.68, '2025-12-21', NULL),
  ('Morya labels', 'Hiyya Chrono Jail Mandi',     'P 500 ml',    4050,  0.9440,   3823.20, '2025-12-21', NULL),
  ('Morya labels', 'Chaitanya''s Modern Kitchen', 'P 500 ml',    5886,  0.9440,   5556.38, '2025-12-26', NULL),
  ('Morya labels', 'Tawalogy',                    'P 250 ml',    1212,  0.4720,    572.06, '2025-12-26', NULL),
  ('Morya labels', 'Alley 91',                    'P 250 ml',    1255,  0.6490,    814.50, '2025-12-26', NULL),
  ('GMG',          'Biryanis and More',           'P 1000 ml',  14500,  1.0000,  14500.00, '2025-12-26', NULL),
  ('GMG',          'Benguluru Bhavan',            'P 500 ml',   12000,  0.8000,   9600.00, '2025-12-30', NULL),
  ('GMG',          'Benguluru Bhavan',            'P 500 ml',   -2080,  0.0000,      0.00, '2025-12-31', 'count mismatch'),
  ('Morya labels', 'Soul of South',               'P 500 ml',      40,  0.8635,      0.00, '2025-12-31', 'count mismatch'),
  ('Morya labels', 'Alley 91',                    '250 EC',      -470,  0.8635,      0.00, '2025-12-31', 'count mismatch'),
  ('Morya labels', 'Gismat',                      'P 500 ml',  -11220,  0.8635,      0.00, '2025-12-31', 'count mismatch'),
  ('ABS',          'Biryanis and More',           'P 1000 ml',   6000,  0.0000,      0.00, '2025-12-31', NULL),
  ('GMG',          'Element E7',                  'P 1000 ml',  -1404,  0.0000,      0.00, '2025-12-31', 'count mismatch')

) AS t(v, c, s, q, cpl, ta, pd, d);
