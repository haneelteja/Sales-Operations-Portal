-- Reconcile Gismat-Kondapur portal vs Elma ledger. Five changes:
-- 1. Remove erroneous 10/27/2025 factory entry (10 P 500ml / ₹1,092) — not in Elma.
-- 2. Remove erroneous 10/27/2025 client sale (10 P 500ml / ₹1,700) — not in Elma.
-- 3. Remove erroneous 6/14/2025 client payment (₹3,320) — duplicate of the negative sale credit.
-- 4. Remove erroneous 1/6/2026 client payment (₹1,700) — not in Elma.
-- 5. Insert missing 6/14/2025 client sale (+20 P 500ml / ₹0) — present in Elma, absent from portal.
-- Net effect: inventory → 0, client outstanding → +₹3,320 (matches Elma ₹33,400 excl. today's dispatch).

-- 1. Remove 10/27 factory entry
DELETE FROM public.factory_payables fp
USING public.customers c
WHERE fp.customer_id = c.id
  AND c.client_name ILIKE '%ismat%' AND c.branch ILIKE '%kondapur%'
  AND fp.transaction_type = 'production'
  AND fp.transaction_date = '2025-10-27'
  AND fp.sku = 'P 500 ml'
  AND fp.quantity = 10;

-- 2. Remove 10/27 client sale
DELETE FROM public.sales_transactions st
USING public.customers c
WHERE st.customer_id = c.id
  AND c.client_name ILIKE '%ismat%' AND c.branch ILIKE '%kondapur%'
  AND st.transaction_type = 'sale'
  AND st.transaction_date = '2025-10-27'
  AND st.sku = 'P 500 ml'
  AND st.quantity = 10;

-- 3. Remove erroneous 6/14 payment
DELETE FROM public.sales_transactions st
USING public.customers c
WHERE st.customer_id = c.id
  AND c.client_name ILIKE '%ismat%' AND c.branch ILIKE '%kondapur%'
  AND st.transaction_type = 'payment'
  AND st.transaction_date = '2025-06-14'
  AND st.amount = 3320.00;

-- 4. Remove erroneous 1/6/2026 payment
DELETE FROM public.sales_transactions st
USING public.customers c
WHERE st.customer_id = c.id
  AND c.client_name ILIKE '%ismat%' AND c.branch ILIKE '%kondapur%'
  AND st.transaction_type = 'payment'
  AND st.transaction_date = '2026-01-06'
  AND st.amount = 1700.00;

-- 5. Insert missing 6/14 client sale (+20 P 500ml at ₹0)
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE '%ismat%' AND branch ILIKE '%kondapur%' LIMIT 1),
  '2025-06-14', 'sale', 'P 500 ml', 20, 0.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions st
  JOIN public.customers c ON st.customer_id = c.id
  WHERE c.client_name ILIKE '%ismat%' AND c.branch ILIKE '%kondapur%'
    AND st.transaction_type = 'sale'
    AND st.transaction_date = '2025-06-14'
    AND st.sku = 'P 500 ml'
    AND st.quantity = 20
    AND st.amount = 0
);
