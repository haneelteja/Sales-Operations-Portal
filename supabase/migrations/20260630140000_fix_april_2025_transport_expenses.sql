-- Fix April 2025 transport_expenses discrepancies vs Elma ledger (2026-06-30).

-- Fix 1: Delete 5 zero-amount auto-generated entries not in Elma.
-- Safety guard: only delete if amount is still 0.
DELETE FROM public.transport_expenses
WHERE id IN (
  '36b3bb5f-0d55-4e0c-b85f-54c7a89174ba', -- Deccan kitchen-Film nagar ₹0 (duplicate 1)
  '0766a374-b469-4074-9812-aadbe6bdeab1', -- Deccan kitchen-Film nagar ₹0 (duplicate 2)
  'ba579435-0399-45cd-be13-916749438e30', -- Golden Pavilion-Banjara Hills ₹0
  '4fd64c57-8154-4cb8-aacb-024fb3651be7', -- Tilaks kitchen-Madhapur ₹0
  'f0045136-6acc-4a01-bc7a-e21dd9981736'  -- House party-Sanikpuri ₹0
)
AND amount = 0;

-- Fix 2: Insert missing Golden Pavilion 4/2 Transport ₹650.
-- client_id: 19a0035e-cee5-4d54-92c8-93184cda4fd3 (Golden Pavilion, Banjara Hills)
INSERT INTO public.transport_expenses
  (client_id, expense_date, description, amount, expense_group, transport_vendor)
SELECT
  '19a0035e-cee5-4d54-92c8-93184cda4fd3',
  '2025-04-02',
  'Golden Pavilion Transport',
  650.00,
  'General',
  'Porter'
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE client_id    = '19a0035e-cee5-4d54-92c8-93184cda4fd3'
    AND expense_date = '2025-04-02'
    AND amount       = 650.00
);
