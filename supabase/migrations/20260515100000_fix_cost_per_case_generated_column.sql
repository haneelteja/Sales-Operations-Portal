-- Rebuild cost_per_case as a generated column that includes GST
-- Formula: price_per_bottle * (1 + COALESCE(tax, 0) / 100) * bottles_per_case
ALTER TABLE factory_pricing DROP COLUMN cost_per_case;
ALTER TABLE factory_pricing
  ADD COLUMN cost_per_case numeric
    GENERATED ALWAYS AS (
      price_per_bottle * (1 + COALESCE(tax, 0) / 100.0) * bottles_per_case
    ) STORED;
