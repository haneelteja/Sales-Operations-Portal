-- Insert 6 missing 2025 factory production entries identified during Elma ledger reconciliation.
-- These batches appear in Elma's ledger but were not entered in the portal.
-- Amounts calculated using factory pricing at time of dispatch (P 1000 ml ₹113.99/case, AL 750 ml ₹99.12/case).

INSERT INTO factory_payables
  (transaction_date, transaction_type, sku, quantity, amount, description, customer_id)
VALUES
  -- Jun 26: 64 cases P 1000 ml missing from portal (Elma total 384, portal had 320)
  ('2025-06-26', 'production', 'P 1000 ml', 64,  7295.36, 'Elma ledger reconciliation Jun 2025', NULL),

  -- Jul 15: 80 cases AL 750 ml missing (Elma total 370, portal had 290)
  ('2025-07-15', 'production', 'AL 750 ml', 80,  7929.60, 'Elma ledger reconciliation Jul 2025', NULL),

  -- Jul 22: 130 cases AL 750 ml missing (Elma total 380, portal had 250)
  ('2025-07-22', 'production', 'AL 750 ml', 130, 12885.60, 'Elma ledger reconciliation Jul 2025', NULL),

  -- Aug 2: 210 cases AL 750 ml missing (Elma total 460, portal had 250)
  ('2025-08-02', 'production', 'AL 750 ml', 210, 20815.20, 'Elma ledger reconciliation Aug 2025', NULL),

  -- Aug 13: 300 cases AL 750 ml entire day missing from portal
  ('2025-08-13', 'production', 'AL 750 ml', 300, 29736.00, 'Elma ledger reconciliation Aug 2025', NULL),

  -- Aug 26: 295 cases AL 750 ml missing (Elma total 630, portal had 335)
  ('2025-08-26', 'production', 'AL 750 ml', 295, 29240.40, 'Elma ledger reconciliation Aug 2025', NULL);
