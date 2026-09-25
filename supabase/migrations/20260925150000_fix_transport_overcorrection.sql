-- Migration 20260925140000 set these three clients to Rs 600 based on the old
-- Elma file. The updated Elma file shows the correct values are higher.
-- Fix: update the surviving transport entry to the new correct amount.
--
-- Alley 91 (Nanakramguda): Rs 600 (500ml delivery) + Rs 1,250 (250ml delivery) = Rs 1,850
-- Iron hill cafe (Madhapur): Rs 1,200
-- Thatha Kottu Tiffins:     Rs 1,200

UPDATE transport_expenses
SET amount = 1850
WHERE client_id = (
        SELECT id FROM customers
        WHERE client_name ILIKE 'Alley 91'
        LIMIT 1
      )
  AND expense_date >= '2026-09-01'
  AND expense_date <= '2026-09-30';

UPDATE transport_expenses
SET amount = 1200
WHERE client_id = (
        SELECT id FROM customers
        WHERE client_name ILIKE 'Iron hill café'
          AND branch ILIKE '%Madhapur%'
        LIMIT 1
      )
  AND expense_date >= '2026-09-01'
  AND expense_date <= '2026-09-30';

UPDATE transport_expenses
SET amount = 1200
WHERE client_id = (
        SELECT id FROM customers
        WHERE client_name ILIKE 'Thatha Kottu%'
        LIMIT 1
      )
  AND expense_date >= '2026-09-01'
  AND expense_date <= '2026-09-30';
