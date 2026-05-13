-- Seed label_vendors config row for Labels Purchase and Labels Payment vendor dropdowns
INSERT INTO invoice_configurations (config_key, config_value, config_type, description)
VALUES (
  'label_vendors',
  '[]',
  'json',
  'Label vendor list (JSON array) for Labels Purchase and Labels Payment vendor dropdowns'
)
ON CONFLICT (config_key) DO NOTHING;
