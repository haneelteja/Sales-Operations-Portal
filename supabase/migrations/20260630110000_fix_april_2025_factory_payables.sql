-- Fix April 2025 factory_payables discrepancies (reconciled against Elma ledger 2026-06-30).

-- Fix 1: Delete 4 extra/duplicate production rows not present in Elma.
DELETE FROM public.factory_payables
WHERE id IN (
  -- Golden Pavilion 4/11 AL 750ml "Shortfall from sale" — correct entry bd760cd2 already exists
  '951923cb-902d-4e28-8118-c9c66bf4b6a4',
  -- House party 4/15 P 500ml "Shortfall from sale" — correct entry 0c3e6e3a already exists
  '5fcd2c03-ec3e-4228-b9bd-c5bb09ab1a59',
  -- Deccan kitchen 4/11 250 EC at wrong amount ₹2,268 — correct entry 479f6596 at ₹3,122.28 exists
  'b2d5f809-e690-46a3-86d5-dac96a43c28d',
  -- Deccan kitchen 4/11 P 750ml 94 cases ₹8,290.80 — not in Elma for this date
  '692910d3-7632-4767-85c9-8bac208d33fe'
);

-- Fix 2: The English café 4/18 — wrong SKU (P 750ml → AL 750ml), qty (69 → 69.33), amount.
UPDATE public.factory_payables
SET sku      = 'AL 750 ml',
    quantity = 69,
    amount   = 6872.00,
    description = 'The English café'
WHERE id = '0a6d870b-692d-43a7-a210-fb69b07d2169';

-- Fix 3: Atias Kitchen 4/24 P 1000ml — wrong amount (₹2,594.46 → ₹2,508).
-- Correct rate: 22 cases × ₹114/case = ₹2,508.
UPDATE public.factory_payables
SET amount = 2508.00
WHERE id = '8eab0833-b050-4b63-a81c-d450e4816860';

-- Fix 4: Insert missing Golden Pavilion 4/2 AL 750ml 35 cases.
-- customer_id: 19a0035e-cee5-4d54-92c8-93184cda4fd3 (Golden Pavilion, Banjara Hills, AL 750ml)
INSERT INTO public.factory_payables
  (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT
  '19a0035e-cee5-4d54-92c8-93184cda4fd3',
  '2025-04-02',
  'production',
  'AL 750 ml',
  35,
  3469.20,
  'Golden Pavilion'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE customer_id      = '19a0035e-cee5-4d54-92c8-93184cda4fd3'
    AND transaction_date = '2025-04-02'
    AND transaction_type = 'production'
    AND sku              = 'AL 750 ml'
    AND quantity         = 35
);

-- Fix 5: Insert missing Element E7 4/9 P 1000ml 107 cases.
-- customer_id: 654230b8-1058-46bf-b571-19774cae82a3 (Element E7, Kukatpally, P 1000ml)
-- Rate: 107 × ₹114/case = ₹12,198. Elma records ₹12,197 (₹1 rounding).
INSERT INTO public.factory_payables
  (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT
  '654230b8-1058-46bf-b571-19774cae82a3',
  '2025-04-09',
  'production',
  'P 1000 ml',
  107,
  12197.00,
  'Element E7'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE customer_id      = '654230b8-1058-46bf-b571-19774cae82a3'
    AND transaction_date = '2025-04-09'
    AND transaction_type = 'production'
    AND sku              = 'P 1000 ml'
    AND quantity         = 107
);
