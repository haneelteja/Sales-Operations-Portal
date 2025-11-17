-- Clear data from all public tables except profiles using CASCADE
BEGIN;

-- Clear tables with foreign key constraints first
TRUNCATE TABLE public.sales_transactions RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.label_purchases RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.label_design_costs RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.transport_expenses RESTART IDENTITY CASCADE;

-- Clear remaining tables
TRUNCATE TABLE public.customers RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.adjustments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.factory_payables RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.factory_pricing RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.label_vendors RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.sku_configurations RESTART IDENTITY CASCADE;

COMMIT;