-- Back label purchase batches: May 2025 – May 2026
-- GMG batches (₹0.26/label) + Morya Labels batches (₹0.354/label)
-- 3/31/2026 GMG count mismatch: source qty 9687.92 rounded to 9688 (INTEGER column)

INSERT INTO back_label_purchases
  (purchase_date, quantity, cost_per_label, total_amount, vendor_id, description)
VALUES
  -- ── GMG batches ──────────────────────────────────────────────────────────
  ('2025-05-20', 50000, 0.2600, 13000.0000, 'GMG',          'GMG'),
  ('2025-06-19', 25000, 0.2600,  6500.0000, 'GMG',          'GMG'),
  ('2025-06-25', 25300, 0.2600,  6578.0000, 'GMG',          'GMG'),
  ('2025-07-17', 50000, 0.2600, 13000.0000, 'GMG',          'GMG'),
  ('2025-08-19', 50000, 0.2600, 13000.0000, 'GMG',          'GMG'),
  ('2025-09-20', 50000, 0.2600, 13000.0000, 'GMG',          'GMG'),
  ('2025-10-25', 53000, 0.2600, 13780.0000, 'GMG',          'GMG'),
  ('2025-12-06', 50000, 0.2600, 13000.0000, 'GMG',          'GMG'),
  ('2026-01-24', 48000, 0.2600, 12480.0000, 'GMG',          'GMG'),
  ('2026-03-31',  9688, 0.2600,     0.0000, 'GMG',          'count mismatch'),

  -- ── Morya labels batches ─────────────────────────────────────────────────
  ('2026-04-10', 10052, 0.3540,  3558.0000, 'Morya labels', 'Morya Labels'),
  ('2026-05-08', 10100, 0.3540,  3575.0000, 'Morya labels', 'Morya Labels'),
  ('2026-05-25', 10130, 0.3540,  3586.0000, 'Morya labels', 'Morya Labels');
