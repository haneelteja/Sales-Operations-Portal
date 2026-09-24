-- Remove extra Jul 3, 2026 Morya qty=2075 entry (pre-existing manual entry that caused
-- the add_jul2026_remaining_labels migration to insert duplicates).
--
-- Both Thatha Kottu Tiffins and Maryadha Ramanna legitimately ordered 2075 P500ml labels
-- on Jul 3 (₹1,958.80 each). The Jul 3-30 migration used client_id guards for these two
-- because they share the same date+qty. If a pre-existing entry with NULL or wrong client_id
-- existed, neither guard would catch it, so both were inserted on top → 3 entries instead of 2.
--
-- Expected: exactly 2 entries (Thatha Kottu + Maryadha Ramanna).
-- This migration deletes any extra entry that is neither.

DELETE FROM public.label_purchases
WHERE vendor_id = (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
  AND purchase_date = '2026-07-03'
  AND quantity = 2075
  AND record_type = 'purchase'
  AND client_id IS DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu%' LIMIT 1)
  AND client_id IS DISTINCT FROM (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna%' LIMIT 1);
