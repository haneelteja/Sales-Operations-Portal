-- All factory_pricing rows ordered by SKU then date
SELECT
  sku,
  pricing_date,
  price_per_bottle,
  bottles_per_case,
  cost_per_case
FROM public.factory_pricing
ORDER BY sku, pricing_date;
