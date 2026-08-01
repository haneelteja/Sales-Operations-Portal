-- Label price history: per-SKU label price over time.
-- Label expense = cases × bottles_per_case × price_per_label (most recent on or before period end).
-- Replaces the per-client label_purchases approach for profitability calculations.

CREATE TABLE public.label_price_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku             TEXT NOT NULL,
  effective_from  DATE NOT NULL,
  price_per_label NUMERIC(10, 4) NOT NULL,   -- ex-GST per label
  gst_rate        NUMERIC(5, 2)  NOT NULL DEFAULT 18,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (sku, effective_from)
);

ALTER TABLE public.label_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage label price history"
  ON public.label_price_history FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Anon read label price history"
  ON public.label_price_history FOR SELECT TO anon
  USING (true);

-- Seed with known historical prices derived from migration comments.
-- P 500 ml: ₹0.90 early (GMG), ₹0.944 from Jul 2025 (Morya labels).
-- P 1000 ml: ₹1.00 (GMG), ₹1.416 from Jan 2026 (Morya labels).
-- P 250 ml: ₹0.826 early, ₹0.944 from Apr 2026.
-- P 750 ml, AL variants: estimated at ₹1.00.
-- EL SKUs: no front-label cost — excluded from this table.
INSERT INTO public.label_price_history (sku, effective_from, price_per_label, gst_rate, notes) VALUES
  ('P 500 ml',  '2024-01-01', 0.9000, 18, 'Historical GMG rate'),
  ('P 500 ml',  '2025-07-01', 0.9440, 18, 'Morya labels Jul 2025 batch'),
  ('P 1000 ml', '2024-01-01', 1.0000, 18, 'Historical GMG rate'),
  ('P 1000 ml', '2026-01-01', 1.4160, 18, 'Morya labels Jan 2026 batch'),
  ('P 750 ml',  '2024-01-01', 1.0000, 18, 'Historical rate'),
  ('P 250 ml',  '2024-01-01', 0.8260, 18, 'Historical Morya rate'),
  ('P 250 ml',  '2026-04-01', 0.9440, 18, 'Morya labels Apr 2026 batch'),
  ('AL 750 ml', '2024-01-01', 1.0000, 18, 'Historical rate'),
  ('AL 500 ml', '2024-01-01', 1.0000, 18, 'Historical rate'),
  ('250 EC',    '2024-01-01', 0.9440, 18, 'Historical rate');
