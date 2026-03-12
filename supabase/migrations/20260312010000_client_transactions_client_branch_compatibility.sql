-- Add client_name/branch compatibility columns for client transactions
-- while preserving existing dealer_name/area application behavior.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customers'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'client_name'
    ) THEN
      ALTER TABLE public.customers ADD COLUMN client_name TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'branch'
    ) THEN
      ALTER TABLE public.customers ADD COLUMN branch TEXT;
    END IF;
  END IF;
END $$;

UPDATE public.customers
SET client_name = COALESCE(client_name, dealer_name),
    branch = COALESCE(branch, area)
WHERE client_name IS NULL
   OR branch IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'sales_transactions'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sales_transactions' AND column_name = 'branch'
    ) THEN
      ALTER TABLE public.sales_transactions ADD COLUMN branch TEXT;
    END IF;
  END IF;
END $$;

UPDATE public.sales_transactions
SET branch = COALESCE(branch, area)
WHERE branch IS NULL;

CREATE OR REPLACE FUNCTION public.sync_customer_client_branch_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.client_name := COALESCE(NEW.client_name, NEW.dealer_name);
  NEW.dealer_name := COALESCE(NEW.dealer_name, NEW.client_name);
  NEW.branch := COALESCE(NEW.branch, NEW.area);
  NEW.area := COALESCE(NEW.area, NEW.branch);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_customer_client_branch_columns ON public.customers;
CREATE TRIGGER trg_sync_customer_client_branch_columns
BEFORE INSERT OR UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.sync_customer_client_branch_columns();

CREATE OR REPLACE FUNCTION public.sync_sales_transaction_branch_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.branch := COALESCE(NEW.branch, NEW.area);
  NEW.area := COALESCE(NEW.area, NEW.branch);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_sales_transaction_branch_column ON public.sales_transactions;
CREATE TRIGGER trg_sync_sales_transaction_branch_column
BEFORE INSERT OR UPDATE ON public.sales_transactions
FOR EACH ROW
EXECUTE FUNCTION public.sync_sales_transaction_branch_column();
