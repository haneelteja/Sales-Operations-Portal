-- Factory payables breakdown: count, total amount, date range by transaction type and SKU
SELECT
  transaction_type,
  sku,
  COUNT(*)                                                          AS tx_count,
  MIN(transaction_date::date)                                       AS earliest_date,
  MAX(transaction_date::date)                                       AS latest_date,
  ROUND(SUM(amount)::numeric, 2)                                    AS total_amount
FROM public.factory_payables
GROUP BY transaction_type, sku
ORDER BY transaction_type, sku;
