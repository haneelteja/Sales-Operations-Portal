-- Add display_order column to sku_configurations so users can manually
-- arrange the SKU list order through the UI.

ALTER TABLE sku_configurations
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Seed initial order from current alphabetical order so existing data is tidy.
UPDATE sku_configurations
SET display_order = sub.rn
FROM (
  SELECT id, (ROW_NUMBER() OVER (ORDER BY sku) - 1) AS rn
  FROM sku_configurations
) sub
WHERE sku_configurations.id = sub.id;
