-- Insert missing Tilaks kitchen 12/13/2025 factory production entry (₹5,460, 50 cases P 500 ml).
-- This entry exists in Elma ledger but was absent from factory_payables, causing the ₹5,460 gap.

INSERT INTO public.factory_payables (transaction_date, transaction_type, customer_id, sku, quantity, amount, description)
SELECT '2025-12-13', 'production', 'd2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6', 'P 500 ml', 50, 5460.00, 'Tilaks kitchen'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2025-12-13'
    AND customer_id = 'd2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6'
    AND amount = 5460.00
    AND transaction_type = 'production'
);
