-- Remove duplicate Jul 9 Benguluru Bhavan Transport entry (₹1,000) inserted by
-- 20260731130000. The user had already entered this as the row linked to the
-- Benguluru Bhavan client (description "Client Sale Transport", vendor "Local").
-- My migration inserted a second unlinked row with vendor "Porter".

DELETE FROM transport_expenses
WHERE description = 'Benguluru Bhavan Transport'
  AND amount = 1000.00
  AND transport_vendor = 'Porter'
  AND expense_group = 'Client Sale Transport';
