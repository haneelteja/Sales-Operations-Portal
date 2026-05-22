-- Diagnose duplicate B&M Nizampet 3/12 P 1000 ml rows
SELECT
  fp.id,
  fp.transaction_date::date,
  c.client_name,
  c.branch,
  fp.sku,
  fp.quantity,
  fp.amount,
  fp.created_at
FROM public.factory_payables fp
JOIN public.customers c ON c.id = fp.customer_id
WHERE fp.transaction_date::date = '2026-03-12'
  AND fp.transaction_type       = 'production'
  AND fp.sku                    = 'P 1000 ml'
  AND c.client_name             = 'Biryanis and More'
  AND c.branch                  = 'Nizampet'
ORDER BY fp.created_at;

-- Delete the stale duplicate (amount = 4816, i.e. old 120.40 price)
-- Keeps the correctly updated row (amount = 4817.20)
DELETE FROM public.factory_payables
WHERE id = (
  SELECT fp.id
  FROM public.factory_payables fp
  JOIN public.customers c ON c.id = fp.customer_id
  WHERE fp.transaction_date::date = '2026-03-12'
    AND fp.transaction_type       = 'production'
    AND fp.sku                    = 'P 1000 ml'
    AND fp.quantity               = 40
    AND c.client_name             = 'Biryanis and More'
    AND c.branch                  = 'Nizampet'
  ORDER BY fp.amount ASC  -- picks the lower (wrong) amount first
  LIMIT 1
);

-- Verify: should now show exactly 1 row at 4817.20
SELECT
  fp.transaction_date::date,
  c.client_name,
  c.branch,
  fp.sku,
  fp.quantity,
  fp.amount
FROM public.factory_payables fp
JOIN public.customers c ON c.id = fp.customer_id
WHERE fp.transaction_date::date = '2026-03-12'
  AND fp.transaction_type       = 'production'
  AND fp.sku                    = 'P 1000 ml'
  AND c.client_name             = 'Biryanis and More'
  AND c.branch                  = 'Nizampet';
