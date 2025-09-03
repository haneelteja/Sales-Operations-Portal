-- Reset DB to a clean initial state (keep tables, reseed minimal master data)
BEGIN;

-- Clear transactional tables first
TRUNCATE TABLE public.sales_transactions RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.factory_payables RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.transport_expenses RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.adjustments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.label_purchases RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.label_design_costs RESTART IDENTITY CASCADE;

-- Clear master/reference data to reseed
TRUNCATE TABLE public.customers RESTART IDENTITY;
TRUNCATE TABLE public.label_vendors RESTART IDENTITY;
TRUNCATE TABLE public.sku_configurations RESTART IDENTITY;
TRUNCATE TABLE public.factory_pricing RESTART IDENTITY;

-- Seed SKU configurations (base costs)
INSERT INTO public.sku_configurations (sku, bottles_per_case, cost_per_bottle, cost_per_case)
VALUES 
  ('WATER-500ML', 24, 0.15, 24 * 0.15),
  ('WATER-1L',    12, 0.25, 12 * 0.25);

-- Seed factory pricing for the SKUs
INSERT INTO public.factory_pricing (pricing_date, sku, bottles_per_case, price_per_bottle, tax, cost_per_case)
VALUES 
  (CURRENT_DATE, 'WATER-500ML', 24, 0.15, 0.00, 24 * 0.15),
  (CURRENT_DATE, 'WATER-1L',    12, 0.25, 0.00, 12 * 0.25);

-- Seed a couple of customers linked to default SKUs
INSERT INTO public.customers (client_name, branch, sku, price_per_bottle, price_per_case)
VALUES
  ('Acme Retail', 'Downtown', 'WATER-500ML', 0.25, 24 * 0.25),
  ('Beta Stores', 'Uptown',   'WATER-1L',    0.40, 12 * 0.40);

-- Seed label vendors
INSERT INTO public.label_vendors (vendor_name, label_type, price_per_label)
VALUES
  ('Prime Labels Co.', 'Standard', 0.02),
  ('QuickPrint',       'Premium',  0.05);

COMMIT;