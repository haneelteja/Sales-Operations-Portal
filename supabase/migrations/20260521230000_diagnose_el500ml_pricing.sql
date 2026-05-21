-- Diagnose EL 500 ml factory_pricing records
SELECT
  id,
  sku,
  pricing_date,
  price_per_bottle,
  tax,
  bottles_per_case,
  cost_per_case
FROM public.factory_pricing
WHERE sku = 'EL 500 ml'
ORDER BY pricing_date DESC;
