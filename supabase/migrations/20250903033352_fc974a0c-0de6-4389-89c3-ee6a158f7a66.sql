-- Reset DB with a single CASCADE truncate across all related tables, then reseed
BEGIN;

TRUNCATE TABLE 
  public.sales_transactions,
  public.factory_payables,
  public.transport_expenses,
  public.adjustments,
  public.label_purchases,
  public.label_design_costs,
  public.customers,
  public.label_vendors,
  public.sku_configurations,
  public.factory_pricing
RESTART IDENTITY CASCADE;

-- Seed SKU configurations
INSERT INTO public.sku_configurations (sku, bottles_per_case, cost_per_bottle, cost_per_case)
VALUES 
  ('WATER-500ML', 24, 0.15, 24 * 0.15),
  ('WATER-1L',    12, 0.25, 12 * 0.25);

-- Seed factory pricing
INSERT INTO public.factory_pricing (pricing_date, sku, bottles_per_case, price_per_bottle, tax, cost_per_case)
VALUES 
  (CURRENT_DATE, 'WATER-500ML', 24, 0.15, 0.00, 24 * 0.15),
  (CURRENT_DATE, 'WATER-1L',    12, 0.25, 0.00, 12 * 0.25);

-- Seed customers
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