-- Add 10 miscellaneous label-related purchases from Apr–Aug 2025 (GMG and Haneel).
--
-- Source spreadsheet rows: L12, L14, L20, L27, L33, L41, L48, L57, L72, L80
--
-- Rules applied:
--   Vendor 'GMG' → stored as 'GMG' (consistent with existing historical rows)
--   Vendor 'Haneel' → internal supply; cost_per_label=0, total_amount=0 (existing pattern)
--   Expense entries with no unit qty (Plates, Visiting Cards, Die Cutting, Sample Sheet):
--     quantity=1, cost_per_label=0.0000, total_amount=actual amount
--     This lets total_amount flow into vendor outstanding correctly.

INSERT INTO label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description)
SELECT t.v,
  CASE
    WHEN t.c IS NULL THEN NULL
    ELSE (SELECT id FROM customers WHERE client_name = t.c LIMIT 1)
  END,
  t.s, t.q, t.cpl, t.ta, t.pd::date, t.d
FROM (VALUES

  -- L12  04/26/2025  Visiting Cards  –  GMG  –  ₹3,250
  ('GMG',  NULL,                  'Visiting Cards',    1,    0.0000,   3250.00, '2025-04-26', 'Visiting Cards'),

  -- L14  04/28/2025  Sample sheet  –  GMG  –  ₹40
  ('GMG',  NULL,                  'Sample Sheet',      1,    0.0000,     40.00, '2025-04-28', 'Sample sheet'),

  -- L20  05/01/2025  Biryanis and More, Ameerpet  –  Haneel  –  qty 600, no amount
  ('Haneel', 'Biryanis and More', 'P 500 ml',        600,   0.0000,      0.00, '2025-05-01', NULL),

  -- L27  05/16/2025  Biryanis and more Plates  –  GMG  –  ₹3,500
  ('GMG',  'Biryanis and More',  'Plates',             1,    0.0000,   3500.00, '2025-05-16', 'Biryanis and more Plates'),

  -- L33  05/20/2025  Almond Mould 500 ml Die cutting  –  GMG  –  ₹7,500
  ('GMG',  NULL,                  'Die Cutting',       1,    0.0000,   7500.00, '2025-05-20', 'Almond Mould 500 ml Die cutting'),

  -- L41  06/11/2025  Tara South Indian plates  –  GMG  –  ₹3,500
  ('GMG',  'Tara South Indian',  'Plates',             1,    0.0000,   3500.00, '2025-06-11', 'Tara South Indian plates'),

  -- L48  06/25/2025  Benguluru Bhavan Plates  –  GMG  –  ₹3,500
  ('GMG',  'Benguluru Bhavan',   'Plates',             1,    0.0000,   3500.00, '2025-06-25', 'Benguluru Bhavan Plates'),

  -- L57  06/30/2025  Tonique  –  Haneel  –  qty 1932, no amount
  ('Haneel', 'Tonique',          'P 500 ml',        1932,   0.0000,      0.00, '2025-06-30', NULL),

  -- L72  07/22/2025  Blossamin Spa Plates  –  GMG  –  ₹3,500
  ('GMG',  'Blossamin Spa',      'Plates',             1,    0.0000,   3500.00, '2025-07-22', 'Blossamin Spa Plates'),

  -- L80  08/04/2025  Gismat Plates  –  GMG  –  ₹3,500.04
  ('GMG',  'Gismat',             'Plates',             1,    0.0000,   3500.04, '2025-08-04', 'Gismat Plates')

) AS t(v, c, s, q, cpl, ta, pd, d);
