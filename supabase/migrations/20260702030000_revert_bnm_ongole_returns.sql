-- Revert two BnM Ongole return entries added in migration 20260702010000.
-- Elma (latest) shows ₹38,880 outstanding which does not include these returns.
-- Removing them brings portal back to match Elma.

DELETE FROM public.sales_transactions st
USING public.customers c
WHERE st.customer_id = c.id
  AND c.client_name ILIKE '%Biryanis%More%'
  AND c.branch ILIKE '%Ongole%'
  AND st.transaction_type = 'sale'
  AND st.sku = 'P 1000 ml'
  AND st.description = 'Return'
  AND st.transaction_date IN ('2025-05-18', '2025-07-27')
  AND st.quantity IN (-1, -5);
