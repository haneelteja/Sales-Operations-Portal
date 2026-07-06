-- Fix Jun 2026 transport: insert missing Gismat-Chandha Nagar ₹650 on 2026-06-22.
-- All other Jun 2026 rows match Elma. DB total was ₹73,130; Elma shows ₹73,780.

INSERT INTO public.transport_expenses
  (expense_date, description, client_id, branch, amount, expense_group, transport_vendor)
VALUES
  ('2026-06-22', 'Gismat-Chandha Nagar Transport', '54bf3b3d-63c5-494d-b992-d4976fc026fb', 'Chandha Nagar', 650, 'Client Sale Transport', 'Local');
