-- Commission configuration per client+SKU.
-- amount_per_case is paid to referrer_name for every case dispatched.
-- This affects profitability expenses only — invoices and outstanding are unchanged.

CREATE TABLE public.client_commissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  referrer_name   text NOT NULL,
  sku             text NOT NULL,
  amount_per_case numeric(10, 2) NOT NULL CHECK (amount_per_case >= 0),
  effective_from  date NOT NULL,
  effective_to    date,
  is_active       boolean NOT NULL DEFAULT true,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT effective_dates_check CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX idx_client_commissions_customer_id ON public.client_commissions (customer_id);
CREATE INDEX idx_client_commissions_active ON public.client_commissions (is_active, effective_from);

ALTER TABLE public.client_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON public.client_commissions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_client_commissions_updated_at
  BEFORE UPDATE ON public.client_commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
