-- Fix July 2026 transport expense gaps (₹2,280 total).
-- 4 issues found vs Excel ledger:
-- 1. 7/9  Benguluru Bhavan ₹1,000 — missing entirely
-- 2. 7/24 Illuzion El-250ml entered as ₹0, should be ₹600
-- 3. 7/30 Morya Labels ₹330 — missing
-- 4. 7/30 Labels Transport ₹350 — missing

-- Fix 1: Insert missing Benguluru Bhavan on Jul 9
INSERT INTO transport_expenses (expense_date, description, expense_group, transport_vendor, amount)
VALUES ('2026-07-09', 'Benguluru Bhavan Transport', 'Client Sale Transport', 'Porter', 1000.00);

-- Fix 2: Correct Illuzion ₹0 → ₹600 on Jul 24
UPDATE transport_expenses
SET amount = 600.00,
    description = 'Illuzion El 250ml Transport',
    updated_at = NOW()
WHERE expense_date::date = '2026-07-24'
  AND amount = 0
  AND description ILIKE '%illuzion%';

-- Fix 3 & 4: Insert missing Jul 30 label transports
INSERT INTO transport_expenses (expense_date, description, expense_group, transport_vendor, amount)
VALUES
  ('2026-07-30', 'Morya Labels Transport', 'labels', 'Porter', 330.00),
  ('2026-07-30', 'Labels Transport', 'labels', 'Porter', 350.00);
