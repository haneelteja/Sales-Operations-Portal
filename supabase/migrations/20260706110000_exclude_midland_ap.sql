-- Exclude Mid Land AP from profitability calculations.
-- These sales/payment/adjustment transactions are tracked in the factory tab only
-- and should not appear in client profitability.

DELETE FROM sales_transactions
WHERE id IN (
  'ec9cffca-cee7-4fde-b366-f55c9493ac59', -- Jul-22-2025 sale ₹22,620
  '9ec60fd7-fd8e-4eb3-9fd7-a84c60afa46a', -- Aug-13-2025 sale ₹52,200
  '0b79c950-2f0d-4fd9-b71a-947b06c73985', -- Dec-13-2025 payment ₹30,000
  '91ad1980-696f-408a-ac2e-97f33783c925', -- Dec-23-2025 payment ₹35,000
  '218369c4-5982-4229-9497-11a38045d20c'  -- Jan-31-2026 adjustment ₹15,000
);

DELETE FROM factory_payables
WHERE id IN (
  'c35e81b6-fbab-4c17-9f04-824d1b36c5ae', -- Jul-22-2025 shortfall 130 cases ₹12,886
  '611f867d-4a91-4911-8688-434ab011c1d7'  -- Aug-13-2025 shortfall 300 cases ₹29,736
);
