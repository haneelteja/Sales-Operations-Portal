-- Insert February 2026 factory payment entries (2026-07-01).

INSERT INTO public.factory_payables (transaction_date, transaction_type, amount, description)
VALUES
  ('2026-02-01', 'payment', -50000.00,  'Parinay UPI - Phone Pe'),
  ('2026-02-07', 'payment', -100000.00, 'Bank Transfer'),
  ('2026-02-10', 'payment', -35000.00,  'label machine Amount'),
  ('2026-02-14', 'payment', -50000.00,  'Parinay UPI - Phone Pe'),
  ('2026-02-21', 'payment', -50000.00,  'Bank Transfer');
