-- Hiyya Dino Mandi Sep 2026: the Sep 4 entry of -10 cases / -₹1,900 was entered
-- as a sales return for damaged stock. The correct treatment is:
--   • Client was invoiced for 120 cases (₹22,800) — no credit given for damaged return
--   • Damaged stock loss sits with the factory, not the client
--
-- Fix:
--   1. Delete the erroneous -10 / -₹1,900 sales entry (id known from DB query)
--   2. Add +200 label adjustment (10 returned cases × 20 btl/case) to restore
--      Hiyya Dino Mandi P 500ml available to 2,525 (Elma-verified remaining).
--      The 10 returned cases came back with labels intact.
--
-- After this migration:
--   Sales transactions Sep 2026: 120 cases, ₹22,800 ✓
--   Factory production Sep 2026: 120 cases, ₹14,964 (unchanged) ✓
--   Label available P 500ml: 2,525 ✓

-- Step 1: Remove the incorrect damaged-return sales transaction
DELETE FROM public.sales_transactions
WHERE id = '2342070f-3e84-411e-bc69-1cb1d9e05e84';

-- Step 2: Restore the 200 labels that came back with the returned cases
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1),
  'P 500 ml', 200, 0, 0, '2026-09-04', 'adjustment',
  'Damaged stock return Sep 2026 - 10 cases returned with labels intact'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1)
    AND sku = 'P 500 ml'
    AND quantity = 200
    AND record_type = 'adjustment'
    AND reason = 'Damaged stock return Sep 2026 - 10 cases returned with labels intact'
);
