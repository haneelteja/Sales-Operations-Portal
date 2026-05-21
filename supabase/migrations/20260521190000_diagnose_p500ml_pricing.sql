-- Diagnose P 500 ml factory_pricing: show all stored columns + generated cost_per_case
SELECT
  id,
  sku,
  pricing_date,
  price_per_bottle,
  tax,
  bottles_per_case,
  cost_per_case,
  ROUND((price_per_bottle * (1 + COALESCE(tax, 0) / 100.0) * bottles_per_case)::numeric, 4) AS raw_cost_per_case,
  description
FROM public.factory_pricing
WHERE sku = 'P 500 ml'
ORDER BY pricing_date DESC;
