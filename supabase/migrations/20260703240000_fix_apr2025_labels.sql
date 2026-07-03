-- April 2025 label gaps:
-- 1. Elma Back sticker (14520 labels, Venu, Aamodha's own back labels — no client)
-- 2. GMG payment ₹18,497 via UPI on 2025-04-28

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description, record_type)
VALUES
  ('Venu', NULL, 'Back Sticker', 14520, 0, 0, '2025-04-30', 'Elma Back sticker', 'purchase');

INSERT INTO public.label_payments
  (vendor_id, payment_amount, payment_date, payment_method, description)
VALUES
  ('GMG', 18497, '2025-04-28', 'UPI', NULL);
