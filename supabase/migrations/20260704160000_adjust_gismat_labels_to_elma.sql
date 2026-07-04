-- Adjust Gismat New (Kondapur) label count to match Elma as of 30 Jun 2026.
-- DB combined Gismat total (Kondapur 174167 + Chanda Nagar 1588) = 175755.
-- Elma "Gismat New" = 36755. Difference = -139000.
-- Applied to Kondapur UUID (c23daee9) so combined total = 35167 + 1588 = 36755.
INSERT INTO public.label_purchases
  (client_id, vendor_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, description)
VALUES
  ('c23daee9-4068-4024-b50c-50cb6bbde582', 'GMG', 'P 500 ml', -139000, 0, 0, '2026-06-30', 'adjustment', 'Adjustment with Elma');
