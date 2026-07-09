-- Sales Tracker: sales officers list + client mapping table
CREATE TABLE public.sales_officers (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.customer_sales_officer (
  client_name  TEXT        NOT NULL,
  branch       TEXT        NOT NULL DEFAULT '',
  officer_id   UUID        NOT NULL REFERENCES public.sales_officers(id) ON DELETE CASCADE,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (client_name, branch)
);

-- RLS
ALTER TABLE public.sales_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_sales_officer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_officers_select"  ON public.sales_officers FOR SELECT  USING (true);
CREATE POLICY "sales_officers_modify"  ON public.sales_officers FOR ALL     USING (true) WITH CHECK (true);
CREATE POLICY "cso_select"             ON public.customer_sales_officer FOR SELECT  USING (true);
CREATE POLICY "cso_modify"             ON public.customer_sales_officer FOR ALL     USING (true) WITH CHECK (true);
