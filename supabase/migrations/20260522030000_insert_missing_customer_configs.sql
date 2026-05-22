-- Insert 4 missing customer configuration rows identified by the diagnostic.
-- Prices sourced from the customer price list dated 2025-04-01.

INSERT INTO public.customers (client_name, branch, sku, price_per_case, pricing_date, is_active)
VALUES
  ('Alley 91',       'Nanakramguda',        'P 250 ml',  165.00, '2025-04-01', true),
  ('Alley 91',       'Nanakramguda',        'P 500 ml',  170.00, '2025-04-01', true),
  ('Deccan kitchen', 'Film nagar',          '250 EC',    192.50, '2025-04-01', true),
  ('jagan Pan House','Bhoodan Pochampally', 'P 1000 ml', 180.00, '2025-04-01', true)
ON CONFLICT DO NOTHING;
