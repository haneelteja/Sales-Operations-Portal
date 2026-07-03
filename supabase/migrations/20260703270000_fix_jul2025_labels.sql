-- July 2025 label gaps:
-- Missing purchase: Elma Back sticker 50000 labels from GMG on 2025-07-17
-- Missing payments: 3× GMG + 3× Morya Labels via UPI

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description, record_type)
VALUES
  ('GMG', NULL, 'Back Sticker', 50000, 0, 13000.00, '2025-07-17', 'Elma Back sticker', 'purchase');

INSERT INTO public.label_payments
  (vendor_id, payment_amount, payment_date, payment_method, description)
VALUES
  ('GMG',          16800.00, '2025-07-01', 'UPI', NULL),
  ('Morya Labels',  5000.00, '2025-07-12', 'UPI', NULL),
  ('Morya Labels',  2563.80, '2025-07-16', 'UPI', NULL),
  ('GMG',          30520.00, '2025-07-18', 'UPI', NULL),
  ('GMG',           8300.00, '2025-07-22', 'UPI', NULL),
  ('Morya Labels',  5000.00, '2025-07-29', 'UPI', NULL);
