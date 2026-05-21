-- Diagnostic: read current price_per_bottle and tax values from factory_pricing.
-- No data changes — just RAISE NOTICE so we can confirm what the DB actually holds.

DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '%-12s | %-12s | %-10s | %-6s | %-10s',
    'pricing_date', 'sku', 'ppb', 'tax', 'cost/case';
  RAISE NOTICE '-------------------------------------------------------------';
  FOR r IN
    SELECT pricing_date, sku, price_per_bottle, tax, cost_per_case
    FROM public.factory_pricing
    ORDER BY sku, pricing_date
  LOOP
    RAISE NOTICE '% | %-12s | %-10s | %-6s | %',
      r.pricing_date, r.sku, r.price_per_bottle, r.tax, r.cost_per_case;
  END LOOP;
END $$;
