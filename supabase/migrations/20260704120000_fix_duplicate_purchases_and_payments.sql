-- Fix two data-duplication issues discovered during vendor outstanding reconciliation:
--
-- 1. Jun 4 2026 label purchases: the reimport (20260619000000) already contained
--    these 4 rows (created 2026-06-20); fix_jun2026_labels (20260704100000) re-inserted
--    them today (created 2026-07-04). Delete the today-created duplicates.
--
-- 2. Morya labels payments Jan–Apr 2026: each payment was inserted 3 times —
--    once via app UI on 2026-06-04, then twice more on 2026-06-20 (04:21 and 12:19)
--    by intermediate migrations. Keep the original Jun 4 entries; delete the 22 Jun 20 copies.

-- ── 1. Delete 4 duplicate Jun 4 2026 purchase rows ───────────────────────────

DELETE FROM public.label_purchases
WHERE id IN (
  '2cd7665b-db2a-418e-bce6-328435098822',  -- Iron hill café  2169 qty ₹2048
  'db3471f6-6466-4020-89af-99eb71a6867d',  -- Maryadha Ramanna 2264 qty ₹2137
  '0089163b-60b1-4f09-b50c-de6943b1b84a',  -- This is it café 2188 qty ₹2065
  'd3b60138-cedc-4abb-ae0e-4ac72ca574bc'   -- Ballus Kitchen  2634 qty ₹3730
);

-- ── 2. Delete 22 duplicate Morya labels payment rows ─────────────────────────
-- Keeping the Jun 4 originals (created_at 2026-06-04 10:31 and 2026-05-14 for Apr 21).
-- Deleting both Jun 20 batches (created_at 2026-06-20 04:21 and 12:19).

DELETE FROM public.label_payments
WHERE id IN (
  -- 2026-06-20 04:21 batch
  'cf52acf5-5a4a-4696-b9cf-6f5785aa96ff',  -- Jan 8   ₹12360
  '2b578e58-5f38-4be4-a085-1bbefc50e4ba',  -- Jan 14  ₹25128
  'd5139640-a586-45d2-b851-5d02f66eb8e0',  -- Feb 3   ₹3811
  '3fe84cb3-56dd-45ef-b9c6-d4c530c82f12',  -- Feb 14  ₹10446.11
  '144cb13a-27be-443b-a8f3-2ca4caa152e6',  -- Feb 20  ₹22472.46
  'ba32e00b-1a65-4d96-b143-caa771f55193',  -- Feb 25  ₹8192
  '0bb676ba-2238-4ab1-960f-36413f0b5547',  -- Mar 22  ₹25731
  'd57a2a55-4afa-46b6-afc6-6da3c61f6535',  -- Mar 26  ₹5000
  'f49d6470-3e1a-4fa8-9cfe-b98bd4f150d3',  -- Mar 26  -₹4
  '56155cd3-11a4-405b-907e-971918cf50c9',  -- Mar 31  ₹22713
  '37264765-ad5a-46d4-bc4c-cdfe285f2215',  -- Apr 21  ₹29506
  -- 2026-06-20 12:19 batch
  '19a02471-7a2a-4b28-8f20-2f99a81b4cdb',  -- Jan 8   ₹12360
  '05276138-8164-499c-99fe-d6772847da97',  -- Jan 14  ₹25128
  '12fde89f-d611-44af-ac07-2bdee23fdb96',  -- Feb 3   ₹3811
  'ec49fb83-ca35-45e5-9c6b-9f2673112ab3',  -- Feb 14  ₹10446.11
  'f761f5c6-fc9e-4413-ad5b-b5da0e6aa6d6',  -- Feb 20  ₹22472.46
  '8907809d-02dc-45e8-8d0e-fed52a42d19f',  -- Feb 25  ₹8192
  '88060381-f4e9-4ae7-b212-85789a7980d1',  -- Mar 22  ₹25731
  'b9567bfb-9baf-4fff-a179-fa3dad3d58ae',  -- Mar 26  -₹4
  '395538e7-e259-4f65-a10b-3e5e1ce0c305',  -- Mar 26  ₹5000
  'de0dbf2c-38f8-44eb-b702-573599931ea7',  -- Mar 31  ₹22713
  '2fae88c1-d2a0-484a-a17b-7716b4ee0bb9'   -- Apr 21  ₹29506
);
