-- Fix cost_per_label values that were entered incorrectly for Apr–May 2026 batches.
-- In all cases total_amount is CORRECT (verified by total ÷ qty ≈ true rate).
-- Only cost_per_label needs updating.
--
-- Confirmed rates in this period:
--   Morya labels P 500 ml  → 0.9440
--   Morya labels P 750 ml  → 1.0620
--   Morya labels P 1000 ml → 1.4160
-- ─────────────────────────────────────────────────────────────────────────────

-- ══ 2026-04-28 ══════════════════════════════════════════════════════════════
-- P 500 ml entries entered with 0.9000 — should be 0.9440
UPDATE public.label_purchases
SET cost_per_label = 0.9440
WHERE purchase_date  = '2026-04-28'
  AND vendor_id      = 'Morya labels'
  AND sku            = 'P 500 ml'
  AND cost_per_label = 0.9000;

-- Biryanis P 1000 ml entered with 1.6000 — should be 1.4160
-- (8832 ÷ 6237 = 1.4160)
UPDATE public.label_purchases
SET cost_per_label = 1.4160
WHERE purchase_date  = '2026-04-28'
  AND vendor_id      = 'Morya labels'
  AND sku            = 'P 1000 ml'
  AND cost_per_label = 1.6000;

-- ══ 2026-05-08 ══════════════════════════════════════════════════════════════
-- Hiyya Dino P 500 ml entered with 0.9000 — should be 0.9440
-- (3804 ÷ 4030 = 0.9438 ≈ 0.9440)
UPDATE public.label_purchases
SET cost_per_label = 0.9440
WHERE purchase_date  = '2026-05-08'
  AND vendor_id      = 'Morya labels'
  AND sku            = 'P 500 ml'
  AND cost_per_label = 0.9000;

-- ══ 2026-05-16 ══════════════════════════════════════════════════════════════
-- P 500 ml entries (Benguluru Bhavan, Gismat, Soul of South, This is it café)
-- entered with 0.9000 — should be 0.9440
UPDATE public.label_purchases
SET cost_per_label = 0.9440
WHERE purchase_date  = '2026-05-16'
  AND vendor_id      = 'Morya labels'
  AND sku            = 'P 500 ml'
  AND cost_per_label = 0.9000;

-- Biryanis P 1000 ml entered with 1.0000 — should be 1.4160
-- (5932 ÷ 4189 = 1.4160)
UPDATE public.label_purchases
SET cost_per_label = 1.4160
WHERE purchase_date  = '2026-05-16'
  AND vendor_id      = 'Morya labels'
  AND sku            = 'P 1000 ml'
  AND cost_per_label = 1.0000;

-- Tawalogy P 1000 ml entered with 0.9000 — should be 1.4160
-- (1982 ÷ 1400 = 1.4157 ≈ 1.4160)
UPDATE public.label_purchases
SET cost_per_label = 1.4160
WHERE purchase_date  = '2026-05-16'
  AND vendor_id      = 'Morya labels'
  AND sku            = 'P 1000 ml'
  AND cost_per_label = 0.9000;

-- ══ 2026-05-19 ══════════════════════════════════════════════════════════════
-- Hiyya Chrono, Hiyya Dino, Jismat P 500 ml entered with 0.9000 — should be 0.9440
UPDATE public.label_purchases
SET cost_per_label = 0.9440
WHERE purchase_date  = '2026-05-19'
  AND vendor_id      = 'Morya labels'
  AND sku            = 'P 500 ml'
  AND cost_per_label = 0.9000;

-- ══ 2026-05-25 ══════════════════════════════════════════════════════════════
-- Illuzion SKU entered as P 500 ml — should be P 750 ml
-- (cost_per_label 1.0620 is the Morya P 750 ml rate; 2490 × 1.062 = 2644.38 ≈ 2644.40 ✓)
UPDATE public.label_purchases
SET sku = 'P 750 ml'
WHERE purchase_date  = '2026-05-25'
  AND vendor_id      = 'Morya labels'
  AND sku            = 'P 500 ml'
  AND cost_per_label = 1.0620
  AND quantity       = 2490;

-- ══ 2026-05-31 ══════════════════════════════════════════════════════════════
-- Count mismatch entries for Hiyya Chrono and Hiyya Dino entered with 0.9000
-- — align to standard 0.9440 rate for consistency
UPDATE public.label_purchases
SET cost_per_label = 0.9440
WHERE purchase_date  = '2026-05-31'
  AND vendor_id      = 'Morya labels'
  AND sku            = 'P 500 ml'
  AND cost_per_label = 0.9000;
