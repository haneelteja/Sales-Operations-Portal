-- Add record_type and reason columns to label_purchases:
--
-- record_type: 'purchase' (default, existing rows) | 'adjustment' (count mismatch corrections)
-- reason: free-text reason for adjustments (e.g. "count mismatch", "label size issue")
--
-- Adjustments have quantity (can be negative), cost = 0, and a reason.
-- Purchases work exactly as before.
-- Only 'purchase' records count toward vendor payment outstanding.

ALTER TABLE public.label_purchases
  ADD COLUMN IF NOT EXISTS record_type TEXT NOT NULL DEFAULT 'purchase',
  ADD COLUMN IF NOT EXISTS reason TEXT NULL;
