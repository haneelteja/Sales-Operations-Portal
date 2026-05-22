-- Find all customer configs for Biryanis and More
SELECT id, client_name, branch, sku, price_per_case
FROM public.customers
WHERE client_name ILIKE '%biryan%'
ORDER BY branch, sku;
