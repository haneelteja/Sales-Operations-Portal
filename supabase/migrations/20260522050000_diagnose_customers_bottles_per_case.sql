-- Find bottles_per_case and price_per_bottle used for these SKUs in existing customer rows
SELECT DISTINCT
  sku,
  bottles_per_case,
  price_per_bottle,
  price_per_case
FROM public.customers
WHERE sku IN ('P 250 ml', 'P 500 ml', '250 EC', 'P 1000 ml')
  AND is_active = true
ORDER BY sku;
