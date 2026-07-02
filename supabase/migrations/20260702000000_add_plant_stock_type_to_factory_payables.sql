-- Add 'plant_stock' as a valid transaction_type in factory_payables.
-- plant_stock entries: amount=0, quantity=fresh count at plant, used for stock tracking only.

ALTER TABLE public.factory_payables
  DROP CONSTRAINT IF EXISTS factory_payables_transaction_type_check;

ALTER TABLE public.factory_payables
  ADD CONSTRAINT factory_payables_transaction_type_check
  CHECK (transaction_type = ANY (ARRAY['production'::text, 'payment'::text, 'plant_stock'::text]));
