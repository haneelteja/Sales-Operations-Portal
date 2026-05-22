-- Factory payables summary: total production cost, payments, and outstanding
SELECT
  ROUND(SUM(CASE WHEN transaction_type = 'production' THEN amount ELSE 0 END)::numeric, 2) AS total_production_cost,
  ROUND(SUM(CASE WHEN transaction_type = 'payment'    THEN amount ELSE 0 END)::numeric, 2) AS total_payments,
  ROUND(SUM(CASE WHEN transaction_type = 'production' THEN  amount
                 WHEN transaction_type = 'payment'    THEN -amount
                 ELSE 0 END)::numeric, 2)                                                   AS outstanding
FROM public.factory_payables;
