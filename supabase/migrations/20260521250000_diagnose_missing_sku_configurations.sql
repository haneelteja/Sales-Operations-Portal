-- Diagnostic: find (client, branch, SKU) combinations that exist in transactions
-- but are MISSING a corresponding row in the customers configuration table.
-- Sources checked: sales_transactions, factory_payables (production), label_purchases.

SELECT source, client_name, branch, sku, transaction_count
FROM (

  -- 1. CLIENT TRANSACTIONS
  SELECT
    'sales_transactions'  AS source,
    c.client_name,
    c.branch,
    st.sku,
    COUNT(*)              AS transaction_count
  FROM public.sales_transactions st
  JOIN public.customers c ON c.id = st.customer_id
  WHERE st.transaction_type = 'sale'
    AND st.sku IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.customers cfg
      WHERE cfg.client_name = c.client_name
        AND cfg.branch       = c.branch
        AND cfg.sku          = st.sku
    )
  GROUP BY c.client_name, c.branch, st.sku

  UNION ALL

  -- 2. FACTORY TRANSACTIONS (production rows only)
  SELECT
    'factory_payables'    AS source,
    c.client_name,
    c.branch,
    fp.sku,
    COUNT(*)              AS transaction_count
  FROM public.factory_payables fp
  JOIN public.customers c ON c.id = fp.customer_id
  WHERE fp.transaction_type = 'production'
    AND fp.sku IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.customers cfg
      WHERE cfg.client_name = c.client_name
        AND cfg.branch       = c.branch
        AND cfg.sku          = fp.sku
    )
  GROUP BY c.client_name, c.branch, fp.sku

  UNION ALL

  -- 3. LABEL PURCHASES (free-text client field, matched by ILIKE)
  SELECT
    'label_purchases'     AS source,
    lp.client             AS client_name,
    ''                    AS branch,
    lp.sku,
    COUNT(*)              AS transaction_count
  FROM public.label_purchases lp
  WHERE lp.sku IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.customers cfg
      WHERE cfg.client_name ILIKE lp.client
        AND cfg.sku = lp.sku
    )
  GROUP BY lp.client, lp.sku

) combined
ORDER BY source, client_name, branch, sku;
