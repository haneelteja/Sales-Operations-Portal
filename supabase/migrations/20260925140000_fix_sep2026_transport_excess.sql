-- Three clients have excess transport recorded in Sep 2026.
-- Elma-correct amounts: Alley 91 ₹600, Iron hill Madhapur ₹600, Thatha Kottu ₹600.
--
-- Strategy per client:
--   1. Delete all Sep 2026 transport entries except the oldest (by created_at).
--   2. Update the surviving entry to the correct amount.

-- ── Alley 91 (Nanakramguda) — portal ₹2,350 → correct ₹600 ──────────────────

WITH ranked_alley AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM transport_expenses
  WHERE client_id = (
          SELECT id FROM customers
          WHERE client_name ILIKE 'Alley 91'
          LIMIT 1
        )
    AND expense_date >= '2026-09-01'
    AND expense_date <= '2026-09-30'
)
DELETE FROM transport_expenses
WHERE id IN (SELECT id FROM ranked_alley WHERE rn > 1);

UPDATE transport_expenses
SET amount = 600
WHERE client_id = (
        SELECT id FROM customers
        WHERE client_name ILIKE 'Alley 91'
        LIMIT 1
      )
  AND expense_date >= '2026-09-01'
  AND expense_date <= '2026-09-30'
  AND amount <> 600;

-- ── Iron hill café (Madhapur) — portal ₹1,200 → correct ₹600 ────────────────

WITH ranked_iron AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM transport_expenses
  WHERE client_id = (
          SELECT id FROM customers
          WHERE client_name ILIKE 'Iron hill café'
            AND branch ILIKE '%Madhapur%'
          LIMIT 1
        )
    AND expense_date >= '2026-09-01'
    AND expense_date <= '2026-09-30'
)
DELETE FROM transport_expenses
WHERE id IN (SELECT id FROM ranked_iron WHERE rn > 1);

UPDATE transport_expenses
SET amount = 600
WHERE client_id = (
        SELECT id FROM customers
        WHERE client_name ILIKE 'Iron hill café'
          AND branch ILIKE '%Madhapur%'
        LIMIT 1
      )
  AND expense_date >= '2026-09-01'
  AND expense_date <= '2026-09-30'
  AND amount <> 600;

-- ── Thatha Kottu Tiffins — portal ₹1,200 → correct ₹600 ────────────────────

WITH ranked_thatha AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM transport_expenses
  WHERE client_id = (
          SELECT id FROM customers
          WHERE client_name ILIKE 'Thatha Kottu%'
          LIMIT 1
        )
    AND expense_date >= '2026-09-01'
    AND expense_date <= '2026-09-30'
)
DELETE FROM transport_expenses
WHERE id IN (SELECT id FROM ranked_thatha WHERE rn > 1);

UPDATE transport_expenses
SET amount = 600
WHERE client_id = (
        SELECT id FROM customers
        WHERE client_name ILIKE 'Thatha Kottu%'
        LIMIT 1
      )
  AND expense_date >= '2026-09-01'
  AND expense_date <= '2026-09-30'
  AND amount <> 600;
