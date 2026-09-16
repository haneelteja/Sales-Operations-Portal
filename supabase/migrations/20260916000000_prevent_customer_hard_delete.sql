-- A customer row that has linked sales_transactions must never be hard-deleted.
-- Deleting it orphans those transactions: the customer_id in sales_transactions
-- becomes a dangling reference, breaking credit-limit, risk, and outstanding
-- calculations across the entire system.
-- Rule: set is_active = false to stop a SKU; set is_deprecated = true to retire
-- the client relationship. Never DELETE a row that has transaction history.

CREATE OR REPLACE FUNCTION public.prevent_customer_hard_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.sales_transactions
        WHERE customer_id = OLD.id
        LIMIT 1
    ) THEN
        RAISE EXCEPTION
            'Cannot delete customer % (client=%, branch=%, sku=%) — linked sales_transactions exist. Use is_active = false to deactivate instead.',
            OLD.id, OLD.client_name, OLD.branch, OLD.sku;
    END IF;
    RETURN OLD;
END;
$$;

CREATE TRIGGER trg_prevent_customer_hard_delete
BEFORE DELETE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.prevent_customer_hard_delete();
