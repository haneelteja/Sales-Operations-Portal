-- Label vendor payments: Jan 2026 – Apr 2026
-- May 2026 payments (5/4, 5/18, 5/27) already inserted in 20260605000000_add_may_2026_label_data.sql
-- GMG labels → stored as 'GMG' (consistent with vendor normalization)
-- 3/26/2026 -4.00 row is a rounding correction entry

INSERT INTO label_payments (vendor_id, payment_amount, payment_date, payment_method, description)
VALUES
  ('Morya labels', 29506.00,  '2026-04-21', 'Bank Transfer', NULL),
  ('Morya labels', 22713.00,  '2026-03-31', 'Bank Transfer', NULL),
  ('Morya labels',    -4.00,  '2026-03-26', 'Bank Transfer', NULL),
  ('Morya labels',  5000.00,  '2026-03-26', 'Bank Transfer', NULL),
  ('Morya labels', 25731.00,  '2026-03-22', 'Bank Transfer', NULL),
  ('Morya labels',  8192.00,  '2026-02-25', 'Bank Transfer', NULL),
  ('Morya labels', 22472.46,  '2026-02-20', 'Bank Transfer', NULL),
  ('Morya labels', 10446.11,  '2026-02-14', 'Bank Transfer', NULL),
  ('Morya labels',  3811.00,  '2026-02-03', 'Bank Transfer', NULL),
  ('GMG',          12480.00,  '2026-01-24', 'Bank Transfer', NULL),
  ('Morya labels', 25128.00,  '2026-01-14', 'Bank Transfer', NULL),
  ('Morya labels', 12360.00,  '2026-01-08', 'Bank Transfer', NULL),
  ('GMG',           4788.00,  '2026-01-05', 'Bank Transfer', NULL);
