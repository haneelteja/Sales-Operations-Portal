-- Cleanup: the previous migration (20260923080000) used IS NOT DISTINCT FROM client_id in the
-- WHERE NOT EXISTS guard, but pre-existing portal entries had NULL client_id. That caused every
-- entry to be re-inserted with a specific client_id, duplicating the pre-existing NULL entries.
--
-- This migration removes those duplicate specific-client-id entries (from our migration) where
-- a pre-existing NULL-client-id entry already exists for the same date/qty/amount.
-- After cleanup, Morya purchased should return to ~₹6,23,946 matching Elma.

DELETE FROM public.label_purchases lp_dup
WHERE lp_dup.vendor_id = (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
  AND lp_dup.record_type = 'purchase'
  AND lp_dup.purchase_date >= '2025-07-12'
  AND lp_dup.purchase_date <= '2026-07-01'
  AND lp_dup.client_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.label_purchases lp_orig
    WHERE lp_orig.vendor_id = lp_dup.vendor_id
      AND lp_orig.purchase_date = lp_dup.purchase_date
      AND lp_orig.quantity = lp_dup.quantity
      AND ABS(lp_orig.total_amount - lp_dup.total_amount) < 0.01
      AND lp_orig.record_type = 'purchase'
      AND lp_orig.client_id IS NULL
      AND lp_orig.id != lp_dup.id
  );
