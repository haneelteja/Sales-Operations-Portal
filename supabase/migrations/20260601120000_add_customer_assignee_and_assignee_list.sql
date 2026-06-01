-- Create customer_assignee table for receivables management assignee tracking
CREATE TABLE IF NOT EXISTS public.customer_assignee (
  customer_id UUID PRIMARY KEY,
  assignee_name TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

ALTER TABLE public.customer_assignee ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_customer_assignee" ON public.customer_assignee;
CREATE POLICY "authenticated_all_customer_assignee" ON public.customer_assignee
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.customer_assignee TO authenticated;
GRANT ALL ON public.customer_assignee TO anon;

-- Add assignee_list to invoice_configurations
INSERT INTO public.invoice_configurations (config_key, config_value, config_type, description)
VALUES (
  'assignee_list',
  '[]',
  'string',
  'Assignee list — people who can be assigned to follow up with customers in Receivables Management'
)
ON CONFLICT (config_key) DO NOTHING;
