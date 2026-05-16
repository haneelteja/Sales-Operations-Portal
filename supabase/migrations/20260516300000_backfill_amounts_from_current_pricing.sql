-- One-time backfill: recalculate amounts from current pricing configurations.
-- After this runs, the triggers added in 20260516100000 and 20260516200000
-- will keep everything up to date automatically on every price change.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. sales_transactions: amount = quantity × customers.price_per_case
--    Applied per client+branch+SKU from that customer's pricing_date forward.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      COALESCE(c.client_name, c.dealer_name) AS client_name,
      COALESCE(c.branch, c.area)             AS branch,
      c.sku,
      c.price_per_case,
      c.pricing_date
    FROM customers c
    WHERE c.price_per_case IS NOT NULL
      AND c.sku             IS NOT NULL
      AND c.pricing_date    IS NOT NULL
  LOOP
    UPDATE sales_transactions st
    SET amount = st.quantity * r.price_per_case
    FROM customers c2
    WHERE st.customer_id = c2.id
      AND COALESCE(c2.client_name, c2.dealer_name) = r.client_name
      AND COALESCE(c2.branch, c2.area)             = r.branch
      AND st.sku               = r.sku
      AND st.transaction_type  = 'sale'
      AND st.quantity          IS NOT NULL
      AND st.transaction_date::date >= r.pricing_date;
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Recascade total_amount (outstanding) for every client+branch in
--    sales_transactions now that amounts have been corrected.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT
      COALESCE(c.client_name, c.dealer_name) AS client_name,
      COALESCE(c.branch, c.area)             AS branch
    FROM sales_transactions st
    JOIN customers c ON c.id = st.customer_id
    WHERE COALESCE(c.client_name, c.dealer_name) IS NOT NULL
      AND COALESCE(c.branch, c.area)             IS NOT NULL
  LOOP
    PERFORM recalculate_outstanding_for_client(r.client_name, r.branch);
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. factory_payables: amount = quantity × factory_pricing.price_per_case
--    Uses the most recent factory_pricing row whose pricing_date ≤ the
--    transaction date (i.e. the price that was in effect at the time).
--    Only touches production-type rows with a quantity.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE factory_payables fp
SET amount = fp.quantity * (
  SELECT fp2.price_per_case
  FROM factory_pricing fp2
  WHERE fp2.sku            = fp.sku
    AND fp2.price_per_case IS NOT NULL
    AND fp2.pricing_date  <= fp.transaction_date::date
  ORDER BY fp2.pricing_date DESC
  LIMIT 1
)
WHERE fp.transaction_type = 'production'
  AND fp.quantity          IS NOT NULL
  AND fp.sku               IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM factory_pricing fp2
    WHERE fp2.sku           = fp.sku
      AND fp2.price_per_case IS NOT NULL
      AND fp2.pricing_date  <= fp.transaction_date::date
  );
