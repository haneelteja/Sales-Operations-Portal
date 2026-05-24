-- Global back label stock purchases (not per-client or per-SKU)
CREATE TABLE IF NOT EXISTS public.back_label_purchases (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_date  date        NOT NULL,
  quantity       integer     NOT NULL CHECK (quantity > 0),
  cost_per_label numeric(10,4) NOT NULL CHECK (cost_per_label >= 0),
  total_amount   numeric(12,4) NOT NULL CHECK (total_amount >= 0),
  vendor_id      text,
  description    text,
  created_at     timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.back_label_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_back_label_purchases"
  ON public.back_label_purchases
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Time-bounded client back label configuration
-- Each row is an event: "client X had back_label = Y starting from effective_from"
-- To find the status on a given date: find the row with MAX(effective_from) <= that date
CREATE TABLE IF NOT EXISTS public.customer_back_label_history (
  id                  uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name         text    NOT NULL,
  requires_back_label boolean NOT NULL,
  effective_from      date    NOT NULL,
  created_at          timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.customer_back_label_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_back_label_history"
  ON public.customer_back_label_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_back_label_history_client_date
  ON public.customer_back_label_history (client_name, effective_from DESC);
