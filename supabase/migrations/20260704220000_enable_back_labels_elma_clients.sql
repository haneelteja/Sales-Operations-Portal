-- Enable back labels for all clients that appear in the Elma sheet with back label costs.
-- Clients already configured: Element E7, Golden Pavilion (from Apr-2025), Tonique (from Jan-2025).
-- New entries from May 2025 (all clients with back labels in May/Jun Elma data):

INSERT INTO public.customer_back_label_history (client_name, requires_back_label, effective_from)
VALUES
  -- May 2025 onwards
  ('Jismat',            true, '2025-05-01'),
  ('Gismat',            true, '2025-05-01'),
  ('Biryanis and More', true, '2025-05-01'),
  ('Tilaks kitchen',    true, '2025-05-01'),
  ('Deccan kitchen',    true, '2025-05-01'),
  ('this is it café',   true, '2025-05-01'),
  ('House Party',       true, '2025-05-01'),
  ('Aaha',              true, '2025-05-01'),
  ('Good Vibes',        true, '2025-05-01'),
  ('Atias Kitchen',     true, '2025-05-01'),
  ('Fusion Aroma',      true, '2025-05-01'),
  -- June 2025 onwards (first appeared in Jun Elma data)
  ('Tara South Indian', true, '2025-06-01'),
  ('Benguluru Bhavan',  true, '2025-06-01'),
  ('Krigo',             true, '2025-06-01');
