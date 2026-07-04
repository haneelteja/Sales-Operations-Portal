-- Fix GMG label_payments to match Elma:
--
-- 1. Delete all 3 copies of Jan 24 2026 ₹12480 payment.
--    This payment is for the Jan 24 GMG back-label batch (in back_label_purchases),
--    which is NOT in label_purchases, so it must not be in label_payments either.
--
-- 2. Delete 2 duplicate Jan 5 2026 ₹4788 entries stored under vendor 'GMG'
--    (wrong vendor). Keep the single 'GMG labels' copy (b5dd219a).
--
-- 3. Add 13 missing Aug–Dec 2025 GMG payments that existed in Elma but not in DB.
--
-- After this migration:
--   GMG purchased = 501927.04, GMG paid = 509160 → outstanding = -7232.96 ✓
--   GMG labels purchased = 4788,  paid = 4788   → outstanding = 0        ✓

-- ── 1. Remove Jan 24 back-sticker payment (all 3 copies) ─────────────────────
DELETE FROM public.label_payments
WHERE id IN (
  '53bc49bf-9872-4167-9cde-f53335c56ea3',  -- GMG labels, Jun 4
  '6b7e81d1-fc22-48a4-9019-18282bad05e5',  -- GMG,        Jun 20 04:21
  'a6739339-49b2-412a-aa6b-5dc881cc38ff'   -- GMG,        Jun 20 12:19
);

-- ── 2. Remove 2 duplicate Jan 5 ₹4788 rows with wrong vendor 'GMG' ───────────
DELETE FROM public.label_payments
WHERE id IN (
  '3ea81260-b220-49eb-95b8-c6ccfc89c4a2',  -- GMG, Jun 20 04:21
  'c6efa949-b671-47c5-b093-c4788745602a'   -- GMG, Jun 20 12:19
);

-- ── 3. Add 13 missing Aug–Dec 2025 GMG payments ──────────────────────────────
INSERT INTO public.label_payments (vendor_id, payment_amount, payment_date, payment_method, description)
VALUES
  ('GMG',  7233.00, '2025-08-02', 'Bank Transfer', NULL),
  ('GMG', 24060.00, '2025-08-04', 'Bank Transfer', NULL),
  ('GMG', 35000.00, '2025-08-19', 'Bank Transfer', NULL),
  ('GMG', 11660.00, '2025-08-28', 'Bank Transfer', NULL),
  ('GMG', 17600.00, '2025-09-10', 'Bank Transfer', NULL),
  ('GMG', 13000.00, '2025-09-20', 'Bank Transfer', NULL),
  ('GMG',  8560.00, '2025-09-23', 'Bank Transfer', NULL),
  ('GMG',  8000.00, '2025-10-06', 'Bank Transfer', NULL),
  ('GMG', 34980.00, '2025-10-13', 'Bank Transfer', NULL),
  ('GMG', 41420.00, '2025-10-25', 'Bank Transfer', NULL),
  ('GMG', 21800.00, '2025-12-06', 'Bank Transfer', NULL),
  ('GMG', 14500.00, '2025-12-26', 'Bank Transfer', NULL),
  ('GMG',  9600.00, '2025-12-30', 'Bank Transfer', NULL);
