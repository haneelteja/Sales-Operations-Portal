-- Fix SSKL July 2026 label purchase incorrectly linked to Sri Sri Group Khammam.
-- In add_jul2026_labels, ILIKE '%Sri Sri%' matched Sri Sri Group (110fbce5) instead of SSKL.
-- Relink the 2026-07-01 P 500ml ₹3,847 record to the correct SSKL customer.
UPDATE public.label_purchases
SET client_id = (
  SELECT id FROM public.customers
  WHERE client_name = 'SSKL'
    AND branch = 'Kalamandir - Hyderabad'
  LIMIT 1
)
WHERE purchase_date = '2026-07-01'
  AND sku = 'P 500 ml'
  AND total_amount = 3847.00
  AND client_id = (
    SELECT id FROM public.customers
    WHERE client_name ILIKE '%Sri Sri%'
      AND client_name NOT ILIKE '%SSKL%'
    LIMIT 1
  );
