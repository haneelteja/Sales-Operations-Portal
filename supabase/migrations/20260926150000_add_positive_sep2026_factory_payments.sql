-- Ensure Sep 2026 factory payments exist as POSITIVE amounts (portal convention).
-- If the user already entered these through the portal UI they will already be positive
-- and these inserts will be skipped by the NOT EXISTS guards.

INSERT INTO public.factory_payables (transaction_date, transaction_type, amount, description)
SELECT '2026-09-02', 'payment', 75000.00, 'Bank Transfer'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-02' AND transaction_type = 'payment' AND amount = 75000.00
);

INSERT INTO public.factory_payables (transaction_date, transaction_type, amount, description)
SELECT '2026-09-07', 'payment', 150000.00, 'Bank Transfer'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-07' AND transaction_type = 'payment' AND amount = 150000.00
);

INSERT INTO public.factory_payables (transaction_date, transaction_type, amount, description)
SELECT '2026-09-11', 'payment', 50000.00, 'Bank Transfer'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-11' AND transaction_type = 'payment' AND amount = 50000.00
);

INSERT INTO public.factory_payables (transaction_date, transaction_type, amount, description)
SELECT '2026-09-23', 'payment', 75000.00, 'Bank Transfer'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-23' AND transaction_type = 'payment' AND amount = 75000.00
);

INSERT INTO public.factory_payables (transaction_date, transaction_type, amount, description)
SELECT '2026-09-26', 'payment', 50000.00, 'Bank Transfer'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-26' AND transaction_type = 'payment' AND amount = 50000.00
);
