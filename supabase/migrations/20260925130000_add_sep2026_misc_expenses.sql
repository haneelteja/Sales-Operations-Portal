-- Sep 2026 misc / overhead expenses from Elma Clients sheet.
-- All dated 2026-09-30 (month-end) as specific dates were not recorded.

INSERT INTO public.misc_expenses (expense_date, category, amount, description)
SELECT '2026-09-30', 'Admin Salary', 13000, 'Admin - Salary'
WHERE NOT EXISTS (
  SELECT 1 FROM public.misc_expenses
  WHERE expense_date = '2026-09-30' AND category = 'Admin Salary' AND amount = 13000
);

INSERT INTO public.misc_expenses (expense_date, category, amount, description)
SELECT '2026-09-30', 'Miscellaneous', 500, 'Admin phone bill'
WHERE NOT EXISTS (
  SELECT 1 FROM public.misc_expenses
  WHERE expense_date = '2026-09-30' AND category = 'Miscellaneous' AND description = 'Admin phone bill'
);

INSERT INTO public.misc_expenses (expense_date, category, amount, description)
SELECT '2026-09-30', 'Miscellaneous', 1000, 'Our phone bill'
WHERE NOT EXISTS (
  SELECT 1 FROM public.misc_expenses
  WHERE expense_date = '2026-09-30' AND category = 'Miscellaneous' AND description = 'Our phone bill'
);

INSERT INTO public.misc_expenses (expense_date, category, amount, description)
SELECT '2026-09-30', 'Factory Overhead', 5000, 'Aahar Expenses'
WHERE NOT EXISTS (
  SELECT 1 FROM public.misc_expenses
  WHERE expense_date = '2026-09-30' AND category = 'Factory Overhead' AND description = 'Aahar Expenses'
);

INSERT INTO public.misc_expenses (expense_date, category, amount, description)
SELECT '2026-09-30', 'WhatsApp Subscription', 1400, 'WhatsApp & Microsoft subscription'
WHERE NOT EXISTS (
  SELECT 1 FROM public.misc_expenses
  WHERE expense_date = '2026-09-30' AND category = 'WhatsApp Subscription' AND description = 'WhatsApp & Microsoft subscription'
);

INSERT INTO public.misc_expenses (expense_date, category, amount, description)
SELECT '2026-09-30', 'GST Filing', 1000, 'GST filing - Haneel'
WHERE NOT EXISTS (
  SELECT 1 FROM public.misc_expenses
  WHERE expense_date = '2026-09-30' AND category = 'GST Filing' AND description = 'GST filing - Haneel'
);
