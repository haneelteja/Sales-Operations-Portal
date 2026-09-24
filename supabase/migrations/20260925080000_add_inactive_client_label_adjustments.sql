-- Adjustment entries for inactive clients.
-- Each adds a single record_type='adjustment' entry with qty = Elma remaining.
-- Vendor_id is NULL (internal historical stock — no vendor payment involved).

-- Tilaks kitchen: 7220 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Tilaks kitchen' LIMIT 1),
  'P 500 ml',
  7220,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Tilaks kitchen' LIMIT 1)
    AND sku = 'P 500 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- Blossamin Spa: 4750 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Blossamin Spa' LIMIT 1),
  'P 250 ml',
  4750,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Blossamin Spa' LIMIT 1)
    AND sku = 'P 250 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- Mid Land 750 ml: 5587 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Mid Land 750 ml' LIMIT 1),
  'AL 750 ml',
  5587,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Mid Land 750 ml' LIMIT 1)
    AND sku = 'AL 750 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- Tara South Indian: 1400 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Tara South Indian' LIMIT 1),
  'P 500 ml',
  1400,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Tara South Indian' LIMIT 1)
    AND sku = 'P 500 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- Deccan kitchen 750 ml: 5594 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 750 ml' LIMIT 1),
  'AL 750 ml',
  5594,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 750 ml' LIMIT 1)
    AND sku = 'AL 750 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- AAHA: 4000 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'AAHA' LIMIT 1),
  'P 1000 ml',
  4000,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'AAHA' LIMIT 1)
    AND sku = 'P 1000 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- Jubile Festa in 1000 ml: 5880 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jubile Festa in 1000 ml' LIMIT 1),
  'P 1000 ml',
  5880,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jubile Festa in 1000 ml' LIMIT 1)
    AND sku = 'P 1000 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- Jubile Festa in 500 ml: 3900 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jubile Festa in 500 ml' LIMIT 1),
  'P 500 ml',
  3900,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jubile Festa in 500 ml' LIMIT 1)
    AND sku = 'P 500 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- Fusion Aroma: 4256 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Fusion Aroma' LIMIT 1),
  'P 1000 ml',
  4256,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Fusion Aroma' LIMIT 1)
    AND sku = 'P 1000 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- Atias Kitchen: 3072 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Atias Kitchen' LIMIT 1),
  'P 1000 ml',
  3072,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Atias Kitchen' LIMIT 1)
    AND sku = 'P 1000 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- First Cut: 3256 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'First Cut' LIMIT 1),
  'P 250 ml',
  3256,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'First Cut' LIMIT 1)
    AND sku = 'P 250 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- The English Café: 3613 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'The English Café' LIMIT 1),
  'P 1000 ml',
  3613,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'The English Café' LIMIT 1)
    AND sku = 'P 1000 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- Finora - 250 ml: 2052 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Finora - 250 ml' LIMIT 1),
  'P 250 ml',
  2052,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Finora - 250 ml' LIMIT 1)
    AND sku = 'P 250 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- Deccan kitchen 250 ml: 2100 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 250 ml' LIMIT 1),
  'P 250 ml',
  2100,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 250 ml' LIMIT 1)
    AND sku = 'P 250 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- Good Vibes: 2000 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Good Vibes' LIMIT 1),
  'P 500 ml',
  2000,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Good Vibes' LIMIT 1)
    AND sku = 'P 500 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- 1980s Milatry Hotel: 1632 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE '1980s Milatry Hotel' LIMIT 1),
  'P 500 ml',
  1632,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE '1980s Milatry Hotel' LIMIT 1)
    AND sku = 'P 500 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- Rangaswami Milatry Hotel: 527 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Rangaswami Milatry Hotel' LIMIT 1),
  'P 500 ml',
  527,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Rangaswami Milatry Hotel' LIMIT 1)
    AND sku = 'P 500 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- Hotel Ellappa - 500 ml: 219 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hotel Ellappa - 500 ml' LIMIT 1),
  'P 500 ml',
  219,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hotel Ellappa - 500 ml' LIMIT 1)
    AND sku = 'P 500 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- Hotel Ellappa - 1000 ml: 132 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hotel Ellappa - 1000 ml' LIMIT 1),
  'P 1000 ml',
  132,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hotel Ellappa - 1000 ml' LIMIT 1)
    AND sku = 'P 1000 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- Jagan pan house 500 ml: 990 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jagan pan house 500 ml' LIMIT 1),
  'P 500 ml',
  990,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jagan pan house 500 ml' LIMIT 1)
    AND sku = 'P 500 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- Jagan pan house 1000 ml: 390 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jagan pan house 1000 ml' LIMIT 1),
  'P 1000 ml',
  390,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jagan pan house 1000 ml' LIMIT 1)
    AND sku = 'P 1000 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);

-- Mid land 1000 ml: 768 labels remaining
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Mid land 1000 ml' LIMIT 1),
  'P 1000 ml',
  768,
  0, 0,
  '2024-01-01',
  'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Mid land 1000 ml' LIMIT 1)
    AND sku = 'P 1000 ml'
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);
