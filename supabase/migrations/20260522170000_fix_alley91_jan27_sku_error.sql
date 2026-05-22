-- Fix: Alley 91, Nanakramguda, 2026-01-27
-- Portal logged 30 cases as "P 250 ml" (113.40/case = 3402)
-- but it should be "250 EC" (108.00/case = 3240)
-- Evidence: reference spreadsheet shows this in "Elma Cust 250" column,
-- and every other Alley 91 250ml entry (1/7, 1/9) correctly uses 250 EC @ 108.

-- Find the correct customer_id for Alley 91, Nanakramguda, 250 EC
-- (used to update the customer_id reference as well)
DO $$
DECLARE
  v_alley91_250ec_id uuid;
  v_fp_id            uuid;
BEGIN
  -- Get the 250 EC customer config for Alley 91 Nanakramguda
  SELECT id INTO v_alley91_250ec_id
  FROM public.customers
  WHERE client_name = 'Alley 91'
    AND branch      = 'Nanakramguda'
    AND sku         = '250 EC'
  LIMIT 1;

  IF v_alley91_250ec_id IS NULL THEN
    RAISE EXCEPTION 'No customer config found for Alley 91 + Nanakramguda + 250 EC';
  END IF;

  -- Find the incorrect factory_payables row
  SELECT fp.id INTO v_fp_id
  FROM public.factory_payables fp
  JOIN public.customers c ON c.id = fp.customer_id
  WHERE fp.transaction_date::date = '2026-01-27'
    AND fp.transaction_type       = 'production'
    AND fp.sku                    = 'P 250 ml'
    AND fp.quantity               = 30
    AND c.client_name             = 'Alley 91'
    AND c.branch                  = 'Nanakramguda';

  IF v_fp_id IS NULL THEN
    RAISE EXCEPTION 'Target factory_payables row not found — already fixed or data changed';
  END IF;

  -- Fix: correct SKU, amount, and customer_id reference
  UPDATE public.factory_payables
  SET sku         = '250 EC',
      amount      = 3240.00,
      customer_id = v_alley91_250ec_id
  WHERE id = v_fp_id;

  RAISE NOTICE 'Fixed: row % updated from P 250 ml (3402) → 250 EC (3240)', v_fp_id;
END $$;

-- Verify
SELECT
  fp.transaction_date::date AS tx_date,
  c.client_name,
  c.branch,
  fp.sku,
  fp.quantity,
  fp.amount
FROM public.factory_payables fp
JOIN public.customers c ON c.id = fp.customer_id
WHERE fp.transaction_date::date = '2026-01-27'
  AND fp.transaction_type = 'production'
ORDER BY fp.sku;
