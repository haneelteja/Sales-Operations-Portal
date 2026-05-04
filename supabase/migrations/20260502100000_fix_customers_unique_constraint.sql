-- Drop old 3-column unique constraints that prevent price history
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_dealer_name_area_sku_key;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_client_branch_sku_unique;

-- Add new 4-column constraint: same SKU can have multiple rows on different dates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'customers_dealer_area_sku_date_key'
  ) THEN
    ALTER TABLE customers
      ADD CONSTRAINT customers_dealer_area_sku_date_key
      UNIQUE (dealer_name, area, sku, pricing_date);
  END IF;
END
$$;
