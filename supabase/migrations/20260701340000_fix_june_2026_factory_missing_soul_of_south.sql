-- Fix June 2026 factory_payables: missing Soul of South - Financial District 6/29 production.
-- 40 units P 500 ml × ₹124.70 = ₹4,988.00. Present in Elma, absent from DB.

INSERT INTO public.factory_payables (transaction_date, transaction_type, customer_id, sku, quantity, amount, description)
SELECT '2026-06-29', 'production', 'c66dbbc1-95da-46bf-a01e-4d5758901dcd', 'P 500 ml', 40, 4988.00, 'soul of south - Financial District'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-06-29'
    AND customer_id = 'c66dbbc1-95da-46bf-a01e-4d5758901dcd'
    AND transaction_type = 'production'
    AND quantity = 40
);
