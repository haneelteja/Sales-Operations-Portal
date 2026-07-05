-- Add back-label config entries for clients that started from July 2025.
-- Blossamin Spa: P 250ml, 45 cases × 30 × ₹0.26 = ₹351 (Jul 2025).
-- Mid land: AL 750ml, bottles override not needed (12/case × ₹0.26 gives correct amounts).
-- Alley 91: recorded under 250 EC SKU in DB but actual product is 500ml (20 bottles/case).
--   The Profitability.tsx BACK_LABEL_BOTTLES_OVERRIDE handles the 20-bottle override.

INSERT INTO public.customer_back_label_history (client_name, requires_back_label, effective_from) VALUES
  ('Blossamin Spa', true, '2025-07-01'),
  ('Mid land',      true, '2025-07-01'),
  ('Alley 91',      true, '2025-07-01');
