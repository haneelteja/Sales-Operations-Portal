-- Add 9 missing Morya labels payments Aug–Dec 2025
-- These existed in Elma but were never entered in the DB.
-- After this insert, Morya outstanding should match Elma: ₹51,083.183

INSERT INTO public.label_payments (vendor_id, payment_amount, payment_date, payment_method, description)
VALUES
  ('Morya labels',  4608.00, '2025-08-06', 'Bank Transfer', NULL),
  ('Morya labels', 10823.00, '2025-09-18', 'Bank Transfer', NULL),
  ('Morya labels',  5211.00, '2025-10-05', 'Bank Transfer', NULL),
  ('Morya labels',  7318.00, '2025-10-17', 'Bank Transfer', NULL),
  ('Morya labels',  3135.00, '2025-11-07', 'Bank Transfer', NULL),
  ('Morya labels',  4286.00, '2025-11-23', 'Bank Transfer', NULL),
  ('Morya labels', 14521.00, '2025-12-16', 'Bank Transfer', NULL),
  ('Morya labels', 10837.00, '2025-12-24', 'Bank Transfer', NULL),
  ('Morya labels',  6943.00, '2025-12-27', 'Bank Transfer', NULL);
