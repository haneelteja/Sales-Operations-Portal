-- Move 9 old Gismat Kondapur label batches (May–Oct 2025, ₹0.80/label) to Jismat Dilshuknagar.
-- These batches were for the old Gismat stores (now tracked as Jismat).
-- Moving them correctly attributes ₹108,440 in label costs to Jismat for profitability.
--
-- After this migration:
--   Gismat New (Kondapur + Chanda Nagar) = 36,755  ✓ matches Elma
--   Jismat (Ameerpet + Dilshuknagar)     = 47,817  ✓ matches Elma

-- ── 1. Move 9 purchases from Gismat Kondapur → Jismat Dilshuknagar ───────────
UPDATE public.label_purchases
SET client_id = '51140c9d-a79a-4504-8ba5-b4d3b3965892'  -- Jismat Dilshuknagar
WHERE id IN (
  'fe103e72-6e50-489a-8adb-27b1a7e19183',  -- 2025-05-10  10550 qty ₹0.80
  'd440c193-b0ed-4e61-9f94-3fb81979e8ff',  -- 2025-05-20  16000 qty ₹0.80
  'c3bc414e-cafb-445b-a8ff-a63fe52f0e85',  -- 2025-06-16  12500 qty ₹0.80
  'e8a37800-561a-4a6d-910c-f4057d98acfe',  -- 2025-07-01  21000 qty ₹0.80
  '2d3df181-2a1a-46d1-9f46-3918df6b67d2',  -- 2025-08-04  15700 qty ₹0.80
  'bcb1dd0c-f3c9-42eb-a2ca-b4f0aba69fac',  -- 2025-08-19  13500 qty ₹0.80
  '0e0c4b8c-bc65-4710-9600-caeda8d6c0d9',  -- 2025-09-23  10700 qty ₹0.80
  '271c64b8-77d4-4d2c-9ca1-46f343143d99',  -- 2025-10-13  14600 qty ₹0.80
  '3a86c217-6141-48f9-9186-6576a93a10ce'   -- 2025-10-25  21000 qty ₹0.80
);

-- ── 2. Delete the old blanket -139000 "Adjustment with Elma" on Gismat ────────
DELETE FROM public.label_purchases
WHERE id = '63e75826-6aa1-41e6-bb47-1e4bad176a79';

-- ── 3. Add small residual adjustment on Gismat Kondapur ──────────────────────
-- Gismat Kondapur after move: 44625 purchases - 6008 other adj = 38617
-- + Chanda Nagar 1588 = 40205. Target 36755. Gap = -3450.
INSERT INTO public.label_purchases
  (client_id, vendor_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, description)
VALUES
  ('c23daee9-4068-4024-b50c-50cb6bbde582', 'GMG', 'P 500 ml', -3450, 0, 0, '2026-06-30', 'adjustment', 'Adjustment with Elma');

-- ── 4. Add offsetting adjustment on Jismat Dilshuknagar ──────────────────────
-- Jismat Dilshuknagar after receiving 135550: 174494 + 305 adj = 174799.
-- Ameerpet stays 8568. Total Jismat = 183367. Target 47817. Gap = -135550.
INSERT INTO public.label_purchases
  (client_id, vendor_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, description)
VALUES
  ('51140c9d-a79a-4504-8ba5-b4d3b3965892', 'GMG', 'P 500 ml', -135550, 0, 0, '2026-06-30', 'adjustment', 'Adjustment with Elma');
