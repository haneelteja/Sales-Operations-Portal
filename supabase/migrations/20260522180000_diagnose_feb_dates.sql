-- February problem dates: individual transactions with pricing
SELECT
  fp.transaction_date::date   AS tx_date,
  fp.transaction_type,
  c.client_name,
  c.branch,
  fp.sku,
  fp.quantity,
  fp.amount,
  pr.pricing_date             AS pricing_period,
  pr.cost_per_case
FROM public.factory_payables fp
LEFT JOIN public.customers c ON c.id = fp.customer_id
LEFT JOIN LATERAL (
  SELECT pricing_date, cost_per_case
  FROM public.factory_pricing
  WHERE sku          = fp.sku
    AND pricing_date <= fp.transaction_date::date
  ORDER BY pricing_date DESC
  LIMIT 1
) pr ON fp.transaction_type = 'production'
WHERE fp.transaction_date::date IN (
  '2026-02-10', '2026-02-16', '2026-02-18', '2026-02-21'
)
ORDER BY fp.transaction_date::date, fp.transaction_type DESC, fp.sku;
