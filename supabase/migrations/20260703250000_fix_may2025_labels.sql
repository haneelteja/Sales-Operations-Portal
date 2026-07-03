-- May 2025 label gaps:
-- Missing purchases: 2× Elma Back sticker (GMG) + Elma Back sticker plates (GMG)
-- Missing payments: 4× GMG payments via UPI

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description, record_type)
VALUES
  ('GMG', NULL, 'Plates',       1,     0, 3500.00, '2025-05-07', 'Elma Back sticker plates', 'purchase'),
  ('GMG', NULL, 'Back Sticker', 32200, 0, 8372.00, '2025-05-07', 'Elma Back sticker',        'purchase'),
  ('GMG', NULL, 'Back Sticker', 50000, 0, 13000.00,'2025-05-20', 'Elma Back sticker',        'purchase');

INSERT INTO public.label_payments
  (vendor_id, payment_amount, payment_date, payment_method, description)
VALUES
  ('GMG', 11872, '2025-05-07', 'UPI', NULL),
  ('GMG',  8440, '2025-05-10', 'UPI', NULL),
  ('GMG', 33500, '2025-05-16', 'UPI', NULL),
  ('GMG', 58000, '2025-05-20', 'UPI', NULL);
