-- Miscellaneous / overhead expenses recorded per period in the Profitability tab.
-- Examples: GST filing, WhatsApp subscription, admin salary, label designing, etc.
-- These are allocated proportionally across clients by cases dispatched.

CREATE TABLE IF NOT EXISTS public.misc_expenses (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_date date   NOT NULL,
  category    text    NOT NULL,
  amount      numeric NOT NULL DEFAULT 0,
  description text,
  created_at  timestamp with time zone DEFAULT now(),
  updated_at  timestamp with time zone DEFAULT now()
);

ALTER TABLE public.misc_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage misc_expenses"
  ON public.misc_expenses FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_misc_expenses_updated_at
  BEFORE UPDATE ON public.misc_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
