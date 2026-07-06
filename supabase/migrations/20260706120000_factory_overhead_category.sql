-- Re-categorize ABS Stock misc_expense entries to 'Factory Overhead'.
-- These entries represent stock purchased for factory use and should be
-- bundled into factory cost rather than shown as standalone misc expenses.

UPDATE misc_expenses
SET category = 'Factory Overhead'
WHERE id IN (
  '0a6c7061-c60d-4151-8023-e164e30e0b15', -- Sep-25 ABS Stock ₹13,000
  '129c90dc-c758-447b-87ad-d014736ab5a9'  -- Oct-25 ABS Stock ₹20,000
);
