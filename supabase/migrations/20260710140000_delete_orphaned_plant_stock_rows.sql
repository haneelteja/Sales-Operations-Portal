-- Remove orphaned plant_stock rows that have no customer_id.
-- These were created by a buggy auto-deduction in FactoryPayables.tsx that
-- queried plant stock by SKU only (ignoring customer) and inserted with
-- customer_id = null. That code has been removed; per-customer reduction
-- is now handled exclusively by the trg_auto_reduce_plant_stock trigger.

DELETE FROM factory_payables
WHERE transaction_type = 'plant_stock'
  AND customer_id IS NULL;
