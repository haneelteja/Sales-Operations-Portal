ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stock_ready boolean NOT NULL DEFAULT false;
