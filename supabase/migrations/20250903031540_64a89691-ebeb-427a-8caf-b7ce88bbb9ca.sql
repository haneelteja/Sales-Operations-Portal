-- Clear data from all public tables except profiles
BEGIN;

TRUNCATE TABLE public.adjustments RESTART IDENTITY;
TRUNCATE TABLE public.customers RESTART IDENTITY;
TRUNCATE TABLE public.factory_payables RESTART IDENTITY;
TRUNCATE TABLE public.factory_pricing RESTART IDENTITY;
TRUNCATE TABLE public.label_design_costs RESTART IDENTITY;
TRUNCATE TABLE public.label_purchases RESTART IDENTITY;
TRUNCATE TABLE public.label_vendors RESTART IDENTITY;
TRUNCATE TABLE public.sales_transactions RESTART IDENTITY;
TRUNCATE TABLE public.sku_configurations RESTART IDENTITY;
TRUNCATE TABLE public.transport_expenses RESTART IDENTITY;

COMMIT;