-- Label Design - Laya: Sep 2026 design cost from Elma Clients sheet.

INSERT INTO public.misc_expenses (expense_date, category, amount, description)
SELECT '2026-09-30', 'Miscellaneous', 2000, 'Label Design - Laya'
WHERE NOT EXISTS (
  SELECT 1 FROM public.misc_expenses
  WHERE expense_date = '2026-09-30'
    AND category = 'Miscellaneous'
    AND description = 'Label Design - Laya'
);
