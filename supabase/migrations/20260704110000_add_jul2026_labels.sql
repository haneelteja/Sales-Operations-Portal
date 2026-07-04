-- July 2026 label purchases: Jul 1 batch (5 rows)
-- Gismat New in Elma = Gismat (c23daee9-4068-4024-b50c-50cb6bbde582)
-- Back Sticker has no client (Elma internal purchase)

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
VALUES
  ('Morya labels', 'c23daee9-4068-4024-b50c-50cb6bbde582',                                      'P 500 ml',    3075, 0.9440,  2903.00, '2026-07-01', 'purchase', NULL),
  ('Morya labels', (SELECT id FROM public.customers WHERE client_name ILIKE '%Sri Sri%' LIMIT 1), 'P 500 ml',    4075, 0.9440,  3847.00, '2026-07-01', 'purchase', NULL),
  ('Morya labels', (SELECT id FROM public.customers WHERE client_name = 'Hiyya Chrono Jail Mandi' LIMIT 1), 'P 500 ml', 3113, 0.9440, 2939.00, '2026-07-01', 'purchase', NULL),
  ('Morya labels', (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South%'     LIMIT 1), 'P 500 ml',    4943, 0.9440,  4666.00, '2026-07-01', 'purchase', NULL),
  ('Morya labels', NULL,                                                                          'Back Sticker', 9551, 0.3540,  3381.00, '2026-07-01', 'purchase', NULL);
