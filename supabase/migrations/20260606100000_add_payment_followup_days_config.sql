-- Seed default config for auto follow-up days after a payment is recorded
insert into invoice_configurations (config_key, config_value, config_type, description)
values (
  'payment_followup_days',
  '10',
  'number',
  'Number of days ahead to set the next follow-up date when a payment is recorded'
)
on conflict (config_key) do nothing;
