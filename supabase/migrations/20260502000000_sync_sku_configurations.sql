INSERT INTO sku_configurations (sku, description, bottles_per_case)
VALUES
  ('250 P',  'Premium Drinking Water 250 ml',  30),
  ('500 P',  'Premium Drinking Water 500 ml',  20),
  ('750 P',  'Premium Drinking Water 750 ml',  12),
  ('1000 P', 'Premium Drinking Water 1000 ml', 9),
  ('250 EC', 'Eco Cup 250 ml',                 35),
  ('500 EC', 'Eco Cup 500 ml',                 20),
  ('500 AL', 'Aluminium Bottle 500 ml',        24),
  ('750 AL', 'Aluminium Bottle 750 ml',        12)
ON CONFLICT (sku) DO NOTHING;
