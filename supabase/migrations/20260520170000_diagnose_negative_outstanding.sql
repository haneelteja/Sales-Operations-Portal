-- Diagnostic only (no data changes): show transaction breakdown for customers
-- with negative outstanding so we can identify the discrepancy.

DO $$
DECLARE
  r RECORD;
BEGIN

  FOR r IN
    WITH balances AS (
      SELECT
        c.id,
        c.client_name,
        c.branch,
        COALESCE(SUM(CASE WHEN st.transaction_type = 'sale'    THEN st.amount ELSE 0 END), 0) AS total_sales,
        COALESCE(SUM(CASE WHEN st.transaction_type = 'payment' THEN st.amount ELSE 0 END), 0) AS total_payments
      FROM public.customers c
      LEFT JOIN public.sales_transactions st ON st.customer_id = c.id
      WHERE c.client_name ILIKE ANY(ARRAY['%tawalogy%', '%tilak%', '%alley 91%'])
      GROUP BY c.id, c.client_name, c.branch
    )
    SELECT *, total_sales - total_payments AS outstanding
    FROM balances
    ORDER BY client_name, branch
  LOOP
    RAISE NOTICE '──────────────────────────────────────────────────────';
    RAISE NOTICE 'Customer  : % / %  (id: %)', r.client_name, r.branch, r.id;
    RAISE NOTICE 'Sales     : ₹%', r.total_sales;
    RAISE NOTICE 'Payments  : ₹%', r.total_payments;
    RAISE NOTICE 'Outstanding: ₹%', r.outstanding;
  END LOOP;

  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE 'Transaction detail per customer:';

  FOR r IN
    SELECT
      c.client_name,
      c.branch,
      st.transaction_date,
      st.transaction_type,
      st.amount,
      st.description,
      st.sku,
      st.quantity
    FROM public.customers c
    JOIN public.sales_transactions st ON st.customer_id = c.id
    WHERE c.client_name ILIKE ANY(ARRAY['%tawalogy%', '%tilak%', '%alley 91%'])
    ORDER BY c.client_name, c.branch, st.transaction_date
  LOOP
    RAISE NOTICE '[%] % | % | ₹% | qty:% | %',
      r.client_name, r.transaction_date, r.transaction_type,
      r.amount, r.quantity, COALESCE(r.description, '');
  END LOOP;

END $$;
