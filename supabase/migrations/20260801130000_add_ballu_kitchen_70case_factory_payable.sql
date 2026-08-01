-- After deleting the unreversed Jul 18 105-case factory payable for Ballu Kitchen,
-- we need to re-insert the correct 70-case payable (the actual qty delivered after MRP correction).
-- Rate: ₹12,382.65 / 105 = ₹117.93/case → 70 × ₹117.93 = ₹8,255.10

INSERT INTO public.factory_payables (transaction_date, sku, quantity, amount, transaction_type, customer_id, description)
SELECT
  '2026-07-31'::date,
  'P 1000 ml',
  70,
  8255.10,
  'production',
  c.id,
  'Corrected delivery — 70 cases after MRP mistake reversal (was 105 on Jul 18)'
FROM public.customers c
WHERE c.client_name ILIKE '%Ballu Kitchen%'
  AND c.branch ILIKE '%Kondapur%'
ORDER BY c.id
LIMIT 1;
