-- Fix April 2025 duplicate and wrong-price sales entries (reconciled against Elma ledger 2026-06-30).

-- Fix 1: Delete 5 duplicate / wrong-price entries where a correct counterpart already exists.
DELETE FROM public.sales_transactions
WHERE id IN (
  -- Deccan kitchen 4/11 250 EC: exact duplicate of 7fc3a872
  'c73d6474-48ea-44c4-8614-93675e3e44bd',
  -- Deccan kitchen 4/11 P 750ml: wrong qty (92 vs correct 94), same amount
  'd082e232-5b7c-4961-bbb6-747b7ba4de08',
  -- Golden Pavilion 4/11 AL 750ml: 48 cases @ ₹180 = ₹8,640 (correct entry is ₹8,064 @ ₹168)
  'bd40a557-d38d-4926-9b99-4ad3d4bb0e26',
  -- Tilaks kitchen 4/11 P 500ml: exact duplicate of bb99fbbf
  '05c239ad-0d33-4c1d-a6bb-b51c336a0d4f',
  -- House party 4/15 P 500ml: 67 cases @ ₹200 = ₹13,400 (correct entry is ₹12,060 @ ₹180)
  '2e3131f5-6c5a-492a-912e-7169e2cec1d0'
);

-- Fix 2: Golden Pavilion 4/2 AL 750ml — wrong price per case (₹180 → ₹168), qty unchanged.
UPDATE public.sales_transactions
SET amount = 5880.00
WHERE id = '193b4966-0289-4396-b1a0-1eb14bfcd004';

-- Fix 3: Element E7 4/9 P 1000ml — wrong qty (105 → 107) and amount (₹18,900 → ₹19,260).
UPDATE public.sales_transactions
SET quantity = 107,
    amount   = 19260.00
WHERE id = '585ca61e-a3ba-4b36-88d4-03417418eaaf';
