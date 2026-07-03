-- June 2025 label gaps:
-- Missing purchases: 2× Elma Back sticker (GMG, Aamodha's own back labels)
-- Missing payments: 3× GMG payments via UPI

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description, record_type)
VALUES
  ('GMG', NULL, 'Back Sticker', 25000, 0, 6500.00, '2025-06-19', 'Elma Back sticker', 'purchase'),
  ('GMG', NULL, 'Back Sticker', 25300, 0, 6578.00, '2025-06-25', 'Elma Back sticker', 'purchase');

INSERT INTO public.label_payments
  (vendor_id, payment_amount, payment_date, payment_method, description)
VALUES
  ('GMG', 11740, '2025-06-11', 'UPI', NULL),
  ('GMG', 10000, '2025-06-17', 'UPI', NULL),
  ('GMG', 54078, '2025-06-25', 'UPI', NULL);
