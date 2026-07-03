-- Remove erroneous 9/12/2025 factory entry for Chaitanya's Modern Kitchen:
-- 50 cases P 500 ml / ₹6,136 was recorded but no such dispatch exists in the
-- Elma factory ledger. With it removed, factory net matches client net exactly.
-- (This row was already deleted manually; this migration is the audit record.)

DELETE FROM public.factory_payables fp
USING public.customers c
WHERE fp.customer_id = c.id
  AND c.client_name ILIKE '%chaitanya%'
  AND fp.transaction_type = 'production'
  AND fp.transaction_date = '2025-09-12'
  AND fp.sku = 'P 500 ml'
  AND fp.quantity = 50;
