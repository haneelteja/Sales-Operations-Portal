-- Drop the old 3-column unique constraint that prevents price history
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_dealer_name_area_sku_key;

-- Add new 4-column constraint: same SKU can have multiple rows on different dates
ALTER TABLE customers
  ADD CONSTRAINT customers_dealer_area_sku_date_key
  UNIQUE (dealer_name, area, sku, pricing_date);
