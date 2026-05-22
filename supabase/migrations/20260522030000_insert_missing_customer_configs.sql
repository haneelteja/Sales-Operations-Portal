-- Insert 4 missing customer configuration rows identified by the diagnostic.
-- price_per_case is a generated column (price_per_bottle * bottles_per_case),
-- so we insert price_per_bottle and bottles_per_case instead.
-- Prices sourced from the customer price list dated 2025-04-01.

INSERT INTO public.customers (client_name, branch, sku, price_per_bottle, bottles_per_case, pricing_date, is_active)
VALUES
  ('Alley 91',       'Nanakramguda',        'P 250 ml',  5.50,  30, '2025-04-01', true),
  ('Alley 91',       'Nanakramguda',        'P 500 ml',  8.50,  20, '2025-04-01', true),
  ('Deccan kitchen', 'Film nagar',          '250 EC',    5.50,  35, '2025-04-01', true),
  ('jagan Pan House','Bhoodan Pochampally', 'P 1000 ml', 15.00, 12, '2025-04-01', true)
ON CONFLICT DO NOTHING;
